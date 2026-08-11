---
id: EPIC-31
title: Correção do Plano de Safra, Seleção de Versões, Liberação de Seletores e Persistência de Status de Cenários — Concluído
status: ACCEPTED
branch: main
last_updated: 2026-08-11
current_task: Nenhuma — Versão 2.26.0 Concluída com Sucesso (100% Homologado, 7/7 Master Checklist PASS & 0 Erros)
---

# SESSION — Versão 2.26.0: Resiliência do Plano de Safra, Seleção de Versões & Persistência de Status

## 📍 Estado Atual
- **Branch ativa:** `main`
- **Fase:** Versão 2.26.0 Totalmente Concluída, Auditada e Validada (7/7 Master Checklist PASS & 0 erros de compilação)
- **Próxima tarefa:** Nenhuma

## 🏁 Últimas Entregas Concluídas
- **TASK-3101**: **Persistência Imediata de Status (`App.tsx` & `services_scenarios.py`)**: Sincronização instantânea no banco de dados via `PATCH /api/scenarios/:id/status` ao aprovar ou finalizar cenários, permitindo que a atualização do status seja salva e mantida após recarregamentos.
- **TASK-3102**: **Liberação dos Seletores de Safra e Mês (`CalculatorTopBar.tsx`)**: Remoção da trava `disabled={isLocked}` dos menus de Safra e Mês de Referência mesmo em cenários aprovados, liberando a criação de novas versões/cenários para outros períodos.
- **TASK-3103**: **Seleção Completa de Versões no Plano de Safra (`services_harvest_plan.py`, `router_harvest_plan.py`, `HarvestPlanTable.tsx`)**: Suporte a parâmetros string `year_harvest` (`2026/2027`) e exibição de todas as versões e status de cenários no cabeçalho da consolidação.
- **TASK-3104**: **Resiliência e Fallbacks do Plano de Safra (`services_harvest_plan_calc.py`)**: Inclusão de fallbacks automáticos para incluir variáveis ativas no plano de safra e recuperar anos safra a partir dos cenários cadastrados caso as tabelas estejam vazias.
- **TASK-3105**: **Padronização do Cliente HTTP & Self-Learning (`useScenarioIO.ts`, `client.ts`, `bme-calc-operations/SKILL.md`)**: Substituição de chamadas `axios` nativas por `apiClient` com timeout de 30s e criação da skill de operações BME Calc.

## ⚠️ Blockers / Open Issues
- Nenhum.
