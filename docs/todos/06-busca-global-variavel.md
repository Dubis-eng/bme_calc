# Tarefa 6.1 — Busca Global de Variável

## Metadados
- **ID**: 6.1
- **Status**: done
- **Concluída em**: 2026-06-14
- **Branch**: main (--no-branch mode, working tree não limpa)

## Entregáveis

### Novos Arquivos
| Arquivo | Responsabilidade |
|---|---|
| `frontend/src/utils/useVariableSearch.ts` | Hook `useMemo` que filtra variáveis por ID, Descrição e Definição, retornando objetos `SearchResult` com pré/match/pós para highlight. |
| `frontend/src/utils/useSearch.ts` | Hook que encapsula todo o estado de busca (query, debounce 300ms, painel aberto, varId destacado, timer de reset de highlight). |
| `frontend/src/components/SearchPanel.tsx` | Slide-out panel direito com lista de `ResultCard`. Single-click → scroll/highlight; double-click/Edit → abre VariableModal. |

### Arquivos Modificados
| Arquivo | Mudança |
|---|---|
| `frontend/src/components/SectorModules.tsx` | Adicionado prop `highlightedVarId`, atributo `data-var-id` em cada `<tr>`, classe CSS condicional `.var-row-highlight`. |
| `frontend/src/App.tsx` | Search bar no header, wiring do `useSearch` + `useVariableSearch`, handlers `onScrollTo` e `onSearchEdit`, `<SearchPanel>` renderizado. |
| `frontend/src/App.css` | Keyframe `var-row-pulse` + classe `.var-row-highlight` (pulse teal + tint persistente). |

## Verificação
- ✅ `npx tsc --noEmit` → zero erros
- ✅ App.tsx: 339 linhas (abaixo do gatilho de 400 linhas para refatoração obrigatória)
- ✅ Todos os novos arquivos ≤ 300 linhas
- ✅ Nesting ≤ 3 níveis em todos os arquivos
- ✅ Zero tipos `any`

## Checklist Manual (usuário)
- [ ] Digitar parcial de ID (ex: `H27`) → resultados aparecem em tempo real no painel
- [ ] Digitar palavra presente só na Definição → snippet destacado em amarelo aparece
- [ ] Single-click em resultado → scroll para variável + animação pulse
- [ ] Double-click em resultado → VariableModal abre
- [ ] Painel permanece aberto após navegação
- [ ] Limpar busca → tint some após 3 segundos
