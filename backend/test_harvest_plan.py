import os
if os.name == 'posix':
    os.environ["DATABASE_URL"] = "sqlite:////tmp/test_harvest.db"
else:
    os.environ["DATABASE_URL"] = "sqlite:///./test_harvest.db"

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
    SQLModel.metadata.drop_all(engine)
    if os.path.exists("./test_harvest.db"):
        try:
            os.remove("./test_harvest.db")
        except Exception:
            pass

def test_global_variable_crud():
    # 1. Create a variable globally
    payload = {
        "id": "H_TEST_VAR",
        "nome": "Test Variable",
        "descricao": "For unit test",
        "setor_id": "TEST_SECTOR",
        "tipo": "INPUT",
        "unidade": "kg",
        "status": "ativa",
        "etapa": "STAGE1",
        "ponto_controle": "PC1",
        "equation_value": ""
    }
    res = client.post("/api/variables", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == "H_TEST_VAR"
    assert data["nome"] == "Test Variable"
    assert data["tipo"] == "INPUT"
    assert data["equation_value"] == ""

    # 2. List variables globally
    res_list = client.get("/api/variables")
    assert res_list.status_code == 200
    vars_list = res_list.json()
    assert any(v["id"] == "H_TEST_VAR" for v in vars_list)

    # 3. Create a derived variable with an equation
    payload_derived = {
        "id": "H_TEST_DERIVED",
        "nome": "Derived Test",
        "descricao": "Formula variable",
        "setor_id": "TEST_SECTOR",
        "tipo": "OUTPUT",
        "unidade": "kg/h",
        "status": "ativa",
        "etapa": "STAGE1",
        "ponto_controle": "PC1",
        "equation_value": "=H_TEST_VAR*2.5"
    }
    res_der = client.post("/api/variables", json=payload_derived)
    assert res_der.status_code == 200
    data_der = res_der.json()
    assert data_der["id"] == "H_TEST_DERIVED"
    assert data_der["equation_value"] == "=H_TEST_VAR*2.5"

    # 4. Update the derived variable's formula
    payload_derived["equation_value"] = "=H_TEST_VAR*3.0"
    res_up = client.put("/api/variables/H_TEST_DERIVED", json=payload_derived)
    assert res_up.status_code == 200
    assert res_up.json()["equation_value"] == "=H_TEST_VAR*3.0"

def test_harvest_plan_settings():
    # 1. Get default settings
    res = client.get("/api/harvest-plan/settings")
    assert res.status_code == 200
    assert res.json()["start_month"] == "Abril"

    # 2. Update settings to Janeiro
    res_up = client.put("/api/harvest-plan/settings", json={"start_month": "Janeiro"})
    assert res_up.status_code == 200
    assert res_up.json()["start_month"] == "Janeiro"

    # 3. Verify it is saved
    res_verify = client.get("/api/harvest-plan/settings")
    assert res_verify.status_code == 200
    assert res_verify.json()["start_month"] == "Janeiro"

def test_harvest_plan_consolidation_calculation():
    # 1. Set settings start_month to Abril
    client.put("/api/harvest-plan/settings", json={"start_month": "Abril"})

    # 2. Create global variables
    v1 = {
        "id": "X1", "nome": "Input Volume", "descricao": "V1", "setor_id": "MOAGEM",
        "tipo": "INPUT", "unidade": "t", "status": "ativa", "etapa": "E1", "ponto_controle": "P1", "equation_value": ""
    }
    v2 = {
        "id": "X2", "nome": "Input Yield", "descricao": "V2", "setor_id": "MOAGEM",
        "tipo": "INPUT", "unidade": "%", "status": "ativa", "etapa": "E1", "ponto_controle": "P1", "equation_value": ""
    }
    v3 = {
        "id": "X3", "nome": "Calculated Result", "descricao": "V3", "setor_id": "MOAGEM",
        "tipo": "OUTPUT", "unidade": "t", "status": "ativa", "etapa": "E1", "ponto_controle": "P1", "equation_value": "=X1*X2/100"
    }
    client.post("/api/variables", json=v1)
    client.post("/api/variables", json=v2)
    client.post("/api/variables", json=v3)

    # 3. Set harvest plan configurations
    config_payload = {
        "configs": [
            {"id": "X1", "in_harvest_plan": True, "harvest_plan_op": "SUM", "harvest_plan_weight_var_id": None},
            {"id": "X2", "in_harvest_plan": True, "harvest_plan_op": "WEIGHTED_AVERAGE", "harvest_plan_weight_var_id": "X1"},
            {"id": "X3", "in_harvest_plan": True, "harvest_plan_op": "CALCULATE", "harvest_plan_weight_var_id": None}
        ]
    }
    res_config = client.post("/api/harvest-plan/config/bulk", json=config_payload)
    assert res_config.status_code == 200

    # 4. Create two approved monthly scenarios (Abril and Maio)
    # Abril scenario: X1 = 1000, X2 = 50. X3 = 1000 * 50 / 100 = 500
    scenario_abril = {
        "year_harvest": "2026/2027",
        "reference_month": "Abril",
        "variables": [
            {"ID - REF": "X1", "SETOR": "MOAGEM", "TIPO": "INPUT", "EQUAÇÕES E VALORES": "1000"},
            {"ID - REF": "X2", "SETOR": "MOAGEM", "TIPO": "INPUT", "EQUAÇÕES E VALORES": "50"},
            {"ID - REF": "X3", "SETOR": "MOAGEM", "TIPO": "OUTPUT", "EQUAÇÕES E VALORES": "=X1*X2/100"}
        ],
        "status": "Aprovado"
    }
    client.post("/api/scenarios", json=scenario_abril)

    # Maio scenario: X1 = 2000, X2 = 80. X3 = 2000 * 80 / 100 = 1600
    scenario_maio = {
        "year_harvest": "2026/2027",
        "reference_month": "Maio",
        "variables": [
            {"ID - REF": "X1", "SETOR": "MOAGEM", "TIPO": "INPUT", "EQUAÇÕES E VALORES": "2000"},
            {"ID - REF": "X2", "SETOR": "MOAGEM", "TIPO": "INPUT", "EQUAÇÕES E VALORES": "80"},
            {"ID - REF": "X3", "SETOR": "MOAGEM", "TIPO": "OUTPUT", "EQUAÇÕES E VALORES": "=X1*X2/100"}
        ],
        "status": "Aprovado"
    }
    client.post("/api/scenarios", json=scenario_maio)

    # 5. Run consolidation
    res_cons = client.get("/api/harvest-plan/consolidation?year_harvest=2026/2027")
    assert res_cons.status_code == 200
    cons_data = res_cons.json()

    # Verify months order starting in Abril
    assert cons_data["months"][0] == "Abril"
    assert cons_data["months"][1] == "Maio"
    assert cons_data["months"][11] == "Março"

    # Verify consolidated values
    vars_data = {v["variable_id"]: v for v in cons_data["data"]}
    
    # X1 (SUM): Abril=1000, Maio=2000. Accumulated should be 3000
    assert vars_data["X1"]["monthly_values"]["Abril"] == 1000.0
    assert vars_data["X1"]["monthly_values"]["Maio"] == 2000.0
    assert vars_data["X1"]["accumulated"]["value"] == 3000.0

    # X2 (WEIGHTED_AVERAGE by X1): Abril=50, Maio=80.
    # Accumulated = (50*1000 + 80*2000) / (1000 + 2000) = (50000 + 160000) / 3000 = 210000 / 3000 = 70
    assert vars_data["X2"]["monthly_values"]["Abril"] == 50.0
    assert vars_data["X2"]["monthly_values"]["Maio"] == 80.0
    assert vars_data["X2"]["accumulated"]["value"] == 70.0

    # X3 (CALCULATE: =X1*X2/100):
    # Accumulated should evaluate formula using X1.accumulated (3000) and X2.accumulated (70):
    # 3000 * 70 / 100 = 2100.
    # Note: simple sum would be 500 + 1600 = 2100 (in this linear case it matches, but it evaluates topographically)
    assert vars_data["X3"]["monthly_values"]["Abril"] == 500.0
    assert vars_data["X3"]["monthly_values"]["Maio"] == 1600.0
    assert vars_data["X3"]["accumulated"]["value"] == 2100.0
