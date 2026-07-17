---
id: EPIC-22
title: Modernização Arquitetural e Design System — bme_calc
status: specified
prd_reference: Avaliação comparativa balanco-massa (2026-07-16)
last_updated: 2026-07-16
branch: feature/architecture-improvements
---

# SPEC-022: Modernização Arquitetural, Stack e Design System

> **Objetivo:** Elevar o bme_calc aos padrões arquiteturais e de design identificados no projeto `balanco-massa`, preservando 100% das funcionalidades existentes de cálculo, cenários, plano de safra e exportações.

---

## 1. Escopo Geral

Este épico cobre **4 domínios** independentes, implementados em ordem, cada um com seus próprios testes antes de avançar.

| Domínio | Risco | Impacto |
|---|---|---|
| 🎨 Design System | Baixo | Visual imediato |
| 🔒 Segurança CORS | Baixo | Produção |
| 🔢 Engine Decimal | Alto | Corretude matemática |
| ⚡ Frontend Stack (Vite + Jotai) | Médio | Performance |
| 📦 Backend Tooling (uv + Alembic) | Médio | Manutenibilidade |
| 🧪 Testes Frontend (Vitest + Playwright) | Baixo | Qualidade |

---

## 2. Domínio A — Design System "Studio Dark"

### 2.1 Princípios
- Paleta near-black canvas (`#0B1120`) + esmeralda CTA (`hsl(152, 70%, 50%)`) + âmbar inputs (`hsl(38, 96%, 62%)`)
- Radial gradient de spotlight na background (como no `balanco-massa/index.css`)
- `font-feature-settings: "tnum" 1` — tabular numbers em todas as tabelas numéricas
- Hairline gradiente verde no topo de cada card ("lit edge" effect)
- Elevação em 3 camadas: `--elevation-1`, `--elevation-2`, `--elevation-floating`
- Scrollbar custom restrita e escura
- Glow esmeralda no botão Calcular (CTA principal)

### 2.2 Diferenciação Visual de Tipos de Campo
| Tipo | Cor de Destaque | Comportamento |
|---|---|---|
| INPUT | Âmbar `--accent: hsl(38,96%,62%)` | Editável, cursor text |
| OUTPUT | Branco neutro | read-only, sem borda de input |
| CONSTANT | Cinza muted | read-only, menor opacidade |

### 2.3 Row Highlight ao Selecionar
- `selectedFieldId` global no state
- Linha ativa: `box-shadow: inset 3px 0 0 hsl(--ring)` + gradiente lateral teal
- Glow de texto no ID da variável selecionada

### 2.4 Componentes CSS a criar/atualizar
- `index.css` — tokens, gradientes, scrollbar, `studio-surface`, `glow-primary`
- `tailwind.config.js` — mapear tokens HSL para classes Tailwind
- Atualizar todos os componentes de tabela para usar `.studio-surface`

---

## 3. Domínio B — Segurança CORS

### 3.1 Problema atual
```python
# main.py — VULNERABILIDADE
allow_origins=["*"]
```

### 3.2 Solução
- Adicionar variável de ambiente `ALLOWED_ORIGINS` (ex: `http://localhost:3000,https://meuapp.com`)
- Parser de lista separada por vírgula no startup do FastAPI
- Fallback seguro para `["http://localhost:3000"]` em dev
- Documentar no `.env.sample` e `docker-compose.yml`

---

## 4. Domínio C — Engine Decimal (Alta Prioridade de Segurança)

### 4.1 Problema atual
O `backend/engine.py` usa `float` nativo do Python para todas as operações. Com 1.108 variáveis e até 100 iterações de convergência, o drift numérico acumula erros ao longo do loop.

### 4.2 Estratégia de Migração Segura
1. **Criar testes de paridade** (`test_engine_decimal_parity.py`):
   - Executar o mesmo conjunto de inputs com `float` e `Decimal`
   - Comparar resultados — devem ser iguais até a 4ª casa decimal (tolerância atual do convergence loop é `0.0001`)
   - Se algum resultado divergir mais que `1e-4`, o teste falha e a tarefa é bloqueada
2. **Migrar `engine.py`** somente após os testes de paridade passarem
3. **Usar `decimal.Decimal` com `getcontext().prec = 28`** (padrão IAPWS-grade)
4. **Manter `iapws` e `scipy` integrations** — esses retornam float, precisam de cast `Decimal(str(value))`
5. **Re-executar toda a suíte de testes** após migração

### 4.3 Arquivos afetados
- `backend/engine.py` (primário)
- `backend/goalseek.py` — interface com scipy (float boundary)
- `backend/evaluator.py` — se houver lógica de avaliação separada
- `backend/test_engine.py` — atualizar tipos de asserção

