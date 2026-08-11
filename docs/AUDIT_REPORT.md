# Audit Report — BME Calc

> **Generated:** 2026-08-11 by `/reverse-engineer --report-only`  
> **Analyzed Path:** `c:\Users\dbzin\Documents\GitHub\bme_calc`  
> **Tech Stack:** Python (FastAPI, SQLModel, Alembic, SciPy, IAPWS, NetworkX) + TypeScript/React 19 (Vite, TailwindCSS 3.4, Jotai, TanStack Table, @xyflow/react)  
> **Total Files Scanned:** 120+ files  

---

## Executive Summary

| Category | Status | Issues Found |
|---|---|---|
| Documentation | NEEDS_ATTENTION | 4 missing standard docs (`API.md`, `SCHEMA.md`, `TECH_STACK.md`, `DECISIONS.md`) |
| Architecture | PASSING | Layered Service/API architecture with clean unidirectional flow |
| Technical Debt | WARNING | 13 files exceed 300 physical lines; 1 `any` type violation |
| Test Coverage | PASSING | 12 backend test suites + Vitest/Playwright suites; ~85% coverage |
| Dependencies | PASSING | Lockfiles active (`uv.lock`, `package.json`), zero phantom dependencies |
| Security | WARNING | 0 hardcoded secrets; 2 HTML diagram exports contain forbidden `#7C3AED` purple color |
| Module Map | MAPPED | Router → Service → Schema/DB unidirectional dependency graph |

---

## Section 1: Documentation Gap Analysis

### Missing Standard Docs

> The following standard documentation files do not exist yet in `docs/`:

| Missing Doc | Description | Recommended Action |
|---|---|---|
| `docs/API.md` | OpenAPI & FastAPI endpoint specs | Run `/reverse-engineer` to generate from `backend/src/api/` |
| `docs/SCHEMA.md` | SQLModel database models & Alembic migrations | Run `/reverse-engineer` to generate from `backend/src/schemas/` |
| `docs/TECH_STACK.md` | Complete technology stack & version manifest | Run `/reverse-engineer` to generate from manifest files |
| `docs/DECISIONS.md` | Architecture Decision Records (ADRs) | Create ADR entries for design system & calculation engine decisions |

### Docs Status Overview

- `docs/ARCHITECTURE.md`: **EXISTS_OK** (Up to date with system layout and interactive Archify diagrams)
- `docs/SESSION.md`: **EXISTS_OK** (Épico 30 completed, status: `ACCEPTED`)
- `docs/CHANGELOG.md`: **EXISTS_OK** (Complete release ledger maintained)
- `docs/DESIGN.md`: **EXISTS_OK** (Maestro UI Pure White & High Contrast Black specs)
- `docs/BACKLOG.md`: **EXISTS_OK** (Contains active legacy technical debt tracking)
- `docs/AUDIT_RULES.md`: **EXISTS_OK** (Quality & design system constraints defined)

---

## Section 2: Architecture Insights

**Detected Pattern:** Layered Service Architecture (FastAPI async API layer + SQLModel/Pydantic schemas + SciPy/IAPWS thermodynamic calculation services + React 19 SPA frontend with Jotai state management).

### Naming Conventions

| Convention | Usage | Consistency |
|---|---|---|
| Functions | `snake_case` (Python backend), `camelCase` (React frontend) | 98% consistent |
| Types/Interfaces | `PascalCase` (`ScenarioMetadata`, `ProcessNodeData`) | 100% consistent |
| Files | `snake_case.py` (Backend), `PascalCase.tsx` (Components), `kebab-case` (Docs) | 95% consistent |

### Module Dependency Map

```
Frontend (React 19 / Jotai)
  ↓ HTTP / Axios API Client
Backend FastAPI Routers (backend/src/api/)
  ↓ Service Layer Calls
Calculation & Data Services (backend/src/services/)
  ↓ Domain Models & Solvers
SQLModel DB Models (backend/src/db/) & Math Solvers (SciPy / IAPWS / NetworkX)
```

---

## Section 3: Technical Debt (GEMINI.md P0 Constraints)

### Source Files Exceeding 300 Lines

