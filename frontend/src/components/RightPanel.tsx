import React, { useState } from 'react';
import { Variable, Sector } from '../types';
import { ScenarioManager, ScenarioMetadata } from './ScenarioManager';
import { ScenarioPremises } from './ScenarioPremises';
import { SectorConfig } from './SectorConfig';

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
    onVariableChange: (id: string, val: string) => void;
    onGoalSeekOpen: () => void;
    sectors: Sector[];
    onRefreshSectors: () => void;
    years: { id: number; active: boolean }[];
    months: { id: number; name: string; order_index: number; enabled: boolean }[];
}

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
    onVariableChange,
    onGoalSeekOpen,
    sectors,
    onRefreshSectors,
    years,
    months
}) => {
    const [rightTab, setRightTab] = useState<'scenarios' | 'config'>('scenarios');

    return (
        <aside className="w-80 border-l border-slate-200 bg-slate-50 p-6 overflow-y-auto space-y-4 flex flex-col">
            <div className="flex border-b border-slate-250 mb-2">
                <button
                    onClick={() => setRightTab('scenarios')}
                    className={`flex-1 pb-2 font-bold text-xs uppercase tracking-wider transition-colors ${
                        rightTab === 'scenarios' ? 'border-b-2 border-teal-500 text-teal-600' : 'text-slate-400 hover:text-slate-650'
                    }`}
                >
                    Cenários
                </button>
                <button
                    onClick={() => setRightTab('config')}
                    className={`flex-1 pb-2 font-bold text-xs uppercase tracking-wider transition-colors ${
                        rightTab === 'config' ? 'border-b-2 border-teal-500 text-teal-600' : 'text-slate-400 hover:text-slate-650'
                    }`}
                >
                    Configurações
                </button>
            </div>

            {rightTab === 'scenarios' ? (
                <div className="space-y-4 flex flex-col">
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
                    <ScenarioPremises scenarioVars={scenarioVars} isLocked={isLocked} onVariableChange={onVariableChange} />
                    <button
                        onClick={onGoalSeekOpen}
                        disabled={isLocked}
                        className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white font-bold py-2 px-4 rounded text-xs transition-colors shadow-sm flex items-center justify-center space-x-1.5"
                    >
                        <span>🔍 Busca de Metas Físicas</span>
                    </button>
                </div>
            ) : (
                <SectorConfig sectors={sectors} onRefreshSectors={onRefreshSectors} isLocked={isLocked} />
            )}
        </aside>
    );
};
