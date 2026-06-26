from typing import List, Dict, Any, Optional
from sqlmodel import select, Session
from database import (
    Variable, Equation, Dependency, Scenario, Result, HarvestPlanSetting,
    ScenarioStatus, VariableType, ResultStatus
)
import engine

ALL_MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]

def get_ordered_months(start_month: str, db: Session) -> List[str]:
    from database import HarvestMonth
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
    from database import HarvestYear
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
        db.commit()
        db.refresh(setting)
    return setting

def get_variables_harvest_config(db: Session) -> List[Dict[str, Any]]:
    stmt = select(Variable).order_by(Variable.setor_id, Variable.id)
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

def update_variables_harvest_config(configs: List[Dict[str, Any]], db: Session):
    for config in configs:
        var_id = config.get("id")
        db_var = db.get(Variable, var_id)
        if db_var:
            db_var.in_harvest_plan = config.get("in_harvest_plan", False)
            db_var.harvest_plan_op = config.get("harvest_plan_op")
            db_var.harvest_plan_weight_var_id = config.get("harvest_plan_weight_var_id")
            db.add(db_var)
    db.commit()

def get_harvest_plan_selections(year_harvest: int, db: Session) -> Dict[str, Any]:
    from database import HarvestPlanSelection, Scenario, ScenarioStatus
    
    # 1. Fetch current selections from database
    selections = db.exec(select(HarvestPlanSelection).where(HarvestPlanSelection.year_harvest == year_harvest)).all()
    selections_list = []
    for sel in selections:
        selections_list.append({
            "month": sel.month,
            "scenario_id": str(sel.scenario_id) if sel.scenario_id else None,
            "exclude": sel.exclude
        })
        
    # 2. Fetch available scenarios per month (must be approved/final)
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
    from database import HarvestPlanSelection
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

