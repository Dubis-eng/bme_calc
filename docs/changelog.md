# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.14.0] - 2026-07-06

### Added
- **Unificação de Configurações e Sincronização de Ciclo (Épico 19)**:
  - Centralização de todas as rotas de configuração sob `/api/settings` no backend (`router_settings.py`), eliminando rotas duplicadas e obsoletas em `main.py` e reduzindo sua densidade.
  - Implementação do endpoint transacional e idempotente `PATCH /settings/months/reorder` com validações rigorosas de integridade (tamanho do array e correspondência exata de IDs ativos).
  - Adição da coluna `cycle_start_month` na tabela `Scenario` para reter o snapshot do ciclo comercial ativo no momento do cálculo/cadastro.
  - Implementação de um banner visual no frontend (`App.tsx`) para avisar quando um cenário possui um "Ciclo desatualizado" em comparação às configurações globais do sistema.
  - Inclusão de botão "Recalcular Cenário com o Novo Ciclo" no banner para acionar o solver manual.
  - Atualização e expansão da suíte de testes unitários (`test_scenarios.py` e `test_harvest_plan.py`) com cobertura completa para as novas rotas.

## [2.13.0] - 2026-06-29

### Added
- **Ordenação em Cascata das Variáveis, Etapas e Pontos de Controle (Tarefa 18.1)**:
  - Implementação de ordenação por Drag-and-Drop e botões rápidos (Subir/Descer) para Etapas, Pontos de Controle e Variáveis.
  - CRUD completo para rotas de reordenação no backend em `services_reorder.py` e rotas `/reorder` correspondentes.
  - Divisão de arquivos de backend e componentes de frontend para respeitar o limite de 300 linhas físicas (ex: `SectorVariableRow.tsx`, `SectorControlPointTable.tsx`, `migrations_legacy.py`).
  - Suíte de testes automatizados (`backend/test_cascade_sorting.py`) validando a consistência e a cascata de ordenação no banco de dados.

## [2.12.0] - 2026-06-29

### Added
- **Tratamento Fail-Fast de Conexão com Servidor Offline (Tarefa 10.5)**:
  - Implementação de um banner visual persistente no topo da tela com estilização Maestro UI avisando quando o servidor está inacessível.
  - Inclusão de botão "Tentar Reconectar" no banner para reavaliação manual do estado de conexão.
  - Implementação de mecanismo de polling de conexão (heartbeat de reconexão automática) a cada 5 segundos que executa exclusivamente enquanto o frontend está em modo offline.
  - Bloqueio completo de escrita e recálculo no frontend: desabilitação de todos os campos de entrada de dados, botões de cálculo, cadastros e painel de cenários quando a conexão é perdida.
  - Remoção de fallbacks silenciosos que simulavam funcionamento offline (como o carregamento silencioso de dados em cache local em caso de erro na inicialização).
  - Refatoração e otimização do hook `useScenario.ts` para extrair utilitários de data e mappers para `helpers.ts`, mantendo o arquivo estritamente sob o limite constitucional de 300 linhas de código.

## [2.11.0] - 2026-06-29

### Added
- **Arredondamento e Exibição de Percentual Dinâmico (Épico 17)**:
  - Adição de novos metadados de formatação no cadastro de variáveis: `casas_decimais` (casas decimais de exibição), `tipo_exibicao` (`NUMBER` ou `PERCENTAGE`) e `percent_base` (`DECIMAL` ou `INTEGER`).
  - Atualização do modal de cadastro de variáveis (`VariableModal.tsx`) para incluir controles visuais de precisão decimal, tipo de exibição e base percentual, isolando componentes sob o limite de 300 linhas.
  - Implementação de formatação dinâmica baseada em metadados no grid de cenários (`SectorModules.tsx`) e na consolidação do plano de safra (`HarvestPlanTable.tsx`).
  - Suporte reativo a inputs percentuais: quando uma variável possui exibição percentual e base decimal, o valor inserido na UI é multiplicado por 100 ao focar e dividido por 100 ao salvar.
  - Formatação e arredondamento customizados aplicados diretamente nas exportações para PDF e Excel (`exports.py`), sem comprometer a precisão matemática dos cálculos no backend (`engine.py`), que continua utilizando ponto flutuante bruto de precisão total.
  - Criação de suíte de testes unitários e de integração (`backend/test_variables_formatting.py`) validando as regras de CRUD, cálculo com precisão total de floats e exportações.

