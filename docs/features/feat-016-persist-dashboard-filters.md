---
id: FEAT-016
title: Persistência e Filtragem Reativa de Status do Dashboard na Tabela de Equações
status: done
prd_reference: docs/README.md
last_updated: 2026-06-29
---

# 🎯 FEAT-016: Persistência e Filtragem de Status

## Requisitos de Negócio
1. O filtro de status selecionado no Dashboard ("Convergido", "Com Erro", "Pendente") deve persistir quando o usuário navega para a tabela de equações de um setor.
2. Na tabela de equações, deve haver uma barra visual de filtro de status (semelhante à de tipo) para que o usuário possa visualizar qual filtro está ativo e alterá-lo diretamente ali.
3. A persistência deve ser bidirecional: se o usuário alterar o filtro de status na tabela de equações, essa alteração deve ser refletida no Dashboard quando ele voltar para a visão geral.
4. Classificação de Status para Variáveis:
   - **Convergido (ok):** Apenas equações calculadas (não inputs/cenários) cujo resultado de cálculo seja bem sucedido (`status === 'OK'`).
   - **Com Erro (error):** Apenas equações calculadas cujo resultado tenha falhado (`status !== 'OK' && status !== 'PENDING'`).
   - **Pendente (idle):**
     - Equações calculadas que estejam pendentes de cálculo (`status === 'PENDING'` ou sem entrada de resultados).
     - Variáveis do tipo `INPUT` ou `CENARIO` que estiverem sem valor algum (vazias/espaço em branco).

## Plano de Implementação

### Componentes Afetados
- `frontend/src/App.tsx`: Gerenciamento do estado global do filtro de status.
- `frontend/src/components/StatusDashboard.tsx`: Integração com o estado global herdado de `App.tsx`.
- `frontend/src/components/SectorModules.tsx`: Exibição da nova barra de filtro de status e aplicação do algoritmo de filtragem por status nas variáveis exibidas.

## Critérios de Aceitação
- Navegar do dashboard com "Com Erro" ativado para o setor "Moenda" deve exibir apenas as variáveis com erro de cálculo no setor Moenda.
- Alterar o filtro localmente na tabela de equações para "Todos" e clicar em "Dashboard" na breadcrumb deve exibir todos os setores no dashboard.
- Variáveis do tipo INPUT/CENARIO sem valor devem ser exibidas sob o filtro "Pendente".
- Arquivos modificados não devem violar o limite de 300 linhas físicas.
