import os
import json
import uuid
import datetime
from sqlmodel import Session, select
from database import (
    engine, Scenario, Variable, Equation, Dependency, Result, Sector,
    ScenarioStatus, VariableType, VariableStatus, ResultStatus
)
import engine as calc_engine

def seed_initial_data():
    with Session(engine) as session:
        # Check if database already has scenarios or variables
        stmt_scen = select(Scenario)
        has_scenarios = session.exec(stmt_scen).first() is not None
        stmt_vars = select(Variable)
        has_variables = session.exec(stmt_vars).first() is not None
        
        if has_scenarios or has_variables:
            print("Database already contains data. Skipping initial seeding.")
            return

        json_path = os.path.join(os.path.dirname(__file__), "memorial_de_calculo_balanco.json")
        if not os.path.exists(json_path):
            print(f"Initial data JSON not found at: {json_path}")
            return

        print(f"Loading initial data from: {json_path}")
        with open(json_path, "r", encoding="utf-8") as f:
            variables_json = json.load(f)

        print(f"Found {len(variables_json)} variables in JSON.")

        # Create scenario base
        scenario_id = uuid.uuid4()
        db_scenario = Scenario(
            id=scenario_id,
            nome="Cenário Base (Inicial)",
            year_harvest="2026/2027",
            reference_month="Abril",
            version=1,
            status=ScenarioStatus.EM_EDICAO,
            created_at=datetime.datetime.utcnow(),
            updated_at=datetime.datetime.utcnow()
        )
        session.add(db_scenario)
        session.flush()

        # Calculate initial results
        calc_res = calc_engine.calculate_state(variables_json)
        results_map = calc_res["results"]

        seeded_sectors = []
        for v in variables_json:
            var_id = v["ID - REF"]
            
            # 1. Sector handling
            sector_str = v.get("SETOR", "OUTROS").strip().upper()
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

            # 2. Variable handling
            tipo_str = v.get("TIPO", "INPUT")
            tipo = VariableType.INPUT
            if tipo_str == "OUTPUT":
                tipo = VariableType.OUTPUT
            elif tipo_str == "DERIVADA":
                tipo = VariableType.DERIVADA
            elif tipo_str == "CENARIO":
                tipo = VariableType.CENARIO
            
            if var_id in {"DIA", "APROVEITAMENTO_OPERACIONAL", "DISPONIBILIDADE"}:
                tipo = VariableType.CENARIO

            nome = v.get("DEFINIÇÃO", "").strip() or v.get("DESCRIÇÃO", "").strip() or var_id
            
            db_var = session.get(Variable, var_id)
            if db_var:
                db_var.nome = nome
                db_var.descricao = v.get("DESCRIÇÃO", "") or ""
                db_var.setor_id = sector_str
                db_var.tipo = tipo
                db_var.unidade = v.get("UNIDADE DE MEDIDA", "") or ""
                db_var.status = VariableStatus.ATIVA
            else:
                db_var = Variable(
                    id=var_id,
                    nome=nome,
                    descricao=v.get("DESCRIÇÃO", "") or "",
                    setor_id=sector_str,
                    tipo=tipo,
                    unidade=v.get("UNIDADE DE MEDIDA", "") or "",
                    status=VariableStatus.ATIVA
                )
            session.add(db_var)
            session.flush()

            # 3. Equation handling
            eq_val = v.get("EQUAÇÕES E VALORES", "")
            if isinstance(eq_val, str) and eq_val.startswith("="):
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

            # 4. Result handling
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

        session.commit()
        print("Database seeding completed successfully.")
