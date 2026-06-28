from fastapi import APIRouter, HTTPException, Depends
from typing import List
from database import get_session
import services
from schemas import (
    VariableCreate, VariableUpdate, VariableDetail,
    SubstitutionPreviewRequest, SubstitutionPreviewResponse,
    SubstitutionConfirmRequest, SubstitutionConfirmResponse
)

router = APIRouter(prefix="/api/variables", tags=["variables"])

@router.get("", response_model=List[VariableDetail])
def list_variables_endpoint(db=Depends(get_session)):
    try:
        return services.list_variables(db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("", response_model=VariableDetail)
def create_variable_endpoint(req: VariableCreate, db=Depends(get_session)):
    try:
        return services.create_variable(req, db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{id}", response_model=VariableDetail)
def update_variable_endpoint(id: str, req: VariableUpdate, db=Depends(get_session)):
    try:
        return services.update_variable(id, req, db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{id}/replace-preview", response_model=SubstitutionPreviewResponse)
def replace_variable_preview_endpoint(id: str, req: SubstitutionPreviewRequest, db=Depends(get_session)):
    try:
        affected, becomes_unused = services.get_substitution_preview(id, req.recursive, db, req.replacement_expr)
        return SubstitutionPreviewResponse(affected=affected, becomes_unused=becomes_unused)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{id}/replace-confirm", response_model=SubstitutionConfirmResponse)
def replace_variable_confirm_endpoint(id: str, req: SubstitutionConfirmRequest, db=Depends(get_session)):
    try:
        _, becomes_unused = services.get_substitution_preview(id, req.recursive, db, req.replacement_expr)
        count = services.confirm_variable_substitution(id, req.recursive, req.action_unused, db, req.replacement_expr)
        return SubstitutionConfirmResponse(affected_count=count, becomes_unused=becomes_unused)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
