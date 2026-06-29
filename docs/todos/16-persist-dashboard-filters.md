# Tarefa Ativa: Persistência e Filtragem Reativa de Status do Dashboard na Tabela de Equações (Épico 16)

- **ID:** FEAT-016
- **Status:** In Progress
- **Branch:** `feature/persist-dashboard-filters`

## Descrição da Entrega
Implementar a elevação e compartilhamento do estado de filtro de status entre o Dashboard e a tabela de equações (`SectorModules.tsx`), com filtro local no setor e lógica acumulada de filtragem por status + tipo.

## Lista de Atividades
1. [x] TASK-1601: Elevar o estado do filtro no `App.tsx` e integrá-lo no `StatusDashboard.tsx`.
2. [x] TASK-1602: Desenhar e renderizar a barra de filtros de status no `SectorModules.tsx`.
3. [x] TASK-1603: Adicionar a lógica de filtragem de variáveis no `SectorModules.tsx` para respeitar as regras acordadas (Calculadas vs Inputs, status no results e vazios).
4. [x] TASK-1604: Homologar o funcionamento no frontend e backend através do script `checklist.py`.
