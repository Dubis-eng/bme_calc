---
id: TASK-2604
title: Frontend Variable Attachment Modal & Delete Functionality
status: done
last_updated: 2026-07-19
---

# TASK-2604: Criar modal NodeVariableSelectorModal.tsx e exclusão de elementos

## Resumo das Alterações
1. Criado `NodeVariableSelectorModal.tsx` em `frontend/src/components/calculator/NodeVariableSelectorModal.tsx` para permitir pesquisar, marcar e anexar/desvincular variáveis aos nós do fluxograma com duplo clique.
2. Atualizado `ProcessFlowToolbar.tsx` com botão interativo `🗑️ Excluir Selecionados` ativado dinamicamente ao selecionar elementos no canvas.
3. Atualizado `ProcessFlowCanvas.tsx` permitindo exclusão nativa (tecla `Delete`/`Backspace` ou botão de lixeira) sem excluir a variável do cadastro relacional do banco de dados.
