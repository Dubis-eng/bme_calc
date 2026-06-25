---
id: FEAT-010
title: Salvamento de Cenário Ativo e Prevenção de Perda de Dados
status: ongoing
prd_reference: Chamado do Usuário - Melhoria no método de atualização da versão
last_updated: 2026-06-22
---

# Salvamento de Cenário Ativo e Prevenção de Perda de Dados

## 1. Descrição do Problema
Atualmente, quando o usuário edita variáveis e realiza recálculos de um cenário carregado, as alterações residem apenas no estado reativo do React (`variables` no `App.tsx`). Não há nenhuma opção para persistir essas edições no cenário ativo se o status for "Em Edição" (a não ser gerando uma versão incrementada nova pelo botão "Salvar Novo Cenário / Versão"). Se o usuário sair do app, ele perde as edições.

## 2. Escopo da Solução

### Backend:
- Adicionar uma rota `PUT /api/scenarios/{id}` para atualizar as variáveis de um cenário existente.
- A rota deve verificar se o cenário existe e se o status é `Em Edição`. Caso o status seja `Aprovado` ou `Final`, deve bloquear a edição retornando erro `400 Bad Request`.
- O endpoint atualizará as linhas correspondentes da tabela `results` com os novos valores calculados/digitados e as expressões correspondentes. Atualizará também o campo `updated_at` do cenário.

### Frontend:
- Adicionar o botão "Salvar Alterações" no `ScenarioManager` (dentro da caixa do cenário ativo, visível apenas quando o status for "Em Edição").
- Implementar controle de alterações pendentes (`hasUnsavedChanges` no estado do `App.tsx`).
- O botão "Salvar Alterações" mudará de cor ou exibirá um indicador caso existam alterações pendentes.
- Implementar o evento nativo `beforeunload` para emitir um alerta ao usuário caso ele tente fechar ou atualizar a aba com alterações pendentes não salvas.
- Exibir alertas visuais não obstrutivos se o cenário for salvo com erros de cálculo/convergência.
