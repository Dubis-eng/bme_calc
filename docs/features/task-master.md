# Task Master — Grafo de Tarefas da Resolução de Bugs e Débitos Técnicos

## Épico 23: Correção do Bug de Input na Tabela e Sanidade de Auditoria (BACKLOG)

| ID | Descrição | Arquivos / Escopo | Status | Dependências |
|---|---|---|---|---|
| TASK-2301 | Corrigir bug de input desresponsivo: exportar `mergedVariables` em `useScenario.ts` e memoizar colunas TanStack em `SectorControlPointTable.tsx`. | `frontend/src/hooks/useScenario.ts`, `frontend/src/components/sectors/SectorControlPointTable.tsx` | `done` | Nenhum |
| TASK-2302 | Extrair `FloatFormulaEvaluator` de `test_engine_decimal_parity.py` para `backend/tests/float_evaluator.py` para respeitar o limite de 300 linhas. | `backend/tests/test_engine_decimal_parity.py`, `backend/tests/float_evaluator.py` | `done` | TASK-2301 |
| TASK-2303 | Refatorar `useScenario.ts` extraindo a lógica de I/O de cenários para `useScenarioIO.ts` para respeitar o limite de 300 linhas. | `frontend/src/hooks/useScenario.ts`, `frontend/src/hooks/useScenarioIO.ts` | `done` | TASK-2301 |
| TASK-2304 | Eliminar tipos `any` residuais nos arquivos `atoms.ts`, `App.tsx` e `ValueCell.tsx`. | `frontend/src/state/atoms.ts`, `frontend/src/App.tsx`, `frontend/src/components/calculator/ValueCell.tsx` | `done` | TASK-2301 |
| TASK-2305 | Executar scripts de verificação SEO/UX, `python .agent/scripts/checklist.py .`, testes backend (Pytest) e frontend (Vitest). | Todo o repositório | `done` | TASK-2301, TASK-2302, TASK-2303, TASK-2304 |
