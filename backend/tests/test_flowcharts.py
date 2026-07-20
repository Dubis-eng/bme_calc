import pytest
from fastapi.testclient import TestClient

def test_get_flowchart_not_found(client: TestClient):
    response = client.get("/api/flowcharts/MOAGEM_INEXISTENTE")
    assert response.status_code == 404

def test_save_and_get_flowchart(client: TestClient):
    sector_id = "EXTRAÇÃO"
    payload = {
        "nodes": [
            {"id": "node-1", "type": "processNode", "position": {"x": 100, "y": 200}, "data": {"label": "Moenda 1"}}
        ],
        "edges": [
            {"id": "edge-1-2", "source": "node-1", "target": "node-2"}
        ]
    }
    # PUT to create
    put_res = client.put(f"/api/flowcharts/{sector_id}", json=payload)
    assert put_res.status_code == 200
    data = put_res.json()
    assert data["sector_id"] == sector_id
    assert len(data["nodes"]) == 1
    assert data["nodes"][0]["id"] == "node-1"
    assert len(data["edges"]) == 1

    # GET to retrieve
    get_res = client.get(f"/api/flowcharts/{sector_id}")
    assert get_res.status_code == 200
    get_data = get_res.json()
    assert get_data["sector_id"] == sector_id
    assert get_data["nodes"][0]["data"]["label"] == "Moenda 1"

def test_update_existing_flowchart(client: TestClient):
    sector_id = "EXTRAÇÃO"
    payload_initial = {
        "nodes": [{"id": "node-1", "type": "processNode", "position": {"x": 0, "y": 0}, "data": {}}],
        "edges": []
    }
    client.put(f"/api/flowcharts/{sector_id}", json=payload_initial)

    payload_updated = {
        "nodes": [
            {"id": "node-1", "type": "processNode", "position": {"x": 50, "y": 50}, "data": {}},
            {"id": "node-2", "type": "ioNode", "position": {"x": 200, "y": 50}, "data": {}}
        ],
        "edges": [
            {"id": "edge-1-2", "source": "node-1", "target": "node-2"}
        ]
    }
    put_res = client.put(f"/api/flowcharts/{sector_id}", json=payload_updated)
    assert put_res.status_code == 200
    data = put_res.json()
    assert len(data["nodes"]) == 2

def test_delete_flowchart(client: TestClient):
    sector_id = "DESTILAÇÃO"
    payload = {
        "nodes": [{"id": "node-1", "type": "hubNode", "position": {"x": 0, "y": 0}, "data": {}}],
        "edges": []
    }
    client.put(f"/api/flowcharts/{sector_id}", json=payload)

    # Delete
    del_res = client.delete(f"/api/flowcharts/{sector_id}")
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True

    # GET should now return 404
    get_res = client.get(f"/api/flowcharts/{sector_id}")
    assert get_res.status_code == 404

def test_delete_non_existent_flowchart(client: TestClient):
    res = client.delete("/api/flowcharts/SETOR_NAO_EXISTENTE")
    assert res.status_code == 200
    assert res.json()["success"] is True

def test_save_empty_flowchart(client: TestClient):
    sector_id = "AÇÚCAR"
    payload = {"nodes": [], "edges": []}
    res = client.put(f"/api/flowcharts/{sector_id}", json=payload)
    assert res.status_code == 200
    assert res.json()["nodes"] == []
    assert res.json()["edges"] == []

def test_save_view_mode_and_summary_fields(client: TestClient):
    sector_id = "FERMENTAÇÃO"
    payload = {
        "view_mode": "summary",
        "summary_field_ids": ["VAR_1", "VAR_2"],
        "nodes": [{"id": "n1", "type": "processNode", "position": {"x": 0, "y": 0}, "data": {}}],
        "edges": []
    }
    put_res = client.put(f"/api/flowcharts/{sector_id}", json=payload)
    assert put_res.status_code == 200
    data = put_res.json()
    assert data["view_mode"] == "summary"
    assert data["summary_field_ids"] == ["VAR_1", "VAR_2"]

    get_res = client.get(f"/api/flowcharts/{sector_id}")
    assert get_res.status_code == 200
    get_data = get_res.json()
    assert get_data["view_mode"] == "summary"
    assert get_data["summary_field_ids"] == ["VAR_1", "VAR_2"]


