import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Variable } from '../types';

export interface ScenarioMetadata {
    id: string;
    year_harvest: string;
    reference_month: string;
    version: number;
    status: 'Em Edição' | 'Aprovado' | 'Final';
    created_at?: string;
    updated_at?: string;
}

interface ScenarioManagerProps {
    variables: Variable[];
    onLoadScenario: (variables: Variable[], metadata: ScenarioMetadata) => void;
    currentScenario: ScenarioMetadata | null;
    onStatusChange: (status: 'Em Edição' | 'Aprovado' | 'Final') => void;
    anoSafra: string;
    setAnoSafra: (val: string) => void;
    mesReferencia: string;
    setMesReferencia: (val: string) => void;
    onSaveNew: () => Promise<void>;
    saving: boolean;
    onSaveActive?: () => Promise<void>;
    savingActive?: boolean;
    hasUnsavedChanges?: boolean;
}

export const ScenarioManager: React.FC<ScenarioManagerProps> = ({
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
    savingActive = false,
    hasUnsavedChanges = false
}) => {
    const [scenarios, setScenarios] = useState<ScenarioMetadata[]>([]);
    const [loading, setLoading] = useState(false);
    const [listError, setListError] = useState('');

    const fetchScenarios = async () => {
        setLoading(true);
        setListError('');
        try {
            const res = await axios.get('http://localhost:8000/api/scenarios');
            setScenarios(res.data);
        } catch (err) {
            setListError('Erro ao carregar lista de cenários.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchScenarios();
    }, [currentScenario]);

    const handleLoad = async (id: string) => {
        try {
            const res = await axios.get(`http://localhost:8000/api/scenarios/${id}`);
            const scenario = res.data;
            const meta: ScenarioMetadata = {
                id: scenario.id,
                year_harvest: scenario.year_harvest,
                reference_month: scenario.reference_month,
                version: scenario.version,
                status: scenario.status
            };
            onLoadScenario(scenario.variables, meta);
        } catch (err) {
            alert('Erro ao carregar detalhes do cenário.');
            console.error(err);
        }
    };

    const handleUpdateStatus = async (status: 'Em Edição' | 'Aprovado' | 'Final') => {
        if (!currentScenario) return;
        try {
            const res = await axios.patch(`http://localhost:8000/api/scenarios/${currentScenario.id}/status`, { status });
            onStatusChange(res.data.status);
            // Refresh list
            fetchScenarios();
        } catch (err) {
            alert('Erro ao atualizar status.');
            console.error(err);
        }
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'Aprovado':
                return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'Final':
                return 'bg-slate-700 text-slate-100 border-slate-600';
            default:
                return 'bg-teal-50 text-teal-800 border-teal-200';
        }
    };

    return (
        <div className="flex flex-col space-y-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Gerenciador de Cenários</h3>

            {/* Save Form controls */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200/60">
                <div className="flex flex-col">
                    <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">
                        Ano Safra
                        <select
                            aria-label="Ano Safra para salvar"
                            value={anoSafra}
                            onChange={(e) => setAnoSafra(e.target.value)}
                            className="block mt-1 w-full bg-white border border-slate-200 text-xs font-semibold text-slate-700 rounded p-1.5 focus:ring-1 focus:ring-teal-500 focus:outline-none"
                        >
                            <option value="2026/2027">2026/2027</option>
                            <option value="2027/2028">2027/2028</option>
                        </select>
                    </label>
                </div>
                <div className="flex flex-col">
                    <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">
                        Mês Referência
                        <select
                            aria-label="Mês Referência para salvar"
                            value={mesReferencia}
                            onChange={(e) => setMesReferencia(e.target.value)}
                            className="block mt-1 w-full bg-white border border-slate-200 text-xs font-semibold text-slate-700 rounded p-1.5 focus:ring-1 focus:ring-teal-500 focus:outline-none"
                        >
                            <option value="Abril">Abril</option>
                            <option value="Maio">Maio</option>
                            <option value="Junho">Junho</option>
                        </select>
                    </label>
                </div>

                <div className="col-span-2 pt-1">
                    <button
                        onClick={onSaveNew}
                        disabled={saving}
                        className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white font-bold py-1.5 px-3 rounded text-xs transition-colors shadow-sm"
                    >
                        {saving ? 'Salvando Cenário...' : 'Salvar Novo Cenário / Versão'}
                    </button>
                </div>
            </div>

            {/* Current Scenario controls */}
            {currentScenario && (
                <div className="bg-teal-50/55 p-3.5 rounded-lg border border-teal-200/50 space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-teal-900">Cenário Ativo: v{currentScenario.version}</span>
                        <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full border ${getStatusBadgeClass(currentScenario.status)}`}>
                            {currentScenario.status}
                        </span>
                    </div>

                    {currentScenario.status === 'Em Edição' && (
                        <div className="pt-1">
                            <button
                                onClick={onSaveActive}
                                disabled={savingActive}
                                aria-label="Salvar alterações do cenário ativo"
                                className={`w-full text-white font-bold py-1.5 px-3 rounded text-xs transition-colors shadow-sm ${
                                    hasUnsavedChanges
                                        ? 'bg-amber-600 hover:bg-amber-700'
                                        : 'bg-teal-600 hover:bg-teal-700'
                                }`}
                            >
                                {savingActive ? 'Salvando...' : hasUnsavedChanges ? '⚠️ Salvar Alterações' : 'Salvar Alterações'}
                            </button>
                        </div>
                    )}

                    {/* Change status action */}
                    <div className="flex flex-col space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-500">Alterar Status</span>
                        <div className="flex space-x-1.5">
                            {(['Em Edição', 'Aprovado', 'Final'] as const).map((st) => (
                                <button
                                    key={st}
                                    onClick={() => handleUpdateStatus(st)}
                                    className={`flex-1 py-1 px-1.5 rounded text-[10px] font-medium border transition-colors ${
                                        currentScenario.status === st
                                            ? 'bg-teal-600 border-teal-600 text-white font-bold'
                                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                    }`}
                                >
                                    {st}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Export Actions */}
                    <div className="flex space-x-2 pt-2 border-t border-teal-200/40">
                        <a
                            href={`http://localhost:8000/api/scenarios/${currentScenario.id}/export/pdf`}
                            download
                            className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold py-1 px-2 rounded text-[10px] text-center transition-colors shadow-sm flex items-center justify-center space-x-1"
                        >
                            <span>📄 Baixar PDF</span>
                        </a>
                        <a
                            href={`http://localhost:8000/api/scenarios/${currentScenario.id}/export/xlsx`}
                            download
                            className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold py-1 px-2 rounded text-[10px] text-center transition-colors shadow-sm flex items-center justify-center space-x-1"
                        >
                            <span>📊 Baixar Excel</span>
                        </a>
                    </div>
                </div>
            )}

            {/* List of historical scenarios */}
            <div className="flex flex-col flex-1 min-h-[150px]">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Histórico de Versões</span>
                    <button
                        onClick={fetchScenarios}
                        className="text-[10px] text-teal-600 hover:text-teal-700 font-bold"
                        aria-label="Atualizar histórico"
                    >
                        Atualizar ↻
                    </button>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center flex-1 py-4">
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-teal-500"></div>
                    </div>
                ) : listError ? (
                    <p className="text-xs text-red-500 text-center py-2">{listError}</p>
                ) : scenarios.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">Nenhum cenário salvo.</p>
                ) : (
                    <div className="overflow-y-auto max-h-[200px] border border-slate-100 rounded-lg divide-y divide-slate-100">
                        {scenarios.map((sc) => (
                            <button
                                key={sc.id}
                                onClick={() => handleLoad(sc.id)}
                                className={`w-full flex flex-col p-2 text-left transition-colors hover:bg-slate-50 border-none outline-none ${
                                    currentScenario?.id === sc.id ? 'bg-teal-50/30 font-semibold' : ''
                                }`}
                            >
                                <div className="flex justify-between w-full items-center">
                                    <span className="text-[11px] font-bold text-slate-700">
                                        Safra {sc.year_harvest} - {sc.reference_month}
                                    </span>
                                    <span className={`px-1.5 py-0.5 text-[8px] font-bold rounded-full border ${getStatusBadgeClass(sc.status)}`}>
                                        {sc.status}
                                    </span>
                                </div>
                                <span className="text-[10px] text-slate-400 mt-0.5">Versão v{sc.version}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