### Fixed
- **Persistência de Dados de Formatação**: Correção na montagem do payload da API em `useScenario.ts` que impedia o salvamento das opções de formatação das variáveis no banco de dados.
- **Resiliência do Plano de Safra**: Correção de travamento no renderizador React da tabela de consolidação (`HarvestPlanTable.tsx`) ao processar células com valores nulos/indefinidos originados de bancos de dados recém-iniciados sem histórico.

## [2.10.0] - 2026-06-29
 
### Added
- **Seeding Idempotente e Inteligente**:
  - Modificação do processo de semeadura do banco de dados (`backend/seeding.py`) para evitar a destruição de dados a cada inicialização da API.
  - O banco de dados agora só faz a carga inicial a partir do JSON se a tabela `variables` estiver completamente vazia.
  - Adicionado suporte para carregar status de variáveis (`STATUS`) e configurações do plano de safra (`IN_HARVEST_PLAN`, `HARVEST_PLAN_OP`, `HARVEST_PLAN_WEIGHT_VAR_ID`) a partir do JSON de carga inicial.
  - Refatoração do script de semeadura em funções especializadas sob o limite constitucional de 40 linhas e baixa complexidade.
- **Utilitário de Exportação de Dados**:
  - Criação do script `backend/export_database_to_json.py` para ler os dados do banco e atualizar de volta o arquivo `memorial_de_calculo_balanco.json` de forma atômica nos 3 destinos (backend, docs e frontend).
  - Conversão automatizada de caracteres corrompidos do PowerShell e restauração limpa de acentuação em UTF-8.
- **Backup e Restauração Binária**:
  - Atualização de `info.txt` documentando comandos binários seguros (`pg_dump` e `pg_restore` com `-F c`) de dentro do container Docker para eliminar problemas de encoding.

## [2.9.0] - 2026-06-29

### Added
- **Persistência e Filtragem Reativa de Status do Dashboard (Épico 16)**:
  - Elevação do estado do filtro de status do dashboard (`activeStatusFilter`) para `App.tsx` para sincronização bidirecional entre o Dashboard e as tabelas de equações dos setores.
  - Implementação de barra visual de filtragem por status (`Todos`, `Convergido`, `Com Erro`, `Pendente`) no componente `SectorModules.tsx` totalmente integrada com o design system Maestro UI.
  - Lógica acumulada de filtragem por status e tipo (operação lógica E) para permitir refinamento de busca.
  - Classificação estrita de status por variável individual: calculadas que convergiram (`status === 'OK'`), falharam (`status !== 'OK' && status !== 'PENDING'`), ou estão pendentes de cálculo (`status === 'PENDING'`), além de variáveis de tipo `INPUT`/`CENARIO` vazias que são consideradas pendentes.

## [2.8.0] - 2026-06-28

### Added
- **Segregação de Variáveis Inativas**:
  - Filtro no backend nas listagens gerais (`/api/variables`) e de configuração de plano de safra (`/api/harvest-plan/config`) para omitir variáveis com status `inativa`, impedindo que apareçam nessas tabelas.
  - Propagação do campo `"STATUS"` no retorno do endpoint de variáveis de cenários (`get_scenario_variables` / `/api/scenarios/{id}`), permitindo a identificação do estado de arquivamento no frontend.
  - Filtro e visualização controlada no frontend (`SectorModules.tsx`): variáveis inativas são ocultadas por padrão e exibidas somente ao ativar o novo toggle "Mostrar Inativas" na barra de tipo.
  - Estilização diferenciada para linhas inativas no frontend (opacidade reduzida, texto em itálico, badge pastel "INATIVA") com inputs e botão de edição desabilitados.
  - Reset automático das propriedades de participação no Plano de Safra (`in_harvest_plan = False`, `harvest_plan_op = None`, `harvest_plan_weight_var_id = None`) para variáveis arquivadas no momento do seu inlining/substituição.
  - Migração de terminologia de "descontinuada" para "inativa" em todo o sistema (enums de banco de dados, serviços de substituição, testes e componentes do frontend).

