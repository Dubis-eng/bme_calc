# Tarefa 9.7 — Ordenação Única de Setores

## Metadados
- **ID**: 9.7
- **Status**: done
- **Concluída em**: 2026-06-22
- **Branch**: main

## Entregáveis

### Arquivos Modificados
| Arquivo | Mudança |
|---|---|
| `backend/database.py` | Adicionada a coluna `ordem` (int) ao modelo `Sector`. Criada a rotina de migração em tempo de startup para atualizar tabelas existentes sem perda de dados. |
| `backend/schemas.py` | Incluído o campo `ordem` nos esquemas Pydantic `SectorCreate`, `SectorUpdate` e `SectorDetail`. |
| `backend/services.py` | Adicionada validação de unicidade do campo `ordem` ao cadastrar e atualizar setores (lançando `ValueError` / erro 400 em colisão). Listagem de setores alterada para ordenar por `Sector.ordem` de forma crescente. |
| `backend/seeding.py` | Atualizada a rotina de seeding inicial para atribuir ordens incrementais de 10 em 10 aos setores padrão, baseado na ordem física de aparecimento das variáveis. |
| `frontend/src/types/index.ts` | Adicionada a propriedade `ordem: number` à interface TypeScript `Sector`. |
| `frontend/src/components/SectorConfig.tsx` | Adicionado input numérico "Ordem" no formulário de cadastro/edição, incluindo validação em tempo real de unicidade no frontend e exibição visual do índice (`#10`, `#20`, etc.). Adicionados atributos de acessibilidade (id/htmlFor/aria-label) e eventos keyboard (`onKeyDown`). |
| `backend/test_scenarios.py` | Adicionados casos de testes unitários para validar a criação de setores com ordens duplicadas, assegurando que o backend barretila e responde com código 400. |

## Verificação
- ✅ `pytest` executado no container backend → 11 passados
- ✅ Auditoria local (`checklist.py`) → 7/7 aprovados
- ✅ Verificação de Acessibilidade → SectorConfig.tsx 100% em conformidade com WCAG
- ✅ Todos os arquivos modificados abaixo do limite de 300 linhas
- ✅ Zero tipos `any` e sem aninhamentos complexos

## Checklist Manual (usuário)
- [ ] Apagar volumes locais do Docker e reinicializar para conferir seeding ordenado.
- [ ] Tentar criar um novo setor com número de ordem já existente e validar bloqueio.
- [ ] Ajustar a ordem de um setor e verificar sua reordenação automática na Sidebar.
