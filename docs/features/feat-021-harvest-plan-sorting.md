---
id: FEAT-021
title: Ordenação Personalizada e Divisores no Plano de Safra
status: todo
prd_reference: Chamado do Usuário - Ordenação e Divisores no Plano de Safra
last_updated: 2026-07-07
---

# SPEC-021: Ordenação Personalizada e Divisores no Plano de Safra

Este documento especifica a implementação de ordenação personalizada e inserção de linhas divisórias (agrupamentos visuais) na exibição do Plano de Safra consolidado, mantendo consistência no frontend, backend, e nas exportações (Excel/PDF).

---

## 1. Escopo Técnico & Regras de Negócio

### 1.1 Modelo e Banco de Dados
Criação de uma nova tabela no PostgreSQL/SQLite chamada `harvest_plan_ordered_items`:
* `id`: `uuid.UUID` (Primary Key)
* `ordem`: `int` (Índice sequencial de ordenação, indexado)
* `tipo`: `str` (Define o tipo do item: `"variable"` ou `"divider"`)
* `variable_id`: `Optional[str]` (Chave estrangeira opcional para `variables.id`, nulo se tipo for divisor)
* `label`: `Optional[str]` (Título de agrupamento, nulo se tipo for variável)

**Sincronização e Regras de Negócio**:
1. **Inserção no Final**: Quando uma variável for adicionada ao Plano de Safra (`in_harvest_plan` marcado como `True`), o backend deve inseri-la automaticamente como um item de tipo `"variable"` no final da tabela de ordenação.
2. **Fallback "Sem Agrupamento"**: Se existirem variáveis com `in_harvest_plan == True` que por qualquer motivo (ex: migração de dados) não tenham registro correspondente na tabela de ordenação, elas serão exibidas no final da lista sob uma seção virtual padrão intitulada `"Variáveis Sem Agrupamento"`.
3. **Exclusão por Inativação**: Quando uma variável for inativada (`status` alterado para `VariableStatus.INATIVA`), seu registro correspondente em `harvest_plan_ordered_items` deve ser automaticamente excluído.

---

## 2. API Endpoints (Backend)

* **`GET /api/harvest-plan/structure`**: Retorna a lista atual de itens ordenados (variáveis e divisores).
  * O retorno conterá objetos mesclando metadados de variáveis com os divisores, ordenados pelo campo `ordem`.
* **`POST /api/harvest-plan/structure`**: Recebe a nova ordenação completa.
  * Aceita uma lista ordenada de itens (`[{"tipo": "variable", "variable_id": "J135"}, {"tipo": "divider", "label": "PRODUÇÃO"}]`).
  * De forma transacional, limpa a tabela de ordenação antiga e salva os novos registros com `ordem` sequencial.
* **`GET /api/harvest-plan/consolidation`**: Modificado para retornar os dados de consolidação ordenados de acordo com a tabela de estrutura do plano.
  * O array de dados retornados conterá variáveis consolidadas e elementos de divisores nos seus respectivos lugares na ordenação.

---

## 3. Interface no Frontend (React + TypeScript)

### 3.1 Unificação da Visualização e Organização (Modo Edição via Cadeado)
* Na sub-aba **Visualização Consolidada**, incluiremos um botão de cadeado **🔓 Modo Edição** / **🔒 Visualização** na barra superior de controles.
* **Cadeado Fechado (Modo Visualização - Padrão)**:
  * Renderização limpa dos valores consolidados mês a mês e acumulado anual.
  * Linhas divisórias (divisores) são exibidas mesclando todas as colunas (`colSpan={months.length + 6}`) com estilo destacado da Maestro UI (fundo slate/cinza-escuro, bordas em teal, texto bold em caixa alta).
* **Cadeado Aberto (Modo Edição Habilitado)**:
  * Cada linha exibe um controle de arrastar e soltar (drag-and-drop HTML5 nativo com ícone `⋮⋮`) e botões discretos de seta "Sobe"/"Desce" (WCAG).
  * Exibição de um controle na barra superior: "Adicionar Divisor" (input de texto + botão `+`). Ao criar, ele é inserido no final da lista.
  * Linhas de divisores exibem input de texto para alteração do título inline e um botão de exclusão `🗑️`.
  * Se houver variáveis no plano que não pertençam a nenhum agrupamento explícito (sem divisor anterior), elas serão agrupadas sob o cabeçalho `"Sem Agrupamento"`.
  * Ao clicar novamente no cadeado para fechar, o frontend envia a nova sequência ordenada para `POST /api/harvest-plan/structure` e recarrega os dados.

---

## 4. Exportação de Relatórios (Excel e PDF)

* A exportação no backend em `exports.py` lerá a mesma ordem de `harvest_plan_ordered_items`.
* Divisores serão renderizados em PDF e Excel como linhas destacadas com colunas mescladas e cor de fundo diferenciada, dividindo os blocos de forma legível.

---

## 5. Plano de Verificação

### 5.1 Testes Automatizados
* Teste de migração do banco para criar a tabela.
* Teste de integração do endpoint de salvamento/leitura da estrutura.
* Teste de ordenação no cálculo da consolidação anual.

### 5.2 Testes Manuais
* Validar a reordenação por drag-and-drop e botões na tela com o cadeado aberto.
* Validar criação, edição inline e remoção de divisores.
* Validar a consistência do layout nos relatórios PDF e planilhas Excel geradas.
