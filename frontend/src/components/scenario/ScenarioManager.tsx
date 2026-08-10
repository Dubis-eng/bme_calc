import React, { useState, useEffect } from 'react';
import { Variable, ScenarioMetadata } from '../../types';
export type { ScenarioMetadata };
import { formatHarvestYear } from '../../utils/helpers';
import { SCENARIO_STATUS_BADGE } from '../../styles/design-system';
import apiClient from '../../api/client';
import { toast } from '../ui/Toast';

interface ScenarioManagerProps {
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
  onSaveActive?: () => Promise<void>;
  savingActive?: boolean;
  hasUnsavedChanges?: boolean;
  years: { id: number; active: boolean }[];
  months: { id: number; name: string; order_index: number; enabled: boolean }[];
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
  hasUnsavedChanges = false,
  years,
  months
}) => {
  const [scenarios, setScenarios] = useState<ScenarioMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState('');

  const fetchScenarios = async () => {
    setLoading(true);
    setListError('');
    try {
      const res = await apiClient.get('/api/scenarios');
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
      const res = await apiClient.get(`/api/scenarios/${id}`);
      const scenario = res.data;
      const meta: ScenarioMetadata = {
        id: scenario.id,
        year_harvest: scenario.year_harvest,
        reference_month: scenario.reference_month,
        version: scenario.version,
        status: scenario.status,
        cycle_start_month: scenario.cycle_start_month
      };
      onLoadScenario(scenario.variables, meta);
      toast.success(`Cenário v${scenario.version} carregado com sucesso!`);
    } catch (err) {
      toast.error('Erro ao carregar detalhes do cenário.');
      console.error(err);
    }
  };

  const handleUpdateStatus = async (status: 'Em Edição' | 'Aprovado' | 'Final') => {
    if (!currentScenario) return;
    try {
      const res = await apiClient.patch(`/api/scenarios/${currentScenario.id}/status`, { status });
      onStatusChange(res.data.status);
      toast.success(`Status alterado para "${res.data.status}".`);
      fetchScenarios();
    } catch (err) {
      toast.error('Erro ao atualizar status do cenário.');
      console.error(err);
    }
  };

  const baseURL = apiClient.defaults.baseURL || 'http://localhost:8000';

  return (
    <div className="bg-white border border-slate-300 rounded-2xl p-5 space-y-4 shadow-xl">
      <h3 className="text-xs font-extrabold text-black uppercase tracking-wider">Gerenciador de Cenários</h3>

      {/* Save Form controls */}
      <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-300 shadow-sm">
        <div>
          <label className="text-[11px] uppercase font-bold text-black tracking-wider block mb-1">
            Ano Safra
          </label>
          <select
            aria-label="Ano Safra para salvar"
            value={anoSafra}
            onChange={(e) => setAnoSafra(Number(e.target.value))}
            className="w-full bg-white border border-slate-300 rounded-xl text-xs font-bold text-black p-2 focus:outline-none focus:border-teal-600 shadow-sm"
          >
            {years.length === 0 ? (
              <option value={2026}>2026/2027</option>
            ) : (
              years.filter(y => y.active).map(y => (
                <option key={y.id} value={y.id}>
                  {formatHarvestYear(y.id)}
                </option>
              ))
            )}
          </select>
        </div>
        <div>
          <label className="text-[11px] uppercase font-bold text-black tracking-wider block mb-1">
            Mês Referência
          </label>
          <select
            aria-label="Mês Referência para salvar"
            value={mesReferencia}
            onChange={(e) => setMesReferencia(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-xl text-xs font-bold text-black p-2 focus:outline-none focus:border-teal-600 shadow-sm"
          >
            {months.length === 0 ? (
              <>
                <option value="Abril">Abril</option>
                <option value="Maio">Maio</option>
                <option value="Junho">Junho</option>
              </>
            ) : (
              months.filter(m => m.enabled).map(m => (
                <option key={m.id} value={m.name}>
                  {m.name}
                </option>
              ))
            )}
          </select>
        </div>

        <div className="col-span-2 pt-1">
          <button
            onClick={onSaveNew}
            disabled={saving}
            className="w-full bg-teal-700 hover:bg-teal-800 disabled:bg-slate-300 text-white font-bold py-2 px-4 rounded-xl text-xs transition-colors shadow-sm"
          >
            {saving ? 'Salvando Cenário...' : 'Salvar Novo Cenário / Versão'}
          </button>
        </div>
      </div>

      {/* Current Scenario controls */}
      {currentScenario && (
        <div className="bg-teal-50 border border-teal-300 p-4 rounded-xl space-y-3 shadow-sm">
          <div className="flex justify-between items-center">
            <span className="text-xs font-extrabold text-teal-950">Cenário Ativo: v{currentScenario.version}</span>
            <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${SCENARIO_STATUS_BADGE[currentScenario.status] ?? 'badge-idle'}`}>
              {currentScenario.status}
            </span>
          </div>

          {currentScenario.status === 'Em Edição' && (
            <div>
              <button
                onClick={onSaveActive}
                disabled={savingActive}
                aria-label="Salvar alterações do cenário ativo"
                className={`w-full text-white font-bold py-2 px-3 rounded-xl text-xs transition-all shadow-sm ${
                  hasUnsavedChanges
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-teal-700 hover:bg-teal-800'
                }`}
              >
                {savingActive ? 'Salvando...' : hasUnsavedChanges ? '⚠️ Salvar Alterações Pendentes' : 'Sem Alterações Pendentes'}
              </button>
            </div>
          )}

          {/* Change status action */}
          <div className="flex flex-col space-y-1">
            <span className="text-[10px] uppercase font-bold text-black">Alterar Status</span>
            <div className="flex space-x-1.5">
              {(['Em Edição', 'Aprovado', 'Final'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => handleUpdateStatus(st)}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold border transition-all ${
                    currentScenario.status === st
                      ? 'bg-teal-700 border-teal-700 text-white shadow-sm'
                      : 'bg-white border-slate-300 text-black hover:bg-slate-100'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Export Actions */}
          <div className="flex space-x-2 pt-2 border-t border-teal-200">
            <a
              href={`${baseURL}/api/scenarios/${currentScenario.id}/export/pdf`}
              download
              className="flex-1 bg-white hover:bg-slate-100 border border-slate-300 text-black font-bold py-1.5 px-2 rounded-xl text-xs text-center transition-colors flex items-center justify-center space-x-1 shadow-sm"
            >
              <span>📄 Baixar PDF</span>
            </a>
            <a
              href={`${baseURL}/api/scenarios/${currentScenario.id}/export/xlsx`}
              download
              className="flex-1 bg-white hover:bg-slate-100 border border-slate-300 text-black font-bold py-1.5 px-2 rounded-xl text-xs text-center transition-colors flex items-center justify-center space-x-1 shadow-sm"
            >
              <span>📊 Baixar Excel</span>
            </a>
          </div>
        </div>
      )}

      {/* List of historical scenarios */}
      <div className="flex flex-col flex-1 min-h-[150px]">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs uppercase font-extrabold text-black tracking-wider">Histórico de Versões</span>
          <button
            onClick={fetchScenarios}
            className="text-xs text-teal-700 hover:text-teal-900 font-bold"
            aria-label="Atualizar histórico"
          >
            Atualizar ↻
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center flex-1 py-4">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-teal-600 border-t-transparent"></div>
          </div>
        ) : listError ? (
          <p className="text-xs font-bold text-red-700 text-center py-2">{listError}</p>
        ) : scenarios.length === 0 ? (
          <p className="text-xs text-black font-semibold text-center py-4">Nenhum cenário salvo.</p>
        ) : (
          <div className="overflow-y-auto max-h-[200px] border border-slate-300 rounded-2xl divide-y divide-slate-200 bg-white shadow-sm">
            {scenarios.map((sc) => (
              <button
                key={sc.id}
                onClick={() => handleLoad(sc.id)}
                className={`w-full flex flex-col p-3 text-left transition-colors hover:bg-slate-50 border-none outline-none ${
                  currentScenario?.id === sc.id ? 'bg-teal-50 font-bold' : ''
                }`}
              >
                <div className="flex justify-between w-full items-center">
                  <span className="text-xs font-bold text-black">
                    Safra {formatHarvestYear(sc.year_harvest)} - {sc.reference_month}
                  </span>
                  <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full border ${SCENARIO_STATUS_BADGE[sc.status] ?? 'badge-idle'}`}>
                    {sc.status}
                  </span>
                </div>
                <span className="text-[11px] text-black font-semibold mt-0.5">Versão v{sc.version}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
