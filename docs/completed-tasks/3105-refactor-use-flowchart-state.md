---
id: TASK-3105
title: Refatoração de Densidade P0 useFlowchartState.ts
status: done
branch: main
completed_at: 2026-09-30
---

# TASK-3105: Refatoração de Densidade P0 em useFlowchartState.ts — Concluído

## Resumo das Modificações
- Criado `frontend/src/hooks/flowchartTopology.ts` (48 linhas):
  - Centralizada a função `createDefaultFlowElements(mergedVariables, sectorKey)` e `mapCustomEdges`.
  - Eliminadas 3 replicações de código idêntico (~75 linhas duplicadas).
- Criado `frontend/src/hooks/useFlowchartScenarioSelector.ts` (36 linhas):
  - Isolado o estado e efeitos de carregamento inicial de cenários e safras (`availableScenarios`, `selectedScenarioId`, `availableYears`).
- Refatorado `frontend/src/hooks/useFlowchartState.ts` de 341 para 249 linhas físicas (< 300 linhas, redução de ~27%).
- Mantida 100% da interface do hook para `ProcessFlowCanvas.tsx`.
- `checklist.py` confirmou zero violações de densidade no repositório.
