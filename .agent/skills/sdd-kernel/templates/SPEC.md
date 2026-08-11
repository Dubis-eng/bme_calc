# Feature Specification — {feature-name}

> AI-Dev Readiness Framework Compliant

---

## 1. Visão Geral e Objetivo

| Item | Descrição |
|---|---|
| **Descrição** | {Resumo da feature} |
| **Problema** | {Problema que resolve} |
| **Valor de Negócio** | {Benefício business} |
| **Objetivos SMART** | {Específicos, Mensuráveis, Alcançáveis, Relevantes, Temporizáveis} |

---

## 2. Glossário de Termos

| Termo | Definição |
|---|---|
| {termo1} | {definição} |
| {termo2} | {definição} |

---

## 3. Contexto do Sistema e Arquitetura

| Item | Descrição | Referência |
|---|---|---|
| **Stack Tecnológica** | {linguagens, frameworks, DB} | `docs/tech_stack.md` |
| **Arquitetura Geral** | {monolito, microsserviços, serverless} | `docs/architecture.md` |
| **Padrões de Código** | {DDD, Clean Arch, convenções} | `.eslintrc`, `.editorconfig` |
| **Estrutura Repo** | {organização pastas} | `docs/repo_structure.md` |
| **CI/CD** | {pipeline} | `.github/workflows/main.yml` |

> 🔴 **Auto-Create:** If any reference above does NOT exist → invoke `context-manager` to create it BEFORE proceeding.

---

## 4. Arquitetura de Dados

| Item | Descrição |
|---|---|
| **Modelo de Dados Proposto** | {diag ER ou lista tabelas} |
| **Esquema Atual DB** | {tabelas existentes relacionadas} |
| **Tabelas Afetadas** | {lista de tabelas} |
| **Convenções DB** | {padrões nomenclatura} |
| **Dados Legados** | {considerações migração} |

> 🔴 **Required for DB features:** If `docs/database_schema.d2` does not exist → invoke `database-architect`.

---

## 5. Regras de Negócio e Lógica de Acesso

| Item | Descrição |
|---|---|
| **Casos de Uso** | {lista detalhada} |
| **Validações** | {regras de entrada} |
| **Auth/Roles** | {perfis e permissões} |
| **Casos de Borda** | {cenários erro} |

> 🔴 **Auto-Create:** If `docs/auth_system.md` does not exist → invoke `security-auditor`.

---

## 6. Requisitos de Interface (UI/UX/API)

| Item | Descrição |
|---|---|
| **Mockups/Wireframes** | {links ou descritivo} |
| **Contratos API** | {endpoints, payloads} |
| **Mensagens Erro** | {padrões} |
| **Comportamento UI** | {estados e permissões} |

> 🔴 **API features:** If `docs/api_contracts/` does not exist → invoke `backend-specialist`.

---

## 7. Requisitos Não Funcionais

| Item | Descrição |
|---|---|
| **Performance** | {SLAs, throughput} |
| **Segurança** | {OWASP, vulnerabilidades} |
| **Observabilidade** | {logs, métricas} |
| **Escalabilidade** | {carga} |
| **Auditabilidade** | {eventos para audit} |

> 🔴 **Auto-Create:** For NFRs lacking docs → invoke `project-planner` to create `docs/nfr_*.md`.

---

## 8. Estratégia de Testes

| Item | Descrição |
|---|---|
| **Cobertura Mínima** | {% required} |
| **Cenários Obrigatórios** | {lista de cenários críticos} |
| **Ferramentas** | {jest, vitest, playwright} |

> 🔴 **Testing Strategy:** If `docs/testing_strategy.md` does not exist → invoke `context-manager`.

---

## 9. Estratégia de Rollout

| Item | Descrição |
|---|---|
| **Migração Dados** | {plano detallado} |
| **Feature Flags** | {lista de flags} |
| **Plano Rollback** | {procedimento revert} |
| **Impacto Módulos** | {outros módulos afetados} |

> 🔴 **Required for deploy:** If `docs/feature_flags.md` does not exist → create basic version.

---

## 🔍 AI-Dev Readiness Checklist

**Before HITL approval, verify:**

- [ ] Seção 1: Visão Geral completa
- [ ] Seção 2: Glossário com todos os termos
- [ ] Seção 3: Stack referenciada ou criada
- [ ] Seção 4: Modelo de dados (se aplicável)
- [ ] Seção 5: Regras de negócio completas
- [ ] Seção 6: UI/API definida (se aplicável)
- [ ] Seção 7: NFRs considerados
- [ ] Seção 8: Estratégia de testes
- [ ] Seção 9: Rollout planejado

> 🔴 **Gap Detection:** IF any reference shows "does not exist" → Auto-Create BEFORE proceeding to HITL.

---

## 📋 Metadata

| Field | Value |
|---|---|
| Feature | {feature-name} |
| Created | {date} |
| SDD Phase | SPECIFY |
| Framework Version | 1.0 |