import React from 'react';
import { ScenarioMetadata } from '../../types';
import { BmeIcon } from '../../styles/design-system';

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

  onCalculate?: () => void;
  isCalculating?: boolean;
  isLayoutLocked?: boolean;
  onToggleLayoutLock?: () => void;

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
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-t-2xl border-b border-slate-300 bg-white px-5 py-3.5 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs font-extrabold uppercase tracking-wider text-black flex items-center gap-2">
          <BmeIcon name="workflow" size={16} className="text-teal-700" />
          <span>Editor de Topologia</span>
        </span>

        {isViewingDefault ? (
          <span className="rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-900">
            Modo Padrão
          </span>
        ) : hasCustomLayout ? (
          <span className="rounded-lg border border-teal-300 bg-teal-50 px-2.5 py-0.5 text-xs font-bold text-teal-900">
            Layout Customizado
          </span>
        ) : (
          <span className="rounded-lg border border-slate-300 bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-black">
            Topologia Automática
          </span>
        )}

        <div className="h-5 w-px bg-slate-300 mx-0.5" />

        {/* Dropdown de Ano Safra */}
        <div className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-slate-50 px-3 py-1 text-xs shadow-sm">
          <span className="text-black font-bold text-xs">Safra:</span>
          <select
            value={selectedYear || 2026}
            onChange={(e) => onYearChange?.(Number(e.target.value))}
            className="bg-transparent text-black font-bold text-xs focus:outline-none cursor-pointer"
          >
            {availableYears.map((yr) => (
              <option key={yr} value={yr} className="bg-white text-black font-bold">
                {yr} / {yr + 1}
              </option>
            ))}
          </select>
        </div>

        {/* Dropdown de Cenário */}
        <div className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-slate-50 px-3 py-1 text-xs shadow-sm">
          <span className="text-black font-bold text-xs">Cenário:</span>
          <select
            value={selectedScenarioId || ''}
            onChange={(e) => onScenarioChange?.(e.target.value)}
            className="bg-transparent text-black font-bold text-xs focus:outline-none cursor-pointer max-w-[210px] truncate"
          >
            <option value="" className="bg-white text-black font-bold">
              -- Selecionar Cenário --
            </option>
            {availableScenarios.map((sc) => (
              <option key={sc.id} value={sc.id} className="bg-white text-black font-bold">
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
            className="flex items-center gap-1.5 rounded-xl border border-teal-700 bg-teal-700 px-4 py-1.5 text-xs font-bold text-white hover:bg-teal-800 disabled:opacity-50 transition-all shadow-sm active:scale-95 cursor-pointer"
            title="Executar motor de cálculo do balanço com os dados atuais"
          >
            <BmeIcon name="zap" size={14} className={isCalculating ? 'animate-spin' : ''} />
            <span>{isCalculating ? 'Calculando...' : 'Calcular'}</span>
          </button>
        )}

        <div className="h-5 w-px bg-slate-300 mx-0.5" />

        {/* Botão Cadeado (Lock / Unlock) */}
        {onToggleLayoutLock && (
          <button
            type="button"
            onClick={onToggleLayoutLock}
            className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-1.5 text-xs font-bold transition-all shadow-sm ${
              isLayoutLocked
                ? 'border-amber-400 bg-amber-50 text-amber-950 hover:bg-amber-100'
                : 'border-teal-400 bg-teal-50 text-teal-950 hover:bg-teal-100'
            }`}
            title={isLayoutLocked ? 'Layout Travado. Clique para liberar edição e movimentação dos blocos.' : 'Edição Liberada. Clique para travar o layout.'}
          >
            <BmeIcon name="lock" size={14} />
            <span>{isLayoutLocked ? 'Layout Travado' : 'Edição Liberada'}</span>
          </button>
        )}

        {/* Ferramentas Estruturais Liberadas Apenas Quando Desbloqueado */}
        {!isLayoutLocked && (
          <>
            <div className="h-5 w-px bg-slate-300 mx-0.5" />

            <button
              type="button"
              onClick={onAddProcessNode}
              className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-black hover:bg-slate-100 transition-colors shadow-sm"
              title="Adicionar Bloco de Processo"
            >
              <BmeIcon name="plus" size={13} />
              <span>Processo</span>
            </button>

            <button
              type="button"
              onClick={onAddIoNode}
              className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-black hover:bg-slate-100 transition-colors shadow-sm"
              title="Adicionar Bloco de E/S (Inputs / Outputs)"
            >
              <BmeIcon name="plus" size={13} />
              <span>E/S</span>
            </button>

            {selectedElementsCount > 0 && onDeleteSelected && (
              <button
                type="button"
                onClick={onDeleteSelected}
                className="flex items-center gap-1.5 rounded-xl border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-900 hover:bg-red-100 transition-colors shadow-sm"
                title="Excluir elementos selecionados no canvas (tecla Delete/Backspace)"
              >
                <BmeIcon name="close" size={13} />
                <span>Excluir ({selectedElementsCount})</span>
              </button>
            )}

            <button
              type="button"
              onClick={onReset}
              className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-black hover:bg-slate-100 transition-colors shadow-sm"
              title={isViewingDefault ? 'Voltar para o layout customizado salvo no banco' : 'Visualizar a topologia automática baseada no cadastro relacional'}
            >
              <BmeIcon name="gear" size={13} />
              <span>{isViewingDefault ? 'Ver Customizado' : 'Ver Padrão'}</span>
            </button>

            <button
              type="button"
              onClick={onSave}
              disabled={isSaving}
              className="flex items-center gap-1.5 rounded-xl bg-teal-700 px-4 py-1.5 text-xs font-bold text-white hover:bg-teal-800 disabled:opacity-50 transition-colors shadow-sm"
            >
              <BmeIcon name="pencil" size={13} />
              <span>{isSaving ? 'Salvando...' : 'Salvar Layout'}</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};
