import uuid
import datetime
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from database import ScenarioStatus

class CalculateRequest(BaseModel):
    variables: List[Dict[str, Any]]

class CalculateResponse(BaseModel):
    results: Dict[str, Any]
    convergence_error: bool
    iterations: int

class ScenarioCreate(BaseModel):
    year_harvest: str
    reference_month: str
    variables: List[Dict[str, Any]]
    status: Optional[ScenarioStatus] = ScenarioStatus.EM_EDICAO

class StatusUpdate(BaseModel):
    status: ScenarioStatus

class ScenarioDetail(BaseModel):
    id: uuid.UUID
    nome: str
    year_harvest: str
    reference_month: str
    version: int
    status: ScenarioStatus
    variables: List[Dict[str, Any]]
    created_at: datetime.datetime
    updated_at: datetime.datetime

class GoalSeekRequest(BaseModel):
    variables: List[Dict[str, Any]]
    input_id: str
    target_id: str
    target_value: float
    min_val: Optional[float] = None
    max_val: Optional[float] = None

class ScenarioExportWrapper:
    def __init__(self, db_scenario, variables):
        self.year_harvest = db_scenario.year_harvest
        self.reference_month = db_scenario.reference_month
        self.version = db_scenario.version
        self.status = db_scenario.status
        self.variables = variables

class SectorCreate(BaseModel):
    id: str
    nome: str
    descricao: Optional[str] = ""
    ordem: int

class SectorUpdate(BaseModel):
    nome: str
    descricao: Optional[str] = ""
    ordem: int

class SectorDetail(BaseModel):
    id: str
    nome: str
    descricao: str
    ordem: int
