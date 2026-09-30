import datetime
from typing import Optional
from sqlmodel import select, Session
from sqlalchemy import func
from src.db.database import (
    Variable, Equation, Dependency, VariableType, VariableStatus,
    Stage, ControlPoint, HarvestPlanOrderedItem
)
from src.core import engine


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


def _resolve_control_point(sector_id: str, etapa_str: str, pc_str: str, db: Session) -> ControlPoint:
    stage_name = etapa_str.strip() if etapa_str else "GERAL"
    stmt = select(Stage).where(
        Stage.sector_id == sector_id,
        func.lower(func.trim(Stage.nome)) == stage_name.lower()
    )
    db_stage = db.exec(stmt).first()
    if not db_stage:
        all_orders = db.exec(select(Stage.ordem).where(Stage.sector_id == sector_id)).all()
        next_ordem = max(all_orders) + 10 if all_orders else 10
        db_stage = Stage(nome=stage_name, sector_id=sector_id, ordem=next_ordem)
        db.add(db_stage)
        db.flush()
        
    cp_name = pc_str.strip() if pc_str else "GERAL"
    stmt = select(ControlPoint).where(
        ControlPoint.stage_id == db_stage.id,
        func.lower(func.trim(ControlPoint.nome)) == cp_name.lower()
    )
    db_cp = db.exec(stmt).first()
    if not db_cp:
        all_orders = db.exec(select(ControlPoint.ordem).where(ControlPoint.stage_id == db_stage.id)).all()
        next_ordem = max(all_orders) + 10 if all_orders else 10
        db_cp = ControlPoint(nome=cp_name, stage_id=db_stage.id, ordem=next_ordem)
        db.add(db_cp)
        db.flush()
        
    return db_cp


def _sync_variable_harvest_grouping(var_id: str, in_harvest_plan: bool, agrupamento: Optional[str], db: Session):
    var_items = db.exec(select(HarvestPlanOrderedItem).where(HarvestPlanOrderedItem.variable_id == var_id)).all()
    if not in_harvest_plan:
        for item in var_items:
            db.delete(item)
        db.flush()
        return

    group_label = agrupamento.strip() if (agrupamento and isinstance(agrupamento, str) and agrupamento.strip()) else "Itens sem Agrupamento"

    divider = db.exec(select(HarvestPlanOrderedItem).where(
        HarvestPlanOrderedItem.tipo == "divider",
        HarvestPlanOrderedItem.label == group_label
    )).first()

    all_items = db.exec(select(HarvestPlanOrderedItem).order_by(HarvestPlanOrderedItem.ordem.asc())).all()

    if not divider:
        max_ord = max([it.ordem for it in all_items], default=-1)
        divider = HarvestPlanOrderedItem(tipo="divider", label=group_label, ordem=max_ord + 1)
        db.add(divider)
        db.flush()
        all_items.append(divider)

    for item in var_items:
        db.delete(item)
    db.flush()

    all_items = db.exec(select(HarvestPlanOrderedItem).order_by(HarvestPlanOrderedItem.ordem.asc())).all()
    div_index = next((i for i, it in enumerate(all_items) if it.id == divider.id), len(all_items) - 1)
    
    new_var_item = HarvestPlanOrderedItem(tipo="variable", variable_id=var_id, ordem=0)
    all_items.insert(div_index + 1, new_var_item)

    for idx, item in enumerate(all_items):
        item.ordem = idx
        db.add(item)
    db.flush()
