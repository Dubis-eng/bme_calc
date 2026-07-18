# SPEC.md — Correção do Bug de Input na Tabela e Resolução de Débitos Técnicos

## 1. Visão Geral
Este documento especifica as modificações necessárias para solucionar o bug de entrada não responsiva no campo de formulário da tabela de variáveis (`<input id="input-val-J178">`) e sanar os débitos técnicos listados em `docs/BACKLOG.md` em conformidade com a Constituição `GEMINI.md`.

---

## 2. Decisões Arquiteturais e de Design Resolvidas (/grill-me)

### 2.1. Bug do Input Desresponsivo na Tabela (`SectorControlPointTable.tsx` & `useScenario.ts`)
- **Problema:** A cada digitação no campo de input, a tabela recria seus elementos DOM (devido à re-instanciação não memoizada do TanStack Table) e perde o foco. Ao perder o foco, o `useEffect` de sincronização reverte o valor do campo para a prop estática `variable['EQUAÇÕES E VALORES']`.
- **Solução:**
  1. No hook `useScenario.ts`, exportar `variables: mergedVariables` (mesclado com `variableValueAtomFamily`) em vez de `variablesAtom` estático.
  2. Em `SectorControlPointTable.tsx`, memoizar a definição de `columns` com `useMemo` para garantir a preservação da identidade dos nós DOM da tabela e manter o foco durante a digitação.

### 2.2. Modurarização e Limite de 300 Linhas (`GEMINI.md` P0)
- **`useScenario.ts` (atualmente 315 linhas):** Extrair a lógica de I/O de cenários, anos e meses para um sub-hook `useScenarioIO.ts`.
- **`test_engine_decimal_parity.py` (atualmente 454 linhas):** Extrair a classe auxiliar `FloatFormulaEvaluator` para `backend/tests/float_evaluator.py`.

### 2.3. Eliminação de Tipos `any` e Validação de Auditoria
- Substituir o uso residual de `any` em `atoms.ts` e componentes frontend por interfaces fortemente tipadas.
- Executar os scripts de auditoria SEO e UX para limpar os alertas pendentes.

---

## 3. Plano de Verificação e Qualidade
- **Checklist de Código Limpo:** Execução de `python .agent/scripts/checklist.py .`.
- **Testes Backend:** `pytest backend/tests/`.
- **Testes Frontend:** `npm run test` (Vitest).
