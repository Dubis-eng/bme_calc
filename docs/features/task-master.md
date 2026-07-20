# Task Master — Grafo de Tarefas do Épico 27 (Refinamento Interativo de Fluxogramas)

## Épico 27: Refinamento Interativo de Fluxogramas por Setor (Persistência Mestre, Seletor Independente de Cenários & Modal Cascata)

| ID | Descrição | Arquivos / Escopo | Status | Dependências |
|---|---|---|---|---|
| TASK-2701 | Frontend: Corrigir carregamento e retenção do layout salvo no banco em `ProcessFlowCanvas.tsx` impedindo reset ao trocar de abas. | `frontend/src/components/calculator/ProcessFlowCanvas.tsx` | `done` | Nenhum |
| TASK-2702 | Frontend: Implementar dropdowns ativos e independentes de **Ano Safra** e **Cenário/Versão** na toolbar do fluxograma. | `frontend/src/components/calculator/ProcessFlowToolbar.tsx`, `ProcessFlowCanvas.tsx` | `done` | TASK-2701 |
| TASK-2703 | Frontend: Reformular `NodeVariableSelectorModal.tsx` com edição/renomeação do título do bloco + seletores cascata (`Setor → Etapa → Ponto de Controle`). | `frontend/src/components/calculator/NodeVariableSelectorModal.tsx`, `nodes/ProcessNode.tsx`, `nodes/IoNode.tsx` | `done` | TASK-2702 |
| TASK-2704 | Frontend: Implementar gerenciamento dinâmico de abas de setores (Adicionar novo setor customizado / Ocultar setor). | `frontend/src/App.tsx`, `ProcessFlowCanvas.tsx` | `done` | TASK-2703 |
| TASK-2705 | Testes & Auditoria: Atualizar suítes de testes automatizados e validar sanidade via `python .agent/scripts/checklist.py .`. | `backend/tests/test_flowcharts.py`, `frontend/src/lib/generateDynamicSectorFlow.test.ts`, todo o repositório | `done` | TASK-2704 |
