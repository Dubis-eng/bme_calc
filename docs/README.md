# 🗺️ Codebase Documentation Index Map

Este arquivo serve como mapa de entrada e índice principal para toda a documentação do projeto Calculadora de Balanço de Massa e Energia.

---

## 🚀 Status das Funcionalidades Técnicas
* **[DONE] Épico 1: Core de Cálculo** — Interpretador de fórmulas em árvore de sintaxe abstrata (AST) e ordenação por grafo topológico.
* **[DONE] Épico 2: Núcleo de Processo** — Integração de fórmulas de Vapor IAPWS-IF97 para resolver tabelas externas.
* **[DONE] Épico 3: Destilaria e Utilidades** — Resolução de funções avançadas (`LN`, `SUBTOTAL`, `SOMASES`), polinômio OIML de densidade do vinho (`H273`) e implementação do design system verde ciano (Maestro UI) com acessibilidade WCAG.
* **[DONE] Épico 4: Busca de Metas & Governança** — Solver numérico Scipy, banco PostgreSQL com modelagem SQLModel, versionamento incremental, travas de edição por status e relatórios PDF/Excel.
* **[DONE] Épico 5: Edição de Equações e Módulos** — Parser AST para IDs alfanuméricos descritivos, painel modular por Definição (`SectorModules`), modal de cadastro/edição de variáveis (`VariableModal`).
* **[DONE] [docs/features/task-master.md](file:///c:/Users/Dubis/Documents/GitHub/bme_calc/docs/features/task-master.md)** — Lista sequencial e grafo de tarefas de todas as entregas do sistema.

---

## 📌 Backlog & Pendências de Arquitetura

### Épico 6: Usabilidade e Calendário de Produção (PENDENTE)
1. **Busca Global de Variável (6.1)**: Barra de pesquisa em tempo real por ID, Descrição ou Definição para navegação ágil no universo de +1000 variáveis durante edição de equações.
2. **Método Padronizado de Equações (6.2)**: Guia ou painel de referência rápida embutido na interface com a sintaxe aceita pelo motor AST (operadores, funções suportadas, formatos de ID válidos).
3. **Cadastro de Meses e Anos de Safra (6.3)**: Migrar o seletor estático para cadastro dinâmico no PostgreSQL com calendário real de operação, como base para acompanhamento histórico e projeções por período.

### Outros Backlog Técnicos
4. **Migração para Next.js**: Avaliada e classificada como pendência postergada. Não recomendada para o escopo atual (aplicação de página única interna corporativa). Reavaliar se houver necessidade de SEO público, rotas complexas ou SSR/SSG.
5. **Gerenciamento de Estado Global (Zustand)**: Mantido no backlog para caso no futuro seja necessário exibir todos os inputs de múltiplos setores em uma única tela contínua sem paginação, evitando re-renderizações desnecessárias.
6. **Internacionalização (i18n)**: Pendência de suporte nativo a múltiplos idiomas além do Português (pt-BR) se a ferramenta for utilizada em unidades internacionais.
