from typing import List, Dict, Any, Optional
from sqlmodel import select, Session
from src.db.database import (
    Variable, Equation, Dependency, Scenario, Result, HarvestPlanSetting,
    ScenarioStatus, VariableType, ResultStatus, VariableStatus
)
from src.core import engine

def calculate_harvest_plan_consolidation(year_harvest: Any, db: Session) -> Dict[str, Any]:
    from src.db.database import parse_year, HarvestPlanSelection
    from src.services.services_harvest_plan import get_harvest_plan_settings, get_ordered_months, get_harvest_plan_structure
    
    year_harvest_int = parse_year(year_harvest) if isinstance(year_harvest, str) else int(year_harvest)
        
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
    
    # Group all available scenarios by month
    scenarios_by_month_all = {}
    for sc in scenarios:
        scenarios_by_month_all.setdefault(sc.reference_month, []).append(sc)
        
    # Resolve active scenarios per month based on selections
    scenarios_by_month = {}
    active_months = []
    
    for month in harvest_months:
        sel = selections_map.get(month)
        sc = None
        
        if sel and sel.exclude:
            continue
        if sel and sel.scenario_id:
            sc = next((s for s in scenarios if s.id == sel.scenario_id), None)
        
        if not sc:
            avail_scs = scenarios_by_month_all.get(month, [])
            if avail_scs:
                avail_scs_sorted = sorted(avail_scs, key=lambda s: s.version, reverse=True)
                sc = avail_scs_sorted[0]
                
        if sc:
            scenarios_by_month[month] = sc
            active_months.append(month)
            
    # Load results for each active scenario
    monthly_results = {}
    monthly_statuses = {}
    for month in active_months:
        sc_results = db.exec(select(Result).where(Result.scenario_id == scenarios_by_month[month].id)).all()
        monthly_results[month] = {r.variable_id: r.value for r in sc_results}
        monthly_statuses[month] = {r.variable_id: (r.status.value if hasattr(r.status, 'value') else str(r.status)) for r in sc_results}

    # Build input variables list for calculation of accumulated column
    engine_vars = []
    
    eq_stmt = select(Equation).where(Equation.status == "ativa")
    active_eqs = db.exec(eq_stmt).all()
    eq_map = {eq.variable_id: eq.expression_original for eq in active_eqs}
    
    for var_id, var in vars_map.items():
        op = var.harvest_plan_op
        if op is None:
            expr = eq_map.get(var_id)
            op = "CALCULATE" if expr else "SUM"
            
        expr = eq_map.get(var_id)
        
        monthly_vals = []
        for m in active_months:
            val = monthly_results[m].get(var_id)
            if val is not None:
                monthly_vals.append(val)
                
        avg = sum(monthly_vals) / len(monthly_vals) if monthly_vals else 0.0
        accum_val = None
        if op == "SUM":
            accum_val = sum(monthly_vals) if monthly_vals else 0.0
        elif op == "AVERAGE":
            accum_val = avg
        elif op == "WEIGHTED_AVERAGE":
            w_id = var.harvest_plan_weight_var_id
            w_pairs = [(monthly_results[m].get(var_id), monthly_results[m].get(w_id)) for m in active_months if w_id]
            valid_w = [(v, w) for v, w in w_pairs if v is not None and w is not None]
            accum_val = sum(v * w for v, w in valid_w) / sum(w for _, w in valid_w) if valid_w and sum(w for _, w in valid_w) != 0 else avg
            
        t_val = str(accum_val) if accum_val is not None else "0"
        t_type = "INPUT"
        if op == "CALCULATE":
            t_val = expr if expr else "0"
            t_type = var.tipo.value if hasattr(var.tipo, 'value') else str(var.tipo)

        engine_vars.append({
            "ID - REF": var_id,
            "SETOR": var.setor_id,
            "TIPO": t_type,
            "UNIDADE DE MEDIDA": var.unidade,
            "DESCRIÇÃO": var.nome,
            "EQUAÇÕES E VALORES": t_val
        })
            
    calc_results = engine.calculate_state(engine_vars)
    accumulated_results = calc_results["results"]
    
    # 4. Fetch the ordered structure of variables and dividers
    structure = get_harvest_plan_structure(db)
    
    # Build dictionary of consolidated variables
    consolidated_dict = {}
    for var_id, var in vars_map.items():
        if var.in_harvest_plan:
            month_vals_dict = {m: monthly_results[m].get(var_id) for m in active_months}
            month_statuses_dict = {m: monthly_statuses[m].get(var_id, "PENDING") for m in active_months}
            accum_res = accumulated_results.get(var_id, {"value": None, "status": "PENDING", "error_message": ""})
            
            consolidated_dict[var_id] = {
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
                "accumulated": accum_res,
                "casas_decimais": var.casas_decimais, 
                "tipo_exibicao": var.tipo_exibicao, 
                "percent_base": var.percent_base
            }
            
    # 5. Order the output according to the structure and insert dividers
    data_list = []
    for item in structure:
        if item["tipo"] == "variable":
            v_id = item["variable_id"]
            if v_id in consolidated_dict:
                var_data = consolidated_dict[v_id]
                var_data["tipo_item"] = "variable"
                data_list.append(var_data)
        else:
            # Divider item
            data_list.append({
                "tipo_item": "divider",
                "label": item["label"],
                "variable_id": f"DIVIDER_{item['id']}",
                "nome": None,
                "descricao": None,
                "setor_id": None,
                "unidade": None,
                "tipo": "INPUT",
                "harvest_plan_op": None,
                "harvest_plan_weight_var_id": None,
                "monthly_values": {},
                "monthly_statuses": {},
                "accumulated": {"value": None, "status": "OK", "error_message": ""}
            })
            
    return {
        "months": active_months,
        "data": data_list
    }
