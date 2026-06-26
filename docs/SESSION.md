# SESSION

> Last updated: 2026-06-26

## Status
- Status: COMMITTED
- Última Sessão: Cadastro Dinâmico de Anos Safra e Meses de Referência (Épico 6, Tarefa 6.3)
- Entregues:
  - Adicionadas tabelas `harvest_years` e `harvest_months` ao banco de dados com seeding automático no startup.
  - Implementada migração automática da coluna `year_harvest` de `VARCHAR` para `INTEGER` com normalização dos dados existentes antes do `ALTER COLUMN`.
  - Implementados endpoints de API `GET/POST/DELETE /api/harvest-years` e `GET/PATCH /api/harvest-months`.
  - Criado componente `SystemSettingsModal.tsx` com painel administrativo para gerenciar anos safra e meses de referência.
  - Adicionado ícone ⚙️ (engrenagem) no rodapé da Sidebar para acesso ao painel de configurações.
  - Atualizados `ScenarioManager.tsx` e `HarvestPlan.tsx` para carregar anos e meses dinamicamente da API.
  - Motor de consolidação de safra (`services.py`) atualizado para ler meses habilitados da base de dados.
  - Adicionado teste de integração `test_harvest_years_and_months` em `test_scenarios.py`.
  - Corrigido bug de `UndefinedTable` no startup via `session.commit()` após `create_all` + bind params nas queries.
- Próximos Passos:
  1. Tarefa 6.2 — Criar painel de referência de sintaxe do motor AST no frontend.

