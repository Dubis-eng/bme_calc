import uuid
import datetime
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

import engine
import goalseek
import exports
from database import create_db_and_tables, get_session, Scenario, ScenarioStatus, HarvestYear, HarvestMonth, parse_year
import services
from schemas import (
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
    HarvestYearCreate,
    HarvestYearRead,
    HarvestMonthRead,
    HarvestMonthUpdate
)

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
    import seeding
    seeding.seed_initial_data()

# Calculation Endpoint
@app.post("/api/calculate", response_model=CalculateResponse)
def calculate(req: CalculateRequest):
    try:
        res_data = engine.calculate_state(req.variables)
        return CalculateResponse(results=res_data["results"], convergence_error=res_data["convergence_error"], iterations=res_data["iterations"])
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
    return ScenarioDetail(id=db_scenario.id, nome=db_scenario.nome, year_harvest=db_scenario.year_harvest, reference_month=db_scenario.reference_month, version=db_scenario.version, status=db_scenario.status, variables=services.get_scenario_variables(id, db), created_at=db_scenario.created_at, updated_at=db_scenario.updated_at)

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

# Global Variables CRUD Endpoints
@app.get("/api/variables", response_model=List[VariableDetail])
def list_variables_endpoint(db=Depends(get_session)):
    try:
        return services.list_variables(db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/variables", response_model=VariableDetail)
def create_variable_endpoint(req: VariableCreate, db=Depends(get_session)):
    try:
        return services.create_variable(req, db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/variables/{id}", response_model=VariableDetail)
def update_variable_endpoint(id: str, req: VariableUpdate, db=Depends(get_session)):
    try:
        return services.update_variable(id, req, db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Harvest Plan Endpoints
@app.get("/api/harvest-plan/years", response_model=List[str])
def list_harvest_plan_years(db=Depends(get_session)):
    try:
        return services.get_harvest_years(db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/harvest-plan/settings")
def get_harvest_plan_settings_endpoint(db=Depends(get_session)):
    try:
        setting = services.get_harvest_plan_settings(db)
        return {"start_month": setting.start_month}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/harvest-plan/settings")
def update_harvest_plan_settings_endpoint(req: HarvestPlanSettingUpdate, db=Depends(get_session)):
    try:
        setting = services.update_harvest_plan_settings(req.start_month, db)
        return {"start_month": setting.start_month}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/harvest-plan/config")
def get_harvest_plan_config_endpoint(db=Depends(get_session)):
    try:
        return services.get_variables_harvest_config(db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/harvest-plan/config/bulk")
def update_harvest_plan_config_endpoint(req: BulkHarvestPlanConfigUpdate, db=Depends(get_session)):
    try:
        # Convert configs to list of dicts for service
        configs_list = [c.dict() for c in req.configs]
        services.update_variables_harvest_config(configs_list, db)
        return {"success": True, "message": "Configurações atualizadas com sucesso."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/harvest-plan/consolidation")
def get_harvest_plan_consolidation_endpoint(year_harvest: str, db=Depends(get_session)):
    try:
        return services.calculate_harvest_plan_consolidation(year_harvest, db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/harvest-years", response_model=List[HarvestYearRead])
def list_harvest_years_endpoint(db=Depends(get_session)):
    try:
        from sqlmodel import select
        stmt = select(HarvestYear).order_by(HarvestYear.id.desc())
        return db.exec(stmt).all()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/harvest-years", response_model=HarvestYearRead)
def create_harvest_year_endpoint(req: HarvestYearCreate, db=Depends(get_session)):
    try:
        db_year = db.get(HarvestYear, req.id)
        if not db_year:
            db_year = HarvestYear(id=req.id, active=True)
            db.add(db_year)
            db.commit()
            db.refresh(db_year)
        else:
            if not db_year.active:
                db_year.active = True
                db.add(db_year)
                db.commit()
                db.refresh(db_year)
        return db_year
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/harvest-years/{year_start}")
def delete_harvest_year_endpoint(year_start: int, db=Depends(get_session)):
    try:
        from sqlmodel import select
        db_year = db.get(HarvestYear, year_start)
        if not db_year:
            raise HTTPException(status_code=404, detail="Ano Safra não encontrado")
        
        scenarios_to_delete = db.exec(select(Scenario).where(Scenario.year_harvest == year_start)).all()
        for sc in scenarios_to_delete:
            db.execute(text("DELETE FROM results WHERE scenario_id = :sid"), {"sid": sc.id})
            db.delete(sc)
            
        db.delete(db_year)
        db.commit()
        return {"success": True, "message": f"Ano Safra {year_start} e seus cenários excluídos com sucesso."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/harvest-months", response_model=List[HarvestMonthRead])
def list_harvest_months_endpoint(enabled_only: Optional[bool] = None, db=Depends(get_session)):
    try:
        from sqlmodel import select
        stmt = select(HarvestMonth)
        if enabled_only:
            stmt = stmt.where(HarvestMonth.enabled == True)
        stmt = stmt.order_by(HarvestMonth.order_index.asc())
        return db.exec(stmt).all()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.patch("/api/harvest-months/{month_id}", response_model=HarvestMonthRead)
def update_harvest_month_endpoint(month_id: int, req: HarvestMonthUpdate, db=Depends(get_session)):
    try:
        db_month = db.get(HarvestMonth, month_id)
        if not db_month:
            raise HTTPException(status_code=404, detail="Mês não encontrado")
        
        if req.enabled is not None:
            db_month.enabled = req.enabled
        if req.order_index is not None:
            db_month.order_index = req.order_index
            
        db.add(db_month)
        db.commit()
        db.refresh(db_month)
        return db_month
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

