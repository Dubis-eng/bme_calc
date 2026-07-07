import datetime
from typing import List, Dict, Any, Optional
from sqlmodel import select, Session
from database import (
    Variable, Equation, Dependency, Sector,
    VariableType, VariableStatus, Stage, ControlPoint, HarvestPlanOrderedItem
)
import engine

def _update_variable_equation(var_id: str, new_eq_val: str, db_var: Variable, db: Session):
    stmt = select(Equation).where(Equation.variable_id == var_id, Equation.status == "ativa")
    active_eqs = db.exec(stmt).all()
    
    if not (isinstance(new_eq_val, str) and new_eq_val.startswith("=")):
        for eq in active_eqs:
            eq.status = "desativada"
            eq.updated_at = datetime.datetime.utcnow()
            db.add(eq)
        db.flush()
        return

    for eq in active_eqs:
        if eq.expression_original == new_eq_val:
            return

    for eq in active_eqs:
        eq.status = "desativada"
        eq.updated_at = datetime.datetime.utcnow()
        db.add(eq)
    db.flush()

    db_eq = Equation(
        variable_id=var_id,
        expression_original=new_eq_val,
        expression_normalized=engine.normalize_formula(new_eq_val),
        version=len(active_eqs) + 1,
        status="ativa"
    )
    db.add(db_eq)
    db.flush()
    
    deps = engine.extract_dependencies(engine.normalize_formula(new_eq_val))
    for idx, dep_id in enumerate(sorted(deps)):
        dep_var = db.get(Variable, dep_id)
        if not dep_var:
            dep_var = Variable(
                id=dep_id, nome=dep_id, descricao="Auto-criado por dependência",
                setor_id=db_var.setor_id, tipo=VariableType.INPUT, status=VariableStatus.PENDENTE
            )
            db.add(dep_var)
            db.flush()
        db_dep = Dependency(equation_id=db_eq.id, dependency_var_id=dep_id, evaluation_order=idx)
        db.add(db_dep)

def list_variables(db: Session) -> List[Dict[str, Any]]:
    stmt = (
        select(Variable)
        .where(Variable.status != VariableStatus.INATIVA)
        .outerjoin(ControlPoint, Variable.control_point_id == ControlPoint.id)
        .outerjoin(Stage, ControlPoint.stage_id == Stage.id)
        .outerjoin(Sector, Variable.setor_id == Sector.id)
        .order_by(Sector.ordem, Stage.ordem, ControlPoint.ordem, Variable.ordem)
    )
    db_vars = db.exec(stmt).all()
    
    stages = db.exec(select(Stage)).all()
    cps = db.exec(select(ControlPoint)).all()
    stage_map = {s.id: s for s in stages}
    cp_map = {cp.id: cp for cp in cps}
    
    eqs = db.exec(select(Equation).where(Equation.status == "ativa")).all()
    eq_map = {eq.variable_id: eq.expression_original for eq in eqs}
    
    vars_list = []
    for var in db_vars:
        eq_val = eq_map.get(var.id, "")
        
        etapa_name = ""
        cp_name = ""
        stage_id = None
        if var.control_point_id:
            cp_obj = cp_map.get(var.control_point_id)
            if cp_obj:
                cp_name = cp_obj.nome
                stage_id = cp_obj.stage_id
                stage_obj = stage_map.get(cp_obj.stage_id)
                if stage_obj:
                    etapa_name = stage_obj.nome
        if not etapa_name:
            etapa_name = var.etapa or ""
        if not cp_name:
            cp_name = var.ponto_controle or ""
            
        vars_list.append({
            "id": var.id,
            "nome": var.nome,
            "descricao": var.descricao,
            "setor_id": var.setor_id,
            "tipo": var.tipo.value if hasattr(var.tipo, 'value') else str(var.tipo),
            "unidade": var.unidade,
            "status": var.status.value if hasattr(var.status, 'value') else str(var.status),
            "etapa": etapa_name,
            "ponto_controle": cp_name,
            "control_point_id": var.control_point_id,
            "stage_id": stage_id,
            "ordem": var.ordem,
            "equation_value": eq_val,
            "casas_decimais": var.casas_decimais,
            "tipo_exibicao": var.tipo_exibicao,
            "percent_base": var.percent_base
        })
    return vars_list

