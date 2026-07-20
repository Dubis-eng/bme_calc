---
id: TASK-2701
title: Frontend Flowchart Layout Retention & Persistence Fix
status: done
last_updated: 2026-07-19
---

# TASK-2701: Retenção e Carregamento Confiável do Layout Salvo

## Resumo das Alterações
1. Corrigida a função `loadFlowchart` em `frontend/src/components/calculator/ProcessFlowCanvas.tsx`.
2. Removidas dependências instáveis no efeito de carregamento do canvas, garantindo que o layout customizado salvo no PostgreSQL seja retido e nunca resetado ao alternar entre abas de setores.
