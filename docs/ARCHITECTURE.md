# 🏛️ Documento de Arquitetura de Software

Este documento detalha o blueprint de arquitetura técnica, fluxo de dados e decisões estruturais da Calculadora de Balanço de Massa e Energia.

---

## 🗺️ Mapa de Diretórios do Projeto
```text
bme_calc/
├── .agent/               # Toolkit de automação do Antigravity Kit
├── backend/              # Aplicação de API Backend (FastAPI + Python)
│   ├── database.py       # Conexão SQLModel e esquema da tabela scenarios
│   ├── engine.py         # Interpretador de fórmulas AST e solucionador de ciclos
│   ├── goalseek.py       # Solver scipy.optimize.root_scalar para busca de metas
│   ├── router_settings.py # Rotas de configurações unificadas sob /api/settings
│   ├── services_*.py     # Serviços de negócios (cenários, safra, reordenação)
│   ├── main.py           # Endpoints principais da API FastAPI
│   └── test_*.py         # Testes de integração e motores matemáticos
├── docs/                 # Documentação técnica e governança do projeto
│   ├── features/         # Histórico de entregas (task-master.md)
│   └── ARCHITECTURE.md   # Este arquivo
├── frontend/             # Aplicação Frontend (React + TypeScript)
│   ├── public/           # Memorial de cálculo inicial (.json) e estáticos
│   └── src/
│       ├── components/   # Componentes modulares (ScenarioManager, GoalSeekModal)
│       ├── utils/        # Helpers e conversores utilitários
│       └── App.tsx       # Componente principal e controle de estado reativo
└── docker-compose.yml    # Orquestração local (Postgres, Backend, Frontend)
```

---

## ⚙️ Componentes Principais & Fluxo de Dados

### 1. Motor de Cálculo AST (`backend/engine.py`)
O motor traduz as fórmulas de strings do Excel para código Python interpretado via árvore de sintaxe abstrata (`ast`). O solucionador detecta dependências circulares e executa uma **ordenação topológica** (`networkx.DiGraph`). Se houver ciclos, resolve por iterações até convergência delta inferior a `0.0001` (máximo de 100 iterações).

### 2. Otimizador Físico (`backend/goalseek.py`)
Utiliza `scipy.optimize.root_scalar` para encontrar o valor de um input que zera a diferença em relação ao valor da saída alvo:
1. **Brentq**: Utilizado quando os sinais nos limites bracetam a raiz (`f(a) * f(b) < 0`).
2. **Secante**: Fallback linear quando os limites não bracetam a raiz.
3. **Nelder-Mead**: Fallback robótico multidimensional de minimização caso ocorra descontinuidade matemática (erros de domínio, divisão por zero ou IAPWS).

### 3. Persistência e Governança (`backend/database.py`)
Persiste os dados de maneira estruturada e relacional através do PostgreSQL normalizado em tabelas:
* **Tabelas do Sistema**: `scenarios` (cenários de safra/mês), `variables` (propriedades de variáveis globais com status `ATIVA`, `PENDENTE`, `INVALIDA`, `INATIVA`), `equations` (fórmulas das variáveis), `dependencies` (grafo de dependências de cálculo), `results` (valores resultantes por cenário/versão), `sectors` (cadastro e ordenação de setores de processo) e `harvest_plan_settings` (configurações do plano de safra).
* **Versionamento Incremental**: O backend localiza automaticamente a versão máxima para aquele período e incrementa (`version + 1`).
* **Bloqueio de Edição**: Caso o status do cenário no banco mude para `Aprovado` ou `Final`, o frontend desabilita todas as caixas de texto de entrada e o botão "Calcular", impedindo alterações acidentais.

### 4. Modelo Termodinâmico Físico
* **Vapor**: Quando uma fórmula solicita `PROCV` com a tabela `Vapor` ou chama as funções `VAPOR_*` (ex: `VAPOR_H`, `VAPOR_S`), é resolvido via biblioteca `iapws` usando o padrão internacional **IAPWS-IF97** com suporte a pressões absolutas.
* **Densidade (`J270`)**: Resolvido via polinômio físico de densidade OIML a 20°C para misturas hidroalcoólicas baseado na variável de entrada de INPM (`J269`).

### 5. Consolidação do Plano de Safra (`backend/services.py` & `HarvestPlan.tsx`)
* **Agregação Mensal e Anual**: Consolida dados operacionais e de balanço ao longo dos 12 meses do ano safra selecionado com base nos cenários homologados/aprovados.
* **Operadores de Consolidação**:
  * `SUM`: Somatório dos valores mensais.
  * `AVERAGE`: Média aritmética simples dos meses.
  * `WEIGHTED_AVERAGE`: Média ponderada baseada em outra variável de peso (como volume de moenda).
  * `CALCULATE`: Avaliação da fórmula matemática usando como entradas os valores já consolidados de suas variáveis dependentes.
* **Ordenação de Meses Dinâmica**: Reordena a exibição e os cálculos de forma lógica e sequencial a partir do mês de início do ciclo configurado na tabela `harvest_plan_settings`.