def _resolve_control_point(sector_id: str, etapa_str: str, pc_str: str, db: Session) -> ControlPoint:
    stage_name = etapa_str.strip() if etapa_str else "GERAL"
    stmt = select(Stage).where(Stage.sector_id == sector_id, Stage.nome == stage_name)
    db_stage = db.exec(stmt).first()
    if not db_stage:
        all_orders = db.exec(select(Stage.ordem).where(Stage.sector_id == sector_id)).all()
        next_ordem = max(all_orders) + 10 if all_orders else 10
        db_stage = Stage(nome=stage_name, sector_id=sector_id, ordem=next_ordem)
        db.add(db_stage)
        db.flush()
        
    cp_name = pc_str.strip() if pc_str else "GERAL"
    stmt = select(ControlPoint).where(ControlPoint.stage_id == db_stage.id, ControlPoint.nome == cp_name)
    db_cp = db.exec(stmt).first()
    if not db_cp:
        all_orders = db.exec(select(ControlPoint.ordem).where(ControlPoint.stage_id == db_stage.id)).all()
        next_ordem = max(all_orders) + 10 if all_orders else 10
        db_cp = ControlPoint(nome=cp_name, stage_id=db_stage.id, ordem=next_ordem)
        db.add(db_cp)
        db.flush()
        
    return db_cp

def create_variable(req, db: Session) -> Dict[str, Any]:
    existing = db.get(Variable, req.id)
    if existing:
        raise ValueError(f"Variável com ID '{req.id}' já existe.")
        
    sector_id = req.setor_id.strip().upper()
    db_sector = db.get(Sector, sector_id)
    if not db_sector:
        all_orders = db.exec(select(Sector.ordem)).all()
        next_ordem = max(all_orders) + 10 if all_orders else 10
        db_sector = Sector(id=sector_id, nome=sector_id.title(), descricao="Criado via cadastro de variável", ordem=next_ordem)
        db.add(db_sector)
        db.flush()
        
    tipo = VariableType(req.tipo.strip().upper())
    db_cp = _resolve_control_point(sector_id, req.etapa, req.ponto_controle, db)
    
    # Calculate variable ordem if not provided or 0
    v_ordem = getattr(req, 'ordem', 0) or 0
    if v_ordem <= 0:
        all_var_orders = db.exec(select(Variable.ordem).where(Variable.control_point_id == db_cp.id)).all()
        v_ordem = max(all_var_orders) + 10 if all_var_orders else 10
        
    db_var = Variable(
        id=req.id.strip(),
        nome=req.nome.strip(),
        descricao=req.descricao.strip() if req.descricao else "",
        setor_id=sector_id,
        tipo=tipo,
        unidade=req.unidade.strip() if req.unidade else "",
        status=VariableStatus(req.status.strip() if req.status else "ativa"),
        etapa=db_cp.stage_id.hex, # dummy legacy value
        ponto_controle=db_cp.id.hex, # dummy legacy value
        control_point_id=db_cp.id,
        ordem=v_ordem,
        casas_decimais=req.casas_decimais,
        tipo_exibicao=req.tipo_exibicao.strip() if req.tipo_exibicao else "NUMBER",
        percent_base=req.percent_base.strip() if req.percent_base else "DECIMAL"
    )
    db.add(db_var)
    db.flush()
    
    if tipo in {VariableType.OUTPUT, VariableType.DERIVADA} and req.equation_value:
        _update_variable_equation(db_var.id, req.equation_value, db_var, db)
        
    db.commit()
    
    db_eq = db.exec(select(Equation).where(Equation.variable_id == db_var.id, Equation.status == "ativa")).first()
    eq_val = db_eq.expression_original if db_eq else ""
    
    return {
        "id": db_var.id,
        "nome": db_var.nome,
        "descricao": db_var.descricao,
        "setor_id": db_var.setor_id,
        "tipo": db_var.tipo.value,
        "unidade": db_var.unidade,
        "status": db_var.status.value,
        "etapa": req.etapa.strip() if req.etapa else "GERAL",
        "ponto_controle": req.ponto_controle.strip() if req.ponto_controle else "GERAL",
        "control_point_id": db_var.control_point_id,
        "stage_id": db_cp.stage_id,
        "ordem": db_var.ordem,
        "equation_value": eq_val,
        "casas_decimais": db_var.casas_decimais,
        "tipo_exibicao": db_var.tipo_exibicao,
        "percent_base": db_var.percent_base
    }

