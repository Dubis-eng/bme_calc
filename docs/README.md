# 🗺️ Codebase Documentation Index Map

Este arquivo serve como mapa de entrada e índice principal para toda a documentação do projeto Calculadora de Balanço de Massa e Energia.

---

## 🚀 Status das Funcionalidades Técnicas
* **[DONE] Épico 1: Core de Cálculo** — Interpretador de fórmulas em árvore de sintaxe abstrata (AST) e ordenação por grafo topológico.
* **[DONE] Épico 2: Núcleo de Processo** — Integração de fórmulas de Vapor IAPWS-IF97 para resolver tabelas externas.
* **[DONE] Épico 3: Destilaria e Utilidades** — Resolução de funções avançadas (`LN`, `SUBTOTAL`, `SOMASES`), polinômio OIML de densidade do vinho (`H273`) e implementação do design system verde ciano (Maestro UI) com acessibilidade WCAG.
* **[DONE] Épico 4: Busca de Metas & Governança** — Solver numérico Scipy, banco PostgreSQL com modelagem SQLModel, versionamento incremental, travas de edição por status e relatórios PDF/Excel.
* **[DONE] Épico 5: Edição de Equações e Módulos** — Parser AST para IDs alfanuméricos descritivos, painel modular por Definição (`SectorModules`), modal de cadastro/edição de variáveis (`VariableModal`).
* **[DONE] [feat-009-subgroups-sectors.md](file:///c:/Users/dbzin/Documents/GitHub/bme_calc/docs/features/feat-009-subgroups-sectors.md)** — Navegação em Árvore (Subgrupos) e Cadastro de Setores.
* **[DONE] [feat-010-save-active-scenario.md](file:///c:/Users/dbzin/Documents/GitHub/bme_calc/docs/features/feat-010-save-active-scenario.md)** — Salvamento de Cenário Ativo e Prevenção de Perda de Dados.
* **[DONE] [feat-011-steam-lookup.md](file:///c:/Users/dbzin/Documents/GitHub/bme_calc/docs/features/feat-011-steam-lookup.md)** — Novo Memorial e Motor de Busca Termodinâmico.
* **[DONE] [feat-012-harvest-plan.md](file:///c:/Users/dbzin/Documents/GitHub/bme_calc/docs/features/feat-012-harvest-plan.md)** — Consolidação do Plano de Safra e Visualização Plurianual.
* **[DONE] [task-master.md](file:///c:/Users/dbzin/Documents/GitHub/bme_calc/docs/features/task-master.md)** — Lista sequencial e grafo de tarefas de todas as entregas do sistema.
* **[DONE] feat-013-harvest-settings** — Cadastro Dinâmico de Anos Safra e Meses de Referência (Épico 6, Tarefa 6.3): tabelas `harvest_years`/`harvest_months`, API CRUD, modal de Configurações do Sistema ⚙️ e seletores dinâmicos.
* **[DONE] Tarefa 6.2 (Editor Inteligente e Auditoria)** — Implementar realce e validação de sintaxe no editor, botão de auditoria para dependências e melhorias visuais.
* **[DONE] Tarefa 6.4 (Tolerância de Reciclo e Filtros de Tipo)** — Adicionar configuração dinâmica de tolerância do solucionador, exibição contínua do resíduo e botões rápidos para filtragem por tipo de variável.



---

## 📌 Backlog & Pendências de Arquitetura

### Épico 6: Usabilidade e Calendário de Produção (PENDENTE)
1. **Busca Global de Variável (6.1)**: Barra de pesquisa em tempo real por ID, Descrição ou Definição para navegação ágil no universo de +1000 variáveis durante edição de equações.
2. **Método Padronizado de Equações (6.2)**: Guia ou painel de referência rápida embutido na interface com a sintaxe aceita pelo motor AST (operadores, funções suportadas, formatos de ID válidos).
3. ~~**Cadastro de Meses e Anos de Safra (6.3)**~~ ✅ Concluído — tabelas `harvest_years`/`harvest_months`, CRUD via API, modal ⚙️ de Configurações do Sistema e seletores dinâmicos.

### Outros Backlog Técnicos
4. **Migração para Next.js**: Avaliada e classificada como pendência postergada. Não recomendada para o escopo atual (aplicação de página única interna corporativa). Reavaliar se houver necessidade de SEO público, rotas complexas ou SSR/SSG.
5. **Gerenciamento de Estado Global (Zustand)**: Mantido no backlog para caso no futuro seja necessário exibir todos os inputs de múltiplos setores em uma única tela contínua sem paginação, evitando re-renderizações desnecessárias.
6. **Internacionalização (i18n)**: Pendência de suporte nativo a múltiplos idiomas além do Português (pt-BR) se a ferramenta for utilizada em unidades internacionais.
