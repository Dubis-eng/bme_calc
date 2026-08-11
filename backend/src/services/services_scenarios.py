import datetime
import uuid
from typing import List, Dict, Any
from sqlmodel import Session, select
from sqlalchemy import func

from src.db.database import Scenario, ScenarioStatus, Equation, Result, Variable as DBVariable
from src.schemas.schemas import ScenarioDetail
from src.core import engine

def _ensure_variable(v: Dict[str, Any], db: Session) -> DBVariable:
    var_id = v["ID - REF"]
    db_var = db.get(DBVariable, var_id)
    if not db_var:
        db_var = DBVariable(
            id=var_id,
            nome=var_id,
            descricao=v.get("DESCRIÇÃO", ""),
            setor_id=(v.get("SETOR") or "OUTROS").strip().upper(),
            tipo=v.get("TIPO", "INPUT"),
            unidade=v.get("UNIDADE DE MEDIDA", "")
        )
        db.add(db_var)
        db.flush()
    return db_var

def get_scenario_variables(scenario_id: uuid.UUID, db: Session) -> List[Dict[str, Any]]:
    vars_stmt = select(Scenario).where(Scenario.id == scenario_id)
    sc = db.exec(vars_stmt).first()
    if not sc:
        return []
        
    res_stmt = select(Result).where(Result.scenario_id == scenario_id)
    results = db.exec(res_stmt).all()
    results_map = {r.variable_id: r for r in results}
    
    from src.services.services_variables import list_variables
    all_vars = list_variables(db)
    
    frontend_vars = []
    for v in all_vars:
        var_id = v["id"]
        res = results_map.get(var_id)
        
        val_display = None
        if res and res.value is not None:
            if res.value.is_integer():
                val_display = str(int(res.value))
            else:
                val_display = str(res.value)
        elif v.get("tipo") == 'CONSTANT' and v.get("equation_value"):
            val_display = str(v.get("equation_value"))

        eq_val = v.get("equation_value") or ""
        v_tipo = (v.get("tipo") or "INPUT").upper()

        if v_tipo in ["INPUT", "CENARIO"]:
            if val_display is not None:
                eq_val = val_display

        fv = {
            "ID - REF": var_id,
            "DESCRIÇÃO": v.get("descricao") or "",
            "SETOR": v.get("setor_id") or "",
            "ETAPA": v.get("etapa") or "",
            "PONTO DE CONTROLE": v.get("ponto_controle") or "",
            "control_point_id": str(v.get("control_point_id")) if v.get("control_point_id") else None,
            "stage_id": str(v.get("stage_id")) if v.get("stage_id") else None,
            "ordem": v.get("ordem") or 0,
            "TIPO": v_tipo,
            "EQUAÇÕES E VALORES": eq_val,
            "VALOR": val_display,
            "UNIDADE DE MEDIDA": v.get("unidade") or "",
            "CRITICIDADE": "MEDIA",
            "tipo_exibicao": v.get("tipo_exibicao") or "FLOAT",
            "decimais": v.get("casas_decimais") if v.get("casas_decimais") is not None else 2,
            "casas_decimais": v.get("casas_decimais"),
            "percent_base": v.get("percent_base") or "DECIMAL",
            "in_harvest_plan": v.get("in_harvest_plan") or False,
            "harvest_plan_op": v.get("harvest_plan_op"),
            "harvest_plan_weight_var_id": v.get("harvest_plan_weight_var_id"),
            "agrupamento": v.get("agrupamento"),
            "STATUS": v.get("status") or "ativa",
            "RESULT_STATUS": res.status if res else "PENDING",
            "RESULT_ERROR": res.error_message if res else ""
        }
        frontend_vars.append(fv)
        
    return frontend_vars

def _upsert_result(var_id: str, scenario_id: uuid.UUID, expression: str, var_calc: Dict[str, Any], db: Session):
    stmt = select(Result).where(Result.variable_id == var_id, Result.scenario_id == scenario_id)
    res = db.exec(stmt).first()
    
    val = var_calc.get("value")
    val_float = float(val) if val is not None else None
    status_db = var_calc.get("status", "PENDING")
    
    if res:
        res.value = val_float
        res.status = status_db
        res.error_message = var_calc.get("error_message", "")
        res.timestamp = datetime.datetime.utcnow()
    else:
        db_res = Result(
            variable_id=var_id, scenario_id=scenario_id, value=val_float,
            status=status_db, error_message=var_calc.get("error_message", ""),
            timestamp=datetime.datetime.utcnow()
        )
        db.add(db_res)

