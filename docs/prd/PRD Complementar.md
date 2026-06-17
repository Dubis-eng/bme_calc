Clarifying equations and semantics

I need to include that the equations are semantic, focusing on variables with semantic IDs, and that this does not relate to the Excel interface. It's crucial to ensure safe division and avoid auto conversion since it's all scenario-driven. I should also mention the import of legacy JSON and how it relates to migrating to semantic IDs. Lastly, it's important to define a product overview to give clarity on what we’re discussing.

Você ainda está tratando isso como “cadastro de equações”, mas o produto que você descreveu é um motor de cálculo industrial com validação semântica, dependências e cenários.
[Certo] Se o PRD não refletir isso, ele vai nascer pequeno demais e voltar a virar planilha disfarçada.

Plano do PRD
Definir o problema que o sistema resolve
Delimitar objetivos e não-objetivos
Descrever as personas
Especificar o fluxo principal
Detalhar requisitos funcionais e regras de negócio
Definir dados, validações e estados
Estabelecer MVP, métricas e riscos
PRD — Motor de Equações e Planejamento Industrial

1) Visão do produto

O sistema será uma aplicação para cadastrar variáveis, registrar equações, validar expressões e calcular resultados de engenharia para cenários de processo industrial, com foco em balanço de massa e térmico, especialmente em contexto de planta.

O produto deve substituir o uso de planilhas como interface principal de cálculo, preservando a lógica de engenharia, mas com:

variáveis nomeadas de forma semântica
equações armazenadas em banco
validação de sintaxe e existência de variáveis
tratamento seguro de erros como divisão por zero
apoio a cenários mensais e anuais
rastreamento de dependências entre variáveis
2) Problema que o produto resolve

Hoje o usuário:

mantém grande volume de cálculos em formato de planilha
depende de referências legadas difíceis de manter
corre risco de usar variáveis não cadastradas
pode obter resultados incorretos quando há divisor zero ou valores ausentes
precisa projetar produção por mês, dia e ano com premissas variáveis
quer evoluir o motor sem reescrever centenas ou milhares de fórmulas manualmente
3) Objetivo do produto

Objetivo principal:
Permitir que o usuário cadastre variáveis e equações de forma estruturada, segura e compreensível, com validação automática e cálculo confiável.

Objetivos secundários:

reduzir reescrita manual de fórmulas
eliminar dependência de Excel como interface
garantir que nenhuma variável usada fique “solta” sem cadastro
suportar projeções por cenário operacional
manter rastreabilidade do que depende de quê
4) Não-objetivos

O sistema não deve, neste estágio:

virar uma planilha genérica
converter automaticamente premissas operacionais sem decisão do usuário
fazer análise dimensional totalmente automática de forma profunda desde o início
inferir silenciosamente valores quando houver erro de cálculo
esconder estados inválidos retornando números falsos
5) Persona principal
Engenheiro / analista de processo
cadastra variáveis de planta
escreve equações de cálculo
precisa validar fórmulas
compara cenários de operação
quer legibilidade e confiabilidade
Planejador operacional
usa resultados para prever produção mensal e anual
ajusta premissas como dias operados, aproveitamento e disponibilidade
precisa saber quando o resultado está indisponível ou inválido
Administrador técnico
mantém a base de variáveis
acompanha dependências
garante integridade do banco e das fórmulas
6) Escopo funcional
6.1 Cadastro de variáveis

Cada variável deve possuir:

ID técnico ou sigla semântica
nome amigável
descrição
setor
tipo: INPUT, OUTPUT, DERIVADA, CENARIO
unidade de medida
valor padrão ou valor inicial, quando aplicável
status: ativa, pendente, inválida, descontinuada
Regras
nenhuma variável pode ser usada em equação sem cadastro prévio
IDs precisam ser únicos
o sistema deve permitir nomes descritivos como moagem_hora
nomes legados podem existir em fase de migração, mas não devem ser o padrão final
6.2 Cadastro de equações

Cada equação deve:

estar vinculada a uma variável de saída
usar operadores básicos:
+
-

*

/
parênteses
permitir condicionais simples quando necessário
ser salva como expressão estruturada e não apenas texto solto
Regras
toda equação deve apontar para uma saída
o sistema deve extrair automaticamente as variáveis usadas
o sistema deve impedir salvar equações com referências inexistentes
a equação precisa ser legível para engenharia
6.3 Validação de equação

O motor deve validar:

sintaxe
parênteses
operadores inválidos
expressão incompleta
semântica
variáveis usadas existem?
a saída está cadastrada?
consistência
há dependência circular?
há quantidade esperada de variáveis?
execução
existe divisão por zero?
há valor ausente em algum cenário?
Regra importante

O sistema não pode substituir erro matemático por número falso.

Se um resultado não puder ser calculado, o status deve ser:

inválido
pendente
divisão_por_zero
variável_ausente
ou outro status explícito
6.4 Tratamento seguro de divisão por zero

O motor precisa impedir que o usuário veja um valor incorreto quando um denominador for zero.

Comportamento esperado
não preencher automaticamente com 0
não exibir número “inventado”
retornar status controlado
mostrar a causa do erro
Política por equação

O sistema deve permitir política configurável, por exemplo:

bloquear cálculo
retornar nulo
exibir alerta
usar tratamento condicional quando a lógica de negócio exigir
6.5 Cenários operacionais

