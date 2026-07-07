---
id: FEAT-021
title: Implementação de Ordenação Personalizada e Divisores no Plano de Safra
status: in-progress
last_updated: 2026-07-07
---

# Tarefa 21: Implementação de Ordenação Personalizada e Divisores no Plano de Safra

Este documento serve como roteiro ativo para o desenvolvimento do Épico 21 nesta branch de desenvolvimento.

## 📋 Lista de Afazeres

### 1. Banco de Dados e Migrações (Tarefa 21.1)
- [ ] Adicionar `HarvestPlanOrderedItem` em `backend/database.py`.
- [ ] Atualizar migração de banco em `backend/migrations.py`.

### 2. Rotas e Serviços Backend (Tarefa 21.2 & 21.3 & 21.4)
- [ ] Criar endpoints `GET` e `POST` para `/api/harvest-plan/structure` em `backend/main.py`.
- [ ] Desenvolver lógica de persistência e sincronização de variáveis ativas no plano em `backend/services_harvest_plan.py`.
- [ ] Adaptar a consolidação mensal para respeitar a ordenação dos itens salvos e mesclar os divisores.
- [ ] Integrar a exclusão automática de itens ordenados ao inativar variáveis em `services_variables.py` e `services_substitution.py`.

### 3. Frontend UI/UX (Tarefa 21.5 & 21.6)
- [ ] Integrar botão de cadeado (`🔓 / 🔒`) para controlar modo de visualização vs edição em `HarvestPlan.tsx`.
- [ ] Desenvolver drag-and-drop HTML5 nativo e botões acessíveis em `HarvestPlanTable.tsx`.
- [ ] Implementar adição e exclusão de divisores com edição inline de texto.
- [ ] Persistir reordenações no backend ao fechar o cadeado de edição.

### 4. Exportação e Homologação (Tarefa 21.7 & 21.8)
- [ ] Formatar linhas de divisórias como linhas mescladas destacadas nas exportações PDF/Excel em `backend/exports.py`.
- [ ] Escrever testes de integração em `backend/test_harvest_plan.py`.
- [ ] Validar conformidade de linter e limites de 300 linhas físicas em todos os arquivos modificados.
