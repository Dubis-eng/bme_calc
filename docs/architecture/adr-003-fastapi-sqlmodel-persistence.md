# ADR-003: FastAPI & SQLModel Persistence Layer

## Status
Accepted

## Context
The persistence layer must handle:
1. Scenario configurations (metadata, reference months, active status, locking).
2. Heavy calculation records (every scenario has 1000+ variables with active values/equations).
3. Dynamic sectors and stages.
4. Database migrations as schema changes happen.
5. Strict typing/validation between API endpoints and database storage.

## Options Considered

| Option | Pros | Cons | Complexity | When Valid |
|--------|------|------|------------|------------|
| **Option A**: Django/Django Rest Framework + PostgreSQL ORM | Built-in admin dashboard, robust migrations. | Heavy framework overhead, slow performance on heavy numeric computations, complex async support. | High | DB-heavy SaaS applications with CRUD needs. |
| **Option B**: FastAPI + SQLModel (SQLAlchemy) + Alembic (Chosen) | Ultra-fast execution, shares Pydantic schemas with SQL models, native async/sync support, easy Alembic migrations. | Requires explicit configuration for database setup and environment routing. | Medium | Modern microservices and high-performance calculation APIs. |

## Decision
**Chosen**: Option B (FastAPI + SQLModel + Alembic + PostgreSQL).

## Rationale
1. **FastAPI** provides fast execution, automatic OpenAPI docs, and type-checked request/response structures.
2. **SQLModel** unifies Pydantic validations with SQLAlchemy database definitions, eliminating boilerplate model mapping code.
3. **Alembic** allows schema upgrades and auto-generation of revisions directly from SQLModel declarations.
4. **PostgreSQL** is the standard for transactional integrity and scaling requirements.

## Trade-offs
- **Accepted**: We have to manage migrations manually via Alembic CLI commands (`alembic revision --autogenerate`).
- **Why Acceptable**: Provides absolute safety and auditability of DB changes.

## Consequences
- **Positive**: Strict compile-time typing from database to API endpoint, high concurrency, and clean modular service structure.
- **Negative**: Foreign keys constraints require atomic cleaning procedures when deleting parent sectors or variables.
- **Mitigation**: Database cascade definitions (`ON DELETE CASCADE`) on tables like `sector_flowcharts` and scenario results.
