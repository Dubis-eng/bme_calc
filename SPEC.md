# Specification Document — Épico 27: Refinamento Interativo de Fluxogramas por Setor

## 1. Visão Geral e Objetivo
Evolução do módulo de fluxogramas interativos do `bme_calc` para resolver problemas de persistência ao alternar abas, desvincular o seletor de cenários da página de variáveis para torná-lo um seletor dinâmico e independente na toolbar, implementar edição e renomeação completa de blocos via modal com filtros cascata (`Setor → Etapa/Processo → Ponto de Controle → Variável`), e suporte ao gerenciamento de setores no fluxo.

## 2. Requisitos Funcionais

### RF-01: Persistência Confiável do Layout Customizado
- O layout salvo pelo usuário na tabela PostgreSQL `sector_flowcharts` é a fonte primária de verdade.
- Trocar de aba de setor no aplicativo **NUNCA** pode resetar nem perder o posicionamento, conexões ou nomes de blocos salvos pelo usuário.
- O botão "Resetar / Ver Padrão" permite alternar temporariamente para a topologia automática baseada no cadastro relacional, sem apagar o layout salvo até que um novo salvamento seja confirmado.

### RF-02: Seletor Dinâmico e Independente de Cenários na Toolbar
- Inclusão de dois dropdowns ativos na barra do fluxograma:
  - **Dropdown de Ano Safra** (ex: 2025/2026, 2026/2027).
  - **Dropdown de Cenário / Versão** (buscando dinamicamente via `GET /api/scenarios`).
- Permite selecionar e projetar os valores calculados de qualquer cenário em tempo real (aprovado ou em edição) diretamente no canvas, de forma totalmente independente da tela de cadastro de variáveis.

### RF-03: Modal de Edição Completa de Bloco (Duplo Clique)
- Ao dar duplo clique em qualquer bloco (Processo ou E/S):
  - **Campo para Renomear Bloco/Título**: Permite alterar livremente o nome exibido no cabeçalho do nó.
  - **Filtro Cascata de Hierarquia**:
    1. Dropdown para selecionar o **Setor**.
    2. Dropdown para selecionar a **Etapa / Processo**.
    3. Dropdown para selecionar o **Ponto de Controle**.
  - **Campo de Busca Textual**: Filtragem rápida por código, ID ou descrição de variável.
  - **Anexo / Desvinculação**: Checkbox para marcar quais variáveis pertencem àquele bloco.

### RF-04: Gerenciamento Dinâmico de Setores no Fluxograma
- Na barra de abas de setores do fluxograma:
  - Permite adicionar um novo setor customizado.
  - Permite oculta/remover um setor do fluxo visual.

### RF-05: Preservação do Motor de Cálculo e Zero Hardcode
- Nenhuma regra de nome ou posicionamento é hardcoded.
- O fluxograma permanece 100% como camada visual reativa, mantendo intacto o motor de cálculo AST e solvers.

## 3. Requisitos Não-Funcionais e Restrições (GEMINI.md P0)
- **Densidade:** Nenhum arquivo pode ultrapassar **300 linhas físicas**.
- **Tipagem:** TypeScript estrito sem o uso de tipo `any`.
- **Nesting:** Máximo de 3 níveis de aninhamento por função.
- **Design System:** Cores baseadas em `teal`, `cyan` e `emerald` (tons de roxo/violeta banidos pelas regras Maestro UI).
- **Validação:** Aprovação de 100% na suíte de testes (Pytest + Vitest) e Master Checklist (`python .agent/scripts/checklist.py .`).
