---
id: TASK-2504
title: Frontend Dynamic Flowchart Sector Tabs in App.tsx
status: done
last_updated: 2026-07-19
---

# TASK-2504: Atualizar App.tsx para carregar dinamicamente os 10 setores reais do bme_calc

## Objetivos
1. Atualizar o seletor de abas da visualização de Fluxogramas (`activeTab === 'flowchart'`) em `frontend/src/App.tsx`.
2. Substituir as 3 abas estáticas por um seletor dinâmico baseado nos 10 setores reais do `bme_calc`:
   - `PLANEJAMENTO`, `EXTRAÇÃO`, `DESTILAÇÃO`, `AÇÚCAR`, `INFO GERAIS`, `FERMENTAÇÃO`, `TRATAMENTO DO CALDO`, `UTILIDADES`, `INFORMAÇÕES TURBINAS`, `LEVEDURA`.
   - Se a API retornar a lista de `sectors`, mapear dinamicamente os setores cadastrados no banco de dados.
3. Garantir que o setor padrão inicial seja `EXTRAÇÃO` e que a navegação entre abas recarregue o `ProcessFlowCanvas` com a topologia dinâmica/customizada correspondente.
4. Respeitar o limite rígido de **300 linhas físicas** em `App.tsx` e tipagem estrita (sem `any`).
