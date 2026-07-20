---
id: TASK-2404
title: Integrar o ProcessFlowCanvas na interface do App.tsx com seletor por abas
status: done
last_updated: 2026-07-18
---

# TASK-2404 — Integrar ProcessFlowCanvas no App.tsx

## Objetivo
Integrar o componente `ProcessFlowCanvas` em `frontend/src/App.tsx`, substituindo o placeholder por um seletor de abas de processo (`Moagem`, `Balanço de Bagaço`, `Premissas e Resultados`) e renderizando a topologia interativa correspondente.

## Arquivos Modificados
- `frontend/src/App.tsx`
- `frontend/src/components/calculator/nodes/ValueTile.tsx` (acessibilidade `<label>`)

## Resultado
- Aba "Fluxograma" do `App.tsx` renderiza o seletor por abas (`Moagem`, `Balanço de Bagaço`, `Premissas e Resultados`).
- `App.tsx` foi formatado para manter menos de 300 linhas físicas.
- Auditoria de arquitetura e UX aprovadas com 100% de sucesso via `python .agent/scripts/checklist.py .`.
