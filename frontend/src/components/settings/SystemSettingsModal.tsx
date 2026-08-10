import React, { useState } from 'react';
import axios from 'axios';
import { formatHarvestYear } from '../../utils/helpers';
import { BmeIcon } from '../../styles/design-system';

interface SystemSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  years: { id: number; active: boolean }[];
  months: { id: number; name: string; order_index: number; enabled: boolean }[];
  fetchYearsAndMonths: () => void;
  tolerance: number;
  onUpdateTolerance: (val: number) => void;
  embedded?: boolean;
}

export const SystemSettingsModal: React.FC<SystemSettingsModalProps> = ({
  isOpen,
  onClose,
  years,
  months,
  fetchYearsAndMonths,
  tolerance,
  onUpdateTolerance,
  embedded = false,
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
      alert('Erro ao alterar status do mês.');
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

  const content = (
    <div className="flex flex-col h-full bg-white text-black">
      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-300 bg-slate-100">
        {(['years', 'months', 'cycle', 'solver'] as const).map(tab => {
          const tabLabels = {
            years: 'Safras',
            months: 'Meses',
            cycle: 'Ciclo Comercial',
            solver: 'Solver (Tolerância)'
          };
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 px-4 text-xs font-bold transition-all border-b-2 text-center uppercase tracking-wider ${
                activeTab === tab
                  ? 'border-teal-600 text-teal-700 bg-white font-extrabold shadow-sm'
                  : 'border-transparent text-slate-700 hover:text-black hover:bg-slate-200/60'
              }`}
            >
              {tabLabels[tab]}
            </button>
          );
        })}
      </div>

      {/* Content Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-white">
        {activeTab === 'years' && (
          <div className="space-y-4">
            <div className="flex items-center space-x-3 bg-slate-50 p-4 rounded-2xl border border-slate-300 shadow-sm">
              <div className="flex-1">
                <label className="text-xs font-bold text-black uppercase tracking-wider block mb-1">Novo Ano Safra (Ano de Início)</label>
                <input
                  type="number"
                  value={newYear}
                  onChange={(e) => setNewYear(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold text-black bg-white focus:outline-none focus:border-teal-600 shadow-sm"
                  placeholder="Ex: 2029"
                />
              </div>
              <button
                onClick={handleAddYear}
                disabled={savingYear}
                className="bg-teal-700 hover:bg-teal-800 text-white mt-5 py-2 px-5 text-xs font-bold rounded-xl shadow-sm transition-all"
              >
                {savingYear ? 'Adicionando...' : '+ Adicionar Safra'}
              </button>
            </div>

            <div className="border border-slate-300 rounded-2xl overflow-hidden shadow-sm bg-white">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 border-b border-slate-300 text-black font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-3.5">Identificador / Safra</th>
                    <th className="p-3.5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {years.map(y => (
                    <tr key={y.id} className="hover:bg-slate-50">
                      <td className="p-3.5 font-bold text-black">{formatHarvestYear(y.id)}</td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleDeleteYear(y.id)}
                          className="text-red-700 hover:text-red-900 font-bold text-xs p-1"
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'months' && (
          <div className="space-y-4">
            <div className="border border-slate-300 rounded-2xl overflow-hidden shadow-sm bg-white">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 border-b border-slate-300 text-black font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-3.5">Ordem</th>
                    <th className="p-3.5">Mês</th>
                    <th className="p-3.5 text-center">Status</th>
                    <th className="p-3.5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {months.map((m, idx) => (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="p-3.5 font-mono font-bold text-black">{idx + 1}</td>
                      <td className="p-3.5 font-bold text-black">{m.name}</td>
                      <td className="p-3.5 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${m.enabled ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-slate-100 text-slate-700 border border-slate-300'}`}>
                          {m.enabled ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right flex justify-end items-center gap-2">
                        <button
                          onClick={() => handleMoveMonth(idx, 'up')}
                          disabled={idx === 0}
                          className="text-black font-bold hover:text-teal-700 disabled:opacity-30 p-1"
                        >
                          ▲
                        </button>
                        <button
                          onClick={() => handleMoveMonth(idx, 'down')}
                          disabled={idx === months.length - 1}
                          className="text-black font-bold hover:text-teal-700 disabled:opacity-30 p-1"
                        >
                          ▼
                        </button>
                        <button
                          onClick={() => handleToggleMonth(m.id, m.enabled)}
                          className="text-teal-700 hover:text-teal-900 font-bold text-xs ml-2"
                        >
                          {m.enabled ? 'Desativar' : 'Ativar'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'cycle' && (
          <div className="space-y-4">
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-300 space-y-4 shadow-sm">
              <div>
                <label className="text-xs font-bold text-black uppercase tracking-wider block mb-1.5">Mês de início do ciclo comercial</label>
                <select
                  value={startMonth}
                  onChange={(e) => setStartMonth(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold text-black bg-white focus:outline-none focus:border-teal-600 shadow-sm"
                >
                  {months.filter(m => m.enabled).map(m => (
                    <option key={m.id} value={m.name}>{m.name}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleSaveCycle}
                disabled={savingCycle}
                className="w-full bg-teal-700 hover:bg-teal-800 text-white py-3 px-4 text-xs font-bold rounded-xl shadow-sm transition-all"
              >
                {savingCycle ? 'Salvando...' : 'Salvar Mês de Início'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'solver' && (
          <div className="space-y-4">
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-300 space-y-4 shadow-sm">
              <div>
                <label className="text-xs font-bold text-black uppercase tracking-wider block mb-1.5">Tolerância de Resíduo de Reciclo</label>
                <input
                  type="text"
                  value={localTolerance}
                  onChange={(e) => setLocalTolerance(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-sm font-bold font-mono text-black bg-white focus:outline-none focus:border-teal-600 shadow-sm"
                  placeholder="Ex: 1e-5"
                />
                <p className="text-xs text-black font-semibold mt-2">Determina o critério de convergência para o balanço de malhas fechadas. Valores menores aumentam a precisão do cálculo.</p>
              </div>
              <button
                onClick={() => {
                  const parsed = parseFloat(localTolerance);
                  if (isNaN(parsed) || parsed <= 0) { alert('Insira um número maior que zero (ex: 1e-5).'); return; }
                  onUpdateTolerance(parsed);
                  alert('Tolerância atualizada com sucesso!');
                }}
                className="w-full bg-teal-700 hover:bg-teal-800 text-white py-3 px-4 text-xs font-bold rounded-xl shadow-sm transition-all"
              >
                Salvar Tolerância
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (embedded) return content;

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-300 rounded-2xl shadow-2xl w-full max-w-2xl h-[600px] flex flex-col overflow-hidden animate-fade-in-up">
        <div className="bg-slate-900 text-white px-5 py-3.5 flex justify-between items-center border-b border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <BmeIcon name="gear" className="text-teal-400" /> Configurações do Sistema
            </h2>
            <p className="text-[11px] text-slate-300 font-medium mt-0.5">Gerenciamento de parâmetros estruturais do simulador</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Fechar"
          >
            <BmeIcon name="close" size={16} />
          </button>
        </div>
        {content}
      </div>
    </div>
  );
};