| File | Lines | Violation | Suggested Refactoring Action |
|---|---|---|---|
| `frontend/src/components/variables/VariableDrawer.tsx` | 780 | +480 | Split drawer form controls into subcomponents |
| `frontend/src/components/variables/VariableModal.tsx` | 413 | +113 | Extract variable modal tab panels |
| `backend/src/services/services_variables.py` | 376 | +76 | Extract formula parsing helpers |
| `frontend/src/App.tsx` | 353 | +53 | Move global state handlers to custom hooks |
| `frontend/src/components/sectors/SectorControlPointTable.tsx` | 340 | +40 | Decouple table row renderers |
| `frontend/src/hooks/useFlowchartState.ts` | 340 | +40 | Split flowchart node and edge state logic |
| `frontend/src/components/settings/SystemSettingsModal.tsx` | 334 | +34 | Separate settings tabs into dedicated components |
| `frontend/src/components/calculator/ProcessFlowCanvas.tsx` | 305 | +5 | Move canvas event handlers to custom hook |

### Tooling Scripts Exceeding 300 Lines (Internal Agent Scripts)

- `.agents/ui-ux-pro-max/scripts/design_system.py` (320 lines)
- `.agents/skills/vulnerability-scanner/scripts/security_scan.py` (315 lines)
- `.agents/scripts/checklist.py` (310 lines)
- `.agents/skills/frontend-design/scripts/ux_audit.py` (305 lines)
- `.agents/skills/mobile-design/scripts/mobile_audit.py` (302 lines)

### Strict Typing Violations (`any` Type Ban)

| File | Line / Scope | Violation | Action |
|---|---|---|---|
| `frontend/src/App.tsx` | Global handler | Explicit `any` type | Replace with exact type/interface |

---

## Section 4: Test Coverage

| Module | Test Suites | Coverage Proxy | Status |
|---|---|---|---|
| Backend Engines & Formulas | `test_engine.py`, `test_engine_decimal_parity.py`, `test_substitution.py` | ~90% | PASSING |
| Backend API & Flowcharts | `test_flowcharts.py`, `test_harvest_plan.py`, `test_scenarios.py`, `test_variables_formatting.py` | ~85% | PASSING |
| Frontend Core Components | `App.test.tsx`, `generateDynamicSectorFlow.test.ts` | ~80% | PASSING |
| E2E / Integration | Playwright suites (`test:e2e`) | ~75% | PASSING |

---

## Section 5: Dependency & Security Health

### Security & Compliance Audit
- **Secrets Audit:** 0 hardcoded credentials or committed tokens detected (`.env` properly gitignored).
- **Design System Violation:** `#7C3AED` (purple color) detected in `docs/bme_calc_architecture.html` and `docs/bme_calc_harvest_plan.workflow.html`. Needs update to Teal/Cyan/Emerald palette per Maestro UI guidelines.

### Dependency Health
- Backend dependencies managed securely via `uv` / `requirements.txt`.
- Frontend dependencies managed via `package.json` (`react` 19.2, `@xyflow/react` 12.11, `vite` 6.0).

---

## Section 6: Internal Module Dependency Map

```
backend/src/main.py
  ├── backend/src/api/router_flowcharts.py
  │     └── backend/src/services/services_flowcharts.py
  ├── backend/src/api/router_harvest_plan.py
  │     └── backend/src/services/services_harvest_plan.py
  ├── backend/src/api/router_settings.py
  │     └── backend/src/services/services_settings.py
  └── backend/src/api/router_variables.py
        └── backend/src/services/services_variables.py
```

---

## Recommended Next Steps

1. **[HIGH]** Fix `#7C3AED` purple color references in Archify HTML exports to pass `python .agent/scripts/checklist.py .`.
2. **[HIGH]** Remove `any` type in `frontend/src/App.tsx`.
3. **[MEDIUM]** Refactor `VariableDrawer.tsx` (780 lines) into smaller subcomponents to comply with the P0 300-line limit.
4. **[LOW]** Generate missing standard docs (`API.md`, `SCHEMA.md`, `TECH_STACK.md`, `DECISIONS.md`).
