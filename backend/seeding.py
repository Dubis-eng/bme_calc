import os
import json
import uuid
import datetime
from sqlmodel import Session, select
from database import (
    engine, Scenario, Variable, Equation, Dependency, Result, Sector,
    ScenarioStatus, VariableType, VariableStatus, ResultStatus
)
from sqlalchemy import text
import engine as calc_engine

def get_or_create_sector(session: Session, sector_name: str, seeded_sectors: list) -> str:
    sector_str = sector_name.strip().upper() or "OUTROS"
    db_sector = session.get(Sector, sector_str)
    if not db_sector:
        next_ordem = (len(seeded_sectors) + 1) * 10
        db_sector = Sector(
            id=sector_str,
            nome=sector_str.title(),
            descricao="Criado automaticamente na semeadura inicial",
            ordem=next_ordem
        )
        session.add(db_sector)
        session.flush()
        seeded_sectors.append(sector_str)
    return sector_str

def get_variable_type(var_id: str, tipo_str: str) -> VariableType:
    if var_id in {"J3", "J16", "J20"}:
        return VariableType.CENARIO
    tipo_map = {
        "OUTPUT": VariableType.OUTPUT,
        "DERIVADA": VariableType.DERIVADA,
        "CENARIO": VariableType.CENARIO
    }
    return tipo_map.get(tipo_str.upper(), VariableType.INPUT)

def create_or_update_variable(session: Session, v: dict, sector_str: str) -> Variable:
    var_id = v["ID - REF"]
    tipo = get_variable_type(var_id, v.get("TIPO", "INPUT"))
    nome = v.get("DESCRIÇÃO", "").strip() or var_id
    
    in_harvest = str(v.get("IN_HARVEST_PLAN", "")).lower() == "true" or v.get("IN_HARVEST_PLAN", False) is True
    harvest_op = v.get("HARVEST_PLAN_OP") or None
    harvest_weight = v.get("HARVEST_PLAN_WEIGHT_VAR_ID") or None

    db_var = session.get(Variable, var_id)
    if not db_var:
        db_var = Variable(id=var_id, nome=nome, setor_id=sector_str, tipo=tipo)
    
    db_var.nome = nome
    db_var.descricao = v.get("DESCRIÇÃO", "") or ""
    db_var.setor_id = sector_str
    db_var.tipo = tipo
    db_var.unidade = v.get("UNIDADE DE MEDIDA", "") or ""
    db_var.status = VariableStatus(v.get("STATUS", "ativa").lower())
    db_var.etapa = v.get("ETAPA", "").strip()
    db_var.ponto_controle = v.get("PONTO DE CONTROLE", "").strip()
    db_var.in_harvest_plan = in_harvest
    db_var.harvest_plan_op = harvest_op
    db_var.harvest_plan_weight_var_id = harvest_weight
    
    session.add(db_var)
    session.flush()
    return db_var

def create_equation_and_dependencies(session: Session, var_id: str, eq_val: str, sector_str: str):
    if not (isinstance(eq_val, str) and eq_val.startswith("=")):
        return
        
    normalized = calc_engine.normalize_formula(eq_val)
    db_eq = Equation(
        variable_id=var_id,
        expression_original=eq_val,
        expression_normalized=normalized,
        version=1,
        status="ativa",
        created_at=datetime.datetime.utcnow(),
        updated_at=datetime.datetime.utcnow()
    )
    session.add(db_eq)
    session.flush()

    deps = calc_engine.extract_dependencies(normalized)
    for idx, dep_id in enumerate(sorted(deps)):
        dep_var = session.get(Variable, dep_id)
        if not dep_var:
            dep_var = Variable(
                id=dep_id,
                nome=dep_id,
                descricao="Auto-criado por dependência",
                setor_id=sector_str,
                tipo=VariableType.INPUT,
                status=VariableStatus.PENDENTE
            )
            session.add(dep_var)
            session.flush()
        
        db_dep = Dependency(
            equation_id=db_eq.id,
            dependency_var_id=dep_id,
            evaluation_order=idx
        )
        session.add(db_dep)

def create_result(session: Session, var_id: str, scenario_id: uuid.UUID, eq_val: str, results_map: dict):
    var_calc = results_map.get(var_id, {"value": None, "status": "PENDING", "error_message": ""})
    val_float = var_calc.get("value")
    
    if not (isinstance(eq_val, str) and eq_val.startswith("=")):
        try:
            val_float = float(str(eq_val).replace(",", "."))
        except ValueError:
            pass

    status_str = var_calc.get("status", "OK") if val_float is not None or (isinstance(eq_val, str) and eq_val.startswith("=")) else "PENDING"
    if status_str not in {"OK", "DIV_BY_ZERO", "MISSING_VAR", "PENDING"}:
        status_db = ResultStatus.PENDING
    else:
        status_db = ResultStatus(status_str)

    db_res = Result(
        variable_id=var_id,
        scenario_id=scenario_id,
        value=val_float,
        status=status_db,
        error_message=var_calc.get("error_message", ""),
        timestamp=datetime.datetime.utcnow()
    )
    session.add(db_res)

def seed_initial_data():
    with Session(engine) as session:
        try:
            has_variables = session.exec(select(Variable)).first() is not None
        except Exception:
            has_variables = False
            
    if has_variables:
        print("Database already seeded. Skipping initial seeding to preserve data.")
        return

    print("Database is empty. Starting initial seeding process...")
    from sqlmodel import SQLModel
    SQLModel.metadata.create_all(engine)

    json_path = os.path.join(os.path.dirname(__file__), "memorial_de_calculo_balanco.json")
    if not os.path.exists(json_path):
        print(f"Initial data JSON not found at: {json_path}")
        return

    with open(json_path, "r", encoding="utf-8") as f:
        variables_json = json.load(f)

    with Session(engine) as session:
        scenario_id = uuid.uuid4()
        db_scenario = Scenario(
            id=scenario_id,
            nome="Cenário Base (Inicial)",
            year_harvest=2026,
            reference_month="Abril",
            version=1,
            status=ScenarioStatus.EM_EDICAO,
            created_at=datetime.datetime.utcnow(),
            updated_at=datetime.datetime.utcnow()
        )
        session.add(db_scenario)
        session.flush()

        calc_res = calc_engine.calculate_state(variables_json)
        results_map = calc_res["results"]
        seeded_sectors = []

        for v in variables_json:
            sector_str = get_or_create_sector(session, v.get("SETOR", "OUTROS"), seeded_sectors)
            create_or_update_variable(session, v, sector_str)
            eq_val = v.get("EQUAÇÕES E VALORES", "")
            create_equation_and_dependencies(session, v["ID - REF"], eq_val, sector_str)
            create_result(session, v["ID - REF"], scenario_id, eq_val, results_map)

        from migrations_legacy import heal_missing_control_points
        heal_missing_control_points(session)
        session.commit()
    print("Database seeding completed successfully.")