def update_variable(var_id: str, req, db: Session) -> Dict[str, Any]:
    db_var = db.get(Variable, var_id)
    if not db_var:
        raise ValueError(f"Variável '{var_id}' não encontrada.")
        
    sector_id = req.setor_id.strip().upper()
    db_sector = db.get(Sector, sector_id)
    if not db_sector:
        all_orders = db.exec(select(Sector.ordem)).all()
        next_ordem = max(all_orders) + 10 if all_orders else 10
        db_sector = Sector(id=sector_id, nome=sector_id.title(), descricao="Criado via cadastro de variável", ordem=next_ordem)
        db.add(db_sector)
        db.flush()
        
    tipo = VariableType(req.tipo.strip().upper())
    db_cp = _resolve_control_point(sector_id, req.etapa, req.ponto_controle, db)
    
    # Calculate variable ordem if not provided or 0
    v_ordem = getattr(req, 'ordem', 0) or 0
    if v_ordem <= 0:
        if db_var.control_point_id != db_cp.id:
            all_var_orders = db.exec(select(Variable.ordem).where(Variable.control_point_id == db_cp.id)).all()
            v_ordem = max(all_var_orders) + 10 if all_var_orders else 10
        else:
            v_ordem = db_var.ordem
            
    db_var.nome = req.nome.strip()
    db_var.descricao = req.descricao.strip() if req.descricao else ""
    db_var.setor_id = sector_id
    db_var.tipo = tipo
    db_var.unidade = req.unidade.strip() if req.unidade else ""
    db_var.status = VariableStatus(req.status.strip() if req.status else "ativa")
    if db_var.status == VariableStatus.INATIVA:
        db_var.in_harvest_plan = False
        db_var.harvest_plan_op = None
        db_var.harvest_plan_weight_var_id = None
        # Remove from harvest plan ordered list
        stmt_del = select(HarvestPlanOrderedItem).where(HarvestPlanOrderedItem.variable_id == db_var.id)
        for item in db.exec(stmt_del).all():
            db.delete(item)
    db_var.control_point_id = db_cp.id
    db_var.ordem = v_ordem
    db_var.casas_decimais = req.casas_decimais
    db_var.tipo_exibicao = req.tipo_exibicao.strip() if req.tipo_exibicao else "NUMBER"
    db_var.percent_base = req.percent_base.strip() if req.percent_base else "DECIMAL"
    db.add(db_var)
    db.flush()
    
    if tipo in {VariableType.OUTPUT, VariableType.DERIVADA}:
        _update_variable_equation(db_var.id, req.equation_value, db_var, db)
    else:
        _update_variable_equation(db_var.id, "", db_var, db)
        
    db.commit()
    
    db_eq = db.exec(select(Equation).where(Equation.variable_id == db_var.id, Equation.status == "ativa")).first()
    eq_val = db_eq.expression_original if db_eq else ""
    
    return {
        "id": db_var.id,
        "nome": db_var.nome,
        "descricao": db_var.descricao,
        "setor_id": db_var.setor_id,
        "tipo": db_var.tipo.value,
        "unidade": db_var.unidade,
        "status": db_var.status.value,
        "etapa": req.etapa.strip() if req.etapa else "GERAL",
        "ponto_controle": req.ponto_controle.strip() if req.ponto_controle else "GERAL",
        "control_point_id": db_var.control_point_id,
        "stage_id": db_cp.stage_id,
        "ordem": db_var.ordem,
        "equation_value": eq_val,
        "casas_decimais": db_var.casas_decimais,
        "tipo_exibicao": db_var.tipo_exibicao,
        "percent_base": db_var.percent_base
    }