## [2.7.0] - 2026-06-27

### Added
- **Substituição Inteligente de Variáveis nas Equações (Épico 14)**:
  - Motor de substituição baseado em Regex e parênteses de precedência para propagar a fórmula de uma variável nas equações que dependem dela com máxima fidelidade matemática.
  - Suporte a substituição recursiva (em cascata) ao longo de todo o grafo topológico descendente de dependências.
  - Endpoints de API `/api/variables/{id}/replace-preview` e `/api/variables/{id}/replace-confirm` para simulação e confirmação das substituições.
  - Modal do Frontend `<SubstitutionModal />` para visualização "Antes e Depois" do impacto em fórmulas ativas e ações para lidar com variáveis órfãs (Arquivamento lógico/descontinuação ou Exclusão física).
  - **Otimização de Performance em Larga Escala (>1000 variáveis)**: Cache em memória e pré-resolução de dependências para evitar queries N+1, reduzindo a latência de ~1.5 minuto para milissegundos.
  - **Visual de Espera e Feedback (UI/UX)**: Overlay bloqueante de confirmação com pipeline de 4 etapas animado e carregamento em pulse skeletons na tabela de preview de impactos.
  - **Suporte a Fórmulas Customizadas e Prevenção de Bad Request (400)**: Passagem de `replacement_expr` na requisição para permitir a simulação e substituição de expressões em digitação na UI antes de salvar no banco, corrigindo erros de variáveis sem equações cadastradas (entradas ou descontinuadas).

### Fixed
- **Substituição Segura de Expressões Excel**: Alterado o motor para regex para preservar formatações locais do Excel (como vírgulas de decimais e ponto-e-vírgulas), evitando que o compilador Python gerasse espaços indevidos (ex: `0, 998` em vez de `0,998` interpretado como tupla).
- **Normalização de Espaço Inicial nas Equações**: Adicionado `.strip()` no tratamento de fórmulas para prevenir erros de indentação inesperada (`unexpected indent`) ao processar equações salvas com espaço inicial (ex: `= J786`).
- **Memorial de Cálculo Original**: Corrigidas as 21 equações no arquivo JSON de sementes (`memorial_de_calculo_balanco.json`) que possuíam espaços após o sinal de igual, eliminando erros de compilação AST logo no startup do banco.

## [2.6.0] - 2026-06-27

### Added
- **Editor de Fórmulas Inteligente (`FormulaEditor.tsx`)**: Novo componente editor de texto com realce de sintaxe em tempo real (sobrepondo textarea transparente e div estilizada) e validação sintática (parênteses desbalanceados e identificação de variáveis inexistentes/desconhecidas).
- **Indicador de Divergência Contínuo no Header**: Exibição em tempo real do resíduo de malha (`max_delta`) retornado pelo solucionador backend na tag de iterações do `Header` (exibido em amarelo/laranja em caso de desvio acima da tolerância).
- **Configuração de Tolerância do Solucionador**: Adicionada a aba "Solucionador" nas Configurações do Sistema (`SystemSettingsModal.tsx`) permitindo definir a tolerância de convergência limite do simulador, salva no `localStorage` do navegador e repassada dinamicamente ao backend.
- **Botões Rápidos de Filtro de Tipos (Pills)**: Filtros rápidos para alternar instantaneamente entre os tipos de variáveis (`Todos`, `INPUT`, `OUTPUT`, `CENÁRIO` e `DERIVADA`) na barra de ferramentas do Plano de Safra (`HarvestPlan.tsx`) e no topo do painel da Calculadora (`SectorModules.tsx`).

### Changed
- **Resolvedor do Backend Parametrizável (`engine.py` / `schemas.py` / `main.py`)**: Atualização do endpoint `/api/calculate` para aceitar um parâmetro opcional `tolerance` e aplicar esse limite como critério de parada na convergência de ciclos de reciclos, além de retornar a chave `"residual"` com o valor final de `max_delta`.
- **Exibição de Valores Alinhados à Direita**: Alinhamento numérico (`text-right`) padronizado na coluna de Valor e nos inputs na tabela de variáveis.
- **Visualização de Fórmula Expandida**: Inclusão de tooltip nativo no hover da fórmula e modal/popover completo no clique da célula de fórmula com botão de cópia rápida.

