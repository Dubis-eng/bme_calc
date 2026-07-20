---
id: TASK-2603
title: Frontend View Mode Toggle (Visão Resumida vs Completa)
status: done
last_updated: 2026-07-19
---

# TASK-2603: Alternador de Visão Resumida vs Completa no Fluxograma

## Resumo das Alterações
1. Atualizado `generateDynamicSectorFlow.ts` em `frontend/src/lib/generateDynamicSectorFlow.ts` para aceitar opções de `viewMode` (`full` vs `summary`) e `summaryFieldIds`.
2. Atualizado `ProcessFlowCanvas.tsx` para gerenciar estado de visibilidade e conectar ao `ProcessFlowToolbar.tsx`.
3. Permite alternar entre exibição de todas as variáveis e exibição focada em KPIs principais para tomadas de decisão rápidas.
