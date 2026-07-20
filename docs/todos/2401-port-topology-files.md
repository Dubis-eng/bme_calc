---
id: TASK-2401
title: Portar arquivos de topologia declarativa (processFlow.ts, processFlowMoagem.ts, processFlowPremissas.ts, processFlowBagaco.ts)
status: done
last_updated: 2026-07-18
---

# TASK-2401 — Portar Arquivos de Topologia Declarativa

## Objetivo
Portar os arquivos de topologia declarativa de fluxogramas (`processFlow.ts`, `processFlowMoagem.ts`, `processFlowPremissas.ts`, `processFlowBagaco.ts`) do projeto de referência `balanco-massa-main` para a pasta `frontend/src/lib/` do `bme_calc`.

## Arquivos Criados
- `frontend/src/lib/processFlow.ts`
- `frontend/src/lib/processFlowMoagem.ts`
- `frontend/src/lib/processFlowPremissas.ts`
- `frontend/src/lib/processFlowBagaco.ts`

## Resultado
- Todos os 4 arquivos foram criados com sucesso sem erros de sintaxe ou compilação.
- `processFlowMoagem.ts` foi formatado para respeitar estritamente a restrição P0 de limite máximo de 300 linhas físicas.
- Auditoria de arquitetura aprovada via `python .agents/scripts/checklist.py .`.