## [2.5.0] - 2026-06-27

### Added
- **Centralização e Unificação do Design System (`design-system.tsx`)**: Nova especificação de tema em TypeScript contendo constantes centralizadas para Badges de tipos de variáveis (`TYPE_BADGE`), erros de convergência (`ERROR_BADGE`) e status de cenários (`SCENARIO_STATUS_BADGE`).
- **Componente Unificado `<BmeIcon />`**: Componente reutilizável para renderização de ícones SVG semânticos (lápis, fechar, engrenagem, setas e ícones industriais específicos para cada setor), eliminando SVGs inline repetidos e emojis da interface.
- **Classes Utilitárias Semânticas (`index.css`)**: Novas classes usando `@apply` para tabelas (`.bme-table*`) e modais (`.bme-modal*`), limpando o JSX e centralizando o comportamento estrutural do CSS.

### Changed
- **Refatoração e Divisão do Plano de Safra (`HarvestPlan.tsx`)**: Modularização do componente original de 625 linhas para respeitar a regra constitucional P0 de limite de 300 linhas, dividindo-o em:
  - `HarvestPlan.tsx`: Controlador de estados, filtros de busca, início do ciclo e cabeçalho superior.
  - `HarvestPlanTable.tsx`: Renderização da matriz de consolidação mensal do plano com colunas sticky laterais e seletores.
  - `HarvestPlanConfigTable.tsx`: Formulário de parametrização de operadores de consolidação e pesos das variáveis.
- **Refatoração de Componentes para o Design System**: Atualização completa de `SectorModules.tsx`, `Sidebar.tsx`, `SearchPanel.tsx`, `RightPanel.tsx`, `ScenarioManager.tsx`, `SectorConfig.tsx`, `GoalSeekModal.tsx`, `VariableModal.tsx` e `SystemSettingsModal.tsx` para usar as novas classes utilitárias e o componente `<BmeIcon />`.

### Fixed
- **Ajuste de Tipagem de Cadastro**: Corrigido erro de compilação TypeScript em `VariableModal` garantindo que campos opcionais no formulário sejam convertidos para strings vazias em vez de `undefined` para satisfazer o contrato estrito da interface `Variable`.

## [2.4.0] - 2026-06-26

### Added
- **Persistência de Seleções do Plano de Safra (`HarvestPlanSelection`)**: Nova tabela no banco de dados para armazenar a seleção de cenário ou exclusão de cada mês por ano safra.
- **API de Seleções do Plano de Safra**: Novos endpoints `GET /api/harvest-plan/selections` e `POST /api/harvest-plan/selections` para recuperar e salvar as seleções dinâmicas de cenário por mês.
- **Seleção Dinâmica de Versões e Exclusão de Meses**: Componente `HarvestPlan.tsx` atualizado com seletores na tabela para escolher versões aprovadas dos cenários ou a opção "Padrão". Adicionada a opção "Não selecionar (Ocultar)" para excluir colunas de meses da matriz de consolidação.
- **Botão "Adicionar Mês" (`HarvestPlan.tsx`)**: Permite reexibir e selecionar cenários para meses previamente ocultos.
- **Testes de Integração de Seleções**: Adicionado caso de teste `test_harvest_plan_selections` em `backend/test_harvest_plan.py` cobrindo a recuperação e atualização das seleções via API.

### Changed
- **Refatoração e Modularização do Serviço**: Dividido `services.py` em sub-arquivos modulares (`services_harvest_plan.py`, `services_scenarios.py`, `services_variables.py`) para cumprir a regra P0 de limite de 300 linhas por arquivo.

## [2.3.0] - 2026-06-26


