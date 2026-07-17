import os
import uuid
import pytest
from fastapi.testclient import TestClient
from sqlmodel import SQLModel, select

if os.name == 'posix':
    os.environ["DATABASE_URL"] = "sqlite:////tmp/test.db"
else:
    os.environ["DATABASE_URL"] = "sqlite:///./test.db"

from src import main
from src.db.database import create_db_and_tables, engine, get_session, Variable, Stage, ControlPoint, Sector
from src.services.services_reorder import reorder_stages, reorder_control_points, reorder_variables

client = TestClient(main.app)

@pytest.fixture(autouse=True)
def setup_database():
    create_db_and_tables()
    yield
    SQLModel.metadata.drop_all(engine)
    if os.path.exists("./test.db"):
        try:
            os.remove("./test.db")
        except Exception:
            pass

def test_cascade_reordering():
    # 1. Create a variable which will automatically seed Sector, Stage, Control Point
    payload = {
        "id": "V1",
        "nome": "V1 Test",
        "descricao": "Test Variable 1",
        "setor_id": "TEST_SECTOR",
        "tipo": "INPUT",
        "unidade": "t",
        "status": "ativa",
        "etapa": "STAGE_A",
        "ponto_controle": "CP_1",
        "equation_value": "100"
    }
    # Create variable 1
    response = client.post("/api/variables", json=payload)
    assert response.status_code == 200
    v1_data = response.json()
    
    # Create variable 2 under same sector but STAGE_B
    payload2 = {
        "id": "V2",
        "nome": "V2 Test",
        "descricao": "Test Variable 2",
        "setor_id": "TEST_SECTOR",
        "tipo": "INPUT",
        "unidade": "t",
        "status": "ativa",
        "etapa": "STAGE_B",
        "ponto_controle": "CP_2",
        "equation_value": "200"
    }
    response2 = client.post("/api/variables", json=payload2)
    assert response2.status_code == 200
    v2_data = response2.json()

    # Get the db session
    session = next(get_session())
    
    # Verify stages were created
    stages = session.exec(select(Stage).where(Stage.sector_id == "TEST_SECTOR")).all()
    assert len(stages) == 2
    stage_a = [s for s in stages if s.nome == "STAGE_A"][0]
    stage_b = [s for s in stages if s.nome == "STAGE_B"][0]
    
    # Stage initial order is seeded by creation order (10, 20)
    assert stage_a.ordem == 10
    assert stage_b.ordem == 20
    
    # Test Stage Reordering
    reorder_stages("TEST_SECTOR", [stage_b.id, stage_a.id], session)
    session.refresh(stage_a)
    session.refresh(stage_b)
    assert stage_b.ordem == 10
    assert stage_a.ordem == 20
    
    # Test API Patch Reorder for Stages
    res_patch = client.patch(f"/api/sectors/TEST_SECTOR/stages/reorder", json=[str(stage_a.id), str(stage_b.id)])
    assert res_patch.status_code == 200
    session.refresh(stage_a)
    session.refresh(stage_b)
    assert stage_a.ordem == 10
    assert stage_b.ordem == 20

    # Test CP reordering under STAGE_A
    cp1 = session.exec(select(ControlPoint).where(ControlPoint.nome == "CP_1")).first()
    # Create another CP under STAGE_A by creating a new variable
    payload3 = {
        "id": "V3",
        "nome": "V3 Test",
        "descricao": "Test Variable 3",
        "setor_id": "TEST_SECTOR",
        "tipo": "INPUT",
        "unidade": "t",
        "status": "ativa",
        "etapa": "STAGE_A",
        "ponto_controle": "CP_3",
        "equation_value": "300"
    }
    response3 = client.post("/api/variables", json=payload3)
    assert response3.status_code == 200
    v3_data = response3.json()
    
    cp3 = session.exec(select(ControlPoint).where(ControlPoint.nome == "CP_3")).first()
    assert cp1.ordem == 10
    assert cp3.ordem == 20
    
    # Test API Patch Reorder for Control Points
    res_cp_patch = client.patch(f"/api/stages/{stage_a.id}/control-points/reorder", json=[str(cp3.id), str(cp1.id)])
    assert res_cp_patch.status_code == 200
    session.refresh(cp1)
    session.refresh(cp3)
    assert cp3.ordem == 10
    assert cp1.ordem == 20

    # Test Variable reordering under CP_1
    # v1 is already under CP_1. Let's create v4 under CP_1.
    payload4 = {
        "id": "V4",
        "nome": "V4 Test",
        "descricao": "Test Variable 4",
        "setor_id": "TEST_SECTOR",
        "tipo": "INPUT",
        "unidade": "t",
        "status": "ativa",
        "etapa": "STAGE_A",
        "ponto_controle": "CP_1",
        "equation_value": "400"
    }
    response4 = client.post("/api/variables", json=payload4)
    assert response4.status_code == 200
    v4_data = response4.json()
    
    v1 = session.get(Variable, v1_data["id"])
    v4 = session.get(Variable, v4_data["id"])
    assert v1.ordem == 10
    assert v4.ordem == 20
    
    # Test API Patch Reorder for Variables
    res_var_patch = client.patch(f"/api/control-points/{cp1.id}/variables/reorder", json=[v4.id, v1.id])
    assert res_var_patch.status_code == 200
    session.refresh(v1)
    session.refresh(v4)
    assert v4.ordem == 10
    assert v1.ordem == 20

    # Test Cross-parent Reorder: reordering item that belongs to a different parent (moves it)
    res_move = client.patch(f"/api/control-points/{cp3.id}/variables/reorder", json=[v1.id])
    assert res_move.status_code == 200
    session.refresh(v1)
    assert v1.control_point_id == cp3.id
    assert v1.ponto_controle == cp3.nome

def test_ensure_variable_resolves_cp_and_stage():
    # Test that when a scenario is created or updated (which calls _ensure_variable),
    # the Stage and ControlPoint entities are correctly created and linked to the Variable.
    # Also verify that a database with unlinked variables is healed correctly on migrate_database_schema.
    from sqlmodel import Session
    from src.services.services_scenarios import create_new_scenario
    from src.db.database import get_session
    
    session = next(get_session())
    
    scenario_payload = {
        "year_harvest": "2026/27",
        "reference_month": "Julho",
        "status": "Em Edição",
        "variables": [
            {
                "ID - REF": "M1",
                "SETOR": "SECTOR_IMP",
                "ETAPA": "STAGE_IMP",
                "PONTO DE CONTROLE": "CP_IMP",
                "DESCRIÇÃO": "Imported Variable 1",
                "TIPO": "INPUT",
                "UNIDADE DE MEDIDA": "m3",
                "EQUAÇÕES E VALORES": "500",
                "STATUS": "ativa"
            }
        ]
    }
    
    from src.schemas.schemas import ScenarioCreate
    req_obj = ScenarioCreate(**scenario_payload)
    sc = create_new_scenario(req_obj, session)
    
    stages = session.exec(select(Stage).where(Stage.sector_id == "SECTOR_IMP")).all()
    assert len(stages) == 1
    assert stages[0].nome == "STAGE_IMP"
    
    cps = session.exec(select(ControlPoint).where(ControlPoint.stage_id == stages[0].id)).all()
    assert len(cps) == 1
    assert cps[0].nome == "CP_IMP"
    
    v = session.get(Variable, "M1")
    assert v.control_point_id == cps[0].id
    
    v.control_point_id = None
    session.add(v)
    session.commit()
    
    from legacy.migrations_legacy import heal_missing_control_points
    heal_missing_control_points(session)
    
    session.refresh(v)
    assert v.control_point_id == cps[0].id
