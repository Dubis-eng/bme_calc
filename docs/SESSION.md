---
id: EPIC-22
title: Modernização Arquitetural — Sessão Ativa
status: in-progress
branch: feature/architecture-improvements
last_updated: 2026-07-16
current_task: 22.D.7 — Instalar e integrar @tanstack/react-table
---

# SESSION — Épico 22: Modernização Arquitetural

## 📍 Estado Atual
- **Branch ativa:** `feature/architecture-improvements`
- **Fase:** Jotai State Migration Concluída → Executando TanStack Table
- **Próxima tarefa:** TASK-2260 (Instalar @tanstack/react-table)

## 🏁 Última Tarefa Concluída
- Épico 22 — Domínio D (Jotai State Migration)
- Branch: `task/22.D.5-migrate-app-atoms`

## 📋 Progresso do Épico 22

### Domínio 0 — Reestruturação de Diretórios
- [x] TASK-2201 Backend: criar estrutura `src/`, mover arquivos por categoria
- [x] TASK-2202 Backend: mover testes para `tests/`, scripts para `scripts/`, dados para `data/`
- [x] TASK-2203 Frontend: criar subpastas de componentes por domínio
- [x] TASK-2204 Frontend: criar pastas `state/`, `api/`, `hooks/`, `styles/`
- [x] TASK-2205 Atualizar todos os imports após movimentação
- [x] TASK-2206 Atualizar docker-compose.yml e Dockerfile para nova estrutura
- [x] TASK-2207 Atualizar README.md e docs/ARCHITECTURE.md

### Domínio A — Design System
- [x] TASK-2210 Atualizar `index.css` com paleta Studio Dark + tabular numbers
- [x] TASK-2211 Atualizar `tailwind.config.js` com tokens HSL
- [x] TASK-2212 Criar `docs/DESIGN.md` com sistema de design documentado
- [x] TASK-2213 Aplicar `studio-surface`, `glow-primary`, row highlight nos componentes
- [x] TASK-2214 Diferenciar visualmente INPUT/OUTPUT/CONSTANT

### Domínio B — Segurança CORS
- [x] TASK-2220 Substituir `allow_origins=["*"]` por env var `ALLOWED_ORIGINS`
- [x] TASK-2221 Atualizar `.env.sample`, `docker-compose.yml` e docs

### Domínio C — Engine Decimal
- [x] TASK-2230 Criar `test_engine_decimal_parity.py` (testes de paridade float vs Decimal)
- [x] TASK-2231 Migrar `engine.py` para `Decimal` (pós-paridade aprovada)
- [x] TASK-2232 Adaptar `goalseek.py` (interface float↔Decimal)
- [x] TASK-2233 Re-executar todos os testes de backend

### Domínio D — Frontend Stack
- [x] TASK-2240 Instalar Vite, criar `vite.config.ts` e `main.tsx`
- [x] TASK-2241 Validar build Vite com todos os componentes existentes
- [x] TASK-2242 Remover CRA (`react-scripts`) após validação
- [x] TASK-2250 Instalar Jotai, criar `state/atoms.ts` com `atomFamily`
- [x] TASK-2251 Migrar state global do App.tsx para atoms
- [x] TASK-2252 Migrar SectorModules para consumir atoms
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