### Added
- **Configurações Dinâmicas de Anos Safra (`/api/harvest-years`)**: Novas rotas `GET`, `POST` e `DELETE` para gerenciar os anos safra cadastrados no banco de dados. Suporte a exclusão em cascata de cenários vinculados, com aviso ao usuário da contagem antes de confirmar.
- **Configurações Dinâmicas de Meses de Referência (`/api/harvest-months`)**: Novas rotas `GET` e `PATCH` para listar e habilitar/desabilitar individualmente os 12 meses pt-BR, com controle de ordem de exibição.
- **Tabelas `harvest_years` e `harvest_months`**: Novos modelos no banco de dados com seeding automático de 3 anos safra (2026–2028) e 12 meses pt-BR no startup.
- **Modal de Configurações do Sistema (`SystemSettingsModal.tsx`)**: Novo painel administrativo acessado pelo ícone ⚙️ no rodapé da Sidebar. Permite criar e excluir anos safra, e habilitar/desabilitar meses de referência via toggles.
- **Seletor Dinâmico de Ano/Mês no Gerenciador de Cenários**: `ScenarioManager.tsx` e `HarvestPlan.tsx` agora carregam as listas de anos e meses ativos diretamente da API em vez de valores fixos hardcoded.
- **Teste de Integração `test_harvest_years_and_months`**: Novo test case em `test_scenarios.py` validando os endpoints CRUD de anos safra e a filtragem de meses habilitados.

### Changed
- **Migração de Coluna `year_harvest` (VARCHAR → INTEGER)**: Rotina de migração automática no startup converte strings legadas (ex: `"2026/2027"`) para inteiros (ex: `2026`), normalizando os valores antes do `ALTER COLUMN` para evitar `NotNullViolation` no PostgreSQL.
- **Motor de Consolidação de Safra Dinâmico**: `services.py::get_ordered_months` agora consulta a tabela `harvest_months` para obter os meses habilitados e sua ordem, em vez de usar uma lista estática.
- **Anos Safra Disponíveis**: `services.py::get_harvest_years` agora lista os anos da tabela `harvest_years` com `active=True`, em vez de varrer os cenários existentes.

### Fixed
- **Exclusão de Ano Safra com Cenários**: Corrigido erro HTTP 500 no `DELETE /api/harvest-years/{year_start}` ao chamar `db.flush()` antes da exclusão do registro pai, garantindo que a remoção em cascata dos cenários e seus resultados seja enviada na ordem correta e respeite a chave estrangeira do PostgreSQL. Resolvido também NameError por falta de importação de `text` em `main.py`.
- **Validação de Anos no Plano de Safra**: Corrigida falha de validação de resposta (HTTP 500 / CORS Blocked) na rota `GET /api/harvest-plan/years` ajustando o `response_model` para `List[int]` para coincidir com a modelagem do banco de dados (que usa anos como inteiros).

## [2.2.0] - 2026-06-26

### Added
- **Consolidação do Plano de Safra (`HarvestPlan.tsx`)**: Novo painel completo contendo sub-aba de visualização plurianual e sub-aba de configuração de variáveis do plano de safra.
- **Parametrização de Agregação de Safra**: Suporte para definição de métodos de agregação por variável (`SUM`, `AVERAGE`, `WEIGHTED_AVERAGE`, `CALCULATE`), incluindo associação inteligente de variável de peso.
- **Configuração de Início do Ciclo**: Rota e interface de configuração para definir o mês inicial do ano safra (ex: Janeiro, Abril), reordenando cronologicamente os 12 meses na API e no frontend.
- **Motor de Agregação Topológica**: Processador backend que avalia as variáveis em ordem lógica de dependências durante a consolidação anual (operador `CALCULATE`).
- **Migração de Banco Automática**: Schema alterado com adição dos campos de configuração na tabela `variables` e criação da tabela `harvest_plan_settings` com seeding padrão de mês inicial.
- **Testes de Integração de Safra (`test_harvest_plan.py`)**: Validação ponta-a-ponta dos operadores de consolidação e alteração dinâmica de ciclo de meses.

## [2.1.0] - 2026-06-26

### Added
- **Componente EquationDropdown (`EquationDropdown.tsx`)**: Criação de um novo arquivo de componente separado para o autocomplete de fórmulas, reduzindo `VariableModal.tsx` de 308 para ~242 linhas e garantindo total conformidade com a regra constitucional P0 de limite de 300 linhas por arquivo.
- **Árvore Hierárquica de 4 Níveis (Sidebar)**: Adicionado o 4º nível na árvore de navegação lateral (Setor -> Etapa -> Ponto de Controle -> Variável). Cada ponto de controle agora é expansível para listar as variáveis pertencentes a ele de forma compacta.
- **Navegação Direta por Árvore**: Integração de cliques em variáveis da árvore lateral para rolar suavemente a tela central até o elemento correspondente e destacá-lo temporariamente.

