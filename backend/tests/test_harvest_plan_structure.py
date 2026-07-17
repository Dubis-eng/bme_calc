import os
if os.name == 'posix':
    os.environ["DATABASE_URL"] = "sqlite:////tmp/test_harvest_struct.db"
else:
    os.environ["DATABASE_URL"] = "sqlite:///./test_harvest_struct.db"

import pytest
from fastapi.testclient import TestClient
from src import main
from src.db.database import create_db_and_tables, engine, Variable, VariableStatus
from sqlmodel import SQLModel, select

client = TestClient(main.app)

@pytest.fixture(autouse=True)
def setup_database():
    create_db_and_tables()
    yield
    SQLModel.metadata.drop_all(engine)
    if os.path.exists("./test_harvest_struct.db"):
        try:
            os.remove("./test_harvest_struct.db")
        except Exception:
            pass

def test_harvest_plan_structure_and_reordering():
    # 1. Create test variables
    v1 = {
        "id": "Z1", "nome": "Var Z1", "descricao": "Z1", "setor_id": "MOAGEM",
        "tipo": "INPUT", "unidade": "t", "status": "ativa", "etapa": "E1", "ponto_controle": "P1", "equation_value": ""
    }
    v2 = {
        "id": "Z2", "nome": "Var Z2", "descricao": "Z2", "setor_id": "MOAGEM",
        "tipo": "INPUT", "unidade": "t", "status": "ativa", "etapa": "E1", "ponto_controle": "P1", "equation_value": ""
    }
    client.post("/api/variables", json=v1)
    client.post("/api/variables", json=v2)

    # 2. Mark variables in plan
    config_payload = {
        "configs": [
            {"id": "Z1", "in_harvest_plan": True, "harvest_plan_op": "SUM", "harvest_plan_weight_var_id": None},
            {"id": "Z2", "in_harvest_plan": True, "harvest_plan_op": "SUM", "harvest_plan_weight_var_id": None}
        ]
    }
    client.post("/api/harvest-plan/config/bulk", json=config_payload)

    # 3. Get initial structure (should have only the 2 variables, no dividers since none were created)
    res_struct = client.get("/api/harvest-plan/structure")
    assert res_struct.status_code == 200
    struct_data = res_struct.json()
    
    assert len(struct_data) == 2
    assert struct_data[0]["tipo"] == "variable"
    assert struct_data[0]["variable_id"] == "Z1"
    assert struct_data[1]["tipo"] == "variable"
    assert struct_data[1]["variable_id"] == "Z2"

    # 4. Save custom reordering with a new divider
    save_payload = {
        "items": [
            {"tipo": "divider", "label": "GRUPO ESPECIAL", "variable_id": None},
            {"tipo": "variable", "variable_id": "Z2", "label": None},
            {"tipo": "variable", "variable_id": "Z1", "label": None}
        ]
    }
    res_save = client.post("/api/harvest-plan/structure", json=save_payload)
    assert res_save.status_code == 200

    # 5. Fetch structure again and verify new order
    res_struct2 = client.get("/api/harvest-plan/structure")
    assert res_struct2.status_code == 200
    struct_data2 = res_struct2.json()
    assert len(struct_data2) == 3
    assert struct_data2[0]["tipo"] == "divider"
    assert struct_data2[0]["label"] == "GRUPO ESPECIAL"
    assert struct_data2[1]["variable_id"] == "Z2"
    assert struct_data2[2]["variable_id"] == "Z1"

    # 6. Add a new variable Z3 and add to plan - since dividers exist, it should trigger "Itens sem Agrupamento"
    v3 = {
        "id": "Z3", "nome": "Var Z3", "descricao": "Z3", "setor_id": "MOAGEM",
        "tipo": "INPUT", "unidade": "t", "status": "ativa", "etapa": "E1", "ponto_controle": "P1", "equation_value": ""
    }
    client.post("/api/variables", json=v3)
    config_payload3 = {
        "configs": [
            {"id": "Z3", "in_harvest_plan": True, "harvest_plan_op": "SUM", "harvest_plan_weight_var_id": None}
        ]
    }
    client.post("/api/harvest-plan/config/bulk", json=config_payload3)

    # 7. Fetch structure and verify it contains GRUPO ESPECIAL, Z2, Z1, Itens sem Agrupamento, Z3
    res_struct_after_z3 = client.get("/api/harvest-plan/structure")
    assert res_struct_after_z3.status_code == 200
    struct_data_z3 = res_struct_after_z3.json()
    assert len(struct_data_z3) == 5
    assert struct_data_z3[0]["tipo"] == "divider"
    assert struct_data_z3[0]["label"] == "GRUPO ESPECIAL"
    assert struct_data_z3[1]["variable_id"] == "Z2"
    assert struct_data_z3[2]["variable_id"] == "Z1"
    assert struct_data_z3[3]["tipo"] == "divider"
    assert struct_data_z3[3]["label"] == "Itens sem Agrupamento"
    assert struct_data_z3[4]["variable_id"] == "Z3"

    # 8. Test Export Endpoints
    res_pdf = client.get("/api/harvest-plan/export/pdf?year_harvest=2026/2027")
    assert res_pdf.status_code == 200
    assert res_pdf.headers["content-type"] == "application/pdf"

    res_xlsx = client.get("/api/harvest-plan/export/xlsx?year_harvest=2026/2027")
    assert res_xlsx.status_code == 200
    assert "openxmlformats-officedocument" in res_xlsx.headers["content-type"]

    # 9. Test Inactivation Sync
    # Update Z3 status to inativa
    res_inact = client.put("/api/variables/Z3", json={
        "id": "Z3", "nome": "Var Z3", "descricao": "Z3", "setor_id": "MOAGEM",
        "tipo": "INPUT", "unidade": "t", "status": "inativa", "etapa": "E1", "ponto_controle": "P1", "equation_value": ""
    })
    assert res_inact.status_code == 200
    
    # Z3 should be removed from structure
    res_struct3 = client.get("/api/harvest-plan/structure")
    assert res_struct3.status_code == 200
    struct_data3 = res_struct3.json()
    assert not any(item["variable_id"] == "Z3" for item in struct_data3)
