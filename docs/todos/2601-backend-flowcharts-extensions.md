---
id: TASK-2601
title: Backend Sector Flowchart Model & Router Extensions
status: done
last_updated: 2026-07-19
---

# TASK-2601: Expandir SectorFlowchart e router_flowcharts.py

## Resumo das Alterações
1. Modelo `SectorFlowchart` expandido em `backend/src/db/database.py` com `view_mode` e `summary_field_ids`.
2. Schemas Pydantic `SectorFlowchartUpdate` e `SectorFlowchartDetail` atualizados em `backend/src/schemas/schemas.py`.
3. Endpoints REST `GET`, `PUT` e `DELETE` em `backend/src/api/router_flowcharts.py` atualizados para serializar e salvar preferências de exibição e KPIs principais.
