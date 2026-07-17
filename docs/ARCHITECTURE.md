# 🏛️ Documento de Arquitetura de Software

Este documento detalha o blueprint de arquitetura técnica, fluxo de dados e decisões estruturais da Calculadora de Balanço de Massa e Energia.

---

## 🗺️ Mapa de Diretórios do Projeto
```text
bme_calc/
├── .agent/               # Toolkit de automação do Antigravity Kit
├── backend/              # Aplicação de API Backend (FastAPI + Python)
│   ├── data/             # Sementes e planilhas de referência (.json, .xlsx)
│   ├── legacy/           # Códigos legados e migrações obsoletas
│   ├── src/              # Código fonte principal do Backend
│   │   ├── api/          # Rotas e controladores da API FastAPI
│   │   ├── core/         # Motores matemáticos, solvers AST e Goals Seek
│   │   ├── db/           # Conexão de banco, modelos e seeding
│   │   ├── schemas/      # Modelos de validação Pydantic
│   │   ├── services/     # Regras de negócios (safra, pdf, reordenação)
│   │   └── main.py       # Ponto de entrada FastAPI
│   ├── scripts/          # Utilitários de linha de comando e conversores
│   ├── tests/            # Suíte de testes automatizados pytest
│   ├── Dockerfile
│   └── requirements.txt
├── docs/                 # Documentação técnica e governança do projeto
│   ├── features/         # Especificações de entregas (task-master.md)
│   └── ARCHITECTURE.md   # Este arquivo
├── frontend/             # Aplicação Frontend (React + TypeScript)
│   └── src/
│       ├── components/   # Componentes modulares organizados por subpastas de domínio
│       │   ├── calculator/ # Visualizações da calculadora principal
│       │   ├── goalseek/   # Modal de busca de metas
│       │   ├── harvest-plan/ # Tabelas do plano de safra
│       │   ├── layout/     # Estrutura base da página (Header, Sidebar, RightPanel)
│       │   ├── scenario/   # Gerenciamento de cenários
│       │   ├── search/     # Painel de pesquisa de variáveis
│       │   ├── sectors/    # Exibição e ordenação de setores
│       │   ├── settings/   # Configurações do sistema
│       │   ├── ui/         # Componentes reutilizáveis básicos (Input)
│       │   └── variables/  # Modal de edição de variáveis e fórmulas
│       ├── hooks/        # Custom hooks de estado e busca de dados
│       ├── pages/        # Telas/páginas principais do app
│       ├── state/        # Gerenciamento de estado global (Jotai/Atoms)
│       ├── styles/       # Temas e arquivos CSS
│       └── utils/        # Conversores e helpers genéricos
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
* **Estrutura Ordenada e Divisores**: Suporte a ordenação arbitrária por drag-and-drop e a inserção de divisores de agrupamento. A estrutura e ordem de exibição são persistidas na tabela `harvest_plan_ordered_items`.
* **Exportação de Relatórios**: Geração de PDFs estruturados em formato paisagem (ReportLab) e planilhas Excel (OpenPyXL) que replicam fielmente a ordenação e os divisores destacados.
