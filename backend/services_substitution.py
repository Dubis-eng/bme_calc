import datetime
from typing import List, Dict, Any, Optional
from sqlmodel import select, Session
from database import (
    Variable, Equation, Dependency, Sector,
    VariableType, VariableStatus
)
from services_variables import _update_variable_equation
import engine

def get_substitution_preview(target_var_id: str, recursive: bool, db: Session, replacement_expr: Optional[str] = None):
    import networkx as nx
    db_target = db.get(Variable, target_var_id)
    if not db_target:
        raise ValueError(f"Variável '{target_var_id}' não encontrada.")
        
    if not replacement_expr:
        eq_stmt = select(Equation).where(Equation.variable_id == target_var_id, Equation.status == "ativa")
        target_eq = db.exec(eq_stmt).first()
        if not target_eq:
            raise ValueError(f"A variável '{target_var_id}' não possui uma fórmula ativa para ser usada na substituição.")
        replacement_expr = target_eq.expression_original
    
    # 1. Pre-load all variables into memory once to avoid N+1 queries
    variables_map = {v.id: v for v in db.exec(select(Variable)).all()}
    
    all_eqs = db.exec(select(Equation).where(Equation.status == "ativa")).all()
    
    g = nx.DiGraph()
    formulas = {}
    eq_dependencies = {}
    
    # 2. Pre-parse dependencies once during graph construction
    for eq in all_eqs:
        formulas[eq.variable_id] = eq.expression_original
        normalized = engine.normalize_formula(eq.expression_original)
        deps = engine.extract_dependencies(normalized)
        eq_dependencies[eq.variable_id] = deps
        for dep in deps:
            g.add_edge(dep, eq.variable_id)
            
    if target_var_id not in g:
        return [], True
        
    descendants = nx.descendants(g, target_var_id)
    if not descendants:
        return [], True
        
    try:
        full_order = list(nx.topological_sort(g))
    except nx.NetworkXUnfeasible:
        full_order = list(g.nodes)
        
    descendants_order = [node for node in full_order if node in descendants]
    
    affected = []
    
    if recursive:
        modified_nodes = {target_var_id: replacement_expr}
        for node in descendants_order:
            orig_formula = formulas.get(node, "")
            if not orig_formula:
                continue
            
            # Check if this node depends on any modified variable
            current_deps = eq_dependencies.get(node, set())
            if not any(mod_node in current_deps for mod_node in modified_nodes):
                continue
                
            new_formula = orig_formula
            for mod_node, mod_expr in modified_nodes.items():
                if mod_node in engine.extract_dependencies(engine.normalize_formula(new_formula)):
                    new_formula = engine.substitute_variable_in_formula(new_formula, mod_node, mod_expr)
                    
            if new_formula != orig_formula:
                modified_nodes[node] = new_formula
                var_db = variables_map.get(node)
                affected.append({
                    "variable_id": node,
                    "nome": var_db.nome if var_db else node,
                    "setor_id": var_db.setor_id if var_db else "",
                    "expression_before": orig_formula,
                    "expression_after": new_formula
                })
    else:
        for node in descendants_order:
            orig_formula = formulas.get(node, "")
            if not orig_formula:
                continue
            # Only process if target_var_id is in pre-calculated dependencies
            current_deps = eq_dependencies.get(node, set())
            if target_var_id in current_deps:
                new_formula = engine.substitute_variable_in_formula(orig_formula, target_var_id, replacement_expr)
                if new_formula != orig_formula:
                    var_db = variables_map.get(node)
                    affected.append({
                        "variable_id": node,
                        "nome": var_db.nome if var_db else node,
                        "setor_id": var_db.setor_id if var_db else "",
                        "expression_before": orig_formula,
                        "expression_after": new_formula
                    })
                    
    still_used = False
    for node, formula in formulas.items():
        if node == target_var_id:
            continue
            
        is_affected = False
        node_formula = formula
        for aff in affected:
            if aff["variable_id"] == node:
                node_formula = aff["expression_after"]
                is_affected = True
                break
        
        if is_affected:
            deps = engine.extract_dependencies(engine.normalize_formula(node_formula))
        else:
            deps = eq_dependencies.get(node, set())
            
        if target_var_id in deps:
            still_used = True
            break
            
    return affected, not still_used

