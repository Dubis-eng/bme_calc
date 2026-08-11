---
name: reverse-engineering
description: Performs automated reverse engineering on existing codebases. Scans project structure, detects tech stack, generates missing documentation (ARCHITECTURE, API, SCHEMA, DESIGN, etc.), and produces an AUDIT_REPORT.md with diff-based update suggestions. Use when the user types /reverse-engineer or when onboarding an existing project with missing docs.
---

# Reverse Engineering Skill

## When to Use This Skill

- User types `/reverse-engineer` in the chat
- Agent detects that `docs/` folder is missing or incomplete in an existing project
- User says "analyze this project", "generate docs", "what does this codebase do?"
- After cloning a legacy or third-party repository for the first time

---

## Workflow (4 Phases)

```
[/reverse-engineer]
  PHASE 1: Discovery      → Map the project
  PHASE 2: Gap Analysis   → Check what docs exist vs. what's needed
  PHASE 3: Intelligence   → Extract insights (arch, debt, security, tests)
  PHASE 4: Generation     → Create missing docs + AUDIT_REPORT.md
```

---

## PHASE 1: Discovery

**Goal:** Build a complete map of the project before writing anything.

### Step 1.1 — Detect Tech Stack

Read `scripts/scan_helpers.md` for full ecosystem rules. Quick reference:

| Manifest File | Ecosystem |
|---|---|
| `package.json` | Node.js / TypeScript |
| `requirements.txt` / `pyproject.toml` | Python |
| `pom.xml` / `build.gradle` | Java / Kotlin |
| `*.csproj` | .NET / C# |
| `go.mod` | Go |
| `Gemfile` | Ruby |

### Step 1.2 — Map Entry Points

Search for: `index.*`, `main.*`, `app.*`, `server.*`, `Program.*`, `manage.py`

### Step 1.3 — Catalog Key Artifacts

Scan and list:
- **Routes/Controllers:** Apply ecosystem patterns from `scan_helpers.md` Section 2-6
- **Models/Entities:** ORM files, schema files, migration directories
- **Components:** `src/components/`, `src/views/`, `src/pages/`
- **Config files:** `.env.example`, `tsconfig.json`, `Dockerfile`, CI configs
- **Test files:** Apply patterns from `scan_helpers.md` Section 7

### Step 1.4 — Read Git History

```bash
git log --oneline -20
git tag --list
git shortlog -sn --no-merges
```

---

## PHASE 2: Gap Analysis

**Goal:** Determine which of the 9 standard docs exist and which need creation or update.

### Checklist — 9 Standard Docs

For each doc, determine status: `MISSING` | `EXISTS_OUTDATED` | `EXISTS_OK`

| Doc File | Status | Action |
|---|---|---|
| `docs/ARCHITECTURE.md` | ? | CREATE / UPDATE / SKIP |
| `docs/SESSION.md` | ? | CREATE / UPDATE / SKIP |
| `docs/CHANGELOG.md` | ? | CREATE / UPDATE / SKIP |
| `docs/API.md` | ? | CREATE / UPDATE / SKIP (if API routes detected) |
| `docs/SCHEMA.md` | ? | CREATE / UPDATE / SKIP (if DB models detected) |
| `docs/TECH_STACK.md` | ? | CREATE / UPDATE / SKIP |
| `docs/DESIGN.md` | ? | CREATE / UPDATE / SKIP (if UI detected) |
| `docs/BACKLOG.md` | ? | CREATE / UPDATE / SKIP |
| `docs/DECISIONS.md` | ? | CREATE / UPDATE / SKIP |

### How to Detect "Outdated"

A doc is `EXISTS_OUTDATED` when any of these are true:
- A framework/library appears in code but not in the doc
- An endpoint is in code but not in `API.md`
- A model field exists in the schema but not in `SCHEMA.md`
- The doc's "Last updated" date is more than 30 days old

---

## PHASE 3: Intelligence Layer

**Goal:** Extract 7 categories of insights for the AUDIT_REPORT.md.

### 3.1 Naming Conventions

Scan function names, variable names, and file names. Detect:
- Dominant pattern (camelCase / snake_case / PascalCase / kebab-case)
- Inconsistencies: functions using wrong convention for the ecosystem
- See `scan_helpers.md` Section 9 for reference table

### 3.2 Architectural Patterns

Detect folder structure patterns:
- `controllers/` + `models/` + `views/` → MVC
- `domain/` + `application/` + `infrastructure/` → Clean Architecture
- `ports/` + `adapters/` → Hexagonal
- Flat structure → Layered or Monolithic

