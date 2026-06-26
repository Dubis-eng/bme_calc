# SESSION

> Last updated: 2026-06-26

## Status
- Status: COMMITTED
- Última Sessão: Seleções e Exclusão de Cenários no Plano de Safra (Épico 6, Tarefa 6.1)
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
  - Corrigido erro 500 ao excluir ano safra com cenários vinculados no PostgreSQL (garantido cascade flush ordenado de cenários e resultados e importação de `text` em `main.py`).
  - Corrigido erro 500 (e bloqueio de CORS resultante) no Plano de Safra ao acessar `GET /api/harvest-plan/years` ajustando o `response_model` para `List[int]`.
  - Implementada persistência de seleções por mês (`HarvestPlanSelection`) com endpoints de API `GET` e `POST` no `/api/harvest-plan/selections`.
  - Atualizado `HarvestPlan.tsx` com seletores de versão e opção de ocultação por mês ("Não selecionar (Ocultar)") e botão "➕ Adicionar Mês" para re-exibir colunas.
  - Resolvido o erro 404 ao reiniciar os serviços no Docker Compose, garantindo a carga das novas rotas de seleção do backend.
- Próximos Passos:
  1. Tarefa 6.2 — Criar painel de referência de sintaxe do motor AST no frontend.

