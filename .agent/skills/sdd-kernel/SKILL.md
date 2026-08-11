---
name: sdd-kernel
description: SDD state machine — manages project.state.json, enforces phase gates, controls HITL checkpoints, and triggers auto-documentation. Use when starting any new project or feature to ensure no phase is skipped.
allowed-tools: Read, Write, Glob
---

# SDD Kernel — State Machine

> **Core Principle:** No phase is skipped. No code before approval. Every decision leaves a trail.

---

## 📊 Phase Definitions

| Phase | Name | Produces | Code? |
|---|---|---|---|
| 1 | **SPECIFY** | `SPEC.md` + `constitution.md` | ❌ |
| 2 | **PLAN** | `plan.md` + tech decisions | ❌ |
| 3 | **TASK** | `tasks.md` + agent assignments | ❌ |
| 4 | **IMPLEMENT** | Working code | ✅ |
| X | **DELIVER** | `.agent/docs/` + updated CHANGELOG | ✅ |

---

## 🔴 Phase Gate Protocol (HARD BLOCK)

**Before advancing phase, ALL conditions must be met:**

```
CHECK: current phase artifact exists?     → If NO: STOP, generate artifact first
CHECK: HITL review file created?          → If NO: STOP, generate hitl-review-{phase}.md
CHECK: User said "De acordo" or "proceed" → If NO: WAIT, do not advance
```

> 🔴 **VIOLATION:** Advancing phase without explicit user approval = FAILED.
> ✅ **AUTO-ADVANCE:** Once user approval is given, automatically advance to the next phase without waiting for another command.

---

## 🔒 Phase Lock Protocol

**When `project.state.json` shows an active phase:**

1. **Read current phase** from state file
2. **Only allow these agents during each phase:**

| Phase      | Allowed Agents                              |
|------------|---------------------------------------------|
| SPECIFY    | sdd-conductor, business-analyst             |
| PLAN       | project-planner, explorer-agent             |
| TASK       | project-planner                             |
| IMPLEMENT  | orchestrator, any specialist agents        |

3. **BLOCK all other auto-invocations** from intelligent-routing
4. **Reject with clear message:**

```
🔒 **Phase Lock Active**

Current Phase: SPECIFY
Allowed: sdd-conductor, business-analyst
❌ Auto-invocation blocked until HITL approval.

→ Complete current phase first, then proceed to next.
```

> 🔴 **During active SDD phase:** intelligent-routing MUST NOT auto-invoke orchestrator or other agents.

---

## 🗺️ State File Management

**File:** `project.state.json` in project root

### Read State
```
1. Read project.state.json
2. If does not exist → project is NEW → start SPECIFY phase
3. If exists → read current phase and route accordingly
```

### Update State (after HITL approval)
```
1. Read current project.state.json
2. Update phase status to "approved"
3. Set next phase status to "active"
4. Write back to project.state.json
```

---

## 📊 Progress Bar Format

**Include in EVERY response during SDD flow:**

```
📍 SDD Progress: [✅ Specify] → [✅ Plan] → [🔄 Task] → [⬜ Implement]
```

| Status | Icon | Meaning |
|---|---|---|
| Locked | ⬜ | Not yet unlocked |
| Active | 🔄 | Current phase |
| Approved | ✅ | HITL approved |
| Blocked | 🚫 | Failed gate check |

---

## 🛑 HITL Checkpoint Protocol

**At the end of each phase, generate TWO outputs:**

### Output 1 — Chat Summary (Portuguese, for the user)
```markdown
## ✋ Portão de Aprovação — Fase [NOME]

📍 SDD Progress: [✅/🔄/⬜ icons]

**O que foi decidido nesta fase:**
1. [Decisão 1]
2. [Decisão 2]
...até 10 pontos

**Riscos identificados:**
- [Risco 1]

**O que acontece a seguir:**
- [Próxima fase e o que será feito]

👉 **Para avançar, responda: "De acordo"**
```

### Output 2 — HITL Review File (English, for AI context)
Save as `hitl-review-{phase}.md` in project root.
Use template: `sdd-kernel/templates/hitl-review.md`

---

## 🏁 Post-Implement: Auto-Documentation

**Triggered automatically when IMPLEMENT phase completes for a NEW project:**

```
1. Invoke context-manager skill
2. Generate .agent/docs/PROJECT_ARCHITECTURE.md
3. Generate .agent/docs/CODE_MAP.md
4. Generate .agent/docs/SYSTEM_ROLES.md
5. Create .agent/docs/CHANGELOG.md with v1.0.0 entry
6. Update project.state.json → phase: "DELIVERED"
```

**For EXISTING projects:** Run `/doc-update` workflow instead.

---

## 🔀 Project Type Detection

**Read at the START of every /specify invocation:**

| Signal | Project Type | Flow |
|---|---|---|
| No `project.state.json` | NEW | Full SDD cycle, Modo A interview |
| `project.state.json` exists, phase ≠ DELIVERED | IN PROGRESS | Resume from current phase |
| `project.state.json` exists, phase = DELIVERED | EXISTING | Git branch FIRST, then Modo B interview |
| `.agent/docs/` exists but no `project.state.json` | EXISTING | Git branch FIRST, then Modo B interview |

---

## Anti-Patterns

| ❌ Wrong | ✅ Correct |
|---|---|
| Skipping Specify because requirements "seem clear" | Always run the interview |
| Advancing to IMPLEMENT after verbal approval | Write hitl-review.md and confirm |
| Generating code during PLAN or TASK phase | Only artifacts — no code files |
| Forgetting progress bar in responses | Include it in every SDD response |
