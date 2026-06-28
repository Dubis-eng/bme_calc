from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from database import get_session, HarvestYear, HarvestMonth, Scenario
from schemas import HarvestYearRead, HarvestYearCreate, HarvestMonthRead, HarvestMonthUpdate

router = APIRouter(prefix="/api", tags=["settings"])

@router.get("/harvest-years", response_model=List[HarvestYearRead])
def list_harvest_years_endpoint(db=Depends(get_session)):
    try:
        from sqlmodel import select
        stmt = select(HarvestYear).order_by(HarvestYear.id.desc())
        return db.exec(stmt).all()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/harvest-years", response_model=HarvestYearRead)
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

@router.delete("/harvest-years/{year_start}")
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

@router.get("/harvest-months", response_model=List[HarvestMonthRead])
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

@router.patch("/harvest-months/{month_id}", response_model=HarvestMonthRead)
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
