import uuid
import datetime
import re
from typing import List, Dict, Any
from sqlmodel import select, Session
from database import (
    Scenario, Variable, Equation, Dependency, Result, Sector,
    ScenarioStatus, VariableType, VariableStatus, ResultStatus,
    HarvestPlanSetting
)
from schemas import ScenarioDetail, SectorCreate, SectorUpdate, SectorDetail
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
    stmt = select(Scenario.version).where(
        Scenario.year_harvest == req.year_harvest,
        Scenario.reference_month == req.reference_month
    ).order_by(Scenario.version.desc())
    versions = db.exec(stmt).all()
    next_version = (versions[0] + 1) if versions else 1
    scenario_id = uuid.uuid4()
    db_scenario = Scenario(
        id=scenario_id,
        nome=f"Cenário {req.year_harvest} - {req.reference_month} (v{next_version})",
        year_harvest=req.year_harvest,
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

def list_sectors(db: Session) -> List[Sector]:
    return db.exec(select(Sector).order_by(Sector.ordem)).all()

def create_sector(req: SectorCreate, db: Session) -> Sector:
    sector_id = req.id.strip().upper()
    existing = db.get(Sector, sector_id)
    if existing:
        raise ValueError(f"Setor com ID '{sector_id}' já está cadastrado.")
    
    existing_ordem = db.exec(select(Sector).where(Sector.ordem == req.ordem)).first()
    if existing_ordem:
        raise ValueError(f"A ordem {req.ordem} já está em uso pelo setor '{existing_ordem.nome}'.")
    
    db_sector = Sector(
        id=sector_id,
        nome=req.nome.strip(),
        descricao=req.descricao.strip() if req.descricao else "",
        ordem=req.ordem
    )
    db.add(db_sector)
    db.commit()
    db.refresh(db_sector)
    return db_sector

def update_sector(sector_id: str, req: SectorUpdate, db: Session) -> Sector:
    db_sector = db.get(Sector, sector_id)
    if not db_sector:
        raise ValueError("Setor não encontrado.")
    
    existing_ordem = db.exec(select(Sector).where(Sector.ordem == req.ordem, Sector.id != sector_id)).first()
    if existing_ordem:
        raise ValueError(f"A ordem {req.ordem} já está em uso pelo setor '{existing_ordem.nome}'.")
    
    db_sector.nome = req.nome.strip()
    if req.descricao is not None:
        db_sector.descricao = req.descricao.strip()
    db_sector.ordem = req.ordem
    
    db.add(db_sector)
    db.commit()
    db.refresh(db_sector)
    return db_sector

def delete_sector(sector_id: str, db: Session) -> bool:
    db_sector = db.get(Sector, sector_id)
    if not db_sector:
        raise ValueError("Setor não encontrado.")
    
    stmt = select(Variable).where(Variable.setor_id == sector_id)
    vars_associated = db.exec(stmt).all()
    if vars_associated:
        raise ValueError(f"Não é possível excluir o setor '{db_sector.nome}' porque existem {len(vars_associated)} variáveis associadas a ele.")
    
    db.delete(db_sector)
    db.commit()
    return True

# ── GLOBAL VARIABLES & EQUATIONS CRUD ─────────────────────────────────────

def _update_variable_equation(var_id: str, new_eq_val: str, db_var: Variable, db: Session):
    stmt = select(Equation).where(Equation.variable_id == var_id, Equation.status == "ativa")
    active_eqs = db.exec(stmt).all()
    
    # If not a formula
    if not (isinstance(new_eq_val, str) and new_eq_val.startswith("=")):
        for eq in active_eqs:
            eq.status = "desativada"
            eq.updated_at = datetime.datetime.utcnow()
            db.add(eq)
        db.flush()
        return

    # Check if formula is identical
    for eq in active_eqs:
        if eq.expression_original == new_eq_val:
            return

    # Deactivate old ones
    for eq in active_eqs:
        eq.status = "desativada"
        eq.updated_at = datetime.datetime.utcnow()
        db.add(eq)
    db.flush()

    # Create new active equation
    db_eq = Equation(
        variable_id=var_id,
        expression_original=new_eq_val,
        expression_normalized=engine.normalize_formula(new_eq_val),
        version=len(active_eqs) + 1,
        status="ativa"
    )
    db.add(db_eq)
    db.flush()
    
    # Re-extract dependencies
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
    db_vars = db.exec(select(Variable)).all()
    eqs = db.exec(select(Equation).where(Equation.status == "ativa")).all()
    eq_map = {eq.variable_id: eq.expression_original for eq in eqs}
    
    vars_list = []
    for var in db_vars:
        eq_val = eq_map.get(var.id, "")
        vars_list.append({
            "id": var.id,
            "nome": var.nome,
            "descricao": var.descricao,
            "setor_id": var.setor_id,
            "tipo": var.tipo.value if hasattr(var.tipo, 'value') else str(var.tipo),
            "unidade": var.unidade,
            "status": var.status.value if hasattr(var.status, 'value') else str(var.status),
            "etapa": var.etapa,
            "ponto_controle": var.ponto_controle,
            "equation_value": eq_val
        })
    return vars_list

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
    
    db_var = Variable(
        id=req.id.strip(),
        nome=req.nome.strip(),
        descricao=req.descricao.strip() if req.descricao else "",
        setor_id=sector_id,
        tipo=tipo,
        unidade=req.unidade.strip() if req.unidade else "",
        status=VariableStatus(req.status.strip() if req.status else "ativa"),
        etapa=req.etapa.strip() if req.etapa else "",
        ponto_controle=req.ponto_controle.strip() if req.ponto_controle else ""
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
        "etapa": db_var.etapa,
        "ponto_controle": db_var.ponto_controle,
        "equation_value": eq_val
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
    
    db_var.nome = req.nome.strip()
    db_var.descricao = req.descricao.strip() if req.descricao else ""
    db_var.setor_id = sector_id
    db_var.tipo = tipo
    db_var.unidade = req.unidade.strip() if req.unidade else ""
    db_var.status = VariableStatus(req.status.strip() if req.status else "ativa")
    db_var.etapa = req.etapa.strip() if req.etapa else ""
    db_var.ponto_controle = req.ponto_controle.strip() if req.ponto_controle else ""
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
        "etapa": db_var.etapa,
        "ponto_controle": db_var.ponto_controle,
        "equation_value": eq_val
    }

# ── HARVEST PLAN SETTINGS, CONFIG & CONSOLIDATION ────────────────────────

ALL_MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]

