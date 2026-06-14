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
│   ├── exports.py        # Módulos de exportação de relatórios PDF e Excel
│   ├── main.py           # Endpoints de API e roteamento de requisições
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
Persiste o estado das 1108 variáveis em uma coluna do tipo `JSONB` no PostgreSQL.
* **Versionamento Incremental**: O backend localiza automaticamente a versão máxima para aquele período e incrementa (`version + 1`).
* **Bloqueio de Edição**: Caso o status do cenário no banco mude para `Aprovado` ou `Final`, o frontend desabilita todas as caixas de texto de entrada e o botão "Calcular", impedindo alterações acidentais.

### 4. Modelo Termodinâmico Físico
* **Vapor**: Quando uma fórmula solicita `PROCV` com a tabela `Vapor`, é resolvido via biblioteca `iapws` usando o padrão internacional **IAPWS-IF97** para vapor saturado.
* **Densidade (`H273`)**: Resolvido via polinômio físico de densidade OIML a 20°C para misturas hidroalcoólicas baseado na variável de entrada de INPM (`H272`).
