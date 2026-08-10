import React, { useState } from 'react';
import axios from 'axios';
import { Variable } from '../../types';
import { BmeIcon } from '../../styles/design-system';

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
  
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [minVal, setMinVal] = useState('');
  const [maxVal, setMaxVal] = useState('');
  
  const [running, setRunning] = useState(false);
  const [resultData, setResultData] = useState<{
    optimal_value: number;
    converged: boolean;
    results: Record<string, number>;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

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
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 animate-fade-in-up">
      <div className="bg-white border border-slate-300 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex justify-between items-center border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-600/20 border border-teal-500/40 flex items-center justify-center">
              <BmeIcon name="search" size={16} className="text-teal-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Busca de Metas (Goal Seek)</h3>
              <p className="text-[11px] text-slate-300 font-medium mt-0.5">Ajuste automático de variáveis de entrada</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors" aria-label="Fechar modal">
            <BmeIcon name="close" size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs text-black bg-white">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-300 text-red-900 text-xs rounded-xl font-bold">
              {errorMsg}
            </div>
          )}

          {/* Step 1 Form */}
          <div className="space-y-3.5">
            <div>
              <label className="text-[11px] uppercase font-bold text-black tracking-wider block mb-1">
                Variável de Entrada (Ajustar)
              </label>
              <select
                aria-label="Variável de Entrada"
                value={inputId}
                onChange={(e) => setInputId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl text-xs font-bold text-black p-2.5 focus:outline-none focus:border-teal-600 shadow-sm"
              >
                <option value="">Selecione...</option>
                {inputVars.map(v => (
                  <option key={v["ID - REF"]} value={v["ID - REF"]}>
                    [{v["ID - REF"]}] {v["DESCRIÇÃO"]} ({v["UNIDADE DE MEDIDA"]})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] uppercase font-bold text-black tracking-wider block mb-1">
                Variável de Saída (Alvo)
              </label>
              <select
                aria-label="Variável de Saída"
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl text-xs font-bold text-black p-2.5 focus:outline-none focus:border-teal-600 shadow-sm"
              >
                <option value="">Selecione...</option>
                {outputVars.map(v => (
                  <option key={v["ID - REF"]} value={v["ID - REF"]}>
                    [{v["ID - REF"]}] {v["DESCRIÇÃO"]} ({v["UNIDADE DE MEDIDA"]})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] uppercase font-bold text-black tracking-wider block mb-1">
                Valor Alvo Desejado
              </label>
              <input
                type="text"
                aria-label="Valor Alvo Desejado"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                placeholder="Ex: 500 ou 0.85"
                className="w-full bg-white border border-slate-300 rounded-xl text-xs font-bold text-black p-2.5 focus:outline-none focus:border-teal-600 shadow-sm"
              />
            </div>
          </div>

          {/* Step 2 Form (Advanced settings) */}
          <div className="border-t border-slate-200 pt-3">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center space-x-1 focus:outline-none"
            >
              <span>{showAdvanced ? '▼' : '▶'} Limites de Busca Avançados (Opcional)</span>
            </button>

            {showAdvanced && (
              <div className="grid grid-cols-2 gap-3 mt-2.5 p-3.5 bg-slate-50 border border-slate-300 rounded-xl shadow-sm">
                <div>
                  <label className="text-[10px] uppercase font-bold text-black block mb-1">
                    Valor Mínimo
                  </label>
                  <input
                    type="text"
                    aria-label="Valor Mínimo"
                    value={minVal}
                    onChange={(e) => setMinVal(e.target.value)}
                    placeholder="Mín"
                    className="w-full bg-white border border-slate-300 rounded-lg text-xs font-bold text-black p-2 focus:outline-none focus:border-teal-600"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-black block mb-1">
                    Valor Máximo
                  </label>
                  <input
                    type="text"
                    aria-label="Valor Máximo"
                    value={maxVal}
                    onChange={(e) => setMaxVal(e.target.value)}
                    placeholder="Máx"
                    className="w-full bg-white border border-slate-300 rounded-lg text-xs font-bold text-black p-2 focus:outline-none focus:border-teal-600"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Results Display */}
          {resultData && (
            <div className="bg-emerald-50 border border-emerald-300 p-4 rounded-xl space-y-2.5 shadow-sm">
              <span className="text-xs font-extrabold text-emerald-950 block">✓ Convergência Concluída!</span>
              <div className="text-xs text-black space-y-1">
                <p className="font-semibold">Valor Ótimo Calculado para <b className="font-mono">{inputId}</b>:</p>
                <p className="text-base font-bold text-teal-800 font-mono">
                  {resultData.optimal_value.toLocaleString('pt-BR', { minimumFractionDigits: 6, maximumFractionDigits: 6 })}
                </p>
              </div>
              <button
                onClick={handleApply}
                className="w-full bg-teal-700 hover:bg-teal-800 text-white font-bold py-2 px-3 rounded-xl text-xs transition-colors shadow-sm"
              >
                Aplicar no Cenário
              </button>
            </div>
          )}
        </div>

        {/* Footer buttons */}
        <div className="bg-slate-50 border-t border-slate-300 px-5 py-3.5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="bg-white hover:bg-slate-100 border border-slate-300 text-black font-bold py-2 px-4 rounded-xl text-xs transition-colors shadow-sm"
          >
            Cancelar
          </button>
          <button
            onClick={handleRun}
            disabled={running}
            className="bg-teal-700 hover:bg-teal-800 disabled:bg-slate-300 text-white font-bold py-2 px-5 rounded-xl text-xs transition-colors shadow-sm flex items-center space-x-1.5"
          >
            {running && <div className="animate-spin rounded-full h-3 w-3 border-2 border-white/20 border-t-white"></div>}
            <span>{running ? 'Buscando...' : 'Calcular Meta'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
