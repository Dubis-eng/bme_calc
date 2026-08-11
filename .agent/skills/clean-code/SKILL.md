---
name: clean-code
description: Pragmatic coding standards - concise, direct, no over-engineering, no unnecessary comments. Enforces User's Golden Rules.
allowed-tools: Read, Write, Edit
version: 2.1
priority: CRITICAL
---

# Clean Code - Pragmatic AI Coding Standards

> **CRITICAL SKILL** - Be **concise, direct, and solution-focused**.

---

## 🏆 USER'S GOLDEN RULES (Anti-Monolith)

These rules are **MANDATORY** and take precedence over generic patterns.

| Rule                      | Description                                                                                                               |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **1. 50-Line Rule (SRP)** | Functions **MUST NOT** exceed ~50 lines. If larger, extract to sub-routines immediately.                                  |
| **2. Interface First**    | **Never** implement a class/module without defining its `interface` or `type` first. Design the contract before the code. |
| **3. No "God Objects"**   | **FORBIDDEN:** Files like `Manager.ts`, `Controller.ts`. Break by domain (e.g., `UserRegistrationService`).               |
| **4. Strict Typing**      | `any` is **PROHIBITED**. Use `unknown` + validation (Zod/Pydantic) at system edges.                                       |
| **5. Fail Fast & Loud**   | **Never** swallow errors. Use custom typed exceptions. Crash if necessary rather than corrupting state.                   |

---

## Naming Rules

| Element       | Convention                                            |
| ------------- | ----------------------------------------------------- |
| **Variables** | Reveal intent: `userCount` not `n`                    |
| **Functions** | Verb + noun: `getUserById()` not `user()`             |
| **Booleans**  | Question form: `isActive`, `hasPermission`, `canEdit` |
| **Constants** | SCREAMING_SNAKE: `MAX_RETRY_COUNT`                    |

> **Rule:** If you need a comment to explain a name, rename it.

---

## Code Structure

| Pattern           | Apply                                         |
| ----------------- | --------------------------------------------- |
| **Guard Clauses** | Early returns for edge cases. Reduce nesting. |
| **Flat > Nested** | Avoid deep nesting (max 2 levels).            |
| **Composition**   | Small functions composed together.            |
| **Colocation**    | Keep related code close.                      |

---

## AI Coding Style

- **Chain of Thought:** Before coding, briefly explain the file structure to ensure modularity.
- **Auto-Critique:** If a request violates DRY or SOLID, warn the user _before_ implementing.
- **Directness:** Fix bugs immediately. Don't explain obvious things.

---

## 🔴 Before Editing ANY File (THINK FIRST!)

**Before changing a file, ask yourself:**

| Question                        | Why                      |
| ------------------------------- | ------------------------ |
| **What imports this file?**     | They might break         |
| **What does this file import?** | Interface changes        |
| **What tests cover this?**      | Tests might fail         |
| **Is this a shared component?** | Multiple places affected |

> 🔴 **Rule:** Edit the file + all dependent files in the SAME task. Don't leave broken builds.

---

## 🔴 Self-Check Before Completing (MANDATORY)

**Before saying "task complete", verify:**

1.  ✅ **50-Line Limit?** check largest function.
2.  ✅ **Interface/Types defined?** check file top.
3.  ✅ **No `any`?** grep for `any`.
4.  ✅ **No God Classes?** check file name and scope.

---

## Verification Scripts

_(Run these to ensure compliance)_

| Agent         | Script        | Command                                                             |
| ------------- | ------------- | ------------------------------------------------------------------- |
| **Any agent** | Lint Check    | `python .agent/skills/lint-and-validate/scripts/lint_runner.py .`   |
| **Any agent** | Type Coverage | `python .agent/skills/lint-and-validate/scripts/type_coverage.py .` |
| **backend**   | API Validator | `python .agent/skills/architecture/scripts/api_validator.py .`      |
