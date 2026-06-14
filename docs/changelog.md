# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
