# HITL Review — Especificação de Persistência e Filtragem Reativa de Status

Este documento resume as decisões e o escopo acordado para a implementação da funcionalidade de Persistência e Filtragem de Status do Dashboard na Tabela de Equações (Épico 16).

## 📋 Resumo das Decisões do Usuário

1. **Persistência Bidirecional:** O estado do filtro de status do dashboard ("Convergido", "Com Erro", "Pendente") será elevado para o `App.tsx` e compartilhado bidirecionalmente entre o Dashboard e a tabela de equações (`SectorModules.tsx`). Qualquer mudança na tabela de equações altera o estado global e reflete no Dashboard ao voltar.
2. **Interação com Filtro por Tipo:** O filtro de status e o filtro por tipo (INPUT, OUTPUT, etc.) irão se acumular (operação lógica E).
3. **Classificação de Status por Variável:**
   - **Convergidos:** Apenas variáveis que possuem equações calculadas (tipo diferente de `INPUT` e `CENARIO`) e cujo status de resultado é `"OK"`.
   - **Com Erro:** Apenas variáveis que possuem equações calculadas e cujo status de resultado é diferente de `"OK"` e diferente de `"PENDING"`.
   - **Pendente:**
     - Variáveis calculadas que possuem status de resultado `"PENDING"` ou sem resultado calculado.
     - Variáveis do tipo `INPUT` ou `CENARIO` que estiverem vazias ou apenas com espaços em branco (sem valor).
4. **Interface (UI/UX):** Será adicionada uma barra visual de filtro de status no componente `SectorModules.tsx` para permitir visualizar o filtro atual, alterá-lo localmente ou limpá-lo.

## 🚀 Próximos Passos
- Aguardar aprovação do plano de implementação pelo usuário para prosseguir à fase de execução (/dev).
