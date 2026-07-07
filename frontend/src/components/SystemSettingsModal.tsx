import React, { useState } from 'react';
import axios from 'axios';
import { formatHarvestYear } from '../utils/helpers';
import { BmeIcon } from '../theme/design-system';

interface SystemSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  years: { id: number; active: boolean }[];
  months: { id: number; name: string; order_index: number; enabled: boolean }[];
  fetchYearsAndMonths: () => void;
  tolerance: number;
  onUpdateTolerance: (val: number) => void;
}

export const SystemSettingsModal: React.FC<SystemSettingsModalProps> = ({
  isOpen,
  onClose,
  years,
  months,
  fetchYearsAndMonths,
  tolerance,
  onUpdateTolerance
}) => {
  const [activeTab, setActiveTab] = useState<'years' | 'months' | 'cycle' | 'solver'>('years');
  const [newYear, setNewYear] = useState<number>(2029);
  const [savingYear, setSavingYear] = useState(false);
  const [savingCycle, setSavingCycle] = useState(false);
  const [localTolerance, setLocalTolerance] = useState<string>(String(tolerance));
  const [startMonth, setStartMonth] = useState<string>(
    months.find(m => m.order_index === 0)?.name || 'Abril'
  );

  if (!isOpen) return null;

  const handleAddYear = async () => {
    setSavingYear(true);
    try {
      await axios.post('http://localhost:8000/api/settings/years', { id: newYear });
      fetchYearsAndMonths();
      alert('Ano safra adicionado com sucesso!');
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err) && err.response?.data?.detail
        ? err.response.data.detail
        : 'Erro ao adicionar ano safra.';
      alert(msg);
    } finally {
      setSavingYear(false);
    }
  };

  const handleDeleteYear = async (id: number) => {
    if (!window.confirm(`Tem certeza de que deseja excluir a safra ${formatHarvestYear(id)}?`)) return;
    try {
      await axios.delete(`http://localhost:8000/api/settings/years/${id}`);
      fetchYearsAndMonths();
      alert('Ano safra excluído.');
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err) && err.response?.data?.detail
        ? err.response.data.detail
        : 'Erro ao excluir ano safra.';
      alert(msg);
    }
  };

  const handleToggleMonth = async (id: number, currentEnabled: boolean) => {
    try {
      await axios.patch(`http://localhost:8000/api/settings/months/${id}`, {
        enabled: !currentEnabled
      });
      fetchYearsAndMonths();
    } catch (err) {
      console.error(err);
      alert('Erro ao atualizar mês.');
    }
  };

  const handleMoveMonth = async (currentIndex: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= months.length) return;

    const reorderedMonths = [...months];
    const temp = reorderedMonths[currentIndex];
    reorderedMonths[currentIndex] = reorderedMonths[targetIndex];
    reorderedMonths[targetIndex] = temp;

    const payload = reorderedMonths.map((m, idx) => ({
      id: m.id,
      order_index: idx
    }));

    try {
      await axios.patch('http://localhost:8000/api/settings/months/reorder', {
        reorderings: payload
      });
      fetchYearsAndMonths();
    } catch (err) {
      console.error(err);
      alert('Erro ao reordenar meses.');
    }
  };

  const handleSaveCycle = async () => {
    setSavingCycle(true);
    try {
      await axios.post('http://localhost:8000/api/settings/cycle', {
        start_month: startMonth
      });
      fetchYearsAndMonths();
      alert('Mês de início do ciclo comercial salvo com sucesso!');
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar início do ciclo.');
    } finally {
      setSavingCycle(false);
    }
  };

  return (
    <div className="bme-modal-overlay">
      <div className="bme-modal-container max-w-2xl h-[600px]">
        {/* Header */}
        <div className="bme-modal-header">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <BmeIcon name="gear" className="text-teal-400" /> Configurações do Sistema
            </h2>
            <p className="text-[10px] text-slate-500 mt-0.5">Gerenciamento de parâmetros estruturais do simulador</p>
          </div>
          <button
            onClick={onClose}
            className="btn-ghost p-1.5 flex items-center justify-center"
            aria-label="Fechar"
          >
            <BmeIcon name="close" size={14} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-900/40">
          {(['years', 'months', 'cycle', 'solver'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 px-4 text-xs font-bold transition-all border-b-2 text-center uppercase tracking-wider ${
                activeTab === tab
                  ? 'border-teal-500 text-teal-400 bg-slate-900 font-extrabold'
                  : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-white/5'
              }`}
            >
              {tab === 'years' ? 'Anos' : tab === 'months' ? 'Meses' : tab === 'cycle' ? 'Ciclo' : 'Solucionador'}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-900/30">
          {activeTab === 'years' && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 bg-slate-900/60 p-4 rounded-xl border border-slate-800/40">
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Novo Ano Safra (Ano de Início)</label>
                  <input
                    type="number"
                    value={newYear}
                    onChange={(e) => setNewYear(parseInt(e.target.value, 10))}
                    className="w-full input-field rounded-lg p-2 text-sm font-semibold"
                    placeholder="Ex: 2029"
                  />
                </div>
                <button
                  onClick={handleAddYear}
                  disabled={savingYear}
                  className="bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white font-bold py-2 px-4 rounded-lg text-xs self-end h-[38px] transition-colors"
                >
                  {savingYear ? 'Adicionando...' : 'Adicionar'}
                </button>
              </div>

              <div className="border border-slate-800/40 rounded-xl overflow-hidden divide-y divide-slate-800/30">
                {years.map(y => (
                  <div key={y.id} className="flex justify-between items-center p-3.5 hover:bg-slate-900/60 transition-colors">
                    <div>
                      <span className="text-sm font-bold text-slate-200">Safra {formatHarvestYear(y.id)}</span>
                      <span className="text-xs text-slate-500 block">Ano Início: {y.id}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteYear(y.id)}
                      className="text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 p-2 rounded-lg transition-colors flex items-center justify-center"
                      aria-label={`Excluir safra ${formatHarvestYear(y.id)}`}
                    >
                      <BmeIcon name="close" size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'months' && (
            <div className="space-y-3">
              <p className="text-[11px] text-slate-500 mb-2">Habilite/desabilite meses de referência ou use as setas para configurar a ordenação personalizada do ano comercial.</p>
              <div className="border border-slate-800/40 rounded-xl overflow-hidden divide-y divide-slate-800/30">
                {months.map((m, idx) => (
                  <div key={m.id} className="flex justify-between items-center p-3 hover:bg-slate-900/60 transition-colors">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={m.enabled}
                        onChange={() => handleToggleMonth(m.id, m.enabled)}
                        className="rounded border-slate-700 text-teal-650 focus:ring-teal-500 h-4 w-4 bg-slate-950"
                        aria-label={`Habilitar ou desabilitar mês ${m.name}`}
                      />
                      <div>
                        <span className={`text-sm font-bold ${m.enabled ? 'text-slate-200' : 'text-slate-650 line-through'}`}>{m.name}</span>
                        <span className="text-[10px] text-slate-500 block">Ordem: {m.order_index + 1}</span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleMoveMonth(idx, 'up')}
                        disabled={idx === 0}
                        className="bg-slate-800 hover:bg-slate-700 border border-slate-750 disabled:opacity-30 p-1.5 rounded transition-all text-xs flex items-center justify-center"
                        aria-label={`Mover mês ${m.name} para cima`}
                      >
                        <BmeIcon name="chevron-down" className="rotate-180 text-slate-300" size={10} />
                      </button>
                      <button
                        onClick={() => handleMoveMonth(idx, 'down')}
                        disabled={idx === months.length - 1}
                        className="bg-slate-800 hover:bg-slate-700 border border-slate-750 disabled:opacity-30 p-1.5 rounded transition-all text-xs flex items-center justify-center"
                        aria-label={`Mover mês ${m.name} para baixo`}
                      >
                        <BmeIcon name="chevron-down" className="text-slate-300" size={10} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'cycle' && (
            <div className="space-y-4">
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/40 space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Mês de início do ciclo comercial</label>
                  <select
                    value={startMonth}
                    onChange={(e) => setStartMonth(e.target.value)}
                    className="w-full input-field p-2.5 text-sm font-semibold"
                  >
                    {months.filter(m => m.enabled).map(m => (
                      <option key={m.id} value={m.name}>{m.name}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleSaveCycle}
                  disabled={savingCycle}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 px-4 rounded-lg text-xs transition-colors shadow-sm"
                >
                  {savingCycle ? 'Salvando...' : 'Salvar Mês de Início'}
                </button>
              </div>
            </div>
          )}
          {activeTab === 'solver' && (
            <div className="space-y-4">
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/40 space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Tolerância de Resíduo de Reciclo</label>
                  <input type="text" value={localTolerance} onChange={(e) => setLocalTolerance(e.target.value)} className="w-full input-field rounded-lg p-2 text-sm font-semibold font-mono text-slate-200" placeholder="Ex: 1e-5" />
                  <p className="text-[10px] text-slate-500 mt-1">Determina o critério de convergência para o balanço de malhas fechadas. Valores menores aumentam a precisão do cálculo.</p>
                </div>
                <button onClick={() => {
                  const parsed = parseFloat(localTolerance);
                  if (isNaN(parsed) || parsed <= 0) { alert('Insira um número maior que zero (ex: 1e-5).'); return; }
                  onUpdateTolerance(parsed);
                  alert('Tolerância atualizada com sucesso!');
                }} className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 px-4 rounded-lg text-xs transition-colors shadow-sm">Salvar Tolerância</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
