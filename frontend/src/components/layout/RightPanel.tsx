import React, { useState } from 'react';
import { Variable, Sector } from '../../types';
import { ScenarioManager, ScenarioMetadata } from '../scenario/ScenarioManager';
import { ScenarioPremises } from '../scenario/ScenarioPremises';
import { SectorConfig } from '../sectors/SectorConfig';
import { SCENARIO_STATUS_BADGE } from '../../styles/design-system';

interface RightPanelProps {
  variables: Variable[];
  onLoadScenario: (variables: Variable[], metadata: ScenarioMetadata) => void;
  currentScenario: ScenarioMetadata | null;
  onStatusChange: (status: 'Em Edição' | 'Aprovado' | 'Final') => void;
  anoSafra: number;
  setAnoSafra: (val: number) => void;
  mesReferencia: string;
  setMesReferencia: (val: string) => void;
  onSaveNew: () => Promise<void>;
  saving: boolean;
  onSaveActive: () => Promise<void>;
  savingActive: boolean;
  hasUnsavedChanges: boolean;
  scenarioVars: Variable[];
  isLocked: boolean;
  onGoalSeekOpen: () => void;
  sectors: Sector[];
  onRefreshSectors: () => void;
  years: { id: number; active: boolean }[];
  months: { id: number; name: string; order_index: number; enabled: boolean }[];
}

type RightTab = 'scenarios' | 'config';

const RIGHT_TABS: { id: RightTab; label: string; icon: string }[] = [
  { id: 'scenarios', label: 'Cenários', icon: '📋' },
  { id: 'config',    label: 'Config.',  icon: '⚙' },
];

export const RightPanel: React.FC<RightPanelProps> = ({
  variables,
  onLoadScenario,
  currentScenario,
  onStatusChange,
  anoSafra,
  setAnoSafra,
  mesReferencia,
  setMesReferencia,
  onSaveNew,
  saving,
  onSaveActive,
  savingActive,
  hasUnsavedChanges,
  scenarioVars,
  isLocked,
  onGoalSeekOpen,
  sectors,
  onRefreshSectors,
  years,
  months,
}) => {
  const [rightTab, setRightTab] = useState<RightTab>('scenarios');

  return (
    <aside className="w-80 shrink-0 flex flex-col bg-white border-l border-slate-300 overflow-hidden shadow-sm">
      {/* ── Tab Header ── */}
      <div className="flex items-center gap-1.5 bg-slate-100 border-b border-slate-300 p-2">
        {RIGHT_TABS.map(tab => (
          <button
            key={tab.id}
            id={`right-tab-${tab.id}`}
            onClick={() => setRightTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
              rightTab === tab.id
                ? 'bg-white text-teal-800 border border-slate-300 shadow-sm font-extrabold'
                : 'text-slate-700 hover:text-black hover:bg-slate-200/60'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── Scenario Info Banner ── */}
      {rightTab === 'scenarios' && currentScenario && (
        <div className="mx-3 mt-3 p-3.5 rounded-2xl bg-teal-50 border border-teal-300 shadow-sm">
          <p className="text-[10px] text-black uppercase tracking-wider mb-1 font-bold">Cenário Ativo</p>
          <p className="text-xs font-extrabold text-black truncate">{currentScenario.year_harvest} · v{currentScenario.version}</p>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-xs text-black font-bold">{currentScenario.reference_month}</span>
            <span className={`px-2.5 py-0.5 text-[9px] font-bold rounded-full border ${SCENARIO_STATUS_BADGE[currentScenario.status] ?? 'badge-idle'}`}>
              {currentScenario.status}
            </span>
          </div>
        </div>
      )}

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-white">
        {rightTab === 'scenarios' ? (
          <>
            <ScenarioManager
              variables={variables}
              onLoadScenario={onLoadScenario}
              currentScenario={currentScenario}
              onStatusChange={onStatusChange}
              anoSafra={anoSafra}
              setAnoSafra={setAnoSafra}
              mesReferencia={mesReferencia}
              setMesReferencia={setMesReferencia}
              onSaveNew={onSaveNew}
              saving={saving}
              onSaveActive={onSaveActive}
              savingActive={savingActive}
              hasUnsavedChanges={hasUnsavedChanges}
              years={years}
              months={months}
            />

            <ScenarioPremises
              scenarioVars={scenarioVars}
              isLocked={isLocked}
            />

            {/* Quick Actions */}
            <div className="bg-white border border-slate-300 p-4 rounded-2xl space-y-2 shadow-sm">
              <span className="text-xs font-extrabold text-black uppercase tracking-wider block">Ações Rápidas</span>
              <button
                onClick={onGoalSeekOpen}
                className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-300 text-black font-bold py-2 px-3 rounded-xl text-xs transition-colors flex items-center justify-center space-x-1.5 shadow-sm"
              >
                <span>🎯</span>
                <span>Busca de Metas (Goal Seek)</span>
              </button>
            </div>
          </>
        ) : (
          <SectorConfig
            sectors={sectors}
            onRefreshSectors={onRefreshSectors}
            isLocked={isLocked}
          />
        )}
      </div>
    </aside>
  );
};