Document the detected pattern in ARCHITECTURE.md.

### 3.3 Technical Debt (GEMINI.md P0 Rules)

Apply thresholds from `scan_helpers.md` Section 10:
- **Files > 300 lines:** List file, line count, and split suggestion
- **Functions > 40 lines:** List file, function name, line count
- **Nesting > 3 levels:** Detect via indentation depth (> 12 spaces for 4-space indent)

### 3.4 Test Coverage

Check for test directories and files (patterns in `scan_helpers.md` Section 7):
- **Coverage estimate:** (test files / source files) × 100 — rough proxy
- **Untested modules:** Source directories with zero matching test files

### 3.5 Dependency Health

Run the appropriate command based on ecosystem:

| Ecosystem | Command |
|---|---|
| Node.js | `npm outdated` or `yarn outdated` |
| Python | `pip list --outdated` |
| Java | `mvn versions:display-dependency-updates` |
| .NET | `dotnet list package --outdated` |
| Go | `go list -u -m all` |

### 3.6 Security Vulnerabilities

Delegate deep analysis to `security-sentinel` skill. Perform basic checks:
- Grep for hardcoded secrets (patterns in `scan_helpers.md` Section 8)
- Check if `.env` is committed (not in `.gitignore`)
- Check for exposed private keys (`*.pem`, `*.key`, `id_rsa`)
- Report location ONLY — never display secret values. Use `[REDACTED]`.

### 3.7 Internal Module Dependency Map

Trace import statements to build a dependency graph:
- Entry point → modules it imports → modules those import
- Flag circular dependencies (A imports B, B imports A)
- Render as ASCII diagram in the report

---

## PHASE 4: Generation

**Goal:** Create missing docs and produce the AUDIT_REPORT.md.

### Step 4.1 — Create Missing Docs

For each `MISSING` doc in the Phase 2 checklist:
1. Load the matching template from `resources/DOC_TEMPLATES/`
2. Fill ALL `{{PLACEHOLDER}}` fields with data from Phase 1 and 3
3. Write to `docs/{{DOC_NAME}}.md`
4. Log: `CREATED: docs/{{DOC_NAME}}.md`

### Step 4.2 — Produce Diff Suggestions for Outdated Docs

For each `EXISTS_OUTDATED` doc:
1. Read the current file content
2. Identify specific lines that are wrong or missing
3. Generate diff blocks (do NOT overwrite the file):

```diff
- [old content detected in file]
+ [correct content based on current code]
```

4. Include the diff in Section 1 of AUDIT_REPORT.md

### Step 4.3 — Generate AUDIT_REPORT.md

Use `resources/AUDIT_REPORT_TEMPLATE.md` as the base. Populate all sections with
findings from Phases 1-3. Key rules:
- Secrets → always write `[REDACTED]`, never the actual value
- Diffs → use fenced diff blocks only, never overwrite source docs
- Prioritize issues: Critical → High → Medium → Low

### Step 4.4 — Announce Results

```
Reverse Engineering Complete!

  Docs created:   N files
  Docs to update: M files (see docs/AUDIT_REPORT.md)

  Architecture:   {{DETECTED_PATTERN}}
  Tech debt:      {{DEBT_ISSUE_COUNT}} issues
  Security:       {{SEC_ISSUE_COUNT}} findings
  Coverage est.:  {{COVERAGE}}%

  Full report: docs/AUDIT_REPORT.md
```

---

## Integrations

| Skill | When to Invoke |
|---|---|
| `security-sentinel` | Phase 3.6 — delegate deep vulnerability analysis |
| `context-manager` | After generation — update SESSION.md and docs/README.md |
| `clean-code` | Phase 3.3 — validate GEMINI.md P0 thresholds |
| `architecture` | Phase 3.2 — validate and name the detected pattern |

---

## Critical Rules

- **Read-only on source code:** This skill NEVER modifies `.ts`, `.py`, `.java`, or any code file.
- **Docs only:** All writes go to `docs/` directory exclusively.
- **No secret exposure:** Any detected secret must be `[REDACTED]` in the report.
- **Diff over overwrite:** Existing docs get diff suggestions, not silent replacement.
- **Template-first:** Always use `resources/DOC_TEMPLATES/` — never write docs from scratch.

## Resources

- `scripts/scan_helpers.md` — Ecosystem detection heuristics (Sections 1-10)
- `resources/DOC_TEMPLATES/` — 9 documentation templates with `{{PLACEHOLDER}}` syntax
- `resources/AUDIT_REPORT_TEMPLATE.md` — Full audit report template (7 sections)
