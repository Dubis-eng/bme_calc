import React, { useState } from 'react';
import axios from 'axios';
import { Variable } from '../types';

interface GoalSeekModalProps {
    isOpen: boolean;
    onClose: () => void;
    variables: Variable[];
    onApplyOptimalValue: (inputId: string, optimalValue: number, results: Record<string, number>) => void;
}

export const GoalSeekModal: React.FC<GoalSeekModalProps> = ({
    isOpen,
    onClose,
    variables,
    onApplyOptimalValue
}) => {
    const [inputId, setInputId] = useState('');
    const [targetId, setTargetId] = useState('');
    const [targetValue, setTargetValue] = useState('');
    
    // Bounds config
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [minVal, setMinVal] = useState('');
    const [maxVal, setMaxVal] = useState('');
    
    // Status
    const [running, setRunning] = useState(false);
    const [resultData, setResultData] = useState<{
        optimal_value: number;
        converged: boolean;
        results: Record<string, number>;
    } | null>(null);
    const [errorMsg, setErrorMsg] = useState('');

    if (!isOpen) return null;

    // Filter input/output variables
    const inputVars = variables.filter(v => v.TIPO === 'INPUT');
    const outputVars = variables.filter(v => v.TIPO === 'OUTPUT');

    const handleRun = async () => {
        if (!inputId || !targetId || !targetValue) {
            setErrorMsg('Preencha os campos obrigatórios.');
            return;
        }
        
        setRunning(true);
        setErrorMsg('');
        setResultData(null);
        
        try {
            const payload = {
                variables,
                input_id: inputId,
                target_id: targetId,
                target_value: parseFloat(targetValue),
                min_val: minVal ? parseFloat(minVal) : null,
                max_val: maxVal ? parseFloat(maxVal) : null
            };
            
            const res = await axios.post('http://localhost:8000/api/goalseek', payload);
            setResultData(res.data);
            if (!res.data.converged) {
                setErrorMsg('Aviso: O solver não convergiu totalmente para o valor exato, mas encontrou a melhor aproximação.');
            }
        } catch (err) {
            const error = err as { response?: { data?: { detail?: string } } };
            setErrorMsg(error.response?.data?.detail || 'Erro ao executar a busca de metas.');
            console.error(err);
        } finally {
            setRunning(false);
        }
    };

    const handleApply = () => {
        if (resultData) {
            onApplyOptimalValue(inputId, resultData.optimal_value, resultData.results);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="bg-slate-900 px-5 py-4 flex justify-between items-center text-white">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-teal-400">Busca de Metas Físicas</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white font-bold" aria-label="Fechar modal">✕</button>
                </div>

                <div className="p-5 flex-1 overflow-y-auto space-y-4">
                    {errorMsg && (
                        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg font-medium">
                            {errorMsg}
                        </div>
                    )}

                    {/* Step 1 Form */}
                    <div className="space-y-3">
                        <div className="flex flex-col">
                            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">
                                Variável de Entrada (Ajustar)
                                <select
                                    aria-label="Variável de Entrada"
                                    value={inputId}
                                    onChange={(e) => setInputId(e.target.value)}
                                    className="block mt-1 w-full bg-white border border-slate-200 text-xs font-semibold text-slate-700 rounded p-2 focus:ring-1 focus:ring-teal-500 focus:outline-none"
                                >
                                    <option value="">Selecione...</option>
                                    {inputVars.map(v => (
                                        <option key={v["ID - REF"]} value={v["ID - REF"]}>
                                            [{v["ID - REF"]}] {v["DESCRIÇÃO"]} ({v["UNIDADE DE MEDIDA"]})
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </div>

                        <div className="flex flex-col">
                            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">
                                Variável de Saída (Alvo)
                                <select
                                    aria-label="Variável de Saída"
                                    value={targetId}
                                    onChange={(e) => setTargetId(e.target.value)}
                                    className="block mt-1 w-full bg-white border border-slate-200 text-xs font-semibold text-slate-700 rounded p-2 focus:ring-1 focus:ring-teal-500 focus:outline-none"
                                >
                                    <option value="">Selecione...</option>
                                    {outputVars.map(v => (
                                        <option key={v["ID - REF"]} value={v["ID - REF"]}>
                                            [{v["ID - REF"]}] {v["DESCRIÇÃO"]} ({v["UNIDADE DE MEDIDA"]})
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </div>

                        <div className="flex flex-col">
                            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">
                                Valor Alvo Desejado
                                <input
                                    type="text"
                                    aria-label="Valor Alvo Desejado"
                                    value={targetValue}
                                    onChange={(e) => setTargetValue(e.target.value)}
                                    placeholder="Ex: 500 ou 0.85"
                                    className="block mt-1 w-full bg-white border border-slate-200 text-xs font-semibold text-slate-700 rounded p-2 focus:ring-1 focus:ring-teal-500 focus:outline-none"
                                />
                            </label>
                        </div>
                    </div>

                    {/* Step 2 Form (Advanced settings) */}
                    <div className="border-t border-slate-100 pt-3">
                        <button
                            type="button"
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center space-x-1 focus:outline-none"
                        >
                            <span>{showAdvanced ? '▼' : '▶'} Limites de Busca Avançados (Opcional)</span>
                        </button>

                        {showAdvanced && (
                            <div className="grid grid-cols-2 gap-3 mt-2.5 p-3 bg-slate-50 border border-slate-200/60 rounded-xl">
                                <div className="flex flex-col">
                                    <label className="text-[10px] uppercase font-bold text-slate-500 mb-1">
                                        Valor Mínimo
                                        <input
                                            type="text"
                                            aria-label="Valor Mínimo"
                                            value={minVal}
                                            onChange={(e) => setMinVal(e.target.value)}
                                            placeholder="Mín"
                                            className="block mt-1 w-full bg-white border border-slate-200 text-xs font-semibold text-slate-700 rounded p-2 focus:ring-1 focus:ring-teal-500 focus:outline-none"
                                        />
                                    </label>
                                </div>
                                <div className="flex flex-col">
                                    <label className="text-[10px] uppercase font-bold text-slate-500 mb-1">
                                        Valor Máximo
                                        <input
                                            type="text"
                                            aria-label="Valor Máximo"
                                            value={maxVal}
                                            onChange={(e) => setMaxVal(e.target.value)}
                                            placeholder="Máx"
                                            className="block mt-1 w-full bg-white border border-slate-200 text-xs font-semibold text-slate-700 rounded p-2 focus:ring-1 focus:ring-teal-500 focus:outline-none"
                                        />
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Results Display */}
                    {resultData && (
                        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl space-y-2.5">
                            <span className="text-xs font-bold text-emerald-900 block">✓ Convergência Concluída!</span>
                            <div className="text-xs text-slate-700 space-y-1">
                                <p>Valor Ótimo Calculado para <b>{inputId}</b>:</p>
                                <p className="text-base font-bold text-teal-700 font-mono">
                                    {resultData.optimal_value.toLocaleString('pt-BR', { minimumFractionDigits: 6, maximumFractionDigits: 6 })}
                                </p>
                            </div>
                            <button
                                onClick={handleApply}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-3 rounded text-xs transition-colors shadow-sm"
                            >
                                Aplicar no Cenário
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer buttons */}
                <div className="bg-slate-50 px-5 py-3.5 border-t border-slate-100 flex justify-end space-x-2.5">
                    <button
                        onClick={onClose}
                        className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold py-1.5 px-4 rounded text-xs transition-colors shadow-sm"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleRun}
                        disabled={running}
                        className="bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white font-bold py-1.5 px-5 rounded text-xs transition-colors shadow-sm flex items-center space-x-1.5"
                    >
                        {running && <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-white"></div>}
                        <span>{running ? 'Buscando...' : 'Calcular Meta'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
