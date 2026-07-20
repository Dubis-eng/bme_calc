# Human-In-The-Loop Review — Épico 25: Fluxogramas Dinâmicos e Modeláveis por Setor

## Status: APROVADO PARA CRIAÇÃO DE TAREFAS

### Resumo das Decisões de Arquitetura:
1. **Modelagem orientada aos 10 setores reais do BME Calc:** Eliminação total de topologias mock com variáveis genéricas. O fluxograma gera layouts nativos para os 10 setores reais do memorial de cálculo (1.063 variáveis).
2. **Topologia Auto-Gerada + Editor Interativo:** Caso um setor não tenha layout salvo, a topologia é gerada dinamicamente agrupando por `Etapa → Ponto de Controle`. O usuário pode editar nós, conectar arestas, mover posições e adicionar/remover variáveis.
3. **Persistência Backend (SQLModel + PostgreSQL):** Tabela `sector_flowcharts` criada no backend com rotas `GET / PUT / DELETE /api/flowcharts/{sector_id}`.
4. **Respeito Estrito à Constituição (P0):** Limite de 300 linhas por arquivo, auditoria `checklist.py` 100% PASS e testes Pytest mantidos.
