import os
import uuid
import datetime
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from src.core import engine
from src.core import goalseek
from src.services import exports
from src.db.database import create_db_and_tables, get_session, Scenario, ScenarioStatus, HarvestYear, HarvestMonth, parse_year
from src.services import services
from src.schemas.schemas import (
    CalculateRequest,
    CalculateResponse,
    ScenarioCreate,
    StatusUpdate,
    ScenarioDetail,
    GoalSeekRequest,
    ScenarioExportWrapper,
    SectorCreate,
    SectorUpdate,
    SectorDetail,
    VariableCreate,
    VariableUpdate,
    VariableDetail,
    HarvestPlanSettingUpdate,
    BulkHarvestPlanConfigUpdate,
    VariableHarvestPlanConfig,
    HarvestYearCreate,
    HarvestYearRead,
    HarvestMonthRead,
    HarvestMonthUpdate,
    HarvestPlanSelectionUpdate,
    HarvestPlanSelectionsResponse,
    SubstitutionPreviewRequest,
    SubstitutionPreviewResponse,
    SubstitutionConfirmRequest,
    SubstitutionConfirmResponse,
    HarvestPlanStructureUpdate
)

app = FastAPI()

allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
allowed_origins = [origin.strip() for origin in allowed_origins_env.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from src.api.router_variables import router as variables_router
app.include_router(variables_router)

from src.api.router_settings import router as settings_router
app.include_router(settings_router)

from src.api.router_harvest_plan import router as harvest_plan_router
app.include_router(harvest_plan_router)

from src.api.router_flowcharts import router as flowcharts_router
app.include_router(flowcharts_router)

@app.on_event("startup")
def on_startup():
    create_db_and_tables()
    from src.db import seeding
    seeding.seed_initial_data()

# Calculation Endpoint
@app.post("/api/calculate", response_model=CalculateResponse)
def calculate(req: CalculateRequest):
    try:
        res_data = engine.calculate_state(req.variables, tolerance=req.tolerance)
        return CalculateResponse(
            results=res_data["results"],
            convergence_error=res_data["convergence_error"],
            iterations=res_data["iterations"],
            residual=res_data.get("residual", 0.0)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Scenario Persistence Endpoints
@app.post("/api/scenarios", response_model=ScenarioDetail)
def create_scenario(req: ScenarioCreate, db=Depends(get_session)):
    try: return services.create_new_scenario(req, db)
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/scenarios/{id}", response_model=ScenarioDetail)
def update_scenario(id: uuid.UUID, req: ScenarioCreate, db=Depends(get_session)):
    try: return services.update_existing_scenario(id, req, db)
    except ValueError as e: raise HTTPException(status_code=400, detail=str(e))
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/scenarios")
def list_scenarios(db=Depends(get_session)):
    try:
        from sqlmodel import select
        stmt = select(Scenario.id, Scenario.year_harvest, Scenario.reference_month, Scenario.version, Scenario.status, Scenario.created_at, Scenario.updated_at).order_by(Scenario.year_harvest.desc(), Scenario.reference_month.desc(), Scenario.version.desc())
        results = db.exec(stmt).all()
        return [{"id": str(r[0]), "year_harvest": r[1], "reference_month": r[2], "version": r[3], "status": r[4], "created_at": r[5].isoformat() if r[5] else None, "updated_at": r[6].isoformat() if r[6] else None} for r in results]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/scenarios/{id}", response_model=ScenarioDetail)
def get_scenario(id: uuid.UUID, db=Depends(get_session)):
    db_scenario = db.get(Scenario, id)
    if not db_scenario: raise HTTPException(status_code=404, detail="Cenário não encontrado")
    return ScenarioDetail(id=db_scenario.id, nome=db_scenario.nome, year_harvest=db_scenario.year_harvest, reference_month=db_scenario.reference_month, version=db_scenario.version, status=db_scenario.status, variables=services.get_scenario_variables(id, db), created_at=db_scenario.created_at, updated_at=db_scenario.updated_at, cycle_start_month=db_scenario.cycle_start_month)

@app.patch("/api/scenarios/{id}/status", response_model=Scenario)
def update_scenario_status(id: uuid.UUID, req: StatusUpdate, db=Depends(get_session)):
    db_scenario = db.get(Scenario, id)
    if not db_scenario: raise HTTPException(status_code=404, detail="Cenário não encontrado")
    db_scenario.status = req.status
    db_scenario.updated_at = datetime.datetime.utcnow()
    db.add(db_scenario); db.commit(); db.refresh(db_scenario)
    return db_scenario

# Goal Seek Optimization Endpoint
@app.post("/api/goalseek")
def run_goalseek_endpoint(req: GoalSeekRequest):
    curr_input_val = 0.0
    for var in req.variables:
        if var["ID - REF"] == req.input_id:
            try: curr_input_val = float(str(var["EQUAÇÕES E VALORES"]).replace(',', '.'))
            except Exception: pass
            break
    min_v = req.min_val if req.min_val is not None else (0.0 if curr_input_val >= 0 else curr_input_val * 2.0)
    max_v = req.max_val if req.max_val is not None else (curr_input_val * 2.0 if curr_input_val > 0 else 0.0)
    if max_v == 0.0 and min_v == 0.0: min_v, max_v = -100.0, 100.0
    if min_v > max_v: min_v, max_v = max_v, min_v
    try: return goalseek.run_goal_seek(variables=req.variables, input_id=req.input_id, target_id=req.target_id, target_value=req.target_value, min_val=min_v, max_val=max_v)
    except Exception as e: raise HTTPException(status_code=400, detail=str(e))

# Document Export Endpoints
@app.get("/api/scenarios/{id}/export/pdf")
def export_pdf(id: uuid.UUID, db=Depends(get_session)):
    db_scenario = db.get(Scenario, id)
    if not db_scenario: raise HTTPException(status_code=404, detail="Cenário não encontrado")
    pdf_buffer = exports.generate_scenario_pdf(ScenarioExportWrapper(db_scenario, services.get_scenario_variables(id, db)))
    filename = f"cenario_{str(db_scenario.year_harvest).replace('/', '_')}_{db_scenario.reference_month}_v{db_scenario.version}.pdf"
    return StreamingResponse(pdf_buffer, media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename={filename}"})

@app.get("/api/scenarios/{id}/export/xlsx")
def export_xlsx(id: uuid.UUID, db=Depends(get_session)):
    db_scenario = db.get(Scenario, id)
    if not db_scenario: raise HTTPException(status_code=404, detail="Cenário não encontrado")
    xlsx_buffer = exports.generate_scenario_xlsx(ScenarioExportWrapper(db_scenario, services.get_scenario_variables(id, db)))
    filename = f"cenario_{str(db_scenario.year_harvest).replace('/', '_')}_{db_scenario.reference_month}_v{db_scenario.version}.xlsx"
    return StreamingResponse(xlsx_buffer, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", headers={"Content-Disposition": f"attachment; filename={filename}"})

# Sector CRUD Endpoints
@app.get("/api/sectors", response_model=List[SectorDetail])
def get_sectors(db=Depends(get_session)):
    try:
        return services.list_sectors(db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/sectors", response_model=SectorDetail)
def create_sector(req: SectorCreate, db=Depends(get_session)):
    try:
        return services.create_sector(req, db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.patch("/api/sectors/{id}", response_model=SectorDetail)
def update_sector(id: str, req: SectorUpdate, db=Depends(get_session)):
    try:
        return services.update_sector(id, req, db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/sectors/{id}")
def delete_sector(id: str, db=Depends(get_session)):
    try:
        services.delete_sector(id, db)
        return {"success": True, "message": "Setor excluído com sucesso."}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.patch("/api/sectors/{sector_id}/stages/reorder")
def reorder_stages_endpoint(sector_id: str, req: List[uuid.UUID], db=Depends(get_session)):
    try:
        services.reorder_stages(sector_id, req, db)
        return {"success": True, "message": "Estágios reordenados com sucesso."}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.patch("/api/stages/{stage_id}/control-points/reorder")
def reorder_control_points_endpoint(stage_id: uuid.UUID, req: List[uuid.UUID], db=Depends(get_session)):
    try:
        services.reorder_control_points(stage_id, req, db)
        return {"success": True, "message": "Pontos de controle reordenados com sucesso."}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.patch("/api/control-points/{cp_id}/variables/reorder")
def reorder_variables_endpoint(cp_id: uuid.UUID, req: List[str], db=Depends(get_session)):
    try:
        services.reorder_variables(cp_id, req, db)
        return {"success": True, "message": "Variáveis reordenadas com sucesso."}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))






