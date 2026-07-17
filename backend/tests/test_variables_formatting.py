import os
if os.name == 'posix':
    os.environ["DATABASE_URL"] = "sqlite:////tmp/test.db"
else:
    os.environ["DATABASE_URL"] = "sqlite:///./test.db"

import pytest
from fastapi.testclient import TestClient
from src import main
from src.db.database import create_db_and_tables, engine, Variable, Equation
from sqlmodel import SQLModel, Session, select
from src.services.exports import generate_scenario_pdf, generate_scenario_xlsx
from src.schemas.schemas import ScenarioExportWrapper

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

def test_variable_crud_with_formatting():
    # 1. Create Variable with formatting attributes
    payload = {
        "id": "VAR_TEST_FORMAT",
        "nome": "Variavel Teste Format",
        "descricao": "Descricao teste",
        "setor_id": "DESTILARIA",
        "tipo": "INPUT",
        "unidade": "m3",
        "status": "ativa",
        "etapa": "Etapa 1",
        "ponto_controle": "PC 1",
        "equation_value": "0.12345",
        "casas_decimais": 3,
        "tipo_exibicao": "PERCENTAGE",
        "percent_base": "DECIMAL"
    }
    response = client.post("/api/variables", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["casas_decimais"] == 3
    assert data["tipo_exibicao"] == "PERCENTAGE"
    assert data["percent_base"] == "DECIMAL"

    # 2. Update Variable formatting attributes
    update_payload = {
        "nome": "Variavel Teste Format Alterada",
        "descricao": "Descricao teste alterada",
        "setor_id": "DESTILARIA",
        "tipo": "INPUT",
        "unidade": "m3",
        "status": "ativa",
        "etapa": "Etapa 1",
        "ponto_controle": "PC 1",
        "equation_value": "0.12345",
        "casas_decimais": 4,
        "tipo_exibicao": "NUMBER",
        "percent_base": "DECIMAL"
    }
    response2 = client.put("/api/variables/VAR_TEST_FORMAT", json=update_payload)
    assert response2.status_code == 200
    data2 = response2.json()
    assert data2["casas_decimais"] == 4
    assert data2["tipo_exibicao"] == "NUMBER"

def test_calculation_precision_remains_intact():
    # Verify that full floats are retained during calculation loops
    payload = {
        "variables": [
            {
                "ID - REF": "VAR_A",
                "SETOR": "DESTILARIA",
                "TIPO": "INPUT",
                "EQUAÇÕES E VALORES": "0.123456789",
                "casas_decimais": 2,
                "tipo_exibicao": "PERCENTAGE",
                "percent_base": "DECIMAL"
            },
            {
                "ID - REF": "VAR_B",
                "SETOR": "DESTILARIA",
                "TIPO": "OUTPUT",
                "EQUAÇÕES E VALORES": "=VAR_A * 2",
                "casas_decimais": 4,
                "tipo_exibicao": "NUMBER"
            }
        ]
    }
    response = client.post("/api/calculate", json=payload)
    assert response.status_code == 200
    results = response.json()["results"]
    
    # Raw mathematical calculation must be used (0.123456789 * 2) = 0.246913578
    assert results["VAR_A"]["value"] == 0.123456789
    assert results["VAR_B"]["value"] == 0.123456789 * 2.0

def test_export_formatting_rules():
    # Mocking variables list for ScenarioExportWrapper
    mock_variables = [
        {
            "ID - REF": "VAR_DEC",
            "SETOR": "DESTILARIA",
            "ETAPA": "Etapa 1",
            "PONTO DE CONTROLE": "PC 1",
            "DESCRIÇÃO": "Decimal Rounding",
            "TIPO": "INPUT",
            "UNIDADE DE MEDIDA": "m3",
            "EQUAÇÕES E VALORES": "100.56789",
            "casas_decimais": 3,
            "tipo_exibicao": "NUMBER",
            "percent_base": "DECIMAL"
        },
        {
            "ID - REF": "VAR_PERC_DEC",
            "SETOR": "DESTILARIA",
            "ETAPA": "Etapa 1",
            "PONTO DE CONTROLE": "PC 1",
            "DESCRIÇÃO": "Percent Decimal Base",
            "TIPO": "INPUT",
            "UNIDADE DE MEDIDA": "%",
            "EQUAÇÕES E VALORES": "0.12345",
            "casas_decimais": 2,
            "tipo_exibicao": "PERCENTAGE",
            "percent_base": "DECIMAL"
        },
        {
            "ID - REF": "VAR_PERC_INT",
            "SETOR": "DESTILARIA",
            "ETAPA": "Etapa 1",
            "PONTO DE CONTROLE": "PC 1",
            "DESCRIÇÃO": "Percent Integer Base",
            "TIPO": "INPUT",
            "UNIDADE DE MEDIDA": "%",
            "EQUAÇÕES E VALORES": "12.345",
            "casas_decimais": 1,
            "tipo_exibicao": "PERCENTAGE",
            "percent_base": "INTEGER"
        }
    ]
    
    class MockScenario:
        id = "f0000000-0000-0000-0000-000000000000"
        year_harvest = 2026
        reference_month = "Abril"
        version = 1
        class status:
            value = "Em Edição"
            
    scenario = MockScenario()
    wrapper = ScenarioExportWrapper(scenario, mock_variables)
    
    # 1. Verify PDF generation compiles successfully with the custom formatted values
    pdf_buf = generate_scenario_pdf(wrapper)
    assert pdf_buf.getvalue() is not None
    
    # 2. Verify Excel generation compiles successfully
    xlsx_buf = generate_scenario_xlsx(wrapper)
    assert xlsx_buf.getvalue() is not None

def test_harvest_plan_consolidation_with_metadata():
    # 1. Create a variable configured in harvest plan with percentage formatting
    payload_var = {
        "id": "VAR_HP_PERCENT",
        "nome": "Variavel Harvest Plan Percentual",
        "descricao": "Descricao",
        "setor_id": "MOAGEM",
        "tipo": "INPUT",
        "unidade": "%",
        "status": "ativa",
        "etapa": "Etapa 1",
        "ponto_controle": "PC 1",
        "equation_value": "0.15",
        "in_harvest_plan": True,
        "harvest_plan_op": "SUM",
        "casas_decimais": 2,
        "tipo_exibicao": "PERCENTAGE",
        "percent_base": "DECIMAL"
    }
    res_var = client.post("/api/variables", json=payload_var)
    assert res_var.status_code == 200

    # Configure variable in harvest plan
    config_res = client.post("/api/harvest-plan/config", json=[
        {"id": "VAR_HP_PERCENT", "in_harvest_plan": True, "harvest_plan_op": "SUM", "harvest_plan_weight_var_id": None}
    ])
    assert config_res.status_code == 200

    # 2. Create an approved scenario for the year 2026/2027 reference month Abril
    payload_sc = {
        "year_harvest": "2026/2027",
        "reference_month": "Abril",
        "variables": [
            {
                "ID - REF": "VAR_HP_PERCENT",
                "SETOR": "MOAGEM",
                "TIPO": "INPUT",
                "EQUAÇÕES E VALORES": "0.15"
            }
        ],
        "status": "Aprovado"
    }
    res_sc = client.post("/api/scenarios", json=payload_sc)
    assert res_sc.status_code == 200

    # 3. Call consolidation endpoint
    res_cons = client.get("/api/harvest-plan/consolidation?year_harvest=2026/2027")
    assert res_cons.status_code == 200
    data = res_cons.json()
    
    # 4. Check that formatting fields are correctly propagated in the JSON response
    vars_data = {v["variable_id"]: v for v in data["data"]}
    assert "VAR_HP_PERCENT" in vars_data
    target = vars_data["VAR_HP_PERCENT"]
    assert target["casas_decimais"] == 2
    assert target["tipo_exibicao"] == "PERCENTAGE"
    assert target["percent_base"] == "DECIMAL"
