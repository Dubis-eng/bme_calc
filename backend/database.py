import os
import datetime
import uuid
from enum import Enum
from typing import List, Dict, Any, Optional
from sqlmodel import SQLModel, Field, Session, create_engine, select, Column, JSON

# Scenario Status Enum
class ScenarioStatus(str, Enum):
    EM_EDICAO = "Em Edição"
    APROVADO = "Aprovado"
    FINAL = "Final"

# Database Configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://uisa_user:uisa_password@localhost:5432/bme_calc")

connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, connect_args=connect_args)

# Scenario SQLModel Database Table
class Scenario(SQLModel, table=True):
    __tablename__ = "scenarios"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    year_harvest: str = Field(index=True)
    reference_month: str = Field(index=True)
    version: int = Field(default=1, index=True)
    status: ScenarioStatus = Field(default=ScenarioStatus.EM_EDICAO, sa_column_kwargs={"nullable": False})
    variables: List[Dict[str, Any]] = Field(default_factory=list, sa_column=Column(JSON, nullable=False))
    created_at: datetime.datetime = Field(
        default_factory=datetime.datetime.utcnow,
        sa_column_kwargs={"nullable": False}
    )
    updated_at: datetime.datetime = Field(
        default_factory=datetime.datetime.utcnow,
        sa_column_kwargs={"nullable": False}
    )

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
