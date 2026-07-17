from typing import List, Dict, Any, Optional
from sqlmodel import select, Session
from src.db.database import (
    Variable, Equation, Dependency, Scenario, HarvestPlanSetting,
    ScenarioStatus, VariableType, ResultStatus, VariableStatus, HarvestPlanOrderedItem
)
from src.core import engine
from src.services.services_harvest_plan_calc import calculate_harvest_plan_consolidation

ALL_MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]

def get_ordered_months(start_month: str, db: Session) -> List[str]:
    from src.db.database import HarvestMonth
    stmt = select(HarvestMonth).where(HarvestMonth.enabled == True).order_by(HarvestMonth.order_index.asc())
    db_months = db.exec(stmt).all()
    enabled_names = [m.name for m in db_months]
    if not enabled_names:
        enabled_names = ALL_MONTHS
    if start_month not in enabled_names:
        return enabled_names
    idx = enabled_names.index(start_month)
    return enabled_names[idx:] + enabled_names[:idx]

def get_harvest_years(db: Session) -> List[int]:
    from src.db.database import HarvestYear
    stmt = select(HarvestYear.id).where(HarvestYear.active == True)
    years = db.exec(stmt).all()
    return sorted(list(set(years)), reverse=True)

def get_harvest_plan_settings(db: Session) -> HarvestPlanSetting:
    setting = db.get(HarvestPlanSetting, "default")
    if not setting:
        setting = HarvestPlanSetting(id="default", start_month="Abril")
        db.add(setting)
        db.commit()
        db.refresh(setting)
    return setting

def update_harvest_plan_settings(start_month: str, db: Session) -> HarvestPlanSetting:
    setting = get_harvest_plan_settings(db)
    if start_month in ALL_MONTHS:
        setting.start_month = start_month
        db.add(setting)
        
        idx = ALL_MONTHS.index(start_month)
        ordered_names = ALL_MONTHS[idx:] + ALL_MONTHS[:idx]
        from src.db.database import HarvestMonth
        db_months = db.exec(select(HarvestMonth)).all()
        for m in db_months:
            if m.name in ordered_names:
                m.order_index = ordered_names.index(m.name)
                db.add(m)
                
        db.commit()
        db.refresh(setting)
    return setting

def get_variables_harvest_config(db: Session) -> List[Dict[str, Any]]:
    stmt = select(Variable).where(Variable.status != VariableStatus.INATIVA).order_by(Variable.setor_id, Variable.id)
    db_vars = db.exec(stmt).all()
    configs = []
    for var in db_vars:
        configs.append({
            "id": var.id,
            "nome": var.nome,
            "descricao": var.descricao,
            "setor_id": var.setor_id,
            "unidade": var.unidade,
            "tipo": var.tipo.value if hasattr(var.tipo, 'value') else str(var.tipo),
            "in_harvest_plan": var.in_harvest_plan,
            "harvest_plan_op": var.harvest_plan_op,
            "harvest_plan_weight_var_id": var.harvest_plan_weight_var_id
        })
    return configs

def _sync_harvest_plan_ordered_item(var_id: str, added: bool, db: Session):
    if not added:
        stmt_del = select(HarvestPlanOrderedItem).where(HarvestPlanOrderedItem.variable_id == var_id)
        for item in db.exec(stmt_del).all():
            db.delete(item)
        return

    exists = db.exec(select(HarvestPlanOrderedItem).where(HarvestPlanOrderedItem.variable_id == var_id)).first()
    if exists:
        return

    has_divider = db.exec(select(HarvestPlanOrderedItem).where(HarvestPlanOrderedItem.tipo == "divider")).first()
    max_ord = db.exec(select(HarvestPlanOrderedItem.ordem).order_by(HarvestPlanOrderedItem.ordem.desc())).first()
    max_ord = max_ord if max_ord is not None else -1

    current_ord = max_ord + 1
    if has_divider:
        ungrouped_div = db.exec(select(HarvestPlanOrderedItem).where(
            HarvestPlanOrderedItem.tipo == "divider",
            HarvestPlanOrderedItem.label == "Itens sem Agrupamento"
        )).first()
        if not ungrouped_div:
            div_item = HarvestPlanOrderedItem(tipo="divider", label="Itens sem Agrupamento", ordem=current_ord)
            db.add(div_item)
            current_ord += 1

    item = HarvestPlanOrderedItem(tipo="variable", variable_id=var_id, ordem=current_ord)
    db.add(item)

def update_variables_harvest_config(configs: List[Dict[str, Any]], db: Session):
    for config in configs:
        var_id = config.get("id")
        db_var = db.get(Variable, var_id)
        if not db_var:
            continue
            
        old_val = db_var.in_harvest_plan
        new_val = config.get("in_harvest_plan", False)
        db_var.in_harvest_plan = new_val
        db_var.harvest_plan_op = config.get("harvest_plan_op")
        db_var.harvest_plan_weight_var_id = config.get("harvest_plan_weight_var_id")
        db.add(db_var)
        
        if old_val != new_val:
            _sync_harvest_plan_ordered_item(var_id, new_val, db)
    db.commit()

