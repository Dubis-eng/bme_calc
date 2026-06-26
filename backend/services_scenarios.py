import uuid
import datetime
from typing import List, Dict, Any
from sqlmodel import select, Session
from database import (
    Scenario, Variable, Equation, Dependency, Result, Sector,
    ScenarioStatus, VariableType, VariableStatus, ResultStatus
)
from schemas import ScenarioDetail
import engine

def get_scenario_variables(scenario_id: uuid.UUID, db: Session) -> List[Dict[str, Any]]:
    results = db.exec(select(Result).where(Result.scenario_id == scenario_id)).all()
    results_map = {r.variable_id: r for r in results}
    db_vars = db.exec(select(Variable)).all()
    
    variables_list = []
    for var in db_vars:
        res = results_map.get(var.id)
        eq_val = ""
        if var.tipo in {VariableType.OUTPUT, VariableType.DERIVADA}:
            db_eq = db.exec(select(Equation).where(Equation.variable_id == var.id, Equation.status == "ativa")).first()
            if db_eq:
                eq_val = db_eq.expression_original
        else:
            if res and res.value is not None:
                eq_val = str(res.value)
                
        variables_list.append({
            "ID - REF": var.id,
            "SETOR": var.setor_id,
            "ETAPA": var.etapa,
            "PONTO DE CONTROLE": var.ponto_controle,
            "DESCRIÇÃO": var.descricao,
            "TIPO": var.tipo.value if hasattr(var.tipo, 'value') else str(var.tipo),
            "UNIDADE DE MEDIDA": var.unidade,
            "EQUAÇÕES E VALORES": eq_val
        })
    return variables_list

def _ensure_variable(v: Dict[str, Any], db: Session) -> Variable:
    var_id = v["ID - REF"]
    db_var = db.get(Variable, var_id)
    if db_var:
        if v.get("ETAPA"):
            db_var.etapa = v["ETAPA"].strip()
        if v.get("PONTO DE CONTROLE"):
            db_var.ponto_controle = v["PONTO DE CONTROLE"].strip()
        return db_var
    tipo_str = v.get("TIPO", "INPUT")
    tipo = VariableType.INPUT
    if tipo_str == "OUTPUT": tipo = VariableType.OUTPUT
    elif tipo_str == "DERIVADA": tipo = VariableType.DERIVADA
    elif tipo_str == "CENARIO": tipo = VariableType.CENARIO
    if var_id in {"J3", "J16", "J20"}:
        tipo = VariableType.CENARIO
    nome = v.get("DESCRIÇÃO", "").strip() or var_id
    sector_str = v.get("SETOR", "OUTROS").strip().upper()
    db_sector = db.get(Sector, sector_str)
    if not db_sector:
        all_orders = db.exec(select(Sector.ordem)).all()
        next_ordem = max(all_orders) + 10 if all_orders else 10
        db_sector = Sector(id=sector_str, nome=sector_str.title(), descricao="Criado automaticamente no cenário", ordem=next_ordem)
        db.add(db_sector)
        db.flush()
    db_var = Variable(
        id=var_id, nome=nome, descricao=v.get("DESCRIÇÃO", ""),
        setor_id=sector_str, tipo=tipo, unidade=v.get("UNIDADE DE MEDIDA", ""),
        status=VariableStatus.ATIVA,
        etapa=v.get("ETAPA", "").strip() if v.get("ETAPA") else "",
        ponto_controle=v.get("PONTO DE CONTROLE", "").strip() if v.get("PONTO DE CONTROLE") else ""
    )
    db.add(db_var)
    db.flush()
    return db_var

def _ensure_equation(var_id: str, eq_val: str, db_var: Variable, db: Session):
    if not (isinstance(eq_val, str) and eq_val.startswith("=")):
        return
    stmt_eq = select(Equation).where(Equation.variable_id == var_id, Equation.expression_original == eq_val)
    db_eq = db.exec(stmt_eq).first()
    if db_eq:
        return
    db_eq = Equation(
        variable_id=var_id, expression_original=eq_val,
        expression_normalized=engine.normalize_formula(eq_val),
        version=1, status="ativa"
    )
    db.add(db_eq)
    db.flush()
    deps = engine.extract_dependencies(engine.normalize_formula(eq_val))
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

