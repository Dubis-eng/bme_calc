# 📋 HITL Review — /specify EPIC-022

> **Data:** 2026-07-16 | **Branch:** `feature/architecture-improvements`
> **Status aguardado:** APROVADO / REJEITADO / AJUSTES

---

## Decisões Capturadas na Entrevista

| # | Pergunta | Resposta |
|---|---|---|
| 1 | Domínios a incluir | Todos os 6 domínios (Design, CORS, Decimal, Vite+Jotai, uv+Alembic, Testes) |
| 2 | Prioridade máxima | Tudo em conjunto — planejar o épico completo primeiro |
| 3 | Estratégia de migração frontend | Gradual — manter CRA funcionando, migrar componente por componente |
| 4 | Testes de paridade Decimal/float | Sim — cada tarefa com seus próprios testes antes de avançar |

---

## Riscos Identificados

| Risco | Probabilidade | Mitigação |
|---|---|---|
| Decimal quebra convergência do engine | Médio | Testes de paridade obrigatórios (TASK-A pré-requisito) |
| Migração Vite quebra componentes existentes | Médio | Manter CRA paralelo até validação completa |
| Jotai incompatível com GoalSeekModal ou HarvestPlan | Baixo | Migração gradual por componente |
| Alembic conflita com migrations.py custom | Baixo | Manter migrations.py como fallback durante transição |

---

## Funcionalidades Protegidas (Invioláveis)

1. Motor de cálculo com convergência iterativa
2. Goal Seek (scipy)
3. Persistência de cenários
4. Plano de Safra (consolidação + divisores)
5. Exportações PDF e Excel
6. Modelo IAPWS-IF97
7. Substituição de variáveis

---

## ✅ Aprovação para /create-tasks

Confirme com "Aprovado" ou "Proceed" para iniciar o planejamento de tarefas.
