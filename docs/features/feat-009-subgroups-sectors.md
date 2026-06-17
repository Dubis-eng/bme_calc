---
id: FEAT-009
title: Navegação em Árvore (Subgrupos) e Cadastro de Setores
status: done
prd_reference: docs/prd/PRD Complementar.md
last_updated: 2026-06-17
---

# 📑 Especificação: Árvore de Subgrupos e Cadastro de Setores

Esta funcionalidade expande a Calculadora de Balanço de Massa e Energia (BME Calc) com um cadastro relacional de Setores no banco de dados e navegação em árvore por Setor -> Subgrupo (Definição) no menu lateral.

---

## 1. Escopo Técnico & Regras de Negócio

### 1.1 Cadastro Relacional de Setores (Backend)
1. **Nova Tabela `sectors`**:
   - `id`: string (chave primária, código técnico em caixa alta, ex: `"MOAGEM"`).
   - `nome`: string (nome amigável para exibição, ex: `"Moagem e Preparo"`).
   - `descricao`: string (opcional).
2. **Atualização da Tabela `variables`**:
   - A coluna `setor` será uma chave estrangeira (`foreign_key`) apontando para `sectors.id`.
3. **Regra de Integridade Referencial**:
   - Não será permitida a exclusão de um setor que possua variáveis vinculadas. O sistema retornará erro `HTTP 400 Bad Request` informando a quantidade de variáveis órfãs.
4. **Semeadura & Migração**:
   - No startup da API backend, caso a tabela `sectors` esteja vazia, uma rotina de migração inspecionará os setores existentes na tabela `variables`, cadastrará os setores correspondentes com nome amigável pré-formatado (ex: `"DIFUSOR"` -> `"Difusor"`) e atualizará a associação.

### 1.2 Navegação em Árvore (Frontend)
1. **Sidebar Hierárquica (`Sidebar.tsx`)**:
   - Renderizar uma árvore expandível de dois níveis:
     - **Nível 1**: Setores cadastrados no banco.
     - **Nível 2**: Subgrupos (campo `DEFINIÇÃO` das variáveis daquele setor) pertencentes ao setor.
2. **Rolagem Suave (Scroll to Subgroup)**:
   - Ao clicar em um subgrupo da árvore na Sidebar, a tela central rolará suavemente (`scrollIntoView({ behavior: 'smooth' })`) até o cabeçalho/card daquele subgrupo no painel de módulos.

### 1.3 Painel de Configurações (Config Panel)
1. **Aba de Configurações**:
   - Integrada na lateral direita junto ao gerenciador de cenários através de abas ("Cenários" / "Configurações").
2. **CRUD de Setores**:
   - Listagem dos setores cadastrados.
   - Cadastro de novo setor (com validação de ID único em caixa alta e nome amigável).
   - Edição de nome amigável de setor existente.
   - Exclusão de setor (respeitando a regra de integridade).

---

## 2. Endpoints de API (Novos)

* `GET /api/sectors`: Retorna a lista de setores cadastrados.
* `POST /api/sectors`: Cadastra um novo setor.
* `PATCH /api/sectors/{id}`: Atualiza o nome ou descrição de um setor.
* `DELETE /api/sectors/{id}`: Remove um setor (bloqueado se houver variáveis dependentes).

---

## 3. Plano de Verificação

### Testes Automatizados
* Validar integridade referencial: tentar excluir um setor com variáveis vinculadas deve retornar erro `400`.
* Validar cadastro de setor: tentar cadastrar setor com ID duplicado deve retornar erro.

### Verificação Manual
* Expandir e colapsar setores na árvore lateral.
* Clicar em um subgrupo na Sidebar e validar a rolagem suave.
* Cadastrar e alterar um setor no painel de configurações.
