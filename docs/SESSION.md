# SESSION

> Last updated: 2026-06-27

## Status
- Status: ACCEPTED
- Última Sessão: Configuração de Tolerância do Solucionador e Filtros por Tipo de Variável (Tarefa 6.4)
- Entregues:
  - Adicionado suporte a tolerância dinâmica de resíduos no motor de cálculo (`engine.py`) e retorno do resíduo de malha (`max_delta`) nas chamadas de cálculo do backend.
  - Implementada exibição contínua do resíduo numérico no Header ao lado do contador de iterações, com coloração de aviso em laranja se o resíduo superar a tolerância limite do usuário.
  - Adicionada aba "Solucionador" nas Configurações do Sistema para ajustar a tolerância de resíduos (salva no localStorage do navegador e enviada nas requisições do simulador).
  - Adicionados botões rápidos (pills) para filtragem por tipo de variável (Todos, INPUT, OUTPUT, Cenário, Derivada) na Calculadora (`SectorModules.tsx`) e no Plano de Safra (`HarvestPlan.tsx`), simplificando a navegação de grandes volumes de dados.
- Próximos Passos:
  - Backlog geral de usabilidade do Épico 6.