### Changed
- **Extração de Dados Limpa (`convert_xlsx_to_json.py`)**: Atualizada a rotina de extração para não mais gerar o campo legado `DEFINIÇÃO`, e alterada para sincronizar a saída limpa nos três diretórios de destino (backend, docs e frontend/public).
- **Adequação à Hierarquia de 3 Níveis**: Remoção total do campo obsoleto `DEFINIÇÃO` em favor do fluxo puramente centrado em `SETOR`, `ETAPA` e `PONTO DE CONTROLE` no backend (`seeding.py`, `services.py`, `exports.py`) e no frontend (`types/index.ts`, `VariableModal.tsx`, `useVariableSearch.ts`, `ScenarioPremises.tsx`).
- **Seeding e Banco de Dados**: A base de dados foi dropada e reconstruída a partir da nova carga limpa do JSON sem histórico residual.

## [2.0.0] - 2026-06-25

### Added
- **Motor Termodinâmico IAPWS-IF97 (`evaluator.py`)**: Implementação de 7 novas funções de cálculo físico no interpretador AST (`VAPOR_H`, `VAPOR_S`, `VAPOR_H_SAT`, `VAPOR_H_LIQ`, `VAPOR_H_PS`, `VAPOR_T_SAT`, `VAPOR_LATENT`) utilizando a biblioteca `iapws` com suporte a pressões absolutas (bar -> MPa).
- **Mapeamento Dinâmico de Turbinas**: Substituição dos valores fixos hardcoded do setor de Turbinas por fórmulas dinâmicas que buscam propriedades de entalpia e entropia de vapor superaquecido/saturado diretamente do modelo físico.
- **Painel de Ajuda no Frontend**: Adicionadas orientações e tooltips informativos diretamente abaixo do input de fórmulas em `VariableModal.tsx`, orientando o usuário sobre a sintaxe das funções `VAPOR_*` e o requisito de usar pressão absoluta.

### Changed
- **Carga de Novo Memorial (J-prefix)**: Substituição do memorial padrão por `docs/memorial_de_calculo_balanco.json` com variáveis reestruturadas no prefixo `J`.
- **Interpretador Prefix-Agnostic (`engine.py`)**: Refatoradas lógicas de regex e expansão de ranges para detectar e suportar dinamicamente o prefixo `J` (além do legado `H`), além de suportar mapeamento condicional de coluna `D` para `J` ou `H` dependendo do contexto.
- **Densidade OIML Dinâmica para J270**: A densidade do vinho `J270` agora é calculada dinamicamente com base em `J269` ("INPM Vinho") usando o polinômio OIML de densidade.
- **Purga de Dados no Startup (`seeding.py`)**: Adicionado detector de variáveis legadas `H`. Se encontradas, as tabelas do banco PostgreSQL são limpas (`TRUNCATE CASCADE`) no startup para permitir a semeadura limpa das novas variáveis e setores de prefixo `J`.

## [1.9.0] - 2026-06-22

### Added
- **Salvamento de Alterações no Cenário Ativo (`PUT /api/scenarios/{id}`)**: Nova rota de API e lógica de serviço para salvar as modificações de variáveis e expressões de um cenário diretamente na base PostgreSQL caso seu status seja "Em Edição". Bloqueia requisições se o cenário estiver finalizado ou aprovado.
- **Botão "Salvar Alterações" no Frontend**: Interface do `ScenarioManager` exibe o botão dinâmico para o cenário ativo, mudando de cor em caso de edições pendentes para guiar o usuário.
- **Aviso de Saída Sem Salvar (`beforeunload`)**: Alerta nativo do navegador implementado no frontend para evitar perda acidental de dados ao fechar ou atualizar a aba com modificações pendentes.

