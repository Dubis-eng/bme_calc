# Task Master — Grafo de Tarefas

## Épico 31: Refatoração de Densidade P0 e Decomposição Modular

| ID | Descrição | Arquivos / Escopo | Status | Dependências |
|---|---|---|---|---|
| TASK-3101 | Frontend: Modularizar `VariableModal.tsx` extraindo `VariableModalIdentitySection.tsx` e `VariableModalHarvestPlanSection.tsx` para cumprir o limite constitucional de 300 linhas físicas e eliminar tipos `any`. | `frontend/src/components/variables/VariableModal.tsx`, `VariableModalIdentitySection.tsx`, `VariableModalHarvestPlanSection.tsx` | `done` | Nenhum |
| TASK-3103 | Backend: Modularizar `backend/src/services/services_variables.py` (377 linhas) extraindo `backend/src/services/services_variables_helpers.py` (<150 linhas) para cumprir o limite constitucional de 300 linhas físicas de `GEMINI.md`. | `backend/src/services/services_variables.py`, `services_variables_helpers.py` | `done` | TASK-3101 |
| TASK-3104 | Frontend: Modularizar `SystemSettingsModal.tsx` (335 linhas) extraindo abas de Safras, Meses, Ciclo e Solver para cumprir o limite constitucional de 300 linhas físicas de `GEMINI.md`. | `frontend/src/components/settings/SystemSettingsModal.tsx`, `SystemSettingsYearsTab.tsx`, `SystemSettingsMonthsTab.tsx`, `SystemSettingsCycleTab.tsx`, `SystemSettingsSolverTab.tsx` | `done` | TASK-3103 |
| TASK-3105 | Frontend: Modularizar `useFlowchartState.ts` (341 linhas) extraindo `flowchartTopology.ts` e `useFlowchartScenarioSelector.ts` para cumprir o limite constitucional de 300 linhas físicas de `GEMINI.md`. | `frontend/src/hooks/useFlowchartState.ts`, `flowchartTopology.ts`, `useFlowchartScenarioSelector.ts` | `done` | TASK-3104 |
| TASK-3106 | Frontend: Tipagem estrita de `EquationAutocompleteState` em `VariableDrawerFormulaSection.tsx` para sincronizar com `useEquationAutocomplete` e eliminar erro `TS2322`. | `frontend/src/components/variables/VariableDrawerFormulaSection.tsx` | `done` | TASK-3105 |
| TASK-3102 | Auditoria & Verificação: Validar conformidade de densidade, tipagem estrita e execução do checklist de qualidade (`python .agent/scripts/checklist.py .`). | Todo o repositório | `done` | TASK-3106 |

---

## Histórico de Épicos Concluídos
- **Épico 31:** Refatoração de Densidade P0 e Decomposição Modular (`TASK-3101` a `TASK-3106` - `done`).
- **Épico 27:** Refinamento Interativo de Fluxogramas por Setor (`TASK-2701` a `TASK-2705` - `done`).
- **Épico 30:** Padronização Global do Design System Pure White & High Contrast Black (`done`).
