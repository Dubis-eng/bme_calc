import uuid
import datetime
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

import engine
import goalseek
import exports
from database import create_db_and_tables, get_session, Scenario, ScenarioStatus

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

# Request/Response DTOs
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

class GoalSeekRequest(BaseModel):
    variables: List[Dict[str, Any]]
    input_id: str
    target_id: str
    target_value: float
    min_val: Optional[float] = None
    max_val: Optional[float] = None

# Calculation Endpoint
@app.post("/api/calculate", response_model=CalculateResponse)
def calculate(req: CalculateRequest):
    try:
        res_data = engine.calculate_state(req.variables)
        return CalculateResponse(
            results=res_data["results"],
            convergence_error=res_data["convergence_error"],
            iterations=res_data["iterations"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Scenario Persistence Endpoints
@app.post("/api/scenarios", response_model=Scenario)
def create_scenario(req: ScenarioCreate, db=Depends(get_session)):
    try:
        from sqlmodel import select
        # Query versions for the same period to assign the next version sequence
        stmt = select(Scenario.version).where(
            Scenario.year_harvest == req.year_harvest,
            Scenario.reference_month == req.reference_month
        ).order_by(Scenario.version.desc())
        versions = db.exec(stmt).all()
        next_version = (versions[0] + 1) if versions else 1

        db_scenario = Scenario(
            year_harvest=req.year_harvest,
            reference_month=req.reference_month,
            version=next_version,
            status=req.status or ScenarioStatus.EM_EDICAO,
            variables=req.variables
        )
        db.add(db_scenario)
        db.commit()
        db.refresh(db_scenario)
        return db_scenario
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/scenarios")
def list_scenarios(db=Depends(get_session)):
    try:
        from sqlmodel import select
        # Return scenario metadata to keep response body lightweight
        stmt = select(
            Scenario.id, Scenario.year_harvest, Scenario.reference_month, 
            Scenario.version, Scenario.status, Scenario.created_at, Scenario.updated_at
        ).order_by(
            Scenario.year_harvest.desc(), Scenario.reference_month.desc(), Scenario.version.desc()
        )
        results = db.exec(stmt).all()
        
        scenarios_list = []
        for r in results:
            scenarios_list.append({
                "id": str(r[0]),
                "year_harvest": r[1],
                "reference_month": r[2],
                "version": r[3],
                "status": r[4],
                "created_at": r[5].isoformat() if r[5] else None,
                "updated_at": r[6].isoformat() if r[6] else None
            })
        return scenarios_list
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/scenarios/{id}", response_model=Scenario)
def get_scenario(id: uuid.UUID, db=Depends(get_session)):
    db_scenario = db.get(Scenario, id)
    if not db_scenario:
        raise HTTPException(status_code=404, detail="Cenário não encontrado")
    return db_scenario

@app.patch("/api/scenarios/{id}/status", response_model=Scenario)
def update_scenario_status(id: uuid.UUID, req: StatusUpdate, db=Depends(get_session)):
    db_scenario = db.get(Scenario, id)
    if not db_scenario:
        raise HTTPException(status_code=404, detail="Cenário não encontrado")
    
    db_scenario.status = req.status
    db_scenario.updated_at = datetime.datetime.utcnow()
    db.add(db_scenario)
    db.commit()
    db.refresh(db_scenario)
    return db_scenario

# Goal Seek Optimization Endpoint
@app.post("/api/goalseek")
def run_goalseek_endpoint(req: GoalSeekRequest):
    curr_input_val = 0.0
    for var in req.variables:
        if var["ID - REF"] == req.input_id:
            try:
                curr_input_val = float(str(var["EQUAÇÕES E VALORES"]).replace(',', '.'))
            except Exception:
                pass
            break
            
    min_v = req.min_val
    max_v = req.max_val
    
    # Apply default bounds if none specified
    if min_v is None:
        min_v = 0.0 if curr_input_val >= 0 else curr_input_val * 2.0
    if max_v is None:
        max_v = curr_input_val * 2.0 if curr_input_val > 0 else 0.0
        if max_v == 0.0 and min_v == 0.0:
            max_v = 100.0
            min_v = -100.0
            
    if min_v > max_v:
        min_v, max_v = max_v, min_v
        
    try:
        res = goalseek.run_goal_seek(
            variables=req.variables,
            input_id=req.input_id,
            target_id=req.target_id,
            target_value=req.target_value,
            min_val=min_v,
            max_val=max_v
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Document Export Endpoints
@app.get("/api/scenarios/{id}/export/pdf")
def export_pdf(id: uuid.UUID, db=Depends(get_session)):
    db_scenario = db.get(Scenario, id)
    if not db_scenario:
        raise HTTPException(status_code=404, detail="Cenário não encontrado")
    
    pdf_buffer = exports.generate_scenario_pdf(db_scenario)
    filename = f"cenario_{db_scenario.year_harvest.replace('/', '_')}_{db_scenario.reference_month}_v{db_scenario.version}.pdf"
    
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@app.get("/api/scenarios/{id}/export/xlsx")
def export_xlsx(id: uuid.UUID, db=Depends(get_session)):
    db_scenario = db.get(Scenario, id)
    if not db_scenario:
        raise HTTPException(status_code=404, detail="Cenário não encontrado")
        
    xlsx_buffer = exports.generate_scenario_xlsx(db_scenario)
    filename = f"cenario_{db_scenario.year_harvest.replace('/', '_')}_{db_scenario.reference_month}_v{db_scenario.version}.xlsx"
    
    return StreamingResponse(
        xlsx_buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
