---
name: architecture
description: Unified architectural decision-making framework. Requirements analysis, trade-off evaluation, ADR documentation, API design patterns (REST/GraphQL/tRPC), and tech stack selection. Use when making architecture decisions, analyzing system design, choosing API style, or selecting technology stacks.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Architecture & API Decision Framework

> "Requirements drive architecture. Trade-offs inform decisions. ADRs capture rationale."
> **Core Principle:** THINK, don't memorize. ASK, don't assume.

---

## 🎯 Selective Reading Rule

**Read ONLY files relevant to the request!** Check the content map, find what you need.

### Architecture & Patterns

| File | Description | When to Read |
|------|-------------|--------------|
| `context-discovery.md` | Questions to ask, project classification | Starting architecture design |
| `trade-off-analysis.md` | ADR templates, trade-off framework | Documenting decisions |
| `pattern-selection.md` | Decision trees, anti-patterns | Choosing patterns |
| `examples.md` | MVP, SaaS, Enterprise examples | Reference implementations |
| `patterns-reference.md` | Quick lookup for patterns | Pattern comparison |

### API Design Patterns

| File | Description | When to Read |
|------|-------------|--------------|
| `api-style.md` | REST vs GraphQL vs tRPC decision tree | Choosing API type |
| `rest.md` | Resource naming, HTTP methods, status codes | Designing REST API |
| `response.md` | Envelope pattern, error format, pagination | Response structure |
| `graphql.md` | Schema design, when to use, security | Considering GraphQL |
| `trpc.md` | TypeScript monorepo, type safety | TS fullstack projects |
| `versioning.md` | URI/Header/Query versioning | API evolution planning |
| `auth.md` | JWT, OAuth, Passkey, API Keys | Auth pattern selection |
| `rate-limiting.md` | Token bucket, sliding window | API protection |
| `documentation.md` | OpenAPI/Swagger best practices | Documentation |
| `security-testing.md` | OWASP API Top 10, auth/authz testing | Security audits |

### Tech Stack Selection

| File | Description | When to Read |
|------|-------------|--------------|
| `resources/language-decision-matrix.md` | Language selection by context | Choosing a programming language |
| `resources/api-architecture-matrix.md` | API architecture comparison | Choosing API architecture style |

---

## 🔧 Runtime Scripts

| Script | Purpose | Command |
|--------|---------|---------|
| `scripts/api_validator.py` | API endpoint validation | `python scripts/api_validator.py <project_path>` |

---

## 🔗 Related Skills

| Skill | Use For |
|-------|---------|
| `@[skills/database-design]` | Database schema design |
| `@[skills/deployment-procedures]` | Deployment architecture |
| `@[skills/nodejs-best-practices]` | Node.js implementation patterns |
| `@[skills/python-patterns]` | Python implementation patterns |

---

## Core Principle

**"Simplicity is the ultimate sophistication."**

- Start simple
- Add complexity ONLY when proven necessary
- You can always add patterns later
- Removing complexity is MUCH harder than adding it

---

## ✅ Unified Decision Checklist

Before finalizing architecture or API design:

- [ ] Requirements clearly understood
- [ ] Constraints identified
- [ ] Each decision has trade-off analysis
- [ ] Simpler alternatives considered
- [ ] ADRs written for significant decisions
- [ ] Team expertise matches chosen patterns
- [ ] API consumers identified (REST/GraphQL/tRPC)
- [ ] Response format defined
- [ ] Versioning strategy planned
- [ ] Authentication needs considered
- [ ] Rate limiting planned
- [ ] Documentation approach defined

---

## ❌ Anti-Patterns

**DON'T:**
- Default to REST for everything
- Use verbs in REST endpoints (/getUsers)
- Return inconsistent response formats
- Expose internal errors to clients
- Skip rate limiting
- Over-engineer for a scale you don't have

**DO:**
- Choose API style based on context
- Ask about client requirements
- Document thoroughly
- Use appropriate status codes
- Start simple, add patterns when needed

---

> **Remember:** Architecture is THINKING, not copying. Every project deserves fresh consideration.
