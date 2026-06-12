from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, List
import engine

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CalculateRequest(BaseModel):
    variables: List[Dict[str, Any]]

class CalculateResponse(BaseModel):
    results: Dict[str, Any]

@app.post("/api/calculate", response_model=CalculateResponse)
def calculate(req: CalculateRequest):
    try:
        new_state = engine.calculate_state(req.variables)
        return CalculateResponse(results=new_state)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