def create_new_scenario(req, db: Session) -> ScenarioDetail:
    from src.db.database import parse_year
    from src.services.services_harvest_plan import get_harvest_plan_settings
    year_harvest_int = parse_year(req.year_harvest)
    
    max_ver_stmt = select(func.max(Scenario.version)).where(
        Scenario.year_harvest == year_harvest_int,
        Scenario.reference_month == req.reference_month
    )
    current_max = db.exec(max_ver_stmt).first()
    next_version = (current_max + 1) if (current_max is not None and current_max >= 1) else 1
    
    scenario_id = uuid.uuid4()
    setting = get_harvest_plan_settings(db)
    db_scenario = Scenario(
        id=scenario_id,
        nome=f"Cenário {year_harvest_int} - {req.reference_month} (v{next_version})",
        year_harvest=year_harvest_int,
        reference_month=req.reference_month,
        version=next_version,
        status=req.status or ScenarioStatus.EM_EDICAO,
        cycle_start_month=setting.start_month
    )
    db.add(db_scenario)
    db.flush()
    
    _force_global_formulas(req.variables, db)
                
    calc_res = engine.calculate_state(req.variables)
    results_map = calc_res["results"]
    for v in req.variables:
        var_id = v["ID - REF"]
        eq_val = v.get("EQUAÇÕES E VALORES", "")
        db_var = _ensure_variable(v, db)
        var_calc = results_map.get(var_id, {"value": None, "status": "PENDING", "error_message": ""})
        _upsert_result(var_id, scenario_id, eq_val, var_calc, db)
    db.commit()
    db.refresh(db_scenario)
    return ScenarioDetail(
        id=db_scenario.id, nome=db_scenario.nome,
        year_harvest=db_scenario.year_harvest, reference_month=db_scenario.reference_month,
        version=db_scenario.version, status=db_scenario.status,
        variables=get_scenario_variables(scenario_id, db),
        created_at=db_scenario.created_at, updated_at=db_scenario.updated_at,
        cycle_start_month=db_scenario.cycle_start_month
    )

def update_existing_scenario(scenario_id: uuid.UUID, req, db: Session) -> ScenarioDetail:
    db_scenario = db.get(Scenario, scenario_id)
    if not db_scenario:
        raise ValueError("Cenário não encontrado")
    if hasattr(req, "status") and req.status is not None:
        db_scenario.status = req.status
    db_scenario.updated_at = datetime.datetime.utcnow()
    
    from src.services.services_harvest_plan import get_harvest_plan_settings
    setting = get_harvest_plan_settings(db)
    db_scenario.cycle_start_month = setting.start_month
    
    db.add(db_scenario)
    
    _force_global_formulas(req.variables, db)
                
    calc_res = engine.calculate_state(req.variables)
    results_map = calc_res["results"]
    for v in req.variables:
        var_id = v["ID - REF"]
        eq_val = v.get("EQUAÇÕES E VALORES", "")
        db_var = _ensure_variable(v, db)
        var_calc = results_map.get(var_id, {"value": None, "status": "PENDING", "error_message": ""})
        _upsert_result(var_id, scenario_id, eq_val, var_calc, db)
    db.commit()
    db.refresh(db_scenario)
    return ScenarioDetail(
        id=db_scenario.id, nome=db_scenario.nome,
        year_harvest=db_scenario.year_harvest, reference_month=db_scenario.reference_month,
        version=db_scenario.version, status=db_scenario.status,
        variables=get_scenario_variables(scenario_id, db),
        created_at=db_scenario.created_at, updated_at=db_scenario.updated_at,
        cycle_start_month=db_scenario.cycle_start_month
    )

def _force_global_formulas(variables: List[Dict[str, Any]], db: Session):
    db_equations = {eq.variable_id: eq.expression_original for eq in db.exec(select(Equation).where(Equation.status == "ativa")).all()}
    for v in variables:
        var_id = v["ID - REF"]
        if var_id in db_equations:
            v["EQUAÇÕES E VALORES"] = db_equations[var_id]
