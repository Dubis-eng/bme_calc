import React from 'react';
import { ScenarioMetadata } from '../../types';

interface ProcessFlowToolbarProps {
  onAddProcessNode: () => void;
  onAddIoNode: () => void;
  onSave: () => void;
  onReset: () => void;
  onDeleteSelected?: () => void;
  selectedElementsCount?: number;
  isSaving: boolean;
  hasCustomLayout: boolean;
  isViewingDefault?: boolean;

  // Calculation & Lock Props
  onCalculate?: () => void;
  isCalculating?: boolean;
  isLayoutLocked?: boolean;
  onToggleLayoutLock?: () => void;

  // Scenario Selection Props
  selectedYear?: number | string;
  onYearChange?: (year: number) => void;
  availableYears?: number[];
  selectedScenarioId?: string;
  onScenarioChange?: (id: string) => void;
  availableScenarios?: ScenarioMetadata[];
}

export const ProcessFlowToolbar: React.FC<ProcessFlowToolbarProps> = ({
  onAddProcessNode,
  onAddIoNode,
  onSave,
  onReset,
  onDeleteSelected,
  selectedElementsCount = 0,
  isSaving,
  hasCustomLayout,
  isViewingDefault = false,
  onCalculate,
  isCalculating = false,
  isLayoutLocked = true,
  onToggleLayoutLock,
  selectedYear,
  onYearChange,
  availableYears = [2025, 2026, 2027],
  selectedScenarioId,
  onScenarioChange,
  availableScenarios = [],
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-t-xl border-b border-slate-800 bg-slate-900/90 px-4 py-3 backdrop-blur-md">
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-teal-400">
          🛠️ Editor de Topologia
        </span>

        {isViewingDefault ? (
          <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-300">
            Modo de Visualização Padrão
          </span>
        ) : hasCustomLayout ? (
          <span className="rounded-md border border-teal-500/30 bg-teal-500/10 px-2 py-0.5 text-[11px] font-medium text-teal-300">
            Layout Customizado Salvo
          </span>
        ) : (
          <span className="rounded-md border border-slate-700 bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-400">
            Topologia Automática
          </span>
        )}

        <div className="h-4 w-px bg-slate-800 mx-0.5" />

        {/* Dropdown de Ano Safra */}
        <div className="flex items-center gap-1.5 rounded-md border border-slate-800 bg-slate-950 px-2.5 py-1 text-xs">
          <span className="text-slate-400 font-medium text-[11px]">Safra:</span>
          <select
            value={selectedYear || 2026}
            onChange={(e) => onYearChange?.(Number(e.target.value))}
            className="bg-transparent text-teal-300 font-semibold text-xs focus:outline-none cursor-pointer"
          >
            {availableYears.map((yr) => (
              <option key={yr} value={yr} className="bg-slate-900 text-slate-200">
                {yr} / {yr + 1}
              </option>
            ))}
          </select>
        </div>

        {/* Dropdown de Cenário */}
        <div className="flex items-center gap-1.5 rounded-md border border-slate-800 bg-slate-950 px-2.5 py-1 text-xs">
          <span className="text-slate-400 font-medium text-[11px]">Cenário:</span>
          <select
            value={selectedScenarioId || ''}
            onChange={(e) => onScenarioChange?.(e.target.value)}
            className="bg-transparent text-teal-300 font-semibold text-xs focus:outline-none cursor-pointer max-w-[210px] truncate"
          >
            <option value="" className="bg-slate-900 text-slate-400">
              -- Selecionar Cenário --
            </option>
            {availableScenarios.map((sc) => (
              <option key={sc.id} value={sc.id} className="bg-slate-900 text-slate-200">
                {sc.year_harvest} - {sc.reference_month} (v{sc.version || 1}) [{sc.status || 'Em Edição'}]
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Botão Calcular */}
        {onCalculate && (
          <button
            type="button"
            onClick={onCalculate}
            disabled={isCalculating}
            className="flex items-center gap-1.5 rounded-lg border border-teal-500/50 bg-gradient-to-r from-teal-600 to-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:from-teal-500 hover:to-emerald-500 disabled:opacity-50 transition-all shadow-md shadow-teal-950/40 active:scale-95 cursor-pointer"
            title="Executar motor de cálculo do balanço com os dados atuais"
          >
            <span className={isCalculating ? 'animate-spin' : ''}>{isCalculating ? '🔄' : '⚡'}</span>
            <span>{isCalculating ? 'Calculando...' : 'Calcular'}</span>
          </button>
        )}

        <div className="h-4 w-px bg-slate-700 mx-0.5" />

        {/* Botão Cadeado (Lock / Unlock) */}
        {onToggleLayoutLock && (
          <button
            type="button"
            onClick={onToggleLayoutLock}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
              isLayoutLocked
                ? 'border-amber-500/40 bg-amber-950/30 text-amber-300 hover:bg-amber-900/40'
                : 'border-cyan-500/50 bg-cyan-950/40 text-cyan-300 hover:bg-cyan-900/50 shadow-sm shadow-cyan-950/50'
            }`}
            title={isLayoutLocked ? 'Layout Travado. Clique para liberar edição e movimentação dos blocos.' : 'Edição Liberada. Clique para travar o layout.'}
          >
            <span>{isLayoutLocked ? '🔒' : '🔓'}</span>
            <span>{isLayoutLocked ? 'Layout Travado' : 'Edição Liberada'}</span>
          </button>
        )}

        {/* Ferramentas Estruturais Liberadas Apenas Quando Desbloqueado */}
        {!isLayoutLocked && (
          <>
            <div className="h-4 w-px bg-slate-700 mx-0.5" />

            <button
              type="button"
              onClick={onAddProcessNode}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-slate-600 hover:bg-slate-700 transition-colors"
              title="Adicionar Bloco de Processo"
            >
              <span>➕</span> Processo
            </button>

            <button
              type="button"
              onClick={onAddIoNode}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-slate-600 hover:bg-slate-700 transition-colors"
              title="Adicionar Bloco de E/S (Inputs / Outputs)"
            >
              <span>📥</span> E/S
            </button>

            {selectedElementsCount > 0 && onDeleteSelected && (
              <button
                type="button"
                onClick={onDeleteSelected}
                className="flex items-center gap-1.5 rounded-lg border border-rose-800/80 bg-rose-950/80 px-3 py-1.5 text-xs font-medium text-rose-200 hover:bg-rose-900 transition-colors"
                title="Excluir elementos selecionados no canvas (tecla Delete/Backspace)"
              >
                <span>🗑️</span> Excluir ({selectedElementsCount})
              </button>
            )}

            <button
              type="button"
              onClick={onReset}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${isViewingDefault ? 'border-teal-500/60 bg-teal-950/80 text-teal-300 shadow-sm shadow-teal-900/30' : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-amber-900/50 hover:bg-amber-950/40 hover:text-amber-300'}`}
              title={isViewingDefault ? 'Voltar para o layout customizado salvo no banco' : 'Visualizar a topologia automática baseada no cadastro relacional'}
            >
              <span>{isViewingDefault ? '🎨' : '🔄'}</span>
              {isViewingDefault ? 'Ver Customizado' : 'Ver Padrão'}
            </button>

            <button
              type="button"
              onClick={onSave}
              disabled={isSaving}
              className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-teal-500 disabled:opacity-50 transition-colors shadow-md shadow-teal-900/20"
            >
              <span>{isSaving ? '⏳' : '💾'}</span>
              {isSaving ? 'Salvando...' : 'Salvar Layout'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};
