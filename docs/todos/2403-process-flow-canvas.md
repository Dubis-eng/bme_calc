---
id: TASK-2403
title: Criar o componente ProcessFlowCanvas.tsx e a folha de estilos ProcessFlowCanvas.css
status: done
last_updated: 2026-07-18
---

# TASK-2403 — Criar ProcessFlowCanvas.tsx e ProcessFlowCanvas.css

## Objetivo
Criar o componente principal `ProcessFlowCanvas.tsx` e a folha de estilos `ProcessFlowCanvas.css` em `frontend/src/components/calculator/` com suporte a navegação interativa (pan, zoom, drag-and-drop de nós, minimapa, fitView) e alinhado ao tema Dark Studio do ecossistema BME Calc.

## Arquivos Criados
- `frontend/src/components/calculator/ProcessFlowCanvas.css`
- `frontend/src/components/calculator/ProcessFlowCanvas.tsx`

## Resultado
- Componente de Canvas `ProcessFlowCanvas.tsx` criado com suporte completo ao ReactFlow, dragging, minimap e estilização customizada Dark Studio em `ProcessFlowCanvas.css`.
- Respeitado o limite de 300 linhas físicas por arquivo.
- Auditoria de arquitetura aprovada via `python .agents/scripts/checklist.py .`.
