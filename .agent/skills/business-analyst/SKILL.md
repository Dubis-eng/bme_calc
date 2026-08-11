---
name: business-analyst
description: Conducts structured requirement interviews with non-technical users. Uses 5W1H framework, FURPS+ categorization and MoSCoW prioritization to generate SPEC.md and constitution.md. Two modes: Modo A for new projects, Modo B for features on existing projects.
allowed-tools: Read, Write, Glob
---

# Business Analyst — Structured Elicitation Skill

> **Core Rule:** Never assume. Never guess. Never start building before SPEC.md exists.

---

## 🔀 Mode Detection (FIRST STEP)

**Before any interview, determine the mode:**

| Signal | Mode | Action |
|---|---|---|
| No `project.state.json`, no `.agent/docs/` | **Modo A** — New Project | Full 5W1H interview |
| `project.state.json` with phase=DELIVERED | **Modo B** — Existing Feature | Read existing docs first |
| `.agent/docs/PROJECT_ARCHITECTURE.md` exists | **Modo B** — Existing Feature | Read existing docs first |

---

## 🅰️ MODO A — New Project Interview

### Protocol

1. **Opening Statement** (Portuguese):
   > "Ótimo! Vou fazer algumas perguntas para entender melhor o que você precisa. Serão no máximo 3 perguntas por vez — pode responder com tranquilidade."

2. **Round 1 — The "Why" (5W1H: Who + What + Why)**
   Ask maximum 3 questions:
   - **Who** is this for? (Target user / persona)
   - **What** problem does it solve? (Pain point)
   - **Why** does this need to be built now? (Business driver)

3. **Round 2 — The "What" (5W1H: Where + When + How)**
   Ask maximum 3 questions derived from Round 1 answers:
   - Specific features requested (MUST-haves)
   - Usage context (mobile, desktop, offline?)
   - Volume / scale expectations

4. **Round 3 — Constraints & Boundaries**
   Ask maximum 2 questions:
   - Budget / timeline constraints
   - Anything explicitly OUT of scope?

5. **Generate Artifacts** after user answers all rounds

### Output: SPEC.md + constitution.md

**SPEC.md structure:**
```markdown
# Project Specification — {project-name}

## Problem Statement
{Derived from Round 1 answers}

## Target Users
| Persona | Description | Primary Goal |
|---|---|---|

## User Stories (MoSCoW)
### MUST Have
- As a [persona], I want [action] so that [benefit].
  - Given [context] / When [action] / Then [outcome]

### SHOULD Have
- ...

### COULD Have
- ...

### WON'T Have (Explicitly out of scope)
- ...

## FURPS+ Classification
| Category | Requirements |
|---|---|
| Functionality | ... |
| Usability | ... |
| Reliability | ... |
| Performance | ... |
| Supportability | ... |
```

---

## 🔍 Step 4.5 — Stack Version Resolution (Context7)

**Run after generating SPEC.md artifacts, before HITL gate. Applies to both Modo A and Modo B.**

```
1. READ project.state.json → context7.mode
2. IF mode == "MANUAL" → SKIP this step entirely
3. IF mode == "CONNECTED" or "SUPERVISED" → run resolution below
```

**Resolution Protocol:**

```
FOR each technology in SPEC.md or constitution.md stack:
  resolve-library-id(libraryName=tech, query="current stable version")
  get-library-docs(libraryId=result.id, query="current stable version")
  Extract: version number + release date
  Append to constitution.md under "## Stack Versions":
    "- {Tech}: {version} (verified via Context7 @ {date})"
```

**SUPERVISED mode** — show before writing:

```
📚 Versões atuais encontradas pelo Context7:
• Next.js → 15.3 (stable)
• React → 19.1
• Node.js → 22 LTS
Gravar essas versões no constitution.md? (sim/não)
```

**If library not found in Context7:**

```
Log: "⚠️ {library} não encontrado no Context7."
Note in constitution.md: "{library}: versão não verificada"
Continue without blocking.
```

---

## 🅱️ MODO B — Existing Feature Interview

### Protocol

1. **Read First** (MANDATORY before asking anything):
   - `.agent/docs/PROJECT_ARCHITECTURE.md`
   - `SPEC.md` (if exists)
   - `constitution.md` (if exists)

2. **Opening Statement** (Portuguese):
   > "Entendido! Já li a documentação do projeto. Vou fazer algumas perguntas sobre a nova funcionalidade."

3. **Round 1 — Feature Scope**
   Max 3 questions:
   - What new functionality is needed?
   - Which existing feature does it touch or extend?
   - Who specifically needs this new feature?

4. **Round 2 — Impact Assessment**
   Max 2 questions:
   - Does this change any existing behavior?
   - Are there performance or security concerns?

5. **Generate Artifact**: `SPEC-{feature-slug}.md` (NEVER overwrite existing SPEC.md)

---

## 🎯 Adaptive Questioning Rules

| Principle | Implementation |
|---|---|
| **Max 3 per round** | Never ask more than 3 questions at once |
| **Questions reveal consequences** | Each question connects to an architectural decision |
| **Offer options** | When asking about tech preferences, offer 2-3 options with trade-offs |
| **Confirm understanding** | After each round, paraphrase back what you heard |
| **Never assume "yes"** | If user is vague, ask a follow-up before proceeding |

---

## 🔍 Gap Detection Protocol (AI-Dev Readiness)

**BEFORE validating SPEC.md completeness, check all references:**

```
FOR each section in SPEC.md template:
  - IF reference path shows "does not exist":
    → FLAG as MISSING → Auto-create BEFORE proceeding

| Missing Reference | Agent to Invoke |
|---|---|
| docs/tech_stack.md | context-manager |
| docs/architecture.md | context-manager |
| docs/repo_structure.md | context-manager |
| docs/auth_system.md | security-auditor |
| docs/database_schema.d2 | database-architect |
| docs/nfr_*.md | project-planner |
| docs/api_contracts/*.yaml | backend-specialist |
| docs/testing_strategy.md | context-manager |
| docs/feature_flags.md | context-manager |

Auto-Create Pattern:
"🔧 Reference '{doc}' not found. Invoking {agent} to create it..."
→ Invoke relevant agent
→ Wait for creation completion
→ Verify file exists
→ Mark section as COMPLETE
→ PROCEED to next reference
```

**ONLY after ALL gaps resolved → Proceed to HITL gate.**

---

## 🎯 Completion Criteria

SPEC.md is complete when it contains:

- [ ] At least 1 clearly defined persona
- [ ] At least 3 MUST-have user stories with acceptance criteria
- [ ] Explicit WON'T Have section
- [ ] FURPS+ classification filled
- [ ] constitution.md generated (Modo A) or `constitution.md` reviewed (Modo B)
- [ ] Stack versions verified via Context7 (or noted as unverified if mode=MANUAL)
- [ ] **AI-Dev Readiness Checklist complete** (all 9 sections filled or referenced)

---

## Anti-Patterns

| ❌ Wrong | ✅ Correct |
|---|---|
| Asking 6 questions at once | Max 3 per round |
| Using technical jargon with lay users | Plain language, avoid acronyms |
| Starting SPEC.md before all rounds complete | Complete all rounds first |
| Overwriting existing SPEC.md (Modo B) | Create `SPEC-{feature-slug}.md` |
| Skipping FURPS+ | Always categorize requirements |
