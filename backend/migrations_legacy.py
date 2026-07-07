import json
import re
from sqlmodel import Session, select, SQLModel
from sqlalchemy import text, inspect

from database import (
    Scenario, Variable, Sector, Equation, Dependency, Result, parse_year,
    VariableType, VariableStatus, ResultStatus, Stage, ControlPoint
)

def migrate_legacy_data(session: Session):
    inspector = inspect(session.bind)
    if "scenarios" not in inspector.get_table_names():
        return

    columns = [col["name"] for col in inspector.get_columns("scenarios")]
    if "variables" not in columns:
        return

    # 1. Fetch all records from the old table
    rows = session.execute(
        text("SELECT id, year_harvest, reference_month, version, status, variables, created_at, updated_at FROM scenarios")
    ).fetchall()

    # 2. Drop old scenarios table and its indexes to avoid conflicts
    session.execute(text("DROP TABLE scenarios CASCADE"))
    session.commit()

    # 3. Create new tables
    SQLModel.metadata.create_all(session.bind)

    # 4. Migrate the data
    for row in rows:
        scenario_id, year_harvest, reference_month, version, status, variables_json, created_at, updated_at = row

        if isinstance(variables_json, str):
            variables_list = json.loads(variables_json)
        else:
            variables_list = variables_json

        parsed_year = parse_year(year_harvest)
        # Create new Scenario record
        new_scenario = Scenario(
            id=scenario_id,
            nome=f"Cenário {parsed_year} - {reference_month} (v{version})",
            year_harvest=parsed_year,
            reference_month=reference_month,
            status=status,
            cycle_start_month="Abril",
            created_at=created_at,
            updated_at=updated_at
        )
        session.add(new_scenario)
        session.flush()

        for v in variables_list:
            var_ref = v["ID - REF"]

            db_var = session.get(Variable, var_ref)
            if not db_var:
                old_type = v.get("TIPO", "INPUT")
                tipo = VariableType.INPUT
                if old_type == "OUTPUT":
                    tipo = VariableType.OUTPUT
                elif old_type == "DERIVADA":
                    tipo = VariableType.DERIVADA

                # Check if it is a known scenario variable based on user's input
                if var_ref in {"DIA", "APROVEITAMENTO_OPERACIONAL", "DISPONIBILIDADE"}:
                    tipo = VariableType.CENARIO

                def_val = v.get("DEFINIÇÃO", "")
                desc_val = v.get("DESCRIÇÃO", "")
                nome = def_val.strip() if def_val.strip() else desc_val.strip()
                if not nome:
                    nome = var_ref

                sector_str = v.get("SETOR", "OUTROS").strip().upper()
                db_sector = session.get(Sector, sector_str)
                if not db_sector:
                    db_sector = Sector(
                        id=sector_str,
                        nome=sector_str.title(),
                        descricao="Importado automaticamente"
                    )
                    session.add(db_sector)
                    session.flush()

                db_var = Variable(
                    id=var_ref,
                    nome=nome,
                    descricao=desc_val,
                    setor_id=sector_str,
                    tipo=tipo,
                    unidade=v.get("UNIDADE DE MEDIDA", ""),
                    status=VariableStatus.ATIVA
                )
                session.add(db_var)
                session.flush()

            eq_val = v.get("EQUAÇÕES E VALORES", "")
            if isinstance(eq_val, str) and eq_val.startswith("="):
                stmt = select(Equation).where(Equation.variable_id == var_ref)
                db_eq = session.exec(stmt).first()
                if not db_eq:
                    db_eq = Equation(
                        variable_id=var_ref,
                        expression_original=eq_val,
                        expression_normalized=eq_val,
                        version=1,
                        status="ativa",
                        created_at=created_at,
                        updated_at=updated_at
                    )
                    session.add(db_eq)
                    session.flush()

                    # Extract dependencies
                    deps = set(re.findall(r'\b[a-zA-Z_][a-zA-Z0-9_]*\b', eq_val))
                    deps = deps - {'SE', 'SEERRO', 'SOMA', 'PROCV', 'LN', 'SUBTOTAL', 'SOMASES', 'Vapor', 'True', 'False'}
                    for idx, dep_id in enumerate(sorted(deps)):
                        db_dep = Dependency(
                            equation_id=db_eq.id,
                            dependency_var_id=dep_id,
                            evaluation_order=idx
                        )
                        session.add(db_dep)

            val_float = None
            res_status = ResultStatus.PENDING
            if not (isinstance(eq_val, str) and eq_val.startswith("=")):
                try:
                    val_float = float(str(eq_val).replace(",", "."))
                    res_status = ResultStatus.OK
                except ValueError:
                    pass

            db_res = Result(
                variable_id=var_ref,
                scenario_id=scenario_id,
                value=val_float,
                status=res_status,
                error_message="",
                timestamp=updated_at
            )
            session.add(db_res)

    # 5. Commit any pending updates
    session.commit()

def heal_missing_control_points(session: Session):
    # Retrieve all variables that don't have control_point_id linked
    unlinked_vars = session.exec(select(Variable).where(Variable.control_point_id == None)).all()
    if not unlinked_vars:
        return
        
    stages = session.exec(select(Stage)).all()
    stage_map = {(s.sector_id, s.nome): s for s in stages}
    cps = session.exec(select(ControlPoint)).all()
    cp_map = {(cp.stage_id, cp.nome): cp for cp in cps}
    
    for v in unlinked_vars:
        et = v.etapa.strip() if v.etapa else "GERAL"
        cp = v.ponto_controle.strip() if v.ponto_controle else "GERAL"
        
        # Resolve Stage
        stage_obj = stage_map.get((v.setor_id, et))
        if not stage_obj:
            stage_orders = [s.ordem for s in stage_map.values() if s.sector_id == v.setor_id]
            next_stage_order = max(stage_orders) + 10 if stage_orders else 10
            stage_obj = Stage(nome=et, sector_id=v.setor_id, ordem=next_stage_order)
            session.add(stage_obj)
            session.flush()
            stage_map[(v.setor_id, et)] = stage_obj
            
        # Resolve ControlPoint
        cp_obj = cp_map.get((stage_obj.id, cp))
        if not cp_obj:
            cp_orders = [c.ordem for c in cp_map.values() if c.stage_id == stage_obj.id]
            next_cp_order = max(cp_orders) + 10 if cp_orders else 10
            cp_obj = ControlPoint(nome=cp, stage_id=stage_obj.id, ordem=next_cp_order)
            session.add(cp_obj)
            session.flush()
            cp_map[(stage_obj.id, cp)] = cp_obj
            
        v.control_point_id = cp_obj.id
        session.add(v)
    session.commit()