O sistema deve separar:

cálculo base
premissas de cenário
projeções por período

Exemplos de cenário:

mês com 31 dias
mês com 20 dias operados
disponibilidade da planta
aproveitamento de produção
parada programada
Regra importante

O sistema não deve converter automaticamente produção horária em mensal ou anual sem contexto.
A projeção deve depender de cenário explicitamente definido pelo usuário.

6.6 Dependências e grafo de cálculo

Cada variável calculada precisa saber de quais outras variáveis depende.

O sistema deve manter um grafo para:

recalcular dependências na ordem correta
evitar loop circular
saber o impacto de uma alteração
mostrar rastreabilidade
Exemplo

Se moagem_hora muda, o sistema deve recalcular automaticamente as variáveis derivadas que dependem dela.

6.7 Importação de base legada

O sistema deve aceitar importação da estrutura já existente para evitar reescrita manual completa.

Objetivo da importação
trazer variáveis existentes
trazer equações já usadas
mapear dependências
converter referências legadas para o novo padrão semântico
Regras
importação não é o produto final
a importação é uma ponte para o novo motor
o formato final deve ser independente de planilha
6.8 Unidades de medida

Cada variável deve ter uma unidade associada.

O sistema deve:

registrar unidade
exibir unidade na interface
validar compatibilidade básica
alertar quando houver uso incoerente
O que não é obrigatório no MVP
análise dimensional totalmente automática para qualquer expressão
cancelamento físico profundo em toda a base
O que é obrigatório
unidade registrada
unidade visível
alerta quando a unidade estiver ausente ou incompatível
7) Requisitos de UX

A experiência precisa ser simples para quem já vem de planilhas, mas sem reproduzir o Excel.

Princípios
escrever equações com linguagem simples
usar siglas descritivas
mostrar variáveis disponíveis
validar em tempo real
destacar erros de forma clara
não exigir conhecimento técnico de programação
não exigir que o usuário pense em importação ou arquitetura
Comportamento esperado
o usuário digita a equação
o sistema sugere variáveis
o sistema aponta variáveis ausentes
o sistema mostra o estado do cálculo
o sistema mantém o resultado rastreável
8) Requisitos de dados

O modelo precisa armazenar, no mínimo:

Tabela de variáveis
id
nome
descrição
setor
tipo
unidade
status
Tabela de equações
id
variável de saída
expressão original
expressão normalizada
versão
status
data de criação
data de atualização
Tabela de dependências
equação_id
variável_dependente
ordem de avaliação
Tabela de cenários
id
nome
período
premissas de operação
dias operados
aproveitamento
disponibilidade
Tabela de resultados
variável_id
cenário_id
valor
unidade
status
mensagem de erro
timestamp
9) Fluxo principal do usuário
cadastra variáveis
define unidades e tipos
cria variável de saída
escreve a equação
o sistema valida sintaxe e referências
o sistema salva a equação
o sistema calcula o resultado
o sistema exibe status
o usuário aplica cenário de operação
o sistema calcula projeções por período
10) Regras de negócio críticas
toda variável usada precisa existir
toda equação precisa ter uma saída
divisão por zero nunca pode virar número falso
cenário operacional não pode ser assumido automaticamente
variáveis sem unidade precisam ser sinalizadas
dependências circulares são proibidas
o sistema deve diferenciar cálculo base de projeção
11) MVP sugerido
Entrega mínima viável
cadastro de variáveis
cadastro de unidades
cadastro de equações
validação de variáveis inexistentes
validação de sintaxe
tratamento seguro de divisão por zero
grafo de dependências
projeção por cenário simples
importação da base legada
Fora do MVP
análise dimensional avançada completa
simulação complexa de múltiplos cenários em cadeia
automação total de premissas de planejamento
motor universal de fórmulas para qualquer domínio
12) Métricas de sucesso
redução de reescrita manual de fórmulas
redução de erro por variável não cadastrada
redução de resultados inválidos exibidos
tempo menor para montar uma equação
número de dependências calculadas corretamente
taxa de importação bem-sucedida da base legada
13) Riscos principais
Risco 1: virar planilha disfarçada

Se o sistema continuar preso à lógica de célula, ele não resolve o problema.

Risco 2: esconder erros matemáticos

Se o motor trocar erro por valor, o usuário perde confiança.

Risco 3: tentar automatizar cenário cedo demais

Se o sistema inferir produção mensal ou anual sem contexto, pode entregar resultado errado.

Risco 4: nomenclatura sem padrão

Sem taxonomia rígida, as variáveis ficam inconsistentes e o sistema degrada rápido.

1) Critérios de aceite do produto

O produto será considerado funcional quando:

o usuário conseguir cadastrar uma variável sem usar Excel
o usuário conseguir montar uma equação com nome semântico
o sistema identificar variável ausente
o sistema bloquear equação inválida
o sistema tratar divisão por zero sem exibir número errado
o sistema recalcular dependências automaticamente
o sistema suportar cenário mensal e anual explicitamente
o sistema importar a base legada sem reescrita total
15) Definição resumida do produto

Este sistema é um motor de cálculo industrial com cadastro de variáveis, equações, unidades, cenários e validação segura.
Ele substitui a lógica manual da planilha, mas preserva a lógica de engenharia.

A essência do produto não é calcular apenas. É calcular com rastreabilidade, segurança e contexto operacional.
