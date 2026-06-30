import datetime
import json
import re
from typing import Set
from sqlmodel import Session, select, SQLModel
from sqlalchemy import text, inspect

from database import (
    engine, ScenarioStatus, VariableType, VariableStatus, ResultStatus,
    Scenario, Variable, Sector, Equation, Dependency, Result, HarvestPlanSetting, parse_year,
    Stage, ControlPoint
)

from migrations_legacy import migrate_legacy_data, heal_missing_control_points

def migrate_database_schema(session: Session):
    SQLModel.metadata.create_all(session.bind)
    session.commit()
    heal_missing_control_points(session)
    inspector = inspect(session.bind)
    tables = inspector.get_table_names()

    # 1. Migrate year_harvest from string to integer
    if "scenarios" in tables:
        cols = inspector.get_columns("scenarios")
        y_col = next((c for c in cols if c["name"] == "year_harvest"), None)
        if y_col and ("VARCHAR" in str(y_col["type"]).upper() or "TEXT" in str(y_col["type"]).upper()):
            scenarios_data = session.execute(text("SELECT id, year_harvest FROM scenarios")).fetchall()
            years = {2026, 2027, 2028}
            s_years = {}
            for s_id, y_h in scenarios_data:
                p_y = parse_year(y_h)
                years.add(p_y)
                s_years[s_id] = p_y
            for yr in years:
                if not session.execute(text("SELECT 1 FROM harvest_years WHERE id=:yr"), {"yr": yr}).first():
                    session.execute(text("INSERT INTO harvest_years (id, active) VALUES (:yr, true)"), {"yr": yr})
            session.commit()
            for s_id, p_y in s_years.items():
                session.execute(text("UPDATE scenarios SET year_harvest=:yr WHERE id=:sid"), {"yr": str(p_y), "sid": s_id})
            session.commit()
            if session.bind.dialect.name == "postgresql":
                session.execute(text("ALTER TABLE scenarios ALTER COLUMN year_harvest TYPE INTEGER USING (year_harvest::integer)"))
                session.commit()

    # 2. Seed harvest_years
    if "harvest_years" in tables and session.execute(text("SELECT COUNT(*) FROM harvest_years")).scalar() == 0:
        for yr in [2026, 2027, 2028]:
            session.execute(text(f"INSERT INTO harvest_years (id, active) VALUES ({yr}, true)"))
        session.commit()

    # 3. Seed harvest_months
    if "harvest_months" in tables and session.execute(text("SELECT COUNT(*) FROM harvest_months")).scalar() == 0:
        months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]
        for idx, m in enumerate(months):
            session.execute(text("INSERT INTO harvest_months (id, name, order_index, enabled) VALUES (:id, :name, :order_index, :enabled)"),
                            {"id": idx+1, "name": m, "order_index": idx, "enabled": True})
        session.commit()

    if "variables" in tables and "sectors" not in tables:
        SQLModel.metadata.create_all(session.bind)
        columns = [col["name"] for col in inspector.get_columns("variables")]
        if "setor" in columns:
            rows = session.execute(text("SELECT id, setor FROM variables")).fetchall()

            unique_sectors = set(r[1] for r in rows if r[1])
            for s in unique_sectors:
                sector_id = s.strip().upper()
                stmt = select(Sector).where(Sector.id == sector_id)
                db_sector = session.exec(stmt).first()
                if not db_sector:
                    db_sector = Sector(id=sector_id, nome=sector_id.title(), descricao="Migrado do campo setor")
                    session.add(db_sector)
            session.commit()

            try:
                session.execute(text("ALTER TABLE variables ADD COLUMN setor_id VARCHAR"))
                session.commit()
            except Exception:
                pass

            session.execute(text("UPDATE variables SET setor_id = UPPER(TRIM(setor))"))
            session.commit()

    if "sectors" in tables:
        cols = [col["name"] for col in inspector.get_columns("sectors")]
        if "ordem" not in cols:
            try:
                session.execute(text("ALTER TABLE sectors ADD COLUMN ordem INTEGER DEFAULT 0"))
                session.commit()
            except Exception:
                pass

    # Ensure harvest_plan_settings exists and has default row
    SQLModel.metadata.create_all(session.bind)
    tables = inspect(session.bind).get_table_names()
    if "harvest_plan_settings" in tables:
        # Check if default setting row exists
        stmt = text("SELECT COUNT(*) FROM harvest_plan_settings WHERE id = 'default'")
        count = session.execute(stmt).scalar()
        if count == 0:
            session.execute(text("INSERT INTO harvest_plan_settings (id, start_month) VALUES ('default', 'Abril')"))
            session.commit()

    # Ensure new columns exist on variables table
    if "variables" in tables:
        cols = [col["name"] for col in inspect(session.bind).get_columns("variables")]
        if "in_harvest_plan" not in cols:
            try:
                session.execute(text("ALTER TABLE variables ADD COLUMN in_harvest_plan BOOLEAN DEFAULT FALSE"))
                session.commit()
            except Exception as e:
                print(f"Error migrating in_harvest_plan: {e}")
        if "harvest_plan_op" not in cols:
            try:
                session.execute(text("ALTER TABLE variables ADD COLUMN harvest_plan_op VARCHAR DEFAULT NULL"))
                session.commit()
            except Exception as e:
                print(f"Error migrating harvest_plan_op: {e}")
        if "harvest_plan_weight_var_id" not in cols:
            try:
                session.execute(text("ALTER TABLE variables ADD COLUMN harvest_plan_weight_var_id VARCHAR DEFAULT NULL"))
                session.commit()
            except Exception as e:
                print(f"Error migrating harvest_plan_weight_var_id: {e}")
        if "casas_decimais" not in cols:
            try:
                session.execute(text("ALTER TABLE variables ADD COLUMN casas_decimais INTEGER DEFAULT NULL"))
                session.commit()
            except Exception as e:
                print(f"Error migrating casas_decimais: {e}")
        if "tipo_exibicao" not in cols:
            try:
                session.execute(text("ALTER TABLE variables ADD COLUMN tipo_exibicao VARCHAR DEFAULT 'NUMBER'"))
                session.commit()
            except Exception as e:
                print(f"Error migrating tipo_exibicao: {e}")
        if "percent_base" not in cols:
            try:
                session.execute(text("ALTER TABLE variables ADD COLUMN percent_base VARCHAR DEFAULT 'DECIMAL'"))
                session.commit()
            except Exception as e:
                print(f"Error migrating percent_base: {e}")
        if "control_point_id" not in cols:
            try:
                if session.bind.dialect.name == "postgresql":
                    session.execute(text("ALTER TABLE variables ADD COLUMN control_point_id UUID DEFAULT NULL"))
                else:
                    session.execute(text("ALTER TABLE variables ADD COLUMN control_point_id VARCHAR DEFAULT NULL"))
                session.commit()
            except Exception as e:
                print(f"Error migrating control_point_id: {e}")
        if "ordem" not in cols:
            try:
                session.execute(text("ALTER TABLE variables ADD COLUMN ordem INTEGER DEFAULT 0"))
                session.commit()
            except Exception as e:
                print(f"Error migrating Variable ordem: {e}")

    # Run data migration if control points/stages are empty
    if "stages" in tables and "control_points" in tables:
        stages_count = session.execute(text("SELECT COUNT(*) FROM stages")).scalar()
        if stages_count == 0:
            db_vars = session.exec(select(Variable)).all()
            
            # Group variables by: sector_id -> etapa -> ponto_controle
            unique_stages = set()
            for v in db_vars:
                et = v.etapa.strip() if v.etapa else "GERAL"
                unique_stages.add((v.setor_id, et))
                
            # Sort stages alphabetically within their sector to assign baseline ordem
            sector_stages = {}
            for sector_id, et in unique_stages:
                if sector_id not in sector_stages:
                    sector_stages[sector_id] = []
                sector_stages[sector_id].append(et)
                
            stage_map = {}
            for sector_id, stages_list in sector_stages.items():
                stages_list.sort()
                for idx, stage_name in enumerate(stages_list):
                    new_stage = Stage(
                        nome=stage_name,
                        sector_id=sector_id,
                        ordem=(idx + 1) * 10
                    )
                    session.add(new_stage)
            session.flush()
            
            # Re-fetch stages to map them
            db_stages = session.exec(select(Stage)).all()
            for s in db_stages:
                stage_map[(s.sector_id, s.nome)] = s
                
            # Create control points
            unique_cps = set()
            var_cp_raw = []
            for v in db_vars:
                et = v.etapa.strip() if v.etapa else "GERAL"
                cp = v.ponto_controle.strip() if v.ponto_controle else "GERAL"
                stage_obj = stage_map.get((v.setor_id, et))
                if stage_obj:
                    unique_cps.add((stage_obj.id, cp))
                    var_cp_raw.append((v, stage_obj.id, cp))
            
            # Sort control points alphabetically within their stage to assign baseline ordem
            stage_cps = {}
            for stage_id, cp_name in unique_cps:
                if stage_id not in stage_cps:
                    stage_cps[stage_id] = []
                stage_cps[stage_id].append(cp_name)
                
            cp_map = {}
            for stage_id, cps_list in stage_cps.items():
                cps_list.sort()
                for idx, cp_name in enumerate(cps_list):
                    new_cp = ControlPoint(
                        nome=cp_name,
                        stage_id=stage_id,
                        ordem=(idx + 1) * 10
                    )
                    session.add(new_cp)
            session.flush()
            
            # Re-fetch control points to map them
            db_cps = session.exec(select(ControlPoint)).all()
            for cp in db_cps:
                cp_map[(cp.stage_id, cp.nome)] = cp
                
            # Associate variables and sort variables alphabetically by ID within each control point
            cp_vars = {}
            for v, stage_id, cp_name in var_cp_raw:
                cp_obj = cp_map.get((stage_id, cp_name))
                if cp_obj:
                    v.control_point_id = cp_obj.id
                    if cp_obj.id not in cp_vars:
                        cp_vars[cp_obj.id] = []
                    cp_vars[cp_obj.id].append(v)
            
            # Assign variable ordem
            for cp_id, vars_list in cp_vars.items():
                vars_list.sort(key=lambda x: x.id)
                for idx, v in enumerate(vars_list):
                    v.ordem = (idx + 1) * 10
                    session.add(v)
            session.commit()

    if "variables" in tables:
        if session.bind.dialect.name == "postgresql":
            try:
                session.commit()
                session.connection().execution_options(isolation_level="AUTOCOMMIT").execute(text("ALTER TYPE variablestatus ADD VALUE 'INATIVA'"))
            except Exception: pass
        try:
            status_sql = "status = 'INATIVA' WHERE status::text IN ('DESCONTINUADA', 'descontinuada')" if session.bind.dialect.name == "postgresql" else "status = 'INATIVA' WHERE status IN ('DESCONTINUADA', 'descontinuada', 'inativa')"
            session.execute(text(f"UPDATE variables SET {status_sql}"))
            session.commit()
        except Exception as e:
            print(f"Error updating variables status to INATIVA: {e}")
