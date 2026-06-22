# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.8.0] - 2026-06-22

### Added
- **Ordenação Única de Setores (Sector Ordering)**: Adicionado o campo `ordem` no modelo de setores, implementando ordenação personalizada na barra de navegação.
- **Validação de Unicidade de Posição**: Implementada validação de unicidade da ordenação no backend (retornando erro 400 em caso de colisões) e no formulário de configuração no frontend (exibindo avisos explicativos).
- **Semeadura Sequencial por Incremento**: Ajustada a rotina de seeding do backend para atribuir ordenações sequenciais de 10 em 10 aos setores padrão com base na ordem física no JSON de premissas.

## [1.7.0] - 2026-06-18

### Added
- **Semeadura Automática do Banco (Database Seeding)**: Novo módulo `seeding.py` que lê as variáveis e equações padrão de `memorial_de_calculo_balanco.json` e popula as tabelas do banco no startup (se estiverem vazias), criando também o "Cenário Base (Inicial)".
- **Resolução de Erros de Unicidade e Enums no Seeding**: Mecanismo de UPSERT na semeadura para evitar colisões de chaves únicas com variáveis pendentes pré-criadas por dependências e coerção de status de erro para a especificação do enum.
- **Carregamento Automático de Cenários no Frontend**: O frontend agora consome a API para buscar e carregar automaticamente o cenário mais recente na inicialização, com fallback local robusto se a API falhar.
- **União Dinâmica de Setores**: Sidebar do frontend agora realiza a união dinâmica dos setores cadastrados no banco de dados e os presentes nas variáveis atuais, impedindo que setores sumam da barra lateral quando novos setores são configurados.

## [1.6.0] - 2026-06-17

### Added
- **Navegação em Árvore Hierárquica (Sidebar)**: Refatoração do menu lateral para exibir uma árvore de dois níveis (Setor -> Subgrupo/Definição) com colapso dinâmico e rolagem suave (smooth scroll) direcionada ao clicar em subgrupos.
- **Painel de Configurações de Setores**: Nova aba "Configurações" integrada na lateral direita do frontend (ao lado do Scenario Manager) permitindo o CRUD completo de setores (cadastro, edição de nome/descrição e exclusão).
- **Modelo Relacional de Setores (SQLModel)**: Criação da tabela `Sector` persistida no PostgreSQL com integridade referencial vinculando variáveis a setores e bloqueando exclusões de setores associados a variáveis ativas.

## [1.5.0] - 2026-06-16

### Added
- **Banco de Dados Relacional Normalizado (5 tabelas)**: Migração completa da coluna monolítica JSONB para uma estrutura normalizada de 5 tabelas (`scenarios`, `variables`, `equations`, `dependencies`, `results`) no PostgreSQL, aumentando a integridade e rastreabilidade dos dados.
- **Tratamento de Erros no AST (Rich Results)**: O interpretador de fórmulas AST agora propaga e persiste objetos de resultado detalhados (`{value, status, error_message}`) contendo erros explícitos como `DIV_BY_ZERO` e `MISSING_VAR` em vez de mascará-los silenciosamente com `0`.
- **Premissas de Cenário Dinâmicas**: Introdução do tipo de variável `CENARIO` para agrupar e exibir premissas de planejamento operacional (`DIA`, `APROVEITAMENTO_OPERACIONAL`, etc.) em um painel lateral separado de fácil edição.
- **Auditoria de Densidade P0 de Arquivos**: Realizada refatoração minuciosa do backend (através de `evaluator.py`, `schemas.py` e `services.py`) e componentização do frontend (através de `Header.tsx`, `Sidebar.tsx` e `ScenarioPremises.tsx`), reduzindo e mantendo o tamanho de todos os arquivos abaixo do limite máximo de 300 linhas físicas.

## [1.4.1] - 2026-06-14

### Added
- **Configuração do Git (.gitignore)**: Adicionado arquivo `.gitignore` estruturado na raiz do repositório para evitar envios indesejados ao GitHub. O arquivo ignora de forma inteligente arquivos de IDEs/sistema, diretórios do Python (`.venv`, `__pycache__`, `.pytest_cache`), pastas do Node.js (`node_modules`, `dist`, `build`), arquivos de banco locais (`*.db`), backups SQL (`*.sql`) e configurações confidenciais/sensíveis (`.env*`).

## [1.4.0] - 2026-06-13

### Added
- **Identificadores Alfanuméricos Customizados**: Nova extração de dependências no backend baseada em análise da AST (`ast.walk`), permitindo variáveis com nomes descritivos (ex: `MOENDA_RPM`) nas fórmulas sem quebrar o motor topológico.
- **Painéis Visuais de Definição (SectorModules)**: Exibição no frontend agrupada em cartões/módulos expansíveis por Definição do processo, contendo atalhos de inclusão rápida e tabelas independentes.
- **Modal de Variáveis (VariableModal)**: Formulário para cadastro e edição direta de variáveis e equações com suporte a autocompletar e validação de nomes/unicidade.
- **Persistência Completa no Postgres**: Estrutura de variáveis do cenário e equações atualizadas passam a residir exclusivamente no banco de dados.

## [1.3.0] - 2026-06-12

### Added
- **PostgreSQL Persistence (SQLModel)**: Added Docker-based PostgreSQL database with JSONB columns to persist the full 1108 variables payload for scenarios.
- **Goal Seek Optimization Solver**: Integrated Scipy root-finding optimizer (Brentq/Secant/Nelder-Mead fallback) to adjust inputs for target outputs.
- **Scenario Versioning & Status Locking**: Automates version incrementing on save. Congested scenarios (status 'Aprovado' or 'Final') freeze input fields and disable calculations in the frontend.
- **Scenario Manager Sidebar Component**: Created modular ScenarioManager component to list, save, load, and change status of scenarios.
- **Goal Seek progressive modal**: Created Goal Seek modal offering progressive options (implied bounds / advanced custom bounds).
- **PDF & XLSX Export Endpoints**: Backend routes using ReportLab and openpyxl to download fully evaluated reports.

## [1.2.0] - 2026-06-12

### Added
- **Epic 3 Excel Formulas**: Implemented parser support in backend FormulaEvaluator AST for `LN(x)`, `SUBTOTAL(9, ...)` and conditional sum `SOMASES(sum_range, criteria_range, criterion)`.
- **Wine Density calculation (H273)**: Replaced INDEX-MATCH lookup querying missing `Densidade` sheet with physical polynomial approximation: `density = 0.99823 - 0.001625 * I - 0.0000045 * I^2`.
- **Dynamic Warning Banners**: Frontend now scans active sector variables for missing sheets (`Vapor!` and `Densidade!`) and displays a colored amber warning listing the exact variable IDs resolved via thermodynamic/OIML physics.
- **Accessibility Improvements**: Added label associations for header select elements, `aria-label` attributes on table inputs, screen-reader-only labels, a skip-to-main-content link, and keydown handler on Calculate button.

### Changed
- **Visual Design**: Switched colors from violet/indigo to compliant teal/cyan gradients and accents, satisfying UX Maestro guidelines.
- **Architectural Cleanup**: Compressed `backend/engine.py` and `frontend/src/App.tsx` below 300 lines to satisfy strict density rules.
- **Linter & Audits**: Added `.venv` and `venv` to ignored directories in validation scripts.

## [1.1.0] - 2026-06-12

### Added
- **Epic 2 Process Core**: Integrates thermodynamic calculations using `iapws` package in backend engine to resolve steam-related lookups (`PROCV` query to `Vapor` table).
- ** Collapsible Sidebar**: Implemented retractable sidebar in React frontend for responsive navigation.
