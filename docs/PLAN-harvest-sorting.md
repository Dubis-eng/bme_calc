# Plano de Projeto: Ordenação Personalizada e Divisores no Plano de Safra

## Goal
Implementar ordenação personalizada e linhas divisórias de agrupamento na exibição do Plano de Safra consolidado, mantendo a consistência no frontend, backend, e nas exportações (Excel/PDF).

---

## Tasks

### Fase 1: Banco de Dados e Migração
- [ ] **Tarefa 1.1 (Modelagem):** Adicionar a classe `HarvestPlanOrderedItem` em `backend/database.py`. -> *Verificar:* Presença da classe com campos `id`, `ordem`, `tipo`, `variable_id`, `label`.
- [ ] **Tarefa 1.2 (Migração):** Atualizar `backend/migrations.py` para criar a tabela `harvest_plan_ordered_items` no startup. -> *Verificar:* Tabela criada com sucesso ao iniciar o backend.
- [ ] **Tarefa 1.3 (Inativação):** Ajustar o serviço de inativação de variáveis em `backend/services_variables.py` para remover a variável da tabela de ordenação se ela for inativada. -> *Verificar:* Inativar variável remove seu item de ordenação correspondente.

### Fase 2: Serviços e Endpoints (Backend)
- [ ] **Tarefa 2.1 (Serviço de Estrutura):** Em `backend/services_harvest_plan.py`, implementar `get_harvest_plan_structure(db)` e `save_harvest_plan_structure(items, db)`. -> *Verificar:* Chamada correta salvando e retornando a estrutura.
- [ ] **Tarefa 2.2 (Sincronização Automática):** Garantir que variáveis ativas com `in_harvest_plan == True` que não estejam na ordenação sejam anexadas automaticamente ao final (ou listadas como sem agrupamento). -> *Verificar:* Variáveis órfãs aparecem no final da lista.
- [ ] **Tarefa 2.3 (Consolidação Ordenada):** Atualizar `calculate_harvest_plan_consolidation(year_harvest, db)` para retornar a lista de variáveis e divisores ordenada segundo a tabela de estrutura. -> *Verificar:* Retorno do endpoint `/api/harvest-plan/consolidation` vem no formato ordenado correto.
- [ ] **Tarefa 2.4 (API Router):** Criar as rotas `GET` e `POST` para `/api/harvest-plan/structure` em `backend/main.py`. -> *Verificar:* Requisições HTTP retornando 200 OK.

### Fase 3: Interface Reativa (Frontend)
- [ ] **Tarefa 3.1 (Controles de Edição e Cadeado):** Implementar estado de edição (`isEditing`) e botão de cadeado (`🔓/🔒`) em `frontend/src/components/HarvestPlan.tsx`. -> *Verificar:* Toggle do botão alterna modo visual e edição.
- [ ] **Tarefa 3.2 (Adição de Divisores):** Criar controles de input de texto e botão para criar divisores quando o cadeado estiver aberto. -> *Verificar:* Divisores adicionados aparecem no final do plano.
- [ ] **Tarefa 3.3 (Drag-and-Drop e Botões Sobe/Desce):** Implementar reordenação de linhas da tabela via HTML5 drag-and-drop e botões acessíveis de Seta em `frontend/src/components/HarvestPlanTable.tsx`. -> *Verificar:* Usuário consegue reordenar linhas visualmente.
- [ ] **Tarefa 3.4 (Exibição e Edição de Divisores):** Divisores exibem inputs de texto para edição inline do título e botão de lixeira para remoção rápida. -> *Verificar:* Exclusão e renomeação de divisores funcionam em modo edição.
- [ ] **Tarefa 3.5 (Persistência ao Fechar Cadeado):** Ao fechar o cadeado, disparar salvamento chamando o endpoint `POST /api/harvest-plan/structure` e recarregar a visualização consolidada normal. -> *Verificar:* A nova ordem persiste após o recarregamento.

### Fase 4: Relatórios e Exportações (Excel/PDF)
- [ ] **Tarefa 4.1 (Exportações PDF/Excel):** Ajustar `backend/exports.py` para ler a tabela de estrutura e renderizar divisores como linhas destacadas e mescladas. -> *Verificar:* Relatórios gerados contêm os títulos dos agrupamentos nas posições corretas.

---

## Done When
- [ ] Banco de dados com tabela de ordenação configurado e migrado.
- [ ] Endpoints de estrutura criados e funcionais.
- [ ] Interface de reordenação com drag-and-drop e botões operando sob controle de cadeado.
- [ ] Divisores de agrupamento renderizados perfeitamente na visualização e nas exportações (Excel/PDF).
- [ ] Limite estrito de 300 linhas físicas respeitado em todos os arquivos modificados.

---

## Restrições de Linhas (Fila Audit)
* `backend/services_harvest_plan.py` (Linhas atuais: 280) - Desenvolver lógica de ordenação de forma enxuta para não estourar o limite de 300 linhas.
* `frontend/src/components/HarvestPlan.tsx` (Linhas atuais: 257) - Se necessário, refatorar para manter abaixo de 300 linhas.
* `frontend/src/components/HarvestPlanTable.tsx` (Linhas atuais: 183) - Implementar reordenação de forma modular para evitar estouro das 300 linhas.
