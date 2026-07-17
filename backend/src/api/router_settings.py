from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from pydantic import BaseModel
from src.db.database import get_session, HarvestYear, HarvestMonth, Scenario
from src.schemas.schemas import (
    HarvestYearRead, HarvestYearCreate, HarvestMonthRead, HarvestMonthUpdate,
    HarvestPlanSettingUpdate
)
from src.services import services

router = APIRouter(prefix="/api", tags=["settings"])

class MonthReorderItem(BaseModel):
    id: int
    order_index: int

class MonthReorderRequest(BaseModel):
    reorderings: List[MonthReorderItem]

# ── HARVEST YEARS ───────────────────────────────────────────────────────────

@router.get("/settings/years", response_model=List[HarvestYearRead])
def list_harvest_years_endpoint(db=Depends(get_session)):
    try:
        from sqlmodel import select
        stmt = select(HarvestYear).order_by(HarvestYear.id.desc())
        return db.exec(stmt).all()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/settings/years", response_model=HarvestYearRead)
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

@router.delete("/settings/years/{year_start}")
def delete_harvest_year_endpoint(year_start: int, db=Depends(get_session)):
    try:
        from sqlmodel import select, text
        db_year = db.get(HarvestYear, year_start)
        if not db_year:
            raise HTTPException(status_code=404, detail="Ano Safra não encontrado")
        
        scenarios_to_delete = db.exec(select(Scenario).where(Scenario.year_harvest == year_start)).all()
        for sc in scenarios_to_delete:
            db.execute(text("DELETE FROM results WHERE scenario_id = :sid"), {"sid": str(sc.id)})
            db.delete(sc)
            
        db.flush()
        db.delete(db_year)
        db.commit()
        return {"success": True, "message": f"Ano Safra {year_start} e seus cenários excluídos com sucesso."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# ── HARVEST MONTHS ──────────────────────────────────────────────────────────

@router.get("/settings/months", response_model=List[HarvestMonthRead])
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

@router.patch("/settings/months/reorder")
def reorder_months_endpoint(req: MonthReorderRequest, db=Depends(get_session)):
    try:
        from sqlmodel import select
        # Validation 1: Get all months in database
        db_months = db.exec(select(HarvestMonth)).all()
        db_month_ids = {m.id for m in db_months}
        req_month_ids = {item.id for item in req.reorderings}
        
        # Guarantee of integrity: array length matches database months count
        if len(req.reorderings) != len(db_months):
            raise HTTPException(
                status_code=400, 
                detail="O array de reordenação deve conter exatamente todos os meses cadastrados no banco de dados."
            )
            
        # Guarantee of integrity: IDs are exactly matching
        if db_month_ids != req_month_ids:
            raise HTTPException(
                status_code=400,
                detail="Os IDs dos meses fornecidos não correspondem aos IDs cadastrados no banco de dados."
            )
            
        # Update inside an atomic transaction (idempotent because of absolute order_index mapping)
        new_start_month = None
        for item in req.reorderings:
            db_month = db.get(HarvestMonth, item.id)
            if db_month:
                db_month.order_index = item.order_index
                db.add(db_month)
                if item.order_index == 0:
                    new_start_month = db_month.name
        
        if new_start_month:
            from src.services.services_harvest_plan import get_harvest_plan_settings
            setting = get_harvest_plan_settings(db)
            setting.start_month = new_start_month
            db.add(setting)
        
        db.commit()
        return {"success": True}
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/settings/months/{month_id}", response_model=HarvestMonthRead)
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

# ── COMMERCIAL CYCLE ────────────────────────────────────────────────────────

@router.get("/settings/cycle")
def get_cycle_endpoint(db=Depends(get_session)):
    try:
        setting = services.get_harvest_plan_settings(db)
        return {"start_month": setting.start_month}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/settings/cycle")
@router.put("/settings/cycle")
def update_cycle_endpoint(req: HarvestPlanSettingUpdate, db=Depends(get_session)):
    try:
        setting = services.update_harvest_plan_settings(req.start_month, db)
        return {"start_month": setting.start_month}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
