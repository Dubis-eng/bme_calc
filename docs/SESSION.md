---
id: EPIC-22
title: Modernização Arquitetural — Sessão Ativa
status: in-progress
branch: feature/architecture-improvements
last_updated: 2026-07-16
current_task: 22.0.6 — Frontend: criar pastas state/, api/, hooks/, styles/
---

# SESSION — Épico 22: Modernização Arquitetural

## 📍 Estado Atual
- **Branch ativa:** `feature/architecture-improvements`
- **Fase:** Planejamento concluído → Execução iniciando em 22.0.x
- **Próxima tarefa:** TASK-2204 (Frontend: criar pastas state/, api/, hooks/, styles/)

## 🏁 Última Tarefa Concluída
- Épico 22 — Tarefa 22.0.5 (Frontend: criar subpastas de componentes por domínio)
- Branch: `task/22.0.5-frontend-components-restructuring`

## 📋 Progresso do Épico 22

### Domínio 0 — Reestruturação de Diretórios
- [x] TASK-2201 Backend: criar estrutura `src/`, mover arquivos por categoria
- [x] TASK-2202 Backend: mover testes para `tests/`, scripts para `scripts/`, dados para `data/`
- [x] TASK-2203 Frontend: criar subpastas de componentes por domínio
- [/] TASK-2204 Frontend: criar pastas `state/`, `api/`, `hooks/`, `styles/`
- [ ] TASK-2205 Atualizar todos os imports após movimentação
- [ ] TASK-2206 Atualizar docker-compose.yml e Dockerfile para nova estrutura

### Domínio A — Design System
- [ ] TASK-2210 Atualizar `index.css` com paleta Studio Dark + tabular numbers
- [ ] TASK-2211 Atualizar `tailwind.config.js` com tokens HSL
- [ ] TASK-2212 Criar `docs/DESIGN.md` com sistema de design documentado
- [ ] TASK-2213 Aplicar `studio-surface`, `glow-primary`, row highlight nos componentes
- [ ] TASK-2214 Diferenciar visualmente INPUT/OUTPUT/CONSTANT

### Domínio B — Segurança CORS
- [ ] TASK-2220 Substituir `allow_origins=["*"]` por env var `ALLOWED_ORIGINS`
- [ ] TASK-2221 Atualizar `.env.sample`, `docker-compose.yml` e docs

### Domínio C — Engine Decimal
- [ ] TASK-2230 Criar `test_engine_decimal_parity.py` (testes de paridade float vs Decimal)
- [ ] TASK-2231 Migrar `engine.py` para `Decimal` (pós-paridade aprovada)
- [ ] TASK-2232 Adaptar `goalseek.py` (interface float↔Decimal)
- [ ] TASK-2233 Re-executar todos os testes de backend

### Domínio D — Frontend Stack
- [ ] TASK-2240 Instalar Vite, criar `vite.config.ts` e `main.tsx`
- [ ] TASK-2241 Validar build Vite com todos os componentes existentes
- [ ] TASK-2242 Remover CRA (`react-scripts`) após validação
- [ ] TASK-2250 Instalar Jotai, criar `state/atoms.ts` com `atomFamily`
- [ ] TASK-2251 Migrar state global do App.tsx para atoms
- [ ] TASK-2252 Migrar SectorModules para consumir atoms
- [ ] TASK-2260 Instalar `@tanstack/react-table`
- [ ] TASK-2261 Migrar tabelas de variáveis para TanStack Table com memo()

### Domínio E — Backend Tooling
- [ ] TASK-2270 Criar `pyproject.toml` + migrar dependências de `requirements.txt`
- [ ] TASK-2271 Inicializar Alembic, criar migration inicial do schema
- [ ] TASK-2272 Gerar `uv.lock`

### Domínio F — Testes Frontend
- [ ] TASK-2280 Instalar Vitest + `@testing-library/react`, criar `vitest.config.ts`
- [ ] TASK-2281 Criar testes smoke para componentes críticos
- [ ] TASK-2282 Instalar Playwright, criar `playwright.config.ts`
- [ ] TASK-2283 Criar teste E2E: carrega app → seleciona cenário → calcula → valida output

## ⚠️ Blockers / Open Issues
- Nenhum no momento.

## 🔗 Documentos Relacionados
- [SPEC.md](../../SPEC.md)
- [feat-022-architecture-modernization.md](feat-022-architecture-modernization.md)
- [task-master.md](task-master.md) — seção Épico 22