---

## 5. Domínio D — Frontend Stack (Migração Gradual)

### 5.1 Fase D1 — Migração CRA → Vite (sem quebrar funcionalidade)
- Instalar Vite + @vitejs/plugin-react no frontend
- Criar `vite.config.ts` e `tsconfig.json` compatível
- Migrar entry point `index.tsx` → `main.tsx`
- Manter `react-scripts` até validação completa
- Validar hot reload, build e todos os componentes existentes
- Remover CRA somente após validação

### 5.2 Fase D2 — Adotar Jotai para State Atomizado
- Instalar `jotai` + `jotai/utils`
- Criar `src/state/atoms.ts` com `atomFamily` para inputs/outputs/status
- Migrar `App.tsx` state global para atoms
- Migrar `SectorModules.tsx` para consumir atoms — eliminar re-renders em cascade
- Manter compatibilidade com `GoalSeekModal`, `ScenarioManager`, `HarvestPlan`

### 5.3 Fase D3 — @tanstack/react-table nas tabelas de variáveis
- Instalar `@tanstack/react-table`
- Migrar tabelas de `SectorModules.tsx` para `useReactTable`
- Adicionar `memo()` em `ValueCell` (input/output/constant)
- Validar que edição de inputs continua funcional

---

## 6. Domínio E — Backend Tooling

### 6.1 uv + pyproject.toml
- Criar `backend/pyproject.toml` com todas as dependências atuais de `requirements.txt`
- Instalar `uv` como package manager
- Gerar `uv.lock` (lockfile determinístico)
- Manter `requirements.txt` compatível para Docker existente

### 6.2 Alembic para Migrations
- Inicializar Alembic no backend (`alembic init`)
- Criar migration inicial a partir do schema atual (`migrations.py` → `alembic/versions/`)
- Documentar fluxo de criação de novas migrations
- Manter `migrations.py` legacy ativo como fallback durante transição

---

## 7. Domínio F — Testes Frontend

### 7.1 Vitest (Unit)
- Instalar `vitest` + `@testing-library/react`
- Criar `vitest.config.ts`
- Testes de smoke para componentes críticos: `SectorModules`, `ScenarioManager`, `HarvestPlan`

### 7.2 Playwright (E2E)
- Instalar `@playwright/test`
- Criar `playwright.config.ts`
- Fluxo E2E obrigatório: carrega app → seleciona cenário → edita input → clica Calcular → valida output

---

## 8. Regras de Proteção de Funcionalidade

> **INVIOLÁVEL:** As seguintes funcionalidades NUNCA podem ser quebradas durante a migração:
> 1. Motor de cálculo com convergência iterativa (100 iter, delta < 0.0001)
> 2. Goal Seek (scipy root_scalar — Brentq/Secante/Nelder-Mead)
> 3. Persistência de cenários (CRUD + versionamento)
> 4. Plano de Safra (consolidação anual, ordenação, divisores)
> 5. Exportações PDF (ReportLab) e Excel (OpenPyXL)
> 6. Modelo termodinâmico IAPWS-IF97 (vapor)
> 7. Substituição de variáveis com preservação de precedência matemática

---

## 9. Estratégia de Branch e PR

- **Branch:** `feature/architecture-improvements` (já criada)
- **Desenvolvimento:** Cada domínio em sub-branch ou commits atômicos nesta branch
- **Ordem de implementação:** A → B → C → D1 → D2 → D3 → E → F
- **Gate de PR:** Todos os testes existentes passando + novos testes do épico passando
- **Merge para main:** Somente após aprovação manual (HITL)

---

## 10. Verificação Final (Definition of Done)

- [ ] Paleta Studio Dark aplicada em todos os componentes
- [ ] `font-feature-settings: "tnum" 1` ativo nas tabelas numéricas
- [ ] `ALLOWED_ORIGINS` via env var — sem `"*"` no CORS
- [ ] Testes de paridade float vs Decimal passando
- [ ] Engine rodando com `Decimal` — convergência verificada
- [ ] Vite substituindo CRA com HMR funcional
- [ ] Jotai atoms para inputs/outputs sem re-renders globais
- [ ] TanStack Table nas tabelas de variáveis
- [ ] `pyproject.toml` + `uv.lock` no backend
- [ ] Alembic inicializado com migration inicial
- [ ] Vitest + Playwright configurados com testes smoke
- [ ] Todos os 10+ testes de backend existentes passando
- [ ] Funcionalidades protegidas (item 8) verificadas manualmente
