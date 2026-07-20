---
id: TASK-2503
title: Frontend Interactive Process Flowchart Canvas & Toolbar
status: done
last_updated: 2026-07-19
---

# TASK-2503: Atualizar ProcessFlowCanvas.tsx com inclusão/remoção, conexões e salvamento no banco

## Objetivos
1. Criar o componente `ProcessFlowToolbar.tsx` (`frontend/src/components/calculator/ProcessFlowToolbar.tsx`):
   - Botão **Adicionar Bloco de Processo** (Cria um novo nó customizado `processNode`).
   - Botão **Adicionar Ponto de E/S** (Cria um novo nó customizado `ioNode`).
   - Botão **Salvar Layout** (Faz um `PUT` para `/api/flowcharts/{sector_id}`).
   - Botão **Resetar / Auto-gerar** (Faz um `DELETE` para `/api/flowcharts/{sector_id}` e recarrega a topologia dinâmica via `generateDynamicSectorFlow`).
2. Atualizar `ProcessFlowCanvas.tsx` (`frontend/src/components/calculator/ProcessFlowCanvas.tsx`):
   - `nodesConnectable={true}` e handler `onConnect` via `addEdge` do `@xyflow/react` para permitir conexão drag-and-drop de arestas entre nós.
   - Handler `onNodesDelete` / `onEdgesDelete` para suporte a remoção de elementos selecionados.
   - Carregar layout salvo via `GET /api/flowcharts/{sector_id}` ao mudar de setor, caindo no fallback dinâmico `generateDynamicSectorFlow(mergedVariables, sector)` se não houver layout customizado no banco.
3. Garantir conformidade com as regras de densidade (máximo 300 linhas por arquivo, funções < 40 linhas, sem `any`, paleta Maestro Teal/Cyan/Emerald).
