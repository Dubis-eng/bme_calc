---
id: EPIC-28
title: Controle de Layout, Conexões e Exclusão Isolada de Setores Customizados — Épico Concluído
status: ACCEPTED
branch: main
last_updated: 2026-07-19
current_task: Nenhuma — Épico 28 Concluído com Sucesso (100% Master Checklist PASS)
---

# SESSION — Épico 28: Controle de Layout, Conexões e Exclusão Isolada de Setores Customizados

## 📍 Estado Atual
- **Branch ativa:** `main`
- **Fase:** Épico 28 Totalmente Concluído e Auditado (7/7 Master Checklist PASS, 7/7 Pytest PASS)
- **Próxima tarefa:** Nenhuma (Todas as solicitações atendidas e homologadas pelo usuário)

## 🏁 Últimas Entregas Concluídas
- **TASK-2801**: Sincronização em tempo real de inputs com Jotai e botão `⚡ Calcular` na toolbar.
- **TASK-2802**: Trava de edição de layout (`🔒 Layout Travado / 🔓 Edição Liberada`) e exclusão de arestas.
- **TASK-2803**: Linhas de conexão limpas sem rótulos de texto e com setas direcionais (`MarkerType.ArrowClosed`).
- **TASK-2804**: Isolamento de setores customizados do fluxograma sem poluir a Calculadora/Variáveis.
- **TASK-2805**: Botão de exclusão definitiva (`🗑️ Excluir`) restrito a setores customizados (`isCustom: true`) limpando o banco PostgreSQL via `DELETE /api/flowcharts/{sector_id}`.
- **TASK-2806**: Persistência imune à limpeza de cache através de carregamento nativo via `GET /api/flowcharts`.
- **TASK-2807**: Suítes de testes (`test_flowcharts.py` Pytest 7/7 PASS) e Master Checklist (7/7 PASS).

## ⚠️ Blockers / Open Issues
- Nenhum.
