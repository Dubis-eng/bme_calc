---
name: context7-lookup
description: Context7 MCP documentation lookup protocol. Resolves current library versions and fetches up-to-date API docs. Reads mode from project.state.json and acts accordingly (CONNECTED, SUPERVISED, MANUAL). Use when verifying tech stack versions or fetching library-specific patterns.
tools: mcp__context7__resolve-library-id, mcp__context7__get-library-docs
skills: sdd-kernel
---

# Context7 Lookup — Documentation Resolution Protocol

> **Contract:** Always read `project.state.json → context7.mode` before any action.
> Never invoke Context7 MCP when mode is `MANUAL`.

---

## Phase -1: Availability Check

Run this ONCE per project before any SDD phase begins.

### Step 1 — Silent Probe

```
resolve-library-id(libraryName="react", query="test availability")
```

- ✅ Valid response → Context7 available → go to Step 2
- ❌ Error / timeout → Context7 not configured → go to Step 3

### Step 2 — Mode Selection (Context7 available)

Present to user in **Portuguese**:

```
✅ Context7 conectado!

Posso consultar a documentação ATUAL das tecnologias do seu projeto,
evitando código baseado em versões desatualizadas.

Como prefere trabalhar?

[A] 🤖 Automático — Consulto sem te interromper (recomendado)
[B] 👀 Supervisionado — Te mostro o que encontrei antes de aplicar
[C] ⚡ Sem Context7 — Uso meu conhecimento interno
```

Save to `project.state.json`:

```json
"context7": {
  "mode": "CONNECTED" | "SUPERVISED" | "MANUAL",
  "available": true,
  "checked_at": "<ISO timestamp>"
}
```

### Step 3 — Not Configured

Present to user in **Portuguese**:

```
⚠️ Context7 não está configurado.

Sem ele, usarei meu conhecimento interno para versões de tecnologias
— que pode ter até 12 meses de defasagem.

Para configurar (opção rápida):
  npx ctx7 setup

Para configurar manualmente:
  1. Acesse: https://context7.com/dashboard
  2. Crie conta gratuita e gere uma API Key
  3. Abra: .agent/mcp_config.json
  4. Substitua "YOUR_API_KEY" pela sua chave
  5. Reinicie o Gemini

Precisa de ajuda para configurar? (sim/não)
```

- **sim** → Run Setup Guide below
- **não** → Save `mode: "MANUAL"`, proceed without Context7

### Step 3a — Setup Guide (if user requests)

```
1. Vou abrir o link para você: https://context7.com/dashboard
2. Após gerar sua chave, me informe ela aqui
3. Vou inserir no mcp_config.json automaticamente
4. Depois reinicie o Gemini e rode /specify novamente
```

---

## Resumption Protocol (subsequent sessions)

At session start, before any action:

```
READ project.state.json → context7.mode

IF null or missing → run Phase -1 check
IF "MANUAL"        → skip all Context7 calls
IF "CONNECTED"     → use silently at injection points
IF "SUPERVISED"    → use with mini-HITL at injection points
```

---

## Injection Points

### Injection Point 1 — Stack Version Resolution

**Triggered by:** `business-analyst` after stack is confirmed.
**Goal:** Identify current stable versions for each technology.

```
FOR each technology in approved_stack:
  1. resolve-library-id(libraryName=tech, query="current stable version")
  2. get-library-docs(libraryId=result.id, query="current stable version LTS")
  3. Extract version number from response
  4. Write to constitution.md:
     "- {Tech}: {version} (verified via Context7 @ {date})"
```

**SUPERVISED mode** — show before writing:

```
📚 Versões encontradas pelo Context7:
• Next.js → 15.3 (stable)
• React → 19.1
• Node.js → 22 LTS
Gravar essas versões no constitution.md? (sim/não)
```

---

### Injection Point 2 — Architecture Pattern Pre-fetch

**Triggered by:** `project-planner` before task breakdown.
**Goal:** Confirm current architectural patterns for chosen stack.

```
FOR each technology in constitution.md stack:
  get-library-docs(libraryId=id, query="best practices architecture 2025")
  Extract: recommended patterns, deprecated patterns, breaking changes
  Include findings in plan file under "## Tech Decisions"
```

**SUPERVISED mode** — show summary before adding to plan:

```
📚 Context7 encontrou para Next.js 15:
• ✅ App Router é o padrão atual
• ❌ Pages Router = legacy (não recomendado)
• ⚠️  "use cache" substituiu getStaticProps
Aplicar ao plano? (sim/não)
```

---

### Injection Point 3 — Feature API Verification

**Triggered by:** specialist agents before implementing any feature.
**Goal:** Verify exact API signature for current library version.

```
BEFORE implementing feature:
  1. Read version from constitution.md
  2. get-library-docs(libraryId=id, query="<feature> API <version>")
  3. Use returned code examples as implementation reference
```

**SUPERVISED mode** — brief note only:

```
📚 Context7: usando API do React 19 para useFormStatus
   (diferente do React 18 — hook agora inclui campo 'data')
```

---

## Fallback (library not in Context7)

```
IF resolve-library-id returns no results:
  → Log: "⚠️ {library} not found in Context7. Using training knowledge."
  → Continue without Context7 for that library
  → Note in constitution.md: "{library}: version unverified"
```

---

## Rules

| Rule | Description |
|---|---|
| **Never block execution** | If Context7 fails, log and continue |
| **Version is law** | Once written to constitution.md, never overwrite without HITL |
| **Mode is immutable** | Never change mode mid-session without user request |
| **Respect MANUAL** | Zero Context7 calls when mode is MANUAL |
