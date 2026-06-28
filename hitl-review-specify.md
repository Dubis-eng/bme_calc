# HITL Review — Especificação de Substituição de Variáveis

Este documento resume as decisões e o escopo acordado para a implementação da funcionalidade de Substituição de Variáveis no sistema de Balanço de Massa e Energia.

## 📋 Resumo das Decisões do Usuário

1. **Método de Substituição:** A variável será substituída pelo corpo de sua expressão matemática correspondente. Toda substituição será encapsulada em parênteses de forma a manter a precedência dos operadores (ex: `J168` com `=J34 + 10` substituído em `=J168 * 2` resultará em `=(J34 + 10) * 2`).
2. **Cascata Recursiva:** O sistema suportará a propagação recursiva da substituição ao longo de toda a árvore de dependência descendente (ex: inlining de toda a cadeia `J34 -> J168 -> J167 -> J166` caso o usuário habilite a opção).
3. **Limpeza de Órfãs:** Se a variável substituída deixar de ser usada, o modal de confirmação no frontend sugerirá descontinuar (soft-delete) ou excluir permanentemente (hard-delete com aviso de segurança).
4. **Pré-visualização (Preview):** O usuário poderá ver uma comparação "Antes e Depois" detalhada de todas as equações que serão afetadas antes de confirmar a persistência no banco.

## 🚀 Próximos Passos
- Aguardar aprovação do plano de implementação pelo usuário.
- Iniciar a execução das tarefas (Épico 14).