### Changed
- **Refatoração Constitucional (SRP & 300 linhas)**: Decomposição e componentização da barra lateral direita em `RightPanel.tsx` e lógica de estado em `useScenario.ts`, mantendo `App.tsx` enxuto (~192 linhas) e em total conformidade com a densidade P0.
- **Modularização de Funções (40 linhas)**: Divisão da persistência de cenários no backend em subfunções modulares (`_ensure_variable`, `_ensure_equation`, `_upsert_result`) limitando as funções a menos de 40 linhas.

## [1.8.1] - 2026-06-22

### Fixed
- **Auto-cadastro de Setores via Edição de Variáveis**: O frontend agora detecta a criação/edição de variáveis associadas a setores inexistentes e realiza a persistência imediata do novo setor no banco PostgreSQL, calculando a sequência de ordenação padrão (`maxOrdem + 10`) e atualizando a listagem.

## [1.8.0] - 2026-06-22

### Added
- **Ordenação Única de Setores (Sector Ordering)**: Adicionado o campo `ordem` no modelo de setores, implementando ordenação personalizada na barra de navegação.
- **Validação de Unicidade de Posição**: Implementada validação de unicidade da ordenação no backend (retornando erro 400 em caso de colisões) e no formulário de configuração no frontend (exibindo avisos explicativos).
- **Semeadura Sequencial por Incremento**: Ajustada a rotina de seeding do backend para atribuir ordenações sequenciais de 10 em 10 aos setores padrão com base na ordem física no JSON de premissas.

## [1.7.0] - 2026-06-18

### Added
- **Semeadura Automática do Banco (Database Seeding)**: Novo módulo `seeding.py` que lê as variáveis e equações padrão de `memorial_de_calculo_balanco.json` e popula as tabelas do banco no startup (se estiverem vazias), criando também o "Cenário Base (Inicial)".
- **Resolução de Erros de Unicidade e Enums no Seeding**: Mecanismo de UPSERT na semeadura para evitar colisões de chaves únicas com variáveis pendentes pré-criadas por dependências e coerção de status de erro para a especificação do enum.
- **Carregamento Automático de Cenários no Frontend**: O frontend agora consome a API para buscar e carregar automaticamente o cenário mais recente na inicialização, com fallback local robusto se a API falhar.
- **União Dinâmica de Setores**: Sidebar do frontend agora realiza a união dinâmica dos setores cadastrados no banco de dados e os presentes nas variáveis atuais, impedindo que setores sumam da barra lateral quando novos setores são configurados.

## [1.6.0] - 2026-06-17

### Added
- **Navegação em Árvore Hierárquica (Sidebar)**: Refatoração do menu lateral para exibir uma árvore de dois níveis (Setor -> Subgrupo/Definição) com colapso dinâmico e rolagem suave (smooth scroll) direcionada ao clicar em subgrupos.
- **Painel de Configurações de Setores**: Nova aba "Configurações" integrada na lateral direita do frontend (ao lado do Scenario Manager) permitindo o CRUD completo de setores (cadastro, edição de nome/descrição e exclusão).
- **Modelo Relacional de Setores (SQLModel)**: Criação da tabela `Sector` persistida no PostgreSQL com integridade referencial vinculando variáveis a setores e bloqueando exclusões de setores associados a variáveis ativas.

## [1.5.0] - 2026-06-16

### Added
- **Banco de Dados Relacional Normalizado (5 tabelas)**: Migração completa da coluna monolítica JSONB para uma estrutura normalizada de 5 tabelas (`scenarios`, `variables`, `equations`, `dependencies`, `results`) no PostgreSQL, aumentando a integridade e rastreabilidade dos dados.
- **Tratamento de Erros no AST (Rich Results)**: O interpretador de fórmulas AST agora propaga e persiste objetos de resultado detalhados (`{value, status, error_message}`) contendo erros explícitos como `DIV_BY_ZERO` e `MISSING_VAR` em vez de mascará-los silenciosamente com `0`.
- **Premissas de Cenário Dinâmicas**: Introdução do tipo de variável `CENARIO` para agrupar e exibir premissas de planejamento operacional (`DIA`, `APROVEITAMENTO_OPERACIONAL`, etc.) em um painel lateral separado de fácil edição.
- **Auditoria de Densidade P0 de Arquivos**: Realizada refatoração minuciosa do backend (através de `evaluator.py`, `schemas.py` e `services.py`) e componentização do frontend (através de `Header.tsx`, `Sidebar.tsx` e `ScenarioPremises.tsx`), reduzindo e mantendo o tamanho de todos os arquivos abaixo do limite máximo de 300 linhas físicas.

