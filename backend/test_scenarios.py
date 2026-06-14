import os
# Configure DATABASE_URL to use SQLite file for tests to avoid connection-isolation issues
os.environ["DATABASE_URL"] = "sqlite:///./test.db"

import pytest
from fastapi.testclient import TestClient
import main
from database import create_db_and_tables, engine, Scenario, ScenarioStatus
from sqlmodel import SQLModel

client = TestClient(main.app)

@pytest.fixture(autouse=True)
def setup_database():
    create_db_and_tables()
    yield
    # Cleanup schema after test
    SQLModel.metadata.drop_all(engine)
    if os.path.exists("./test.db"):
        try:
            os.remove("./test.db")
        except Exception:
            pass

def test_create_and_version_scenario():
    # 1. Create initial version (v1)
    payload = {
        "year_harvest": "2026/2027",
        "reference_month": "Abril",
        "variables": [
            {
                "ID - REF": "H1",
                "SETOR": "MOAGEM",
                "DEFINIÇÃO": "",
                "DESCRIÇÃO": "Moagem Diária",
                "TIPO": "INPUT",
                "UNIDADE DE MEDIDA": "t/d",
                "EQUAÇÕES E VALORES": "10000"
            }
        ],
        "status": "Em Edição"
    }
    response = client.post("/api/scenarios", json=payload)
    if response.status_code != 200:
        print("RESPONSE STATUS:", response.status_code)
        print("RESPONSE BODY:", response.json())
    assert response.status_code == 200
    data = response.json()
    assert data["version"] == 1
    assert data["status"] == "Em Edição"
    assert data["year_harvest"] == "2026/2027"
    assert data["reference_month"] == "Abril"
    assert len(data["variables"]) == 1
    
    # 2. Create another version (should auto-increment to v2)
    payload["variables"][0]["EQUAÇÕES E VALORES"] = "12000"
    response2 = client.post("/api/scenarios", json=payload)
    assert response2.status_code == 200
    data2 = response2.json()
    assert data2["version"] == 2
    assert data2["status"] == "Em Edição"
    
    # 3. List scenarios (should return metadata of both sorted by version descending)
    list_res = client.get("/api/scenarios")
    assert list_res.status_code == 200
    list_data = list_res.json()
    assert len(list_data) == 2
    assert list_data[0]["version"] == 2
    assert list_data[1]["version"] == 1
    
    # 4. Patch status to Aprovado
    scenario_id = data2["id"]
    patch_res = client.patch(f"/api/scenarios/{scenario_id}/status", json={"status": "Aprovado"})
    assert patch_res.status_code == 200
    patched_data = patch_res.json()
    assert patched_data["status"] == "Aprovado"

def test_goal_seek_converge():
    # Define a simple linear model to verify Scipy root-finding convergence
    # H1 = input, H2 = output = H1 * 2.5
    variables = [
        {
            "ID - REF": "H1",
            "SETOR": "MOAGEM",
            "DEFINIÇÃO": "",
            "DESCRIÇÃO": "Entrada de Teste",
            "TIPO": "INPUT",
            "UNIDADE DE MEDIDA": "t/d",
            "EQUAÇÕES E VALORES": "100"
        },
        {
            "ID - REF": "H2",
            "SETOR": "MOAGEM",
            "DEFINIÇÃO": "",
            "DESCRIÇÃO": "Saída Proporcional",
            "TIPO": "OUTPUT",
            "UNIDADE DE MEDIDA": "t/d",
            "EQUAÇÕES E VALORES": "=H1*2.5"
        }
    ]
    
    # Execute goal seek targeting H2 = 500 (requires H1 = 200)
    goalseek_payload = {
        "variables": variables,
        "input_id": "H1",
        "target_id": "H2",
        "target_value": 500.0,
        "min_val": 0.0,
        "max_val": 1000.0
    }
    
    response = client.post("/api/goalseek", json=goalseek_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["converged"] is True
    assert abs(data["optimal_value"] - 200.0) < 0.01
    assert abs(data["results"]["H2"] - 500.0) < 0.01
