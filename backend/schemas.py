import uuid
import datetime
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from database import ScenarioStatus

class CalculateRequest(BaseModel):
    variables: List[Dict[str, Any]]
    tolerance: Optional[float] = 0.0001

class CalculateResponse(BaseModel):
    results: Dict[str, Any]
    convergence_error: bool
    iterations: int
    residual: Optional[float] = 0.0

class HarvestYearCreate(BaseModel):
    id: int

class HarvestYearRead(BaseModel):
    id: int
    active: bool

class HarvestMonthRead(BaseModel):
    id: int
    name: str
    order_index: int
    enabled: bool

class HarvestMonthUpdate(BaseModel):
    order_index: Optional[int] = None
    enabled: Optional[bool] = None

class ScenarioCreate(BaseModel):
    year_harvest: Any
    reference_month: str
    variables: List[Dict[str, Any]]
    status: Optional[ScenarioStatus] = ScenarioStatus.EM_EDICAO

class StatusUpdate(BaseModel):
    status: ScenarioStatus

class ScenarioDetail(BaseModel):
    id: uuid.UUID
    nome: str
    year_harvest: int
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

class VariableCreate(BaseModel):
    id: str
    nome: str
    descricao: Optional[str] = ""
    setor_id: str
    tipo: str
    unidade: Optional[str] = ""
    status: Optional[str] = "ativa"
    etapa: Optional[str] = ""
    ponto_controle: Optional[str] = ""
    equation_value: Optional[str] = ""

class VariableUpdate(BaseModel):
    nome: str
    descricao: Optional[str] = ""
    setor_id: str
    tipo: str
    unidade: Optional[str] = ""
    status: Optional[str] = "ativa"
    etapa: Optional[str] = ""
    ponto_controle: Optional[str] = ""
    equation_value: Optional[str] = ""

class VariableDetail(BaseModel):
    id: str
    nome: str
    descricao: str
    setor_id: str
    tipo: str
    unidade: str
    status: str
    etapa: str
    ponto_controle: str
    equation_value: str

class HarvestPlanSettingUpdate(BaseModel):
    start_month: str

class VariableHarvestPlanConfig(BaseModel):
    id: str
    in_harvest_plan: bool
    harvest_plan_op: Optional[str] = None
    harvest_plan_weight_var_id: Optional[str] = None

class BulkHarvestPlanConfigUpdate(BaseModel):
    configs: List[VariableHarvestPlanConfig]

class HarvestPlanSelectionUpdate(BaseModel):
    month: str
    scenario_id: Optional[uuid.UUID] = None
    exclude: bool = False

class AvailableScenarioInfo(BaseModel):
    id: uuid.UUID
    nome: str
    version: int
    status: str

class HarvestPlanSelectionsResponse(BaseModel):
    selections: List[Dict[str, Any]]
    available_scenarios: Dict[str, List[AvailableScenarioInfo]]