def _upsert_result(var_id: str, scenario_id: uuid.UUID, eq_val: Any, var_calc: Dict[str, Any], db: Session):
    val_float = var_calc.get("value")
    if not (isinstance(eq_val, str) and eq_val.startswith("=")):
        try: val_float = float(str(eq_val).replace(",", "."))
        except: pass
    status_str = var_calc.get("status", "OK")
    if status_str not in {"OK", "DIV_BY_ZERO", "MISSING_VAR", "PENDING"}:
        status_db = ResultStatus.PENDING
    else:
        status_db = ResultStatus(status_str)
    db_res = db.exec(
        select(Result).where(Result.scenario_id == scenario_id, Result.variable_id == var_id)
    ).first()
    if db_res:
        db_res.value = val_float
        db_res.status = status_db
        db_res.error_message = var_calc.get("error_message", "")
        db_res.timestamp = datetime.datetime.utcnow()
    else:
        db_res = Result(
            variable_id=var_id, scenario_id=scenario_id, value=val_float,
            status=status_db, error_message=var_calc.get("error_message", ""),
            timestamp=datetime.datetime.utcnow()
        )
    db.add(db_res)

def create_new_scenario(req, db: Session) -> ScenarioDetail:
    from database import parse_year
    year_harvest_int = parse_year(req.year_harvest)
    stmt = select(Scenario.version).where(
        Scenario.year_harvest == year_harvest_int,
        Scenario.reference_month == req.reference_month
    ).order_by(Scenario.version.desc())
    versions = db.exec(stmt).all()
    next_version = (versions[0] + 1) if versions else 1
    scenario_id = uuid.uuid4()
    db_scenario = Scenario(
        id=scenario_id,
        nome=f"Cenário {year_harvest_int} - {req.reference_month} (v{next_version})",
        year_harvest=year_harvest_int,
        reference_month=req.reference_month,
        version=next_version,
        status=req.status or ScenarioStatus.EM_EDICAO
    )
    db.add(db_scenario)
    db.flush()
    
    # Force global active formulas from DB
    db_equations = {eq.variable_id: eq.expression_original for eq in db.exec(select(Equation).where(Equation.status == "ativa")).all()}
    for v in req.variables:
        var_id = v["ID - REF"]
        db_var = db.get(Variable, var_id)
        if db_var and db_var.tipo in {VariableType.OUTPUT, VariableType.DERIVADA}:
            v["EQUAÇÕES E VALORES"] = db_equations.get(var_id, "")
        elif not db_var:
            tipo_str = v.get("TIPO", "INPUT")
            if tipo_str in {"OUTPUT", "DERIVADA"} and var_id in db_equations:
                v["EQUAÇÕES E VALORES"] = db_equations[var_id]
                
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
        created_at=db_scenario.created_at, updated_at=db_scenario.updated_at
    )

def update_existing_scenario(scenario_id: uuid.UUID, req, db: Session) -> ScenarioDetail:
    db_scenario = db.get(Scenario, scenario_id)
    if not db_scenario:
        raise ValueError("Cenário não encontrado")
    if db_scenario.status in {ScenarioStatus.APROVADO, ScenarioStatus.FINAL}:
        raise ValueError("Cenário bloqueado para edições")
    db_scenario.updated_at = datetime.datetime.utcnow()
    db.add(db_scenario)
    
    # Force global active formulas from DB
    db_equations = {eq.variable_id: eq.expression_original for eq in db.exec(select(Equation).where(Equation.status == "ativa")).all()}
    for v in req.variables:
        var_id = v["ID - REF"]
        db_var = db.get(Variable, var_id)
        if db_var and db_var.tipo in {VariableType.OUTPUT, VariableType.DERIVADA}:
            v["EQUAÇÕES E VALORES"] = db_equations.get(var_id, "")
        elif not db_var:
            tipo_str = v.get("TIPO", "INPUT")
            if tipo_str in {"OUTPUT", "DERIVADA"} and var_id in db_equations:
                v["EQUAÇÕES E VALORES"] = db_equations[var_id]
                
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
        created_at=db_scenario.created_at, updated_at=db_scenario.updated_at
    )
