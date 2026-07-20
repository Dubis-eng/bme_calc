import datetime
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session, select

from src.db.database import get_session, SectorFlowchart, Sector
from src.schemas.schemas import SectorFlowchartUpdate, SectorFlowchartDetail

router = APIRouter(prefix="/api/flowcharts", tags=["flowcharts"])

@router.get("", response_model=List[SectorFlowchartDetail])
def list_all_sector_flowcharts(db: Session = Depends(get_session)):
    try:
        flowcharts = db.exec(select(SectorFlowchart)).all()
        return [
            SectorFlowchartDetail(
                sector_id=fc.sector_id,
                view_mode=getattr(fc, "view_mode", "full") or "full",
                summary_field_ids=getattr(fc, "summary_field_ids", []) or [],
                nodes=fc.nodes or [],
                edges=fc.edges or [],
                updated_at=fc.updated_at
            )
            for fc in flowcharts
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{sector_id}", response_model=SectorFlowchartDetail)
def get_sector_flowchart(sector_id: str, db: Session = Depends(get_session)):
    try:
        flowchart = db.exec(
            select(SectorFlowchart).where(SectorFlowchart.sector_id == sector_id)
        ).first()
        if not flowchart:
            raise HTTPException(
                status_code=404,
                detail=f"Fluxograma para o setor '{sector_id}' não encontrado."
            )
        return SectorFlowchartDetail(
            sector_id=flowchart.sector_id,
            view_mode=getattr(flowchart, "view_mode", "full") or "full",
            summary_field_ids=getattr(flowchart, "summary_field_ids", []) or [],
            nodes=flowchart.nodes or [],
            edges=flowchart.edges or [],
            updated_at=flowchart.updated_at
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{sector_id}", response_model=SectorFlowchartDetail)
def save_sector_flowchart(
    sector_id: str,
    req: SectorFlowchartUpdate,
    db: Session = Depends(get_session)
):
    try:
        flowchart = db.exec(
            select(SectorFlowchart).where(SectorFlowchart.sector_id == sector_id)
        ).first()
        now = datetime.datetime.utcnow()
        v_mode = req.view_mode if req.view_mode else "full"
        s_ids = req.summary_field_ids if req.summary_field_ids is not None else []

        if not flowchart:
            flowchart = SectorFlowchart(
                sector_id=sector_id,
                view_mode=v_mode,
                summary_field_ids=s_ids,
                nodes=req.nodes,
                edges=req.edges,
                updated_at=now
            )
            db.add(flowchart)
        else:
            flowchart.view_mode = v_mode
            flowchart.summary_field_ids = s_ids
            flowchart.nodes = req.nodes
            flowchart.edges = req.edges
            flowchart.updated_at = now
            db.add(flowchart)
        
        db.commit()
        db.refresh(flowchart)
        return SectorFlowchartDetail(
            sector_id=flowchart.sector_id,
            view_mode=flowchart.view_mode,
            summary_field_ids=flowchart.summary_field_ids or [],
            nodes=flowchart.nodes or [],
            edges=flowchart.edges or [],
            updated_at=flowchart.updated_at
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{sector_id}")
def reset_sector_flowchart(sector_id: str, db: Session = Depends(get_session)):
    try:
        flowchart = db.exec(
            select(SectorFlowchart).where(SectorFlowchart.sector_id == sector_id)
        ).first()
        if flowchart:
            db.delete(flowchart)
            db.commit()
        return {"success": True, "message": f"Fluxograma do setor '{sector_id}' resetado com sucesso."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
