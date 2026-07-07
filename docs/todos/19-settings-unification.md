# Tarefa 19: Unificação de Configurações e Sincronização de Ciclo (CONCLUÍDA)

## Descrição
Corrigir os erros de rota /api/settings/cycle retornando 404 e unificar todos os endpoints de configurações em /api/settings no backend, sincronizando o ciclo do cenário ativamente para snapshots e avisos de inconsistência.

## Checklist
- [x] Tarefa 19.1: Adicionar coluna `cycle_start_month` à tabela `Scenario` e ajustar migrações/seeds.
- [x] Tarefa 19.2: Implementar rotas em `router_settings.py`, incluindo `PATCH /settings/months/reorder` transacional com validação total de array e `POST /settings/cycle`, e remover rotas duplicadas/obsoletas de `main.py`.
- [x] Tarefa 19.3: Atualizar frontend (App.tsx, useScenario.ts, SystemSettingsModal.tsx, HarvestPlan.tsx, ScenarioManager.tsx) com as rotas unificadas, swap de meses completo, banner visual e gatilho de recálculo manual.
- [x] Tarefa 19.4: Atualizar suíte de testes unitários no backend (test_scenarios.py, test_harvest_plan.py).