def calculate_harvest_plan_consolidation(year_harvest: Any, db: Session) -> Dict[str, Any]:
    from database import parse_year, HarvestPlanSelection
    if isinstance(year_harvest, str):
        year_harvest_int = parse_year(year_harvest)
    else:
        year_harvest_int = int(year_harvest)
        
    setting = get_harvest_plan_settings(db)
    harvest_months = get_ordered_months(setting.start_month, db)
    
    # 1. Fetch custom selections for this year
    selections = db.exec(select(HarvestPlanSelection).where(HarvestPlanSelection.year_harvest == year_harvest_int)).all()
    selections_map = {sel.month: sel for sel in selections}
    
    # 2. Get all variables
    stmt_vars = select(Variable)
    db_vars = db.exec(stmt_vars).all()
    vars_map = {v.id: v for v in db_vars}
    
    # 3. Get all approved/final scenarios for the harvest year
    stmt_scenarios = select(Scenario).where(
        Scenario.year_harvest == year_harvest_int,
        Scenario.status.in_([ScenarioStatus.APROVADO, ScenarioStatus.FINAL])
    )
    scenarios = db.exec(stmt_scenarios).all()
    
    # Group all available scenarios by month and version
    scenarios_by_month_all = {}
    for sc in scenarios:
        scenarios_by_month_all.setdefault(sc.reference_month, []).append(sc)
        
    # Resolve active scenarios per month based on selections
    scenarios_by_month = {}
    active_months = []
    
    for month in harvest_months:
        sel = selections_map.get(month)
        sc = None
        
        # Resolve according to selection settings
        if sel:
            if sel.exclude:
                # Explicitly excluded, so skip/do not activate this month
                continue
            elif sel.scenario_id:
                # Specific scenario selected, let's find it
                sc = next((s for s in scenarios if s.id == sel.scenario_id), None)
        
        # If no explicit selection/scenario resolved yet, fallback to highest version
        if not sc:
            avail_scs = scenarios_by_month_all.get(month, [])
            if avail_scs:
                # sort by version descending and take first
                avail_scs_sorted = sorted(avail_scs, key=lambda s: s.version, reverse=True)
                sc = avail_scs_sorted[0]
                
        # If we have a resolved scenario for this month, add it
        if sc:
            scenarios_by_month[month] = sc
            active_months.append(month)
            
    # Load results for each of these active scenarios
    monthly_results = {} # {month: {variable_id: float_value}}
    monthly_statuses = {} # {month: {variable_id: str_status}}
    
    for month in active_months:
        sc = scenarios_by_month[month]
        stmt_results = select(Result).where(Result.scenario_id == sc.id)
        results = db.exec(stmt_results).all()
        monthly_results[month] = {r.variable_id: r.value for r in results}
        monthly_statuses[month] = {r.variable_id: r.status.value if hasattr(r.status, 'value') else str(r.status) for r in results}

    # Build input variables list for calculation of accumulated column
    engine_vars = []
    
    # Fetch active global equations
    eq_stmt = select(Equation).where(Equation.status == "ativa")
    active_eqs = db.exec(eq_stmt).all()
    eq_map = {eq.variable_id: eq.expression_original for eq in active_eqs}
    
    for var_id, var in vars_map.items():
        op = var.harvest_plan_op
        if op is None:
            expr = eq_map.get(var_id)
            op = "CALCULATE" if expr else "SUM"
            
        expr = eq_map.get(var_id)
        
        # Calculate monthly values list for operations using ONLY active_months
        monthly_vals = []
        for m in active_months:
            val = monthly_results[m].get(var_id)
            if val is not None:
                monthly_vals.append(val)
                
        accum_val = None
        if op == "SUM":
            accum_val = sum(monthly_vals) if monthly_vals else 0.0
        elif op == "AVERAGE":
            accum_val = sum(monthly_vals) / len(monthly_vals) if monthly_vals else 0.0
        elif op == "WEIGHTED_AVERAGE":
            weight_id = var.harvest_plan_weight_var_id
            num = 0.0
            den = 0.0
            has_w = False
            for m in active_months:
                v_val = monthly_results[m].get(var_id)
                w_val = monthly_results[m].get(weight_id) if weight_id else None
                if v_val is not None and w_val is not None:
                    num += v_val * w_val
                    den += w_val
                    has_w = True
            if has_w and den != 0.0:
                accum_val = num / den
            else:
                accum_val = sum(monthly_vals) / len(monthly_vals) if monthly_vals else 0.0
        elif op == "CALCULATE":
            pass
            
        if op != "CALCULATE":
            engine_vars.append({
                "ID - REF": var_id,
                "SETOR": var.setor_id,
                "TIPO": "INPUT",
                "UNIDADE DE MEDIDA": var.unidade,
                "DESCRIÇÃO": var.nome,
                "EQUAÇÕES E VALORES": str(accum_val) if accum_val is not None else "0"
            })
        else:
            engine_vars.append({
                "ID - REF": var_id,
                "SETOR": var.setor_id,
                "TIPO": var.tipo.value if hasattr(var.tipo, 'value') else str(var.tipo),
                "UNIDADE DE MEDIDA": var.unidade,
                "DESCRIÇÃO": var.nome,
                "EQUAÇÕES E VALORES": expr if expr else "0"
            })
            
    # Run the calculation engine on the engine_vars
    calc_results = engine.calculate_state(engine_vars)
    accumulated_results = calc_results["results"] # {var_id: {"value": ..., "status": ...}}
    
    # Construct final data only for variables in the harvest plan
    data_list = []
    for var_id, var in vars_map.items():
        if not var.in_harvest_plan:
            continue
            
        month_vals_dict = {}
        month_statuses_dict = {}
        for m in active_months:
            month_vals_dict[m] = monthly_results[m].get(var_id)
            month_statuses_dict[m] = monthly_statuses[m].get(var_id, "PENDING")
                
        accum_res = accumulated_results.get(var_id, {"value": None, "status": "PENDING", "error_message": ""})
        
        data_list.append({
            "variable_id": var_id,
            "nome": var.nome,
            "descricao": var.descricao,
            "setor_id": var.setor_id,
            "unidade": var.unidade,
            "tipo": var.tipo.value if hasattr(var.tipo, 'value') else str(var.tipo),
            "harvest_plan_op": var.harvest_plan_op,
            "harvest_plan_weight_var_id": var.harvest_plan_weight_var_id,
            "monthly_values": month_vals_dict,
            "monthly_statuses": month_statuses_dict,
            "accumulated": accum_res
        })
        
    return {
        "months": active_months,
        "data": data_list
    }
