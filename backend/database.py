import os
import datetime
import uuid
import json
import re
from enum import Enum
from typing import List, Dict, Any, Optional
from sqlmodel import SQLModel, Field, Session, create_engine, select, Column, JSON
from sqlalchemy import text, inspect
class ScenarioStatus(str, Enum):
    EM_EDICAO = "Em Edição"
    APROVADO = "Aprovado"
    FINAL = "Final"
class VariableType(str, Enum):
    INPUT = "INPUT"
    OUTPUT = "OUTPUT"
    DERIVADA = "DERIVADA"
    CENARIO = "CENARIO"
class VariableStatus(str, Enum):
    ATIVA = "ativa"
    PENDENTE = "pendente"
    INVALIDA = "inválida"
    DESCONTINUADA = "descontinuada"
class ResultStatus(str, Enum):
    OK = "OK"
    DIV_BY_ZERO = "DIV_BY_ZERO"
    MISSING_VAR = "MISSING_VAR"
    PENDING = "PENDING"

def parse_year(year_str: str) -> int:
    match = re.search(r'\d{4}', str(year_str))
    return int(match.group(0)) if match else 2026

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://uisa_user:uisa_password@localhost:5432/bme_calc")
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
engine = create_engine(DATABASE_URL, connect_args=connect_args)

class HarvestYear(SQLModel, table=True):
    __tablename__ = "harvest_years"
    id: int = Field(primary_key=True)
    active: bool = Field(default=True)

class HarvestMonth(SQLModel, table=True):
    __tablename__ = "harvest_months"
    id: int = Field(primary_key=True)
    name: str = Field(index=True)
    order_index: int = Field(default=0, index=True)
    enabled: bool = Field(default=True)

class Sector(SQLModel, table=True):
    __tablename__ = "sectors"

    id: str = Field(primary_key=True, index=True)  # Technical ID e.g. "MOAGEM"
    nome: str = Field(index=True)                 # Friendly name
    descricao: str = Field(default="")
    ordem: int = Field(default=0, index=True)

class Scenario(SQLModel, table=True):
    __tablename__ = "scenarios"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    nome: str = Field(index=True)
    year_harvest: int = Field(foreign_key="harvest_years.id", index=True)
    reference_month: str = Field(index=True)
    version: int = Field(default=1, index=True)
    status: ScenarioStatus = Field(default=ScenarioStatus.EM_EDICAO, sa_column_kwargs={"nullable": False})
    created_at: datetime.datetime = Field(
        default_factory=datetime.datetime.utcnow,
        sa_column_kwargs={"nullable": False}
    )
    updated_at: datetime.datetime = Field(
        default_factory=datetime.datetime.utcnow,
        sa_column_kwargs={"nullable": False}
    )

class Variable(SQLModel, table=True):
    __tablename__ = "variables"

    id: str = Field(primary_key=True, index=True)  # ID/REF técnico ex: "MOENDA_RPM"
    nome: str = Field(index=True)  # Nome amigável
    descricao: str = Field(default="")
    setor_id: str = Field(foreign_key="sectors.id", index=True)
    tipo: VariableType = Field(default=VariableType.INPUT, sa_column_kwargs={"nullable": False})
    unidade: str = Field(default="")
    status: VariableStatus = Field(default=VariableStatus.ATIVA, sa_column_kwargs={"nullable": False})
    etapa: str = Field(default="", index=True)
    ponto_controle: str = Field(default="", index=True)
    
    # Harvest Plan configurations
    in_harvest_plan: bool = Field(default=False)
    harvest_plan_op: Optional[str] = Field(default=None)
    harvest_plan_weight_var_id: Optional[str] = Field(default=None, foreign_key="variables.id")

class Equation(SQLModel, table=True):
    __tablename__ = "equations"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    variable_id: str = Field(foreign_key="variables.id", index=True)
    expression_original: str = Field(sa_column_kwargs={"nullable": False})
    expression_normalized: str = Field(sa_column_kwargs={"nullable": False})
    version: int = Field(default=1)
    status: str = Field(default="ativa")
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
    updated_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)

class Dependency(SQLModel, table=True):
    __tablename__ = "dependencies"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    equation_id: uuid.UUID = Field(foreign_key="equations.id", index=True)
    dependency_var_id: str = Field(foreign_key="variables.id", index=True)
    evaluation_order: int = Field(default=0)

class Result(SQLModel, table=True):
    __tablename__ = "results"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    variable_id: str = Field(foreign_key="variables.id", index=True)
    scenario_id: uuid.UUID = Field(foreign_key="scenarios.id", index=True)
    value: Optional[float] = Field(default=None, sa_column_kwargs={"nullable": True})
    status: ResultStatus = Field(default=ResultStatus.PENDING, sa_column_kwargs={"nullable": False})
    error_message: str = Field(default="")
    timestamp: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)

class HarvestPlanSetting(SQLModel, table=True):
    __tablename__ = "harvest_plan_settings"
    
    id: str = Field(primary_key=True, default="default")
    start_month: str = Field(default="Abril", sa_column_kwargs={"nullable": False})

# ── IMPLEMENTATION DETAILS & MIGRATIONS ────────────────────────────────────

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

def migrate_database_schema(session: Session):
    SQLModel.metadata.create_all(session.bind)
    session.commit()
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

def create_db_and_tables():
    # Detect if we need migration first
    with Session(engine) as session:
        migrate_legacy_data(session)
        migrate_database_schema(session)
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session

