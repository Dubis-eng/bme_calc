# HITL Review — Especificação de Ordenação em Cascata de Variáveis

Este documento resume as decisões e o escopo acordado para a implementação da funcionalidade de Ordenação em Cascata das Variáveis (Épico 18).

## 📋 Resumo das Decisões do Usuário

1. **Arquitetura de Banco de Dados Normalizada (Opção 3):**
   * Criação de tabelas dedicadas: `stages` (Etapas) e `control_points` (Pontos de Controle) com chaves estrangeiras apropriadas.
   * `Variable` passará a referenciar o ID de `control_points` através de `control_point_id`.
   * Campos antigos de `etapa` e `ponto_controle` em texto simples serão mantidos apenas como legados/nulos, sendo gradualmente removidos. No entanto, o retorno JSON do endpoint continuará populando esses campos para manter compatibilidade reversa com o restante do sistema.

2. **Interface Visual (UI/UX) com Drag-and-Drop + Botões (Sobe/Desce) Acessíveis:**
   * A interface principal de ordenação será baseada em **Arrastar e Soltar (Drag-and-Drop)** nativo (HTML5) para permitir reordenar rapidamente listas longas de variáveis (+1000).
   * Adicionalmente, teremos botões de setas "Sobe" / "Desce" discretos que respondem a navegação física por teclado para garantir total acessibilidade (WCAG).
   * Isso será implementado em três níveis:
     * **Nível 1 (Etapa):** Reordenação no cabeçalho do acordeão de etapas.
     * **Nível 2 (Ponto de Controle):** Reordenação no cabeçalho da barra do Ponto de Controle.
     * **Nível 3 (Variável):** Reordenação de linhas da tabela de variáveis.
   * Ao soltar um elemento arrastado ou clicar nas setas, a UI atualiza instantaneamente a ordem em tela e envia o novo sequenciamento em lote via endpoint `PATCH` ao backend.

3. **Migração de Dados Baseline:**
   * A migração lerá os campos atuais `etapa` e `ponto_controle` das variáveis, criará as entidades normalizadas correspondentes e associará as variáveis a elas.
   * A ordenação baseline inicial será feita em ordem alfabética para Etapas, Pontos de Controle e Variáveis (ID/Ref), e receberão números de ordem de 10 em 10 (10, 20, 30...) estabelecendo uma baseline limpa.

## 🚀 Próximos Passos
- Avançar automaticamente para a fase de planejamento (/plan), que gerará o grafo de tarefas detalhado no `task-master.md` e o plano de implementação (`implementation_plan.md`).
