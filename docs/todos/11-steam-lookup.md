---
id: TASK-11
title: Novo Memorial de Cálculo e Motor de Busca Termodinâmico
status: done
last_updated: 2026-06-25
---

# 🚀 Tarefa Ativa: Novo Memorial de Cálculo e Busca Termodinâmica

Estamos implementando as modificações da nova planilha de cálculo e adicionando o motor termodinâmico para vapor saturado/superaquecido.

## Checklist de Execução
- [x] Tarefa 11.1: Sincronizar o arquivo `docs/memorial_de_calculo_balanco.json` com `backend/` e `frontend/public/`
- [x] Tarefa 11.2: Limpar registros antigos com prefixo `H` no startup do banco de dados
- [x] Tarefa 11.3: Ajustar `backend/engine.py` para suportar o prefixo `J` nas expressões regulares, expansão de ranges e a densidade `J270` baseada no teor alcoólico `J269`
- [x] Tarefa 11.4: Implementar as novas funções termodinâmicas no interpretador AST `backend/evaluator.py` usando pressões absolutas com a biblioteca `iapws`
- [x] Tarefa 11.5: Substituir os valores fixos de turbinas por fórmulas de vapor dinâmicas no JSON de memorial e sincronizar
- [x] Tarefa 11.6: Adicionar orientações e tooltips explicativos sobre as novas funções de vapor no frontend
- [x] Tarefa 11.7: Validar a convergência do cálculo com testes locais
