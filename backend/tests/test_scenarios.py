import os
if os.name == 'posix':
    os.environ["DATABASE_URL"] = "sqlite:////tmp/test.db"
else:
    os.environ["DATABASE_URL"] = "sqlite:///./test.db"

import pytest
from fastapi.testclient import TestClient
from src import main
from src.db.database import create_db_and_tables, engine, Scenario, ScenarioStatus
from sqlmodel import SQLModel

client = TestClient(main.app)

@pytest.fixture(autouse=True)
def setup_database():
    create_db_and_tables()
    yield
    SQLModel.metadata.drop_all(engine)
    if os.path.exists("./test.db"):
        try: os.remove("./test.db")
        except Exception: pass

def test_create_and_version_scenario():
    # 1. Create initial version (v1)
    payload = {
        "year_harvest": "2026/2027",
        "reference_month": "Abril",
        "variables": [{"ID - REF": "H1", "SETOR": "MOAGEM", "DEFINIÇÃO": "", "DESCRIÇÃO": "Moagem Diária", "TIPO": "INPUT", "UNIDADE DE MEDIDA": "t/d", "EQUAÇÕES E VALORES": "10000"}],
        "status": "Em Edição"
    }
    response = client.post("/api/scenarios", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["version"] == 1
    assert data["status"] == "Em Edição"
    assert data["year_harvest"] == 2026
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
        {"ID - REF": "H1", "SETOR": "MOAGEM", "DEFINIÇÃO": "", "DESCRIÇÃO": "Entrada de Teste", "TIPO": "INPUT", "UNIDADE DE MEDIDA": "t/d", "EQUAÇÕES E VALORES": "100"},
        {"ID - REF": "H2", "SETOR": "MOAGEM", "DEFINIÇÃO": "", "DESCRIÇÃO": "Saída Proporcional", "TIPO": "OUTPUT", "UNIDADE DE MEDIDA": "t/d", "EQUAÇÕES E VALORES": "=H1*2.5"}
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
    assert abs(data["results"]["H2"]["value"] - 500.0) < 0.01

def test_sector_crud_and_validation():
    # 1. Create a sector
    payload = {"id": "NOVOS_PROJETOS", "nome": "Novos Projetos", "descricao": "Setor de testes", "ordem": 999}
    res = client.post("/api/sectors", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == "NOVOS_PROJETOS"
    assert data["nome"] == "Novos Projetos"

    # 2. Try to create duplicate sector ID (should fail)
    res_dup = client.post("/api/sectors", json=payload)
    assert res_dup.status_code == 400

    # 2b. Try to create another sector with duplicate order (should fail)
    payload_dup_ordem = {"id": "OUTRO_SETOR", "nome": "Outro Setor", "descricao": "Setor de testes", "ordem": 999}
    res_dup_ordem = client.post("/api/sectors", json=payload_dup_ordem)
    assert res_dup_ordem.status_code == 400

    # 3. List sectors (should contain NOVOS_PROJETOS)
    list_res = client.get("/api/sectors")
    assert list_res.status_code == 200
    sectors = list_res.json()
    assert any(s["id"] == "NOVOS_PROJETOS" for s in sectors)

    # 4. Patch sector
    patch_res = client.patch("/api/sectors/NOVOS_PROJETOS", json={"nome": "Projetos Especiais", "ordem": 999})
    assert patch_res.status_code == 200
    assert patch_res.json()["nome"] == "Projetos Especiais"

    # 5. Create scenario with variable associated to this sector
    scen_payload = {
        "year_harvest": "2026/2027",
        "reference_month": "Maio",
        "variables": [{"ID - REF": "H1000", "SETOR": "NOVOS_PROJETOS", "DEFINIÇÃO": "SUB_PROJ", "DESCRIÇÃO": "Variável de teste", "TIPO": "INPUT", "UNIDADE DE MEDIDA": "t/d", "EQUAÇÕES E VALORES": "500"}]
    }
    client.post("/api/scenarios", json=scen_payload)

    # 6. Try to delete sector (should fail because H1000 is associated)
    del_res = client.delete("/api/sectors/NOVOS_PROJETOS")
    assert del_res.status_code == 400
    assert "Não é possível excluir" in del_res.json()["detail"]

def test_update_scenario_endpoint():
    # 1. Create a scenario
    payload = {
        "year_harvest": "2026/2027",
        "reference_month": "Abril",
        "variables": [{"ID - REF": "H99", "SETOR": "MOAGEM", "DEFINIÇÃO": "MOA_DIA", "DESCRIÇÃO": "Moagem Diária", "TIPO": "INPUT", "UNIDADE DE MEDIDA": "t/d", "EQUAÇÕES E VALORES": "10000"}],
        "status": "Em Edição"
    }
    response = client.post("/api/scenarios", json=payload)
    assert response.status_code == 200
    data = response.json()
    scenario_id = data["id"]
    assert data["variables"][0]["EQUAÇÕES E VALORES"] == "10000.0"

    # 2. Update scenario variables via PUT
    payload["variables"][0]["EQUAÇÕES E VALORES"] = "15000"
    update_res = client.put(f"/api/scenarios/{scenario_id}", json=payload)
    assert update_res.status_code == 200
    updated_data = update_res.json()
    assert updated_data["variables"][0]["EQUAÇÕES E VALORES"] == "15000.0"

    # 3. Load scenario again and verify changes
    get_res = client.get(f"/api/scenarios/{scenario_id}")
    assert get_res.status_code == 200
    assert get_res.json()["variables"][0]["EQUAÇÕES E VALORES"] == "15000.0"

    # 4. Change status to Aprovado
    client.patch(f"/api/scenarios/{scenario_id}/status", json={"status": "Aprovado"})

    # 5. Try updating again (should return 400 since it is locked)
    payload["variables"][0]["EQUAÇÕES E VALORES"] = "20000"
    fail_res = client.put(f"/api/scenarios/{scenario_id}", json=payload)
    assert fail_res.status_code == 400
    assert "bloqueado" in fail_res.json()["detail"]

def test_harvest_years_and_months():
    # 1. Get initial harvest years (seeded: 2026, 2027, 2028)
    res_yrs = client.get("/api/settings/years")
    assert res_yrs.status_code == 200
    yrs = res_yrs.json()
    assert len(yrs) >= 3
    years_ids = [y["id"] for y in yrs]
    assert 2026 in years_ids
    assert 2027 in years_ids
    assert 2028 in years_ids

    # 2. Add a new harvest year (2029)
    res_add = client.post("/api/settings/years", json={"id": 2029})
    assert res_add.status_code == 200
    assert res_add.json()["id"] == 2029

    # 3. Get harvest years again to verify 2029 is present
    res_yrs2 = client.get("/api/settings/years")
    years_ids2 = [y["id"] for y in res_yrs2.json()]
    assert 2029 in years_ids2

    # 3.5. Create a scenario under year 2029 to verify cascade delete
    payload = {
        "year_harvest": "2029/2030",
        "reference_month": "Abril",
        "variables": [{"ID - REF": "H1", "SETOR": "MOAGEM", "DEFINIÇÃO": "", "DESCRIÇÃO": "Moagem Diária", "TIPO": "INPUT", "UNIDADE DE MEDIDA": "t/d", "EQUAÇÕES E VALORES": "10000"}],
        "status": "Em Edição"
    }
    res_sc = client.post("/api/scenarios", json=payload)
    assert res_sc.status_code == 200
    sc_id = res_sc.json()["id"]

    # 4. Get harvest months
    res_mths = client.get("/api/settings/months")
    assert res_mths.status_code == 200
    months = res_mths.json()
    assert len(months) == 12
    assert months[0]["name"] == "Janeiro"

    # 5. Disable "Fevereiro" (id = 2)
    res_patch = client.patch("/api/settings/months/2", json={"enabled": False})
    assert res_patch.status_code == 200
    assert res_patch.json()["enabled"] is False

    # 6. List enabled months only
    res_mths_enabled = client.get("/api/settings/months?enabled_only=true")
    assert res_mths_enabled.status_code == 200
    enabled_months = res_mths_enabled.json()
    assert len(enabled_months) == 11
    assert not any(m["id"] == 2 for m in enabled_months)

    # 6.5. Test month reordering transactional and idempotent
    # Fetch current months to prepare full payload
    res_all_m = client.get("/api/settings/months")
    assert res_all_m.status_code == 200
    m_list = res_all_m.json()
    reordered_payload = []
    for m in m_list:
        if m["id"] == 1:
            reordered_payload.append({"id": 1, "order_index": 1})
        elif m["id"] == 2:
            reordered_payload.append({"id": 2, "order_index": 0})
        else:
            reordered_payload.append({"id": m["id"], "order_index": m["order_index"]})
            
    res_reorder = client.patch("/api/settings/months/reorder", json={"reorderings": reordered_payload})
    assert res_reorder.status_code == 200
    
    res_m_verify = client.get("/api/settings/months")
    assert res_m_verify.status_code == 200
    m_list_verify = res_m_verify.json()
    m2 = next(m for m in m_list_verify if m["id"] == 2)
    assert m2["order_index"] == 0
    
    invalid_res = client.patch("/api/settings/months/reorder", json={"reorderings": [{"id": 1, "order_index": 0}]})
    assert invalid_res.status_code == 400

    # 7. Delete harvest year 2029 (which should delete the associated scenario and results first)
    res_del = client.delete("/api/settings/years/2029")
    assert res_del.status_code == 200

    # 8. Verify 2029 is deleted
    res_yrs3 = client.get("/api/settings/years")
    years_ids3 = [y["id"] for y in res_yrs3.json()]
    assert 2029 not in years_ids3

    # 9. Verify the scenario is also deleted (cascade)
    res_sc_get = client.get(f"/api/scenarios/{sc_id}")
    assert res_sc_get.status_code == 404


