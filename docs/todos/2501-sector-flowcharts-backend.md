---
id: TASK-2501
title: Backend Sector Flowchart Model & Router
status: done
last_updated: 2026-07-19
---

# TASK-2501: Criar tabela SectorFlowchart no banco e rotas /api/flowcharts/{sector_id}

## Objetivos
1. Definir o modelo `SectorFlowchart` em `backend/src/db/database.py` via SQLModel.
2. Criar `backend/src/api/router_flowcharts.py` com os endpoints:
   - `GET /api/flowcharts/{sector_id}`: Retorna o fluxograma customizado do setor (ou 404/empty se não existir).
   - `PUT /api/flowcharts/{sector_id}`: Salva/atualiza nós e arestas (`nodes`, `edges`) do fluxograma do setor.
   - `DELETE /api/flowcharts/{sector_id}`: Reseta/remove a customização do fluxograma do setor.
3. Incluir o `router_flowcharts` no `backend/src/main.py`.
4. Garantir que as diretrizes de código (300 linhas por arquivo, tipagem estrita, guard clauses) sejam respeitadas.
