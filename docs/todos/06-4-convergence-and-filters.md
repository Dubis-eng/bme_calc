# Tarefa 6.4 — Configuração de Tolerância do Solucionador e Filtros de Tipo

## Metadados
- **ID**: 6.4
- **Status**: done
- **Concluída em**: 2026-06-27
- **Branch**: main

## Entregáveis

### Novos Arquivos
Nenhum novo arquivo.

### Arquivos Modificados
| Arquivo | Mudança |
|---|---|
| `backend/engine.py` | Adicionado suporte a tolerância customizada e retorno do resíduo de malha no cálculo de ciclos. |
| `backend/schemas.py` | Incluído campo `tolerance` na requisição e `residual` na resposta de cálculo. |
| `backend/main.py` | Atualizado endpoint `/api/calculate` para receber a tolerância. |
| `frontend/src/utils/useScenario.ts` | Passagem do parâmetro `tolerance` e recepção do estado `residual`. Exposição da função `updateTolerance`. |
| `frontend/src/App.tsx` | Integração do resíduo e atualização de estados do modal de configurações. |
| `frontend/src/components/Header.tsx` | Visualização contínua do resíduo com cor de aviso (laranja) caso supere a tolerância. |
| `frontend/src/components/SystemSettingsModal.tsx` | Aba "Solucionador" para configuração da tolerância gravada no `localStorage`. |
| `frontend/src/components/SectorModules.tsx` | Botões rápidos de filtro por tipo de variável (INPUT, OUTPUT, CENÁRIO, DERIVADA). |
| `frontend/src/components/HarvestPlan.tsx` | Botões rápidos de filtro por tipo de variável na barra de controles do Plano de Safra. |

## Verificação
- ✅ Testes do backend passando (`pytest backend`).
- ✅ Compilação do build do frontend (`npm run build`) concluído com sucesso e sem avisos de linter nas dependências e arquivos editados.
- ✅ Todos os arquivos criados ou modificados respeitando a regra constitucional de <300 linhas físicas.
