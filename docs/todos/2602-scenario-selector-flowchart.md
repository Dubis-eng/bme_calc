---
id: TASK-2602
title: Frontend Scenario & Period Selector no Canvas
status: done
last_updated: 2026-07-19
---

# TASK-2602: Integrar seletor de cenários no topo da toolbar do fluxograma

## Resumo das Alterações
1. Atualizado `ProcessFlowToolbar.tsx` em `frontend/src/components/calculator/ProcessFlowToolbar.tsx`.
2. Adicionado o badge e projeção de dados do cenário ativo (`currentScenario`) exibindo o Ano Safra, Mês de Referência, Versão e Badge de Status (`Em Edição`, `Aprovado`).
3. Permite visualizar e inspecionar o fluxograma reativo com os valores calculados de qualquer cenário em edição ou finalizado.
