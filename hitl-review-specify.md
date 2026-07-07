# HITL Review — Especificação de Ordenação Personalizada e Divisores no Plano de Safra

Este documento resume as decisões e o escopo acordado para a implementação da funcionalidade de Ordenação Personalizada e Divisores no Plano de Safra (Épico 21).

## 📋 Resumo das Decisões do Usuário

1. **Modelagem de Dados Normalizada:**
   * Criação da tabela `harvest_plan_ordered_items` no PostgreSQL/SQLite.
   * A tabela armazenará tanto variáveis (`tipo = "variable"`) quanto divisores (`tipo = "divider"`).
   * **Nova Variável:** Adicionada no final da lista quando marcada no plano.
   * **Variáveis Não Agrupadas (Fallback):** Qualquer variável ativa no plano de safra que não possuir registro correspondente na tabela de ordenação ou que esteja órfã de agrupamento será exibida no final sob o cabeçalho virtual `"Variáveis Sem Agrupamento"`.
   * **Inativação:** Ao inativar uma variável no sistema, seu registro de ordenação é removido.

2. **Interface Visual (UI/UX) Unificada:**
   * Unificação das funções de visualização e organização na sub-aba **Visualização Consolidada**.
   * Adição de um botão de **Cadeado (🔓 Modo Edição / 🔒 Visualização)**.
   * **Modo Edição (Cadeado Aberto):** Habilita reordenação via drag-and-drop e botões discretos (Sobe/Desce para acessibilidade WCAG) e permite adicionar divisores.
   * **Modo Visualização (Cadeado Fechado):** Exibe a tabela consolidada normal com divisores renderizados como linhas mescladas de largura total com visual destacado Maestro UI (fundo slate, bordas teal, texto em caixa alta e negrito).

3. **Consistência nas Exportações:**
   * O relatório PDF e a planilha Excel exportados refletirão fielmente a ordenação e os divisores configurados na tela, renderizando as divisórias como linhas mescladas com destaque visual.

## 🚀 Próximos Passos
- Avançar para a fase de planejamento (/plan), gerando o grafo de tarefas detalhado no `task-master.md` e o plano de implementação (`implementation_plan.md`).
