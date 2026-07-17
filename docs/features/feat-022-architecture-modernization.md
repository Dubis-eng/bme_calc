---
id: FEAT-022
title: Modernização Arquitetural, Reestruturação de Diretórios e Design System
status: ongoing
prd_reference: SPEC.md (SPEC-022) + Avaliação balanco-massa (2026-07-16)
last_updated: 2026-07-16
branch: feature/architecture-improvements
---

# Épico 22 — Modernização Arquitetural, Reestruturação e Design System

## Objetivo
Elevar o bme_calc aos padrões arquiteturais e de design do projeto `balanco-massa`, preservando 100% das funcionalidades existentes de cálculo, cenários, plano de safra e exportações.

## Domínios
- **Domínio 0 — Reestruturação de Diretórios** (pré-requisito de tudo)
- **Domínio A — Design System Studio Dark**
- **Domínio B — Segurança CORS**
- **Domínio C — Engine Decimal**
- **Domínio D — Frontend Stack (Vite + Jotai + TanStack)**
- **Domínio E — Backend Tooling (uv + Alembic)**
- **Domínio F — Testes Frontend (Vitest + Playwright)**

## Referências
- [SPEC.md](../../SPEC.md) — Especificação completa
- [estrutura_diretorios.md] — Mapa completo de movimentação de arquivos
- [task-master.md](task-master.md) — Tarefas 22.x

## Funcionalidades Protegidas (Invioláveis)
1. Motor de cálculo com convergência iterativa (100 iter, delta < 0.0001)
2. Goal Seek (scipy root_scalar — Brentq/Secante/Nelder-Mead)
3. Persistência de cenários (CRUD + versionamento incremental)
4. Plano de Safra (consolidação anual, ordenação, divisores)
5. Exportações PDF (ReportLab) e Excel (OpenPyXL)
6. Modelo termodinâmico IAPWS-IF97 (vapor)
7. Substituição de variáveis com preservação de precedência matemática
