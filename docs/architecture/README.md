# 🏛️ Architecture Decision Records (ADR) Log

Este diretório contém os registros oficiais de decisões de arquitetura (**Architecture Decision Records - ADR**) do projeto BME Calc, documentados de acordo com a nossa diretriz global de design de sistemas.

---

## 📑 Índice de Decisões

| ID | Título | Status | Data de Aprovação |
|---|---|---|---|
| **[ADR-001](file:///c:/Users/Dubis/Documents/GitHub/bme_calc/docs/architecture/adr-001-formula-solver-engine.md)** | Motor de Cálculo com AST Parser & Resolutor de Grafo NetworkX | **Accepted** | 2026-07-19 |
| **[ADR-002](file:///c:/Users/Dubis/Documents/GitHub/bme_calc/docs/architecture/adr-002-frontend-state-flowchart.md)** | Gerenciamento de Estado Jotai & React Flow Canvas no Frontend | **Accepted** | 2026-07-19 |
| **[ADR-003](file:///c:/Users/Dubis/Documents/GitHub/bme_calc/docs/architecture/adr-003-fastapi-sqlmodel-persistence.md)** | Backend de Alta Performance com FastAPI & Camada de Persistência SQLModel | **Accepted** | 2026-07-19 |

---

## 🎯 Processo de Tomada de Decisão
Todas as futuras alterações estruturais que impactem:
- Estilo de APIs (REST, GraphQL, tRPC).
- Seleção de novas linguagens de programação ou frameworks.
- Políticas de segurança, autenticação e mitigação de concorrência.
- Estrutura de persistência e redundância de dados.

**Devem** ser documentadas criando um novo arquivo seguindo o padrão `adr-[id]-[slug].md` e incluídas na tabela acima.
