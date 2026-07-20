---
id: TASK-2702
title: Independent Scenario & Year Harvest Selectors on Flowchart Toolbar
status: done
last_updated: 2026-07-19
---

# TASK-2702: Seletores Independentes de Cenário e Ano Safra na Toolbar

## Resumo das Alterações
1. Atualizado `ProcessFlowToolbar.tsx` em `frontend/src/components/calculator/ProcessFlowToolbar.tsx`.
2. Adicionados dois dropdowns ativos na toolbar (Ano Safra e Cenários consultados dinamicamente via `/api/scenarios`).
3. Permite projetar e inspecionar qualquer cenário (aprovado ou em edição) no fluxograma sem depender do estado global da página de variáveis.
