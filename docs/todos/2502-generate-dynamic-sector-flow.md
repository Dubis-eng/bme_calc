---
id: TASK-2502
title: Frontend Dynamic Sector Flow Generator
status: done
last_updated: 2026-07-19
---

# TASK-2502: Criar gerador de topologia dinâmica generateDynamicSectorFlow.ts

## Objetivos
1. Criar `frontend/src/lib/generateDynamicSectorFlow.ts`.
2. A função `generateDynamicSectorFlow(variables: Variable[], sector: string): ProcessFlow` deve:
   - Filtrar as variáveis pertencentes ao setor informado (`SETOR`).
   - Agrupar variáveis por `ETAPA` e `PONTO DE CONTROLE`.
   - Gerar nós customizados do `@xyflow/react` (`processNode`, `ioNode`, `hubNode`).
   - Gerar arestas (`edges`) conectando os nós de forma lógica (`Entradas → Etapa → Saídas` e conexões entre Etapas sequenciais).
   - Calcular posições `(x, y)` sem sobreposição.
3. Garantir compatibilidade com `ProcessFlow` de `processFlow.ts`.
4. Respeitar as diretrizes de código: máximo 300 linhas, tipagem estrita sem `any`, funções pequenas (máx 40 linhas) e sem aninhamentos profundos.