def get_ordered_months(start_month: str) -> List[str]:
    if start_month not in ALL_MONTHS:
        start_month = "Abril"
    idx = ALL_MONTHS.index(start_month)
    return ALL_MONTHS[idx:] + ALL_MONTHS[:idx]

def get_harvest_years(db: Session) -> List[str]:
    stmt = select(Scenario.year_harvest).distinct()
    years = db.exec(stmt).all()
    # Unique and sorted descending
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

def calculate_harvest_plan_consolidation(year_harvest: str, db: Session) -> Dict[str, Any]:
    setting = get_harvest_plan_settings(db)
    harvest_months = get_ordered_months(setting.start_month)
    
    # Get all variables
    stmt_vars = select(Variable)
    db_vars = db.exec(stmt_vars).all()
    vars_map = {v.id: v for v in db_vars}
    
    # Get all approved/final scenarios for the harvest year
    stmt_scenarios = select(Scenario).where(
        Scenario.year_harvest == year_harvest,
        Scenario.status.in_([ScenarioStatus.APROVADO, ScenarioStatus.FINAL])
    )
    scenarios = db.exec(stmt_scenarios).all()
    
    # Group scenarios by month, keeping the one with the highest version
    scenarios_by_month = {}
    for sc in scenarios:
        month = sc.reference_month
        if month not in scenarios_by_month or sc.version > scenarios_by_month[month].version:
            scenarios_by_month[month] = sc
            
    # Load results for each of these scenarios
    monthly_results = {} # {month: {variable_id: float_value}}
    monthly_statuses = {} # {month: {variable_id: str_status}}
    
    for month in harvest_months:
        sc = scenarios_by_month.get(month)
        if sc:
            stmt_results = select(Result).where(Result.scenario_id == sc.id)
            results = db.exec(stmt_results).all()
            monthly_results[month] = {r.variable_id: r.value for r in results}
            monthly_statuses[month] = {r.variable_id: r.status.value if hasattr(r.status, 'value') else str(r.status) for r in results}
        else:
            monthly_results[month] = {}
            monthly_statuses[month] = {}

    # Build input variables list for calculation of accumulated column
    engine_vars = []
    
    # Fetch active global equations
    eq_stmt = select(Equation).where(Equation.status == "ativa")
    active_eqs = db.exec(eq_stmt).all()
    eq_map = {eq.variable_id: eq.expression_original for eq in active_eqs}
    
    for var_id, var in vars_map.items():
        op = var.harvest_plan_op
        if op is None:
            # Default logic: CALCULATE if equation exists, else SUM
            expr = eq_map.get(var_id)
            op = "CALCULATE" if expr else "SUM"
            
        expr = eq_map.get(var_id)
        
        # Calculate monthly values list for operations
        monthly_vals = []
        for m in harvest_months:
            val = monthly_results[m].get(var_id)
            if val is not None:
                monthly_vals.append(val)
                
        # Apply operation
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
            for m in harvest_months:
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
        for m in harvest_months:
            if m in scenarios_by_month:
                month_vals_dict[m] = monthly_results[m].get(var_id)
                month_statuses_dict[m] = monthly_statuses[m].get(var_id, "PENDING")
            else:
                month_vals_dict[m] = None
                month_statuses_dict[m] = "MISSING_SCENARIO"
                
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
        "months": harvest_months,
        "data": data_list
    }

