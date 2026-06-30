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
    INATIVA = "inativa"
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

class Stage(SQLModel, table=True):
    __tablename__ = "stages"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    nome: str = Field(index=True)
    sector_id: str = Field(foreign_key="sectors.id", index=True)
    ordem: int = Field(default=0, index=True)

class ControlPoint(SQLModel, table=True):
    __tablename__ = "control_points"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    nome: str = Field(index=True)
    stage_id: uuid.UUID = Field(foreign_key="stages.id", index=True)
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
    etapa: Optional[str] = Field(default="", index=True, sa_column_kwargs={"nullable": True})
    ponto_controle: Optional[str] = Field(default="", index=True, sa_column_kwargs={"nullable": True})
    control_point_id: Optional[uuid.UUID] = Field(default=None, foreign_key="control_points.id", index=True, sa_column_kwargs={"nullable": True})
    ordem: int = Field(default=0, index=True)
    
    # Harvest Plan configurations
    in_harvest_plan: bool = Field(default=False)
    harvest_plan_op: Optional[str] = Field(default=None)
    harvest_plan_weight_var_id: Optional[str] = Field(default=None, foreign_key="variables.id")

    # Rounding and Formatting configurations
    casas_decimais: Optional[int] = Field(default=None, sa_column_kwargs={"nullable": True})
    tipo_exibicao: str = Field(default="NUMBER", sa_column_kwargs={"nullable": False})
    percent_base: str = Field(default="DECIMAL", sa_column_kwargs={"nullable": False})

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

# ── HARVEST PLAN SELECTIONS ───────────────────────────────────────────────

class HarvestPlanSelection(SQLModel, table=True):
    __tablename__ = "harvest_plan_selections"
    
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    year_harvest: int = Field(index=True, sa_column_kwargs={"nullable": False})
    month: str = Field(index=True, sa_column_kwargs={"nullable": False})
    scenario_id: Optional[uuid.UUID] = Field(default=None, foreign_key="scenarios.id", sa_column_kwargs={"nullable": True})
    exclude: bool = Field(default=False, sa_column_kwargs={"nullable": False})

# ── DATABASE CREATION & SESSION ────────────────────────────────────────────

def create_db_and_tables():
    from migrations import migrate_legacy_data, migrate_database_schema
    # Detect if we need migration first
    with Session(engine) as session:
        migrate_legacy_data(session)
        migrate_database_schema(session)
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
