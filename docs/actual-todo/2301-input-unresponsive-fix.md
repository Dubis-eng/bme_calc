---
id: TASK-2301
title: Corrigir bug de input desresponsivo na tabela e exportar mergedVariables
status: in-progress
branch: task/2301-input-unresponsive-fix
start_date: 2026-07-18
---

# TASK-2301 — Corrigir Bug de Input na Tabela

## 🎯 Objetivo
Corrigir a desresponsividade de digitação no `<input id="input-val-J178">` garantindo que:
1. `useScenario.ts` exporte `variables: mergedVariables` (unindo os valores locais digitados aos dados da variável).
2. `SectorControlPointTable.tsx` memoize as colunas da tabela com `useMemo` para evitar que o TanStack Table destrua e recrie os elementos DOM a cada renderização, evitando a perda de foco e o reset do valor pelo `useEffect`.

## 🛠️ Arquivos Modificados
- `frontend/src/hooks/useScenario.ts`
- `frontend/src/components/sectors/SectorControlPointTable.tsx`
