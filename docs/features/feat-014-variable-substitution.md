---
id: FEAT-014
title: Função de Substituição de Variáveis nas Equações
status: done
prd_reference: Solicitação do Usuário - Substituição de Variáveis
last_updated: 2026-06-27
---

# 🔁 Função de Substituição de Variáveis nas Equações

## 1. Descrição do Problema
No planejamento industrial e na modelagem matemática de balanço de massa, os usuários frequentemente criam variáveis intermediárias que posteriormente se tornam redundantes ou precisam ser substituídas.
Por exemplo, se a variável `J168` depende de `J34` (ex: `=J34 + 10`) e a variável `J167` depende de `J168` (ex: `=J168 * 2`), o usuário deseja substituir `J168` por `J34` nas fórmulas que usam `J168`. Isso exige:
1. **Tratamento de Precedência Matemática:** Substituir a variável pela sua expressão matemática correspondente envolta em parênteses para manter a integridade operacional (ex: transformando `=J168 * 2` em `=(J34 + 10) * 2`).
2. **Substituição em Cadeia (Recursiva):** Possibilidade de inativar/eliminar a redundância do grafo propagando a substituição em todos os níveis subsequentes de dependência.
3. **Pré-visualização (Preview):** Exibição de um painel mostrando a mudança das fórmulas ("Antes e Depois") para aprovação antes de persistir no banco.
4. **Gerenciamento de Órfãos:** Identificar se a variável substituída ficou sem uso e sugerir arquivamento lógico (`descontinuada`) ou exclusão física.

## 2. Escopo da Solução

### Backend (`backend/`)
1. **Algoritmo de Substituição com AST e `ast.unparse`:**
   - Criar uma rotina em `backend/engine.py` ou módulo de serviço que utilize `ast.NodeTransformer` para substituir referências a um identificador específico por uma expressão correspondente.
   - Utilizar a precedência natural do compilador Python com `ast.unparse` para adicionar parênteses apenas quando necessário, garantindo que expressões com operadores de menor precedência sejam envoltas em parênteses de forma matematicamente correta.
2. **End-points de Substituição (`backend/main.py` e `services_variables.py`):**
   - **`POST /api/variables/{id}/replace-preview`**:
     - Parâmetros: `target_id` (a ser substituída), `recursive` (boolean).
     - Retorno: lista de fórmulas afetadas (id, nome, setor, antes, depois) e se o alvo se tornou órfão (`becomes_unused`).
   - **`POST /api/variables/{id}/replace-confirm`**:
     - Parâmetros: `target_id`, `recursive` (boolean), `action_unused` (enum: `None`, `archive`, `delete`).
     - Persiste as equações atualizadas no banco (`equations` e atualiza a tabela `dependencies` recalculando dependências).
     - Se `action_unused` for `archive`, atualiza o status da variável para `descontinuada`.
     - Se `action_unused` for `delete`, deleta fisicamente a variável e seus resultados/dependências associados de forma segura dentro de uma transação.

### Frontend (`frontend/src/`)
1. **Painel / Modal de Substituição:**
   - Integrar no painel de edição de variáveis (ou barra de ferramentas do editor de equações) um botão "Substituir Variável".
   - Abrir um modal onde o usuário pode escolher a variável substituta de uma lista autocompletável.
   - Adicionar uma chave de seleção (switch/checkbox) para habilitar "Substituição em Cadeia (Recursiva)" (Cascade).
2. **Impacto e Preview ("Antes e Depois"):**
   - Exibir uma tabela com "Antes e Depois" de todas as equações que serão modificadas.
   - Mostrar avisos claros em vermelho se houver erros e destacar em verde os trechos de equações alterados.
3. **Opções para Variável Órfã:**
   - Caso a variável de origem deixe de ser usada em qualquer fórmula do sistema após a substituição, exibir uma mensagem especial e um checkbox para "Arquivar Variável (Descontinuar)" ou "Excluir permanentemente do sistema (Aviso de segurança)".

## 3. Planos de Teste e Validação
- **Testes Unitários no Backend:** Validar substituições com diferentes precedências matemáticas (soma, multiplicação, funções, etc.) e verificar se a conversão do AST preserva a precedência correta dos operadores matemáticos.
- **Testes do Endpoint:** Validar requisições de preview e confirmação de substituição.
- **Validação de Banco de Dados:** Confirmar que as tabelas `equations`, `dependencies` e `results` são atualizadas/limpas corretamente.