## [1.4.1] - 2026-06-14

### Added
- **Configuração do Git (.gitignore)**: Adicionado arquivo `.gitignore` estruturado na raiz do repositório para evitar envios indesejados ao GitHub. O arquivo ignora de forma inteligente arquivos de IDEs/sistema, diretórios do Python (`.venv`, `__pycache__`, `.pytest_cache`), pastas do Node.js (`node_modules`, `dist`, `build`), arquivos de banco locais (`*.db`), backups SQL (`*.sql`) e configurações confidenciais/sensíveis (`.env*`).

## [1.4.0] - 2026-06-13

### Added
- **Identificadores Alfanuméricos Customizados**: Nova extração de dependências no backend baseada em análise da AST (`ast.walk`), permitindo variáveis com nomes descritivos (ex: `MOENDA_RPM`) nas fórmulas sem quebrar o motor topológico.
- **Painéis Visuais de Definição (SectorModules)**: Exibição no frontend agrupada em cartões/módulos expansíveis por Definição do processo, contendo atalhos de inclusão rápida e tabelas independentes.
- **Modal de Variáveis (VariableModal)**: Formulário para cadastro e edição direta de variáveis e equações com suporte a autocompletar e validação de nomes/unicidade.
- **Persistência Completa no Postgres**: Estrutura de variáveis do cenário e equações atualizadas passam a residir exclusivamente no banco de dados.

## [1.3.0] - 2026-06-12

### Added
- **PostgreSQL Persistence (SQLModel)**: Added Docker-based PostgreSQL database with JSONB columns to persist the full 1108 variables payload for scenarios.
- **Goal Seek Optimization Solver**: Integrated Scipy root-finding optimizer (Brentq/Secant/Nelder-Mead fallback) to adjust inputs for target outputs.
- **Scenario Versioning & Status Locking**: Automates version incrementing on save. Congested scenarios (status 'Aprovado' or 'Final') freeze input fields and disable calculations in the frontend.
- **Scenario Manager Sidebar Component**: Created modular ScenarioManager component to list, save, load, and change status of scenarios.
- **Goal Seek progressive modal**: Created Goal Seek modal offering progressive options (implied bounds / advanced custom bounds).
- **PDF & XLSX Export Endpoints**: Backend routes using ReportLab and openpyxl to download fully evaluated reports.

## [1.2.0] - 2026-06-12

### Added
- **Epic 3 Excel Formulas**: Implemented parser support in backend FormulaEvaluator AST for `LN(x)`, `SUBTOTAL(9, ...)` and conditional sum `SOMASES(sum_range, criteria_range, criterion)`.
- **Wine Density calculation (H273)**: Replaced INDEX-MATCH lookup querying missing `Densidade` sheet with physical polynomial approximation: `density = 0.99823 - 0.001625 * I - 0.0000045 * I^2`.
- **Dynamic Warning Banners**: Frontend now scans active sector variables for missing sheets (`Vapor!` and `Densidade!`) and displays a colored amber warning listing the exact variable IDs resolved via thermodynamic/OIML physics.
- **Accessibility Improvements**: Added label associations for header select elements, `aria-label` attributes on table inputs, screen-reader-only labels, a skip-to-main-content link, and keydown handler on Calculate button.

### Changed
- **Visual Design**: Switched colors from violet/indigo to compliant teal/cyan gradients and accents, satisfying UX Maestro guidelines.
- **Architectural Cleanup**: Compressed `backend/engine.py` and `frontend/src/App.tsx` below 300 lines to satisfy strict density rules.
- **Linter & Audits**: Added `.venv` and `venv` to ignored directories in validation scripts.

## [1.1.0] - 2026-06-12

### Added
- **Epic 2 Process Core**: Integrates thermodynamic calculations using `iapws` package in backend engine to resolve steam-related lookups (`PROCV` query to `Vapor` table).
- ** Collapsible Sidebar**: Implemented retractable sidebar in React frontend for responsive navigation.
