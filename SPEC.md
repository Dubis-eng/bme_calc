# SPEC.md — Especificação do Motor de Equações e Planejamento Industrial

## 1. Visão Geral
Este documento especifica os requisitos de evolução da Calculadora de Balanço de Massa e Energia (BME Calc) com base no **PRD Complementar**. O objetivo é transformar o protótipo em um motor de cálculo industrial com validação semântica estrita, tratamento controlado de erros matemáticos, dependências rastreáveis e suporte a cenários operacionais dinâmicos.

---

## 2. Decisões Arquiteturais Homologadas (HITL)

### 2.1 Banco de Dados Relacional Normalizado (5 Tabelas)
O banco de dados PostgreSQL será migrado de um campo único JSONB para 5 tabelas normalizadas usando SQLModel:
1. **Tabela `variables`**:
   * `id`: string (chave primária, ID/REF técnico alfanumérico ex: `MOENDA_RPM`).
   * `nome`: string (nome amigável).
   * `descrição`: string.
   * `setor`: string.
   * `tipo`: enum (`INPUT`, `OUTPUT`, `DERIVADA`, `CENARIO`).
   * `unidade`: string.
   * `status`: enum (`ativa`, `pendente`, `inválida`, `descontinuada`).
2. **Tabela `equations`**:
   * `id`: UUID.
   * `variable_id`: string (foreign key apontando para a variável de saída).
   * `expression_original`: string (ex: `=MOENDA_RPM * 1.5`).
   * `expression_normalized`: string (traduzida para a AST).
   * `version`: integer.
   * `status`: string.
   * `created_at` / `updated_at`: datetime.
3. **Tabela `dependencies`**:
   * `equation_id`: UUID.
   * `dependency_var_id`: string (variável de entrada de qual a equação depende).
   * `evaluation_order`: integer.
4. **Tabela `scenarios`**:
   * `id`: UUID.
   * `nome`: string.
   * `year_harvest`: string (ex: "2026/27").
   * `reference_month`: string (ex: "Julho").
   * `status`: enum (`Em Edição`, `Aprovado`, `Final`).
5. **Tabela `results`**:
   * `variable_id`: string (foreign key).
   * `scenario_id`: UUID (foreign key).
   * `value`: float (ou null se erro).
   * `status`: enum (`OK`, `DIV_BY_ZERO`, `MISSING_VAR`, `PENDING`).
   * `error_message`: string.
   * `timestamp`: datetime.

### 2.2 Propagação de Erros por Objeto Rico (Dicionário com Value/Status)
O motor AST (`backend/engine.py`) não retornará zeros silenciosos para erros matemáticos ou variáveis ausentes.
* **Comportamento do Interpretador**: Em caso de falha matemática, o resultado retornado será um dicionário estruturado:
  ```json
  {
    "value": null,
    "status": "DIV_BY_ZERO",
    "error_message": "Divisão por zero ao avaliar a equação"
  }
  ```
* **Impacto no Frontend**: O frontend exibirá badges coloridos de alerta e tags acessíveis (WCAG) contendo o status de erro e a causa exata, bloqueando a exportação de relatórios finais inconsistentes.

### 2.3 Premissas Dinâmicas de Cenário (Variáveis de Tipo `CENARIO`)
* Premissas como `DIA` (dias operados) ou `% Aproveitamento Operacional` serão cadastradas como variáveis regulares com tipo técnico `CENARIO`.
* O frontend exibirá essas variáveis de cenário em um painel destacado de premissas (ex: cabeçalho ou barra lateral).
* O usuário pode alterar livremente seus valores por cenário e referenciá-las pelo ID técnico em qualquer fórmula (ex: `= MOAGEM_HORARIA * DIA * 24 * APROVEITAMENTO`).
* Isso elimina colunas estáticas no banco de dados, permitindo adicionar novos fatores dinâmicos de calendário no futuro sem migrações adicionais de esquema.

---

## 3. Próximos Passos
1. Atualizar o `hitl-review-specify.md` com as decisões.
2. Avançar para a fase de planejamento (`Plan`) criando o plano de implementação técnica detalhada.
