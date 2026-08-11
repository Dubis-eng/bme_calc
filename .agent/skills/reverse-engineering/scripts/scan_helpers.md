# scan_helpers.md — Heurísticas de Scanning por Ecossistema
> Referenciado pela FASE 1 (Discovery) do SKILL.md
> Cada ecossistema define: manifests, entry points, extensões, padrões de rotas/modelos

---

## 1. Detecção de Ecossistema

Verificar na raiz do projeto os arquivos abaixo. O primeiro match define o ecossistema primário.

| Arquivo Detectado | Ecossistema | Runtime |
|---|---|---|
| `package.json` | Node.js / JavaScript / TypeScript | Node ≥ 18 |
| `requirements.txt` / `pyproject.toml` / `setup.py` | Python | Python ≥ 3.8 |
| `pom.xml` / `build.gradle` | Java / Kotlin | JVM |
| `*.csproj` / `*.sln` | .NET / C# | .NET ≥ 6 |
| `go.mod` | Go | Go ≥ 1.20 |
| `Gemfile` | Ruby | Ruby ≥ 3.0 |
| `Cargo.toml` | Rust | Rust stable |
| `composer.json` | PHP | PHP ≥ 8.0 |

---

## 2. Node.js / TypeScript

### Entry Points
```
index.js / index.ts
src/index.ts / src/main.ts
server.ts / app.ts
src/server.ts / src/app.ts
```

### Sub-framework Detection
| Framework | Indicador |
|---|---|
| Next.js | `next.config.js/ts`, `pages/` ou `app/` com `page.tsx` |
| Express | `express` em `package.json` dependencies |
| Fastify | `fastify` em `package.json` dependencies |
| NestJS | `@nestjs/core` em `package.json` |
| Vite | `vite.config.ts`, `index.html` na raiz |

### Patterns de Rotas
```
pages/**/*.tsx         → Next.js Pages Router
app/**/page.tsx        → Next.js App Router
src/routes/**/*.ts     → Express/Fastify routers
src/**/*.controller.ts → NestJS controllers
```

### Patterns de Modelos / Schema
```
prisma/schema.prisma   → Prisma ORM
src/models/**/*.ts     → TypeORM / Sequelize
src/entities/**/*.ts   → TypeORM entities
src/schemas/**/*.ts    → Zod / Yup schemas
```

### Patterns de Componentes UI
```
src/components/**/*.tsx  → React components
src/app/**/layout.tsx    → Next.js layouts
src/pages/**/*.tsx       → Next.js pages
```

### Arquivos de Config Relevantes
```
tsconfig.json, .eslintrc*, .prettierrc*, jest.config.*
vite.config.*, next.config.*, tailwind.config.*
```

---

## 3. Python

### Entry Points
```
main.py / app.py / run.py / manage.py
src/main.py / src/app.py
wsgi.py / asgi.py
```

### Sub-framework Detection
| Framework | Indicador |
|---|---|
| Django | `manage.py`, `settings.py`, `DJANGO_SETTINGS_MODULE` |
| FastAPI | `fastapi` em `requirements.txt`, `@app.get()` patterns |
| Flask | `flask` em `requirements.txt`, `@app.route()` patterns |

### Patterns de Rotas
```
**/views.py       → Django views
**/routes.py      → Flask / FastAPI routes
**/routers/**/*.py → FastAPI routers
**/urls.py        → Django URL patterns
```

### Patterns de Modelos
```
**/models.py      → Django ORM models
**/schemas.py     → Pydantic schemas
**/entities.py    → SQLAlchemy entities
alembic/          → Database migrations
```

### Arquivos de Config
```
requirements.txt, pyproject.toml, setup.py, setup.cfg
.env, .env.example, pytest.ini, mypy.ini, ruff.toml
```

---

## 4. Java / Kotlin (Maven/Gradle)

### Entry Points
```
src/main/java/**/Application.java
src/main/kotlin/**/Application.kt
src/main/java/**/Main.java
```

### Sub-framework Detection
| Framework | Indicador |
|---|---|
| Spring Boot | `spring-boot-starter` em `pom.xml`/`build.gradle` |
| Quarkus | `quarkus-core` em pom/gradle |
| Micronaut | `micronaut-core` em pom/gradle |

### Patterns de Rotas
```
**/*Controller.java   → Spring/REST controllers
**/*Resource.java     → JAX-RS / Quarkus resources
```

### Patterns de Modelos
```
**/*Entity.java       → JPA entities
**/*Repository.java   → Spring Data repositories
src/main/resources/db/migration/ → Flyway migrations
```

---

## 5. .NET / C#

### Entry Points
```
Program.cs
src/**/Program.cs
Startup.cs
```

### Patterns de Rotas
```
**/*Controller.cs     → ASP.NET MVC controllers
**/Endpoints/**/*.cs  → Minimal API endpoints
```

### Patterns de Modelos
```
**/*Entity.cs / **/*Model.cs
**/Migrations/        → EF Core migrations
**/*DbContext.cs      → Entity Framework contexts
```

---

## 6. Go

### Entry Points
```
main.go
cmd/*/main.go
internal/server/server.go
```

### Patterns de Rotas
```
**/routes.go / **/router.go
**/handlers/**/*.go
```

### Patterns de Modelos
```
**/models/**/*.go
**/entities/**/*.go
```

---

## 7. Padrões de Testes (Universal)

Independente do ecossistema, verificar:

```
test/           → pasta de testes genérica
tests/          → alternativa comum
__tests__/      → Jest / Python unittest
spec/           → Ruby / Jest specs
*.test.ts/js    → Jest unit tests
*.spec.ts/js    → Jest/Vitest specs
*_test.go       → Go tests
test_*.py       → Pytest
*Test.java      → JUnit
*Tests.cs       → .NET xUnit/NUnit
e2e/            → End-to-end tests
cypress/        → Cypress E2E
playwright/     → Playwright E2E
```

---

## 8. Padrões de Segurança a Verificar (Universal)

```
# Secrets hardcoded (grep patterns)
API_KEY\s*=\s*["'][^"']+["']
SECRET\s*=\s*["'][^"']+["']
PASSWORD\s*=\s*["'][^"']+["']
TOKEN\s*=\s*["'][^"']+["']
private_key\s*=

# Arquivos sensíveis que não devem existir no repositório
.env          (sem .gitignore entry)
*.pem / *.key
credentials.json / service-account.json
```

---

## 9. Padrões de Nomenclatura a Detectar

| Padrão | Exemplo | Ecosistema Típico |
|---|---|---|
| `camelCase` | `getUserById` | JS/TS, Java, C# |
| `snake_case` | `get_user_by_id` | Python, Ruby, Go |
| `PascalCase` | `UserController` | Nomes de classe (universal) |
| `kebab-case` | `user-profile` | Rotas URL, arquivos CSS |
| `SCREAMING_SNAKE` | `MAX_RETRY_COUNT` | Constantes (universal) |

Detectar inconsistências: função `get_user` em projeto TypeScript indica mistura de padrões.

---

## 10. Dívida Técnica — Limites GEMINI.md P0

| Violação | Threshold | Como Detectar |
|---|---|---|
| Arquivo muito longo | > 300 linhas | `wc -l` ou `Get-Content` |
| Função muito longa | > 40 linhas | Contar linhas entre `{` e `}` |
| Aninhamento excessivo | > 3 níveis | Indentação > 12 espaços (4x3) |
| Arquivo sem responsabilidade única | Misto de lógica | Múltiplas classes de domínio |