def get_harvest_plan_selections(year_harvest: int, db: Session) -> Dict[str, Any]:
    from src.db.database import HarvestPlanSelection, Scenario, ScenarioStatus
    
    selections = db.exec(select(HarvestPlanSelection).where(HarvestPlanSelection.year_harvest == year_harvest)).all()
    selections_list = []
    for sel in selections:
        selections_list.append({
            "month": sel.month,
            "scenario_id": str(sel.scenario_id) if sel.scenario_id else None,
            "exclude": sel.exclude
        })
        
    stmt = select(Scenario).where(
        Scenario.year_harvest == year_harvest,
        Scenario.status.in_([ScenarioStatus.APROVADO, ScenarioStatus.FINAL])
    ).order_by(Scenario.reference_month, Scenario.version.desc())
    scenarios = db.exec(stmt).all()
    
    available = {}
    for sc in scenarios:
        available.setdefault(sc.reference_month, []).append({
            "id": str(sc.id),
            "nome": sc.nome,
            "version": sc.version,
            "status": sc.status.value if hasattr(sc.status, "value") else str(sc.status)
        })
        
    return {
        "selections": selections_list,
        "available_scenarios": available
    }

def update_harvest_plan_selection(year_harvest: int, month: str, scenario_id: Optional[Any], exclude: bool, db: Session):
    from src.db.database import HarvestPlanSelection
    import uuid
    
    sc_id = uuid.UUID(str(scenario_id)) if scenario_id else None
    stmt = select(HarvestPlanSelection).where(
        HarvestPlanSelection.year_harvest == year_harvest,
        HarvestPlanSelection.month == month
    )
    sel = db.exec(stmt).first()
    if not sel:
        sel = HarvestPlanSelection(
            year_harvest=year_harvest,
            month=month,
            scenario_id=sc_id,
            exclude=exclude
        )
        db.add(sel)
    else:
        sel.scenario_id = sc_id
        sel.exclude = exclude
        db.add(sel)
    db.commit()
    return {"success": True}

def get_harvest_plan_structure(db: Session) -> List[Dict[str, Any]]:
    # 1. Fetch active variables in harvest plan
    active_vars_stmt = select(Variable).where(
        Variable.in_harvest_plan == True,
        Variable.status != VariableStatus.INATIVA
    )
    active_vars = db.exec(active_vars_stmt).all()
    active_var_ids = {v.id for v in active_vars}
    vars_map = {v.id: v for v in active_vars}
    
    # 2. Fetch existing ordered items
    ordered_stmt = select(HarvestPlanOrderedItem).order_by(HarvestPlanOrderedItem.ordem.asc())
    ordered_items = db.exec(ordered_stmt).all()
    
    # Find variables that are in the plan but missing from ordered items
    ordered_var_ids = {item.variable_id for item in ordered_items if item.tipo == "variable"}
    missing_var_ids = active_var_ids - ordered_var_ids
    
    # Sync missing variables (append them)
    if missing_var_ids:
        max_ord = db.exec(select(HarvestPlanOrderedItem.ordem).order_by(HarvestPlanOrderedItem.ordem.desc())).first()
        max_ord = max_ord if max_ord is not None else -1
        
        # Check if there is already an "Itens sem Agrupamento" divider
        ungrouped_divider = db.exec(select(HarvestPlanOrderedItem).where(
            HarvestPlanOrderedItem.tipo == "divider",
            HarvestPlanOrderedItem.label == "Itens sem Agrupamento"
        )).first()
        
        current_ord = max_ord + 1
        if not ungrouped_divider:
            new_div = HarvestPlanOrderedItem(
                tipo="divider",
                label="Itens sem Agrupamento",
                ordem=current_ord
            )
            db.add(new_div)
            current_ord += 1
            
        for idx, m_id in enumerate(sorted(list(missing_var_ids))):
            new_item = HarvestPlanOrderedItem(
                tipo="variable",
                variable_id=m_id,
                ordem=current_ord + idx
            )
            db.add(new_item)
        db.commit()
        ordered_items = db.exec(ordered_stmt).all()
        
    result = []
    for item in ordered_items:
        if item.tipo == "variable":
            v_id = item.variable_id
            if v_id in active_var_ids:
                var = vars_map[v_id]
                result.append({
                    "id": str(item.id),
                    "tipo": "variable",
                    "variable_id": v_id,
                    "label": None,
                    "ordem": item.ordem,
                    "nome": var.nome,
                    "unidade": var.unidade,
                    "setor_id": var.setor_id
                })
        else:
            result.append({
                "id": str(item.id),
                "tipo": "divider",
                "variable_id": None,
                "label": item.label,
                "ordem": item.ordem,
                "nome": None,
                "unidade": None,
                "setor_id": None
            })
    return result

def save_harvest_plan_structure(items: List[Dict[str, Any]], db: Session):
    db_items = db.exec(select(HarvestPlanOrderedItem)).all()
    for db_it in db_items:
        db.delete(db_it)
    db.commit()
    
    for idx, item in enumerate(items):
        new_item = HarvestPlanOrderedItem(
            tipo=item.get("tipo", "variable"),
            variable_id=item.get("variable_id"),
            label=item.get("label"),
            ordem=idx
        )
        db.add(new_item)
    db.commit()
