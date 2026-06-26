---
id: FEAT-012
title: Consolidação do Plano de Safra
status: done
prd_reference: Chamado do Usuário - Consolidação do Plano de Safra e Visualização Plurianual
last_updated: 2026-06-26
---

# 📑 Especificação: Consolidação do Plano de Safra

Esta funcionalidade implementa a consolidação anual do plano de safra. Permite que variáveis de processo e premissas operacionais sejam marcadas para compor o plano de safra, especifica seus métodos de agregação e exibe os valores consolidados mensalmente para os cenários aprovados, calculando o acumulado anual correspondente.

---

## 1. Escopo Técnico & Regras de Negócio

### 1.1 Modelo e Migração de Dados
1. **Configuração de Variáveis**:
   - Foram adicionadas colunas à tabela `variables` no PostgreSQL/SQLite:
     - `in_harvest_plan`: Booleano indicando se a variável faz parte do relatório consolidado da safra.
     - `harvest_plan_op`: Tipo de agregação (`SUM` - Soma, `AVERAGE` - Média aritmética, `WEIGHTED_AVERAGE` - Média ponderada, `CALCULATE` - Calculada por fórmula).
     - `harvest_plan_weight_var_id`: Chave estrangeira para a variável utilizada como peso (ex: Moenda volume de cana) em caso de média ponderada.
2. **Configuração Geral da Safra**:
   - Criação da tabela `harvest_plan_settings` que armazena a parametrização geral, incluindo o mês inicial do ano safra (ex: `Abril` ou `Janeiro`).

### 1.2 Algoritmo de Agregação e Consolidação
O motor de consolidação no backend (`calculate_harvest_plan_consolidation` em `services.py`) executa o seguinte fluxo:
1. Identifica a ordenação cronológica dos 12 meses da safra baseando-se no mês inicial configurado.
2. Carrega todos os cenários aprovados (`ScenarioStatus.APROVADO` ou `ScenarioStatus.FINAL`) para a safra informada.
3. Para cada variável marcada em `in_harvest_plan`:
   - Agrupa seus valores mensais reais correspondentes a cada cenário aprovado.
   - Calcula o acumulado anual de acordo com o operador selecionado:
     - `SUM`: Somatório simples dos valores mensais.
     - `AVERAGE`: Média aritmética simples de todos os meses com dados.
     - `WEIGHTED_AVERAGE`: Média ponderada pela variável de peso especificada.
     - `CALCULATE`: Avaliação topológica da fórmula matemática no interpretador AST usando como inputs os valores consolidados anuais já calculados para as suas dependências.

---

## 2. Roteamento da API (Endpoints)
- `GET /api/harvest-plan/years`: Lista os anos de safra únicos cadastrados.
- `GET /api/harvest-plan/settings`: Obtém as configurações globais de safra.
- `PUT /api/harvest-plan/settings`: Atualiza o mês inicial da safra.
- `GET /api/harvest-plan/config`: Retorna a lista de variáveis com suas respectivas configurações de plano de safra.
- `POST /api/harvest-plan/config/bulk`: Salva em lote a configuração de plano de safra para múltiplas variáveis.
- `GET /api/harvest-plan/consolidation`: Retorna os valores consolidados mês a mês e o acumulado anual de cada variável para um determinado ano safra.

---

## 3. Interface no Frontend
- **Sub-aba Visualização**: Tabela contendo as variáveis agrupadas por setor de processo, colunas com os valores mensais extraídos dos cenários homologados e a coluna "Acumulado" anual. Os valores exibem badges coloridas indicando o status do cenário daquele mês (Em Edição, Homologado, etc.).
- **Sub-aba Configuração**: Permite ao usuário configurar o mês de início do ciclo e gerenciar a inclusão/operador de cada variável do sistema, com autocomplete interativo para facilitar a busca e associação da variável de peso.
