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
        <aside className="w-80 shrink-0 flex flex-col bg-slate-950 border-l border-slate-800/60 overflow-hidden">
            {/* ── Tab Header ── */}
            <div className="flex items-center gap-0.5 bg-slate-900/40 border-b border-slate-800/60 p-2">
                {RIGHT_TABS.map(tab => (
                    <button
                        key={tab.id}
                        id={`right-tab-${tab.id}`}
                        onClick={() => setRightTab(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                            rightTab === tab.id
                                ? 'bg-slate-800 text-teal-400 border border-slate-700/60'
                                : 'text-slate-500 hover:text-slate-300'
                        }`}
                    >
                        <span>{tab.icon}</span>
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* ── Scenario Info Banner ── */}
            {rightTab === 'scenarios' && currentScenario && (
                <div className="mx-3 mt-3 p-3 rounded-lg bg-slate-900/60 border border-slate-800/60">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 font-semibold">Cenário Ativo</p>
                    <p className="text-xs font-bold text-white truncate">{currentScenario.year_harvest} · v{currentScenario.version}</p>
                    <div className="flex items-center justify-between mt-1.5">
                        <span className="text-[10px] text-slate-600">{currentScenario.reference_month}</span>
                        <ScenarioStatusBadge status={currentScenario.status} />
                    </div>
                </div>
            )}

            {/* ── Content ── */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
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
                        <button
                            id="btn-goal-seek"
                            onClick={onGoalSeekOpen}
                            disabled={isLocked}
                            className="btn-primary w-full py-2 text-xs flex items-center justify-center gap-2"
                        >
                            <span>🎯</span>
                            <span>Busca de Metas Físicas</span>
                        </button>
                    </>
                ) : (
                    <SectorConfig sectors={sectors} onRefreshSectors={onRefreshSectors} isLocked={isLocked} />
                )}
            </div>
        </aside>
    );
};

function ScenarioStatusBadge({ status }: { status: string }) {
    return <span className={SCENARIO_STATUS_BADGE[status] ?? 'badge-idle'}>{status}</span>;
}
