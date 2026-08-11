---
name: context-manager
description: Manages two separate doc contexts - {PROJECT_ROOT}/docs/ (project documentation) and .agent/docs/ (AI system docs). Use at session start to load context, and when onboarding a new codebase. See rules/project-docs.md for the full protocol.
allowed-tools: Read, Write, Find
---

# Context Manager Skill

> **MANDATORY:** Use this skill to create the `.agent` "Brain" folder in any target repository.

## 🎯 Purpose

This skill ensures every project has a standardized `.agent/docs/` directory. This directory acts as the "Long Term Memory" and "Map" for any AI agent entering the project, preventing the "blind" coding problem.

## Two Doc Contexts (NEVER mix them)

| Context | Location | Purpose |
|---|---|---|
| **Project Docs** | `{PROJECT_ROOT}/docs/` | Architecture, changelog, schema, session continuity |
| **AI System Docs** | `.agent/docs/` | Kit architecture, lessons learned (this toolkit only) |

### Project `docs/` Standard Structure

```
{PROJECT_ROOT}/
  docs/
    ├── ARCHITECTURE.md   # System architecture, flows, tech decisions
    ├── CHANGELOG.md      # Feature history (Keep-a-Changelog format)
    ├── SESSION.md        # Session continuity — where we stopped
    ├── TECH_STACK.md     # Languages, frameworks, versions (if applicable)
    ├── SCHEMA.md         # DB schema, models, enums (if applicable)
    ├── API.md            # Endpoint catalog (if applicable)
    └── DECISIONS.md      # Architecture Decision Records (if applicable)
```

**Minimum required:** `ARCHITECTURE.md` + `CHANGELOG.md` + `SESSION.md`

## Workflows

### 1. Session Start (EVERY session)

> Full protocol: `.agent/rules/project-docs.md` → Section "Protocol: Session Start"

1. Check if `docs/` exists in the project root.
2. **If exists:** Read `SESSION.md` → `ARCHITECTURE.md` → last 5 entries of `CHANGELOG.md`.
3. **If missing:** Announce and ask user permission to create it.
4. Announce context loaded: `"📂 Context loaded from docs/"`

### 2. Initialization (docs/ missing, user confirmed creation)

1. Scan 100% of project (package.json, requirements.txt, configs, folder structure, existing code).
2. Identify tech stack, key modules, DB schema, API routes, auth patterns.
3. Create each applicable file using Standard Structure above.
4. Populate `SESSION.md` with onboarding state.
5. Confirm to user: `"✅ docs/ criado com [N] arquivos."`

### 2b. Brownfield Detection (existing code, no docs/)

If the project has source files (`src/`, `app/`, `lib/`, etc.) but `docs/` is absent:
- Announce: `"📦 Brownfield project detected — source code exists but docs/ is empty."`
- **Do NOT** generate blank template files — the codebase needs reverse-engineered docs, not guesses.
- Propose: `"Run /reverse-engineer to auto-generate all docs from your existing codebase."`
- Wait for user to confirm before proceeding with any doc creation.

### 3. Maintenance (During Development)

After any significant change:

1. Update `ARCHITECTURE.md` if system structure changed.
2. Update `SCHEMA.md` if DB changed.
3. Update `API.md` if endpoints changed.
4. Log the change in `CHANGELOG.md`.
5. Update `SESSION.md` status and next steps.

## 🤖 Assistant Announcement

```
📂 Context loaded from docs/
  └ SESSION.md   → Last task: [slug], Status: [status]
  └ ARCHITECTURE.md → [tech stack summary]
  └ CHANGELOG.md → Last change: [date]
```
