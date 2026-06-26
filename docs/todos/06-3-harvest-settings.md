# Tarefa 6.3 — Cadastro de Meses e Anos de Referência

## Metadados
- **ID**: 6.3
- **Status**: done
- **Concluída em**: 2026-06-26
- **Branch**: main

## Entregáveis

### Novos Arquivos
| Arquivo | Responsabilidade |
|---|---|
| `frontend/src/components/SystemSettingsModal.tsx` | Modal de configurações do sistema para CRUD de anos safra, habilitar/desabilitar meses de referência e ordená-los. |

### Arquivos Modificados
| Arquivo | Mudança |
|---|---|
| `backend/database.py` | Adicionadas tabelas `HarvestYear` e `HarvestMonth`, além da rotina de migração no startup. |
| `backend/main.py` | Adicionados endpoints de API `/api/harvest-years` e `/api/harvest-months`. |
| `backend/schemas.py` | Adicionados esquemas Pydantic/SQLModel para as novas tabelas. |
| `backend/seeding.py` | Atualizada a inicialização do banco para semear anos/meses dinâmicos. |
| `backend/services.py` | Adaptada a consolidação do plano de safra e leitura de anos/meses dinâmicos da base. |
| `backend/test_scenarios.py` | Adicionados testes unitários para os endpoints de anos e meses de safra. |
| `frontend/src/App.tsx` | Integrada a chamada de buscar anos safra ativos e meses para o estado global. |
| `frontend/src/components/HarvestPlan.tsx` | Atualizado seletor de ano safra para usar a listagem dinâmica do backend. |
| `frontend/src/components/RightPanel.tsx` | Ajustada a passagem de dados dinâmicos de anos/meses para o ScenarioManager. |
| `frontend/src/components/ScenarioManager.tsx` | Substituído o seletor estático de anos/meses por opções vindas dinamicamente da API. |
| `frontend/src/components/Sidebar.tsx` | Adicionado botão de engrenagem (⚙️) para abrir o modal de configurações do sistema. |
| `frontend/src/utils/useScenario.ts` | Atualizados campos e tipos internos para suportar ano safra como inteiro. |

## Verificação
- ✅ `pytest` no backend → 17 testes passaram (100% de sucesso)
- ✅ Limites de 300/400 linhas respeitados

## Quality checklist
- [ ] Pydantic schema e input parsing no cadastro de anos
- [ ] Tratamento de erro na exclusão em cascata de anos safra
- [ ] Inclusão de testes de integração para endpoints de anos safra
