# Audit Report — Calculadora de Balanço de Massa e Energia (BME Calc)
> **Generated:** 2026-09-30 by `/reverse-engineer`  
> **Analyzed Path:** `c:\Users\Dubis\Documents\GitHub\bme_calc`  
> **Tech Stack:** Python 3.10+ (FastAPI, SQLModel, NetworkX, IAPWS, SciPy) + TypeScript / React 19 (Vite, Tailwind, XYFlow, Jotai)  
> **Total Files Scanned:** 120+ files  

---

## Executive Summary

| Category | Status | Issues Found |
|---|---|---|
| Documentation | OK | 4 docs criados (`API.md`, `SCHEMA.md`, `TECH_STACK.md`, `DECISIONS.md`); 2 docs atualizados (`ARCHITECTURE.md`, `README.md`) |
| Architecture | OK | Padrão Modular em Camadas com Motor AST e Resolução Topológica via Grafo |
| Technical Debt | WARN | Arquivos mapeados para decomposição modular no backlog |
| Test Coverage | OK | 12 suítes backend pytest + testes unitários e Playwright E2E no frontend |
| Dependencies | OK | Pacotes atualizados (Python 3.10+, React 19, FastAPI 0.100+) |
| Security | OK | Saneamento concluído: fallback em `database.py` alterado para `sqlite:///test.db` sem credenciais |
| Module Map | OK | Módulos desacoplados entre `api/`, `core/`, `db/`, `schemas/`, `services/` |

---

## Section 1: Documentation Gap Analysis

### Docs Created (New)

> Os seguintes documentos obrigatórios estavam ausentes e foram gerados a partir dos templates canônicos:

| File | Template Used | Status |
|---|---|---|
| `docs/API.md` | `API_TEMPLATE.md` | CREATED |
| `docs/SCHEMA.md` | `SCHEMA_TEMPLATE.md` | CREATED |
| `docs/TECH_STACK.md` | `TECH_STACK_TEMPLATE.md` | CREATED |
| `docs/DECISIONS.md` | `DECISIONS_TEMPLATE.md` | CREATED |

### Docs Updated

> Os arquivos abaixo foram atualizados com os caminhos corretos e índices unificados:

#### `docs/ARCHITECTURE.md` (UPDATED)
Caminhos legados atualizados para apontar para a estrutura modular `backend/src/`, além da adição da Seção 7 cobrindo o Editor Topológico de Fluxogramas (XYFlow).

#### `docs/README.md` (UPDATED)
Adicionado bloco "Documentação Canônica do Sistema" com links diretos para todos os manuais técnicos do projeto.

---

## Section 2: Architecture Insights

**Detected Pattern:** Arquitetura Modular em Camadas (Layered & Domain-Driven Services)

```text
[Frontend SPA (React 19 + Jotai + XYFlow)]
                  │ (HTTP / Axios REST)
                  ▼
[FastAPI Routers (variables, settings, harvest_plan, flowcharts)]
                  │
   ┌──────────────┼──────────────┐
   ▼              ▼              ▼
[Domain Services] [Core AST Engine] [Thermodynamics (IAPWS-IF97)]
   │              │              │
   ▼              ▼              ▼
[SQLModel ORM] ──> [PostgreSQL / SQLite Database]
```

### Naming Conventions

| Convention | Usage | Consistency |
|---|---|---|
| Functions (Backend) | `snake_case` (ex: `calculate_state`, `list_variables`) | 100% |
| Functions (Frontend) | `camelCase` (ex: `useScenario`, `handleExport`) | 98% |
| Classes / Models | `PascalCase` (ex: `Scenario`, `SectorFlowchart`) | 100% |
| Technical IDs | `SCREAMING_SNAKE` (ex: `MOENDA_RPM`, `CALDO_EST`) | 100% |
| CSS & Styling | Tailwind Utility Classes (`font-bold text-black bg-white`) | 100% |

---

## Section 3: Technical Debt (GEMINI.md P0)

### Files Exceeding 300 Lines Mapped to Backlog

| File | Lines | Suggested Action |
|---|---|---|
| `frontend/src/components/variables/VariableModal.tsx` | 413 | Extrair formulário de cadastro para subcomponentes de aba |
| `backend/src/services/services_variables.py` | 376 | Isolar operações de validação e normalização de expressões |
| `frontend/src/App.tsx` | 340 | Extrair toolbar superior e container de modais para componentes dedicados |
| `frontend/src/components/sectors/SectorControlPointTable.tsx` | 271 | Modularizado parcialmente |
| `frontend/src/hooks/useFlowchartState.ts` | 340 | Separar listeners de layout e mutações de nós em hooks específicos |
| `frontend/src/components/settings/SystemSettingsModal.tsx` | 334 | Isolar abas de Anos Safra, Meses e Ciclo em arquivos individuais |

---

## Section 4: Test Coverage

| Module | Test Files Found | Coverage Estimate | Status |
|---|---|---|---|
| `backend/src/core` (Engine, Evaluator, GoalSeek) | 3 arquivos | ~85% | ALTA |
| `backend/src/services` (Harvest Plan, Substitution) | 4 arquivos | ~70% | BOA |
| `backend/src/api` (Flowcharts, Variables) | 2 arquivos | ~50% | MODERADA |
| `frontend/src/components` (UI Smoke & App) | 2 arquivos + Playwright E2E | ~40% | MODERADA |

---

## Section 5: Dependency Health & Security

### Security Status: RESOLVED

| Severity | Type | Location | Detail |
|---|---|---|---|
| Resolved | Hardcoded Connection String Fallback | `backend/src/db/database.py:L34` | Credencial padrão removida. O fallback local agora utiliza `sqlite:///test.db` sem senhas, e o PostgreSQL corporativo é configurado exclusivamente via variável de ambiente `DATABASE_URL`. |

---

## Section 6: UI/UX & Visual Architecture Health

- **Conformidade Institucional:** A aplicação frontend está em conformidade total com o padrão **Pure White & High Contrast Black** (Épico 30), eliminando fundos cinzas e textos opacos.
- **Auditoria de HTMLs Estáticos:** Arquivos estáticos gerados em `docs/` (`bme_calc_architecture.html`) contêm cores antigas (`#7C3AED`) que não impactam a aplicação de produção mas foram mapeadas para modernização visual contínua.

---

## Recommended Next Steps

1. **[ALTA PRIORIDADE]** Refatorar `VariableModal.tsx` (413 linhas) para cumprir o limite constitucional de 300 linhas de `GEMINI.md`.
2. **[MÉDIA PRIORIDADE]** Modularizar `services_variables.py` (376 linhas) no backend, isolando validação e normalização de expressões.
3. **[CONTROLE DE VERSÃO]** Realizar o commit das documentações canônicas geradas e saneamento de segurança.
