---
id: TASK-12
title: Consolidação do Plano de Safra
status: done
last_updated: 2026-06-26
---

# 🚀 Tarefa Ativa: Consolidação do Plano de Safra

Implementação completa do módulo de plano de safra, permitindo configurar quais variáveis participam da consolidação anual, seus operadores de agregação e a visualização consolidada dos cenários aprovados.

## Checklist de Execução
- [x] Tarefa 12.1: Adicionar campos `in_harvest_plan`, `harvest_plan_op` e `harvest_plan_weight_var_id` na tabela de variáveis e criar tabela `harvest_plan_settings` com migração automática.
- [x] Tarefa 12.2: Implementar serviços e endpoints backend para listagem de safras, configurações de início de ciclo, configurações de variáveis e o motor de cálculo consolidado anual.
- [x] Tarefa 12.3: Desenvolver o painel frontend `HarvestPlan.tsx` com as sub-abas de Visualização Consolidada e Configuração de Variáveis (com autocomplete para seleção de peso).
- [x] Tarefa 12.4: Implementar suíte de testes de integração em `backend/test_harvest_plan.py` validando todos os fluxos de agregação e parametrização.
