---
id: TASK-2703
title: Cascading Block Edit & Variable Attachment Modal
status: done
last_updated: 2026-07-19
---

# TASK-2703: Reformulação do NodeVariableSelectorModal com Filtro Cascata e Edição de Título

## Resumo das Alterações
1. Reformulado `NodeVariableSelectorModal.tsx` em `frontend/src/components/calculator/NodeVariableSelectorModal.tsx`.
2. Adicionado campo de texto para renomeação livre do título do bloco de processo/E/S.
3. Adicionados seletores cascata para filtragem por `Setor → Etapa/Processo → Ponto de Controle`, permitindo localizar e anexar/desvincular variáveis de qualquer ponto do cadastro relacional.