def confirm_variable_substitution(target_var_id: str, recursive: bool, action_unused: Optional[str], db: Session, replacement_expr: Optional[str] = None):
    # Pre-load variables to avoid N+1 queries during dependency auto-creation
    variables_map = {v.id: v for v in db.exec(select(Variable)).all()}
    
    affected, becomes_unused = get_substitution_preview(target_var_id, recursive, db, replacement_expr)
    
    # Batch update equations
    for aff in affected:
        var_id = aff["variable_id"]
        new_expr = aff["expression_after"]
        
        # Deactivate current active equation
        active_eqs = db.exec(select(Equation).where(Equation.variable_id == var_id, Equation.status == "ativa")).all()
        for eq in active_eqs:
            eq.status = "desativada"
            eq.updated_at = datetime.datetime.utcnow()
            db.add(eq)
            
        # Create new equation
        new_eq = Equation(
            variable_id=var_id,
            expression_original=new_expr,
            expression_normalized=engine.normalize_formula(new_expr),
            version=len(active_eqs) + 1,
            status="ativa"
        )
        db.add(new_eq)
        db.flush() # Flush to get new_eq.id
        
        # Add dependencies — only create stub if variable truly does not exist
        deps = engine.extract_dependencies(engine.normalize_formula(new_expr))
        for idx, dep_id in enumerate(sorted(deps)):
            if dep_id not in variables_map:
                # Double-check against DB before creating to avoid PENDENTE stubs
                # overwriting real variables that were loaded before this loop began
                existing = db.get(Variable, dep_id)
                if existing:
                    variables_map[dep_id] = existing
                else:
                    dep_var = Variable(
                        id=dep_id, nome=dep_id, descricao="Auto-criado por dependência",
                        setor_id=variables_map[var_id].setor_id if var_id in variables_map else "TEST_SEC",
                        tipo=VariableType.INPUT, status=VariableStatus.PENDENTE
                    )
                    db.add(dep_var)
                    variables_map[dep_id] = dep_var
                    db.flush()

            db_dep = Dependency(equation_id=new_eq.id, dependency_var_id=dep_id, evaluation_order=idx)
            db.add(db_dep)
            
    if becomes_unused and action_unused:
        action = action_unused.strip().lower()
        if action == "archive":
            db_var = variables_map.get(target_var_id)
            if db_var:
                db_var.status = VariableStatus.DESCONTINUADA
                db.add(db_var)
                active_eqs = db.exec(select(Equation).where(Equation.variable_id == target_var_id, Equation.status == "ativa")).all()
                for eq in active_eqs:
                    eq.status = "desativada"
                    eq.updated_at = datetime.datetime.utcnow()
                    db.add(eq)
        elif action == "delete":
            from sqlalchemy import text
            db.execute(text("UPDATE variables SET harvest_plan_weight_var_id = NULL WHERE harvest_plan_weight_var_id = :var_id"), {"var_id": target_var_id})
            db.execute(text("DELETE FROM dependencies WHERE dependency_var_id = :var_id"), {"var_id": target_var_id})
            db.execute(text("DELETE FROM dependencies WHERE equation_id IN (SELECT id FROM equations WHERE variable_id = :var_id)"), {"var_id": target_var_id})
            db.execute(text("DELETE FROM results WHERE variable_id = :var_id"), {"var_id": target_var_id})
            db.execute(text("DELETE FROM equations WHERE variable_id = :var_id"), {"var_id": target_var_id})
            db_var = variables_map.get(target_var_id)
            if db_var:
                db.delete(db_var)
                
    db.commit()
    return len(affected)
