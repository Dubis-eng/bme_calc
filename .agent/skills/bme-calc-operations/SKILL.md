---
name: bme-calc-operations
description: >
  Golden paths and operational patterns for BME Calc (Mass & Energy Balance Calculator),
  Harvest Plan (Plano de Safra) data structures, scenario status persistence, parameter typing,
  and Docker container verification workflows. Use this skill when working on BME Calc
  scenario lifecycle, harvest plan integration, or backend API parameter contracts.
license: MIT
metadata:
  author: Antigravity
  version: "1.0"
---

# BME Calc Operations & Harvest Plan Integration

Proven operational procedures, API contract rules, and architectural patterns for BME Calc (Balanço de Massa e Energia) and Plano de Safra.

**Failure pattern:** Unpersisted scenario status changes, 422 API errors on string/int `year_harvest` formats (`2026/2027`), locked Safra/Mês dropdowns on approved scenarios, un-guarded `.map()` on props, and raw `axios` network errors during container restarts.
**Verified by:** Master checklist script (`python .agent/scripts/checklist.py .`) passing 7/7 core checks and Docker build (`docker compose up -d --build`).

## When to use this

- When working on BME Calc scenarios (creating, approving, marking final, or updating status).
- When modifying Plano de Safra (Harvest Plan) endpoints or UI components.
- When configuring API calls or handling network error fallbacks in frontend hooks.
- When verifying code density (300 physical lines limit per file) and architecture rules.

## Core Architectural Rules & Procedures

- [ ] 1. **Scenario Status Persistence**:
  - Always call `apiClient.patch('/api/scenarios/:id/status', { status })` immediately in `handleStatusChange` to persist status changes ("Em Edição", "Aprovado", "Final") in PostgreSQL/SQLite.
  - In backend `update_existing_scenario`, ensure `db_scenario.status = req.status` is applied if `req.status` is provided.

- [ ] 2. **Harvest Year Parameter Types (`year_harvest`)**:
  - `year_harvest` parameters in FastAPI endpoints MUST be typed as `year_harvest: str` (not `int`) to accept formats like `"2026/2027"` or `"2026"`.
  - Use `parse_year(year_harvest)` from `src.db.database` to extract integer year numbers safely in backend services.
  - In frontend, encode the parameter using `encodeURIComponent(selectedYear)`.

- [ ] 3. **Unlocked Safra and Month Selectors**:
  - The Safra and Mês de Referência dropdown selectors in `CalculatorTopBar.tsx` MUST remain enabled (`disabled={isOffline}`) even when a scenario is approved or final (`isLocked === true`), allowing users to switch months/safras and save new scenarios.

- [ ] 4. **API Client Standard**:
  - NEVER use raw `axios.get('http://localhost:8000/...')`. Always import and use `apiClient` from `./api/client` or `../api/client`.
  - Configure `apiClient` timeout (30s) and add graceful `.catch(() => ({ data: [] }))` fallbacks in custom hooks (`useScenarioIO.ts`, `useHarvestPlanState.ts`) to handle server restarts gracefully.

- [ ] 5. **Defensive Prop Destructuring**:
  - Components accepting lists/maps (such as `sectors`, `variables`, `results`) MUST specify default parameter fallbacks (e.g. `{ sectors = [], variables = [] }`) and use guarded expressions `(sectors || []).map(...)` to prevent `TypeError: Cannot read properties of undefined (reading 'map')`.

- [ ] 6. **Pre-commit Quality Verification**:
  - Always run `python .agent/scripts/checklist.py .` before claiming completion.
  - Always rebuild and test Docker containers via `docker compose up -d --build`.

## Gotchas

- **File Physical Line Limit (P0)**: Keep code files strictly under 300 physical lines. If edits expand `App.tsx` beyond 300 lines, compact JSX attributes or extract helper hooks immediately.
- **Strict Typing**: The use of `any` type is strictly forbidden by the Anti-Bypass Protocol (8.1). Use exact TypeScript interfaces (e.g., `Variable[]` instead of `any[]`).

## What didn't work

- **Relying solely on `update_existing_scenario` `PUT` to save scenario status**: Failed because `PUT` did not set `db_scenario.status` from `req.status` and blocked edits when status was already approved.
- **Parsing `selectedYear.split('/')[0]` as `int` in frontend**: Passed an integer query parameter to `/api/harvest-plan/selections` which caused 422 errors when string safra representations were used.
