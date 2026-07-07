from typing import List, Dict, Any, Optional
import uuid
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from database import get_session
import services
import exports_harvest_plan
from schemas import (
    BulkHarvestPlanConfigUpdate,
    VariableHarvestPlanConfig,
    HarvestPlanSelectionUpdate,
    HarvestPlanSelectionsResponse,
    HarvestPlanStructureUpdate
)

router = APIRouter()

@router.get("/api/harvest-plan/years", response_model=List[int])
def list_harvest_plan_years(db=Depends(get_session)):
    try:
        return services.get_harvest_years(db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/harvest-plan/config")
def get_harvest_plan_config_endpoint(db=Depends(get_session)):
    try:
        return services.get_variables_harvest_config(db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/harvest-plan/config/bulk")
def update_harvest_plan_config_endpoint(req: BulkHarvestPlanConfigUpdate, db=Depends(get_session)):
    try:
        configs_list = [c.dict() for c in req.configs]
        services.update_variables_harvest_config(configs_list, db)
        return {"success": True, "message": "Configurações atualizadas com sucesso."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/harvest-plan/config")
def update_harvest_plan_config_direct_endpoint(req: List[VariableHarvestPlanConfig], db=Depends(get_session)):
    try:
        configs_list = [c.dict() for c in req]
        services.update_variables_harvest_config(configs_list, db)
        return {"success": True, "message": "Configurações atualizadas com sucesso."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/harvest-plan/consolidation")
def get_harvest_plan_consolidation_endpoint(year_harvest: str, db=Depends(get_session)):
    try:
        return services.calculate_harvest_plan_consolidation(year_harvest, db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/harvest-plan/structure")
def get_harvest_plan_structure_endpoint(db=Depends(get_session)):
    try:
        return services.get_harvest_plan_structure(db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/harvest-plan/structure")
def save_harvest_plan_structure_endpoint(req: HarvestPlanStructureUpdate, db=Depends(get_session)):
    try:
        items_list = [item.dict() for item in req.items]
        services.save_harvest_plan_structure(items_list, db)
        return {"success": True, "message": "Estrutura do plano de safra salva com sucesso."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/harvest-plan/selections", response_model=HarvestPlanSelectionsResponse)
def get_harvest_plan_selections_endpoint(year_harvest: int, db=Depends(get_session)):
    try:
        return services.get_harvest_plan_selections(year_harvest, db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/harvest-plan/selections")
def update_harvest_plan_selection_endpoint(req: HarvestPlanSelectionUpdate, year_harvest: int, db=Depends(get_session)):
    try:
        return services.update_harvest_plan_selection(year_harvest, req.month, req.scenario_id, req.exclude, db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/harvest-plan/export/pdf")
def export_harvest_plan_pdf(year_harvest: str, db=Depends(get_session)):
    try:
        consolidation = services.calculate_harvest_plan_consolidation(year_harvest, db)
        pdf_buffer = exports_harvest_plan.generate_harvest_plan_pdf(consolidation, year_harvest)
        headers = {'Content-Disposition': f'attachment; filename="plano_safra_{year_harvest.replace("/", "_")}.pdf"'}
        return StreamingResponse(pdf_buffer, media_type="application/pdf", headers=headers)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/harvest-plan/export/xlsx")
def export_harvest_plan_xlsx(year_harvest: str, db=Depends(get_session)):
    try:
        consolidation = services.calculate_harvest_plan_consolidation(year_harvest, db)
        xlsx_buffer = exports_harvest_plan.generate_harvest_plan_xlsx(consolidation, year_harvest)
        headers = {'Content-Disposition': f'attachment; filename="plano_safra_{year_harvest.replace("/", "_")}.xlsx"'}
        return StreamingResponse(
            xlsx_buffer,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers=headers
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
