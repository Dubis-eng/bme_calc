# Task Master — Grafo de Tarefas

## Épico 31: Refatoração de Densidade P0 e Decomposição Modular

| ID | Descrição | Arquivos / Escopo | Status | Dependências |
|---|---|---|---|---|
| TASK-3101 | Frontend: Modularizar `VariableModal.tsx` extraindo `VariableModalIdentitySection.tsx` e `VariableModalHarvestPlanSection.tsx` para cumprir o limite constitucional de 300 linhas físicas e eliminar tipos `any`. | `frontend/src/components/variables/VariableModal.tsx`, `VariableModalIdentitySection.tsx`, `VariableModalHarvestPlanSection.tsx` | `done` | Nenhum |
| TASK-3102 | Auditoria & Verificação: Validar conformidade de densidade, tipagem estrita e execução do checklist de qualidade (`python .agent/scripts/checklist.py .`). | Todo o repositório | `blocked` | TASK-3101 |

---

## Histórico de Épicos Concluídos
- **Épico 27:** Refinamento Interativo de Fluxogramas por Setor (`TASK-2701` a `TASK-2705` - `done`).
- **Épico 30:** Padronização Global do Design System Pure White & High Contrast Black (`done`).
