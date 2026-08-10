import React from 'react';
import { Variable } from '../../types';
import { ScenarioMetadata } from '../scenario/ScenarioManager';
import { SearchDropdown } from '../search/SearchDropdown';
import { ScenarioSelectDropdown } from '../scenario/ScenarioSelectDropdown';
import { BmeIcon, SCENARIO_STATUS_BADGE } from '../../styles/design-system';

interface CalculatorTopBarProps {
  currentScenario: ScenarioMetadata | null;
  onLoadScenario: (variables: Variable[], metadata: ScenarioMetadata) => void;
  anoSafra: number;
  setAnoSafra: (val: number) => void;
  mesReferencia: string;
  setMesReferencia: (val: string) => void;
  hasUnsavedChanges: boolean;
  onSaveActive: () => Promise<void>;
  onSaveNew: () => Promise<void>;
  savingActive: boolean;
  saving: boolean;
  isLocked: boolean;
  isOffline: boolean;
  variables: Variable[];
  onSelectVariable: (varId: string) => void;
  iterations: number;
  residual: number;
  tolerance: number;
  calculating: boolean;
  handleCalculate: () => void;
  onGoalSeekOpen: () => void;
  years: { id: number; active: boolean }[];
  months: { id: number; name: string; order_index: number; enabled: boolean }[];
  onStatusChange: (status: 'Em Edição' | 'Aprovado' | 'Final') => void;
}

const DEFAULT_MONTHS_LIST = [
  'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro', 'Janeiro', 'Fevereiro', 'Março', 'Abril'
];

export const CalculatorTopBar: React.FC<CalculatorTopBarProps> = ({
  currentScenario,
  onLoadScenario,
  anoSafra,
  setAnoSafra,
  mesReferencia,
  setMesReferencia,
  hasUnsavedChanges,
  onSaveActive,
  onSaveNew,
  savingActive,
  saving,
  isLocked,
  isOffline,
  variables,
  onSelectVariable,
  iterations,
  residual,
  tolerance,
  calculating,
  handleCalculate,
  onGoalSeekOpen,
  years,
  months,
  onStatusChange,
}) => {
  const safeYears = years && years.length > 0
    ? years
    : [
        { id: anoSafra || 2026, active: true },
        { id: (anoSafra || 2026) + 1, active: true },
        { id: (anoSafra || 2026) + 2, active: true },
      ];

  const safeMonths = months && months.length > 0
    ? months
    : DEFAULT_MONTHS_LIST.map((name, idx) => ({ id: idx + 1, name, order_index: idx, enabled: true }));

  return (
    <div className="bg-white border-b border-slate-200 px-6 py-2.5 shadow-sm flex flex-col gap-2.5 shrink-0 z-20">
      {/* ── Top Level Row ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Active Scenario Info & Selectors */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Dropdown de Seleção Elegante do Cenário Ativo */}
          <ScenarioSelectDropdown
            currentScenario={currentScenario}
            onLoadScenario={onLoadScenario}
            isOffline={isOffline}
          />

          {/* Quick Selectors for Harvest & Month */}
          <div className="flex items-center gap-2">
            <select
              value={anoSafra}
              onChange={(e) => setAnoSafra(Number(e.target.value))}
              disabled={isLocked || isOffline}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-black focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none disabled:opacity-60 disabled:bg-slate-100"
            >
              {safeYears.map((y) => (
                <option key={y.id} value={y.id}>
                  Safra {y.id}/{y.id + 1}
                </option>
              ))}
            </select>

            <select
              value={mesReferencia}
              onChange={(e) => setMesReferencia(e.target.value)}
              disabled={isLocked || isOffline}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-black focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none disabled:opacity-60 disabled:bg-slate-100"
            >
              {safeMonths.map((m) => (
                <option key={m.id} value={m.name}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status buttons - SEMPRE visíveis e clicáveis para permitir alterar o status */}
          {currentScenario && (
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase px-1.5">Status:</span>
              {(['Em Edição', 'Aprovado', 'Final'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  disabled={isOffline}
                  onClick={() => onStatusChange(st)}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                    currentScenario.status === st
                      ? 'bg-bme-teal text-white shadow-sm'
                      : 'text-slate-600 hover:text-black hover:bg-white/80'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          )}

          {/* Save Pending / Save New */}
          <div className="flex items-center gap-2 ml-1">
            {hasUnsavedChanges && !isLocked && (
              <button
                type="button"
                onClick={onSaveActive}
                disabled={savingActive || isOffline}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-60"
              >
                <span>⚠️</span>
                <span>{savingActive ? 'Salvando...' : 'Salvar Alterações'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onSaveNew}
              disabled={saving || isOffline}
              className="btn-primary px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 shadow-sm disabled:opacity-60"
            >
              {saving && (
                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              <span>{saving ? 'Criando...' : '+ Novo Cenário'}</span>
            </button>
          </div>
        </div>

        {/* Right: Search + GoalSeek + Calculate */}
        <div className="flex items-center gap-3">
          {/* Search Dropdown */}
          <SearchDropdown
            variables={variables}
            onSelectVariable={onSelectVariable}
          />

          {/* Goal Seek Button */}
          <button
            type="button"
            onClick={onGoalSeekOpen}
            disabled={isLocked || isOffline}
            className="btn-outline px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
            title="Busca de Metas Físicas"
          >
            <span>🎯</span>
            <span className="hidden xl:inline">Metas Físicas</span>
          </button>

          {/* Iterations & Residual badge */}
          {iterations > 1 && (
            <div className="flex items-center gap-1.5">
              <span className="badge-info">{iterations} it.</span>
              <span
                className={`px-2 py-0.5 rounded-full border text-[10px] font-mono font-bold ${
                  residual > tolerance
                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                }`}
                title={`Resíduo de reciclo: ${residual.toExponential(2)}`}
              >
                res: {residual.toExponential(2)}
              </span>
            </div>
          )}

          {/* Calculate Button */}
          <button
            id="btn-calculate"
            onClick={handleCalculate}
            disabled={calculating || isLocked || isOffline}
            className="btn-primary px-4 py-2 text-xs font-bold shadow-md flex items-center gap-2"
          >
            {calculating && (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            <span>{calculating ? 'Calculando...' : '▶ Calcular'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
