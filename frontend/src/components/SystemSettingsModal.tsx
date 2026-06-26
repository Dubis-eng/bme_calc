import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { formatHarvestYear } from '../utils/useScenario';

interface SystemSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  years: { id: number; active: boolean }[];
  months: { id: number; name: string; order_index: number; enabled: boolean }[];
  fetchYearsAndMonths: () => Promise<void>;
}

export const SystemSettingsModal: React.FC<SystemSettingsModalProps> = ({
  isOpen,
  onClose,
  years,
  months,
  fetchYearsAndMonths
}) => {
  const [activeTab, setActiveTab] = useState<'years' | 'months' | 'cycle'>('years');
  const [newYear, setNewYear] = useState<number>(new Date().getFullYear() + 3);
  const [startMonth, setStartMonth] = useState<string>('Abril');
  const [savingCycle, setSavingCycle] = useState(false);
  const [scenarios, setScenarios] = useState<{ id: string; year_harvest: string | number }[]>([]);

  useEffect(() => {
    if (isOpen) {
      axios.get('http://localhost:8000/api/scenarios')
        .then(res => setScenarios(res.data))
        .catch(err => console.error(err));

      axios.get('http://localhost:8000/api/harvest-plan/settings')
        .then(res => setStartMonth(res.data.start_month))
        .catch(err => console.error(err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddYear = async () => {
    if (isNaN(newYear) || newYear < 1900 || newYear > 2100) {
      alert('Ano inválido');
      return;
    }
    try {
      await axios.post('http://localhost:8000/api/harvest-years', { id: newYear });
      await fetchYearsAndMonths();
      alert('Ano Safra adicionado com sucesso!');
    } catch (err) {
      alert('Erro ao adicionar ano safra.');
    }
  };

  const handleDeleteYear = async (yearId: number) => {
    const relatedCount = scenarios.filter(s => {
      const y = typeof s.year_harvest === 'string' ? parseInt(s.year_harvest, 10) : s.year_harvest;
      return y === yearId;
    }).length;

    const message = relatedCount > 0
      ? `⚠️ ATENÇÃO: Existem ${relatedCount} cenários vinculados à safra ${formatHarvestYear(yearId)}. Excluir esta safra excluirá permanentemente todos os cenários vinculados em cascata! Deseja continuar?`
      : `Deseja realmente excluir a safra ${formatHarvestYear(yearId)}?`;

    if (window.confirm(message)) {
      try {
        await axios.delete(`http://localhost:8000/api/harvest-years/${yearId}`);
        await fetchYearsAndMonths();
        alert('Safra excluída com sucesso.');
      } catch (err) {
        alert('Erro ao excluir safra.');
      }
    }
  };

  const handleToggleMonth = async (monthId: number, currentEnabled: boolean) => {
    try {
      await axios.patch(`http://localhost:8000/api/harvest-months/${monthId}`, { enabled: !currentEnabled });
      await fetchYearsAndMonths();
    } catch (err) {
      alert('Erro ao atualizar mês.');
    }
  };

  const handleMoveMonth = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= months.length) return;

    const currentMonth = months[index];
    const targetMonth = months[targetIndex];

    try {
      await axios.patch(`http://localhost:8000/api/harvest-months/${currentMonth.id}`, { order_index: targetMonth.order_index });
      await axios.patch(`http://localhost:8000/api/harvest-months/${targetMonth.id}`, { order_index: currentMonth.order_index });
      await fetchYearsAndMonths();
    } catch (err) {
      alert('Erro ao reordenar meses.');
    }
  };

  const handleSaveCycle = async () => {
    setSavingCycle(true);
    try {
      await axios.put('http://localhost:8000/api/harvest-plan/settings', { start_month: startMonth });
      alert('Mês de início do ciclo atualizado com sucesso!');
    } catch (err) {
      alert('Erro ao atualizar configurações do plano.');
    } finally {
      setSavingCycle(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl flex flex-col h-[600px] shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-base font-bold text-slate-800 flex items-center">
              <span className="mr-2">⚙️</span> Configurações do Sistema
            </h2>
            <p className="text-xs text-slate-400">Gerenciamento de parâmetros estruturais do simulador</p>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 p-1.5 rounded-full transition-colors focus:outline-none"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/50">
          {(['years', 'months', 'cycle'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 px-4 text-xs font-bold transition-all border-b-2 text-center uppercase tracking-wider ${
                activeTab === tab
                  ? 'border-teal-600 text-teal-700 bg-white font-extrabold'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'
              }`}
            >
              {tab === 'years' ? 'Anos Safra' : tab === 'months' ? 'Meses de Referência' : 'Início do Ciclo'}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-white">
          {activeTab === 'years' && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Novo Ano Safra (Ano de Início)</label>
                  <input
                    type="number"
                    value={newYear}
                    onChange={(e) => setNewYear(parseInt(e.target.value, 10))}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    placeholder="Ex: 2029"
                  />
                </div>
                <button
                  onClick={handleAddYear}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 px-6 rounded-lg text-xs mt-5 transition-colors shadow-sm"
                >
                  + Adicionar Safra
                </button>
              </div>

              <div className="border border-slate-100 rounded-xl overflow-hidden divide-y divide-slate-100">
                {years.map(y => (
                  <div key={y.id} className="flex justify-between items-center p-3.5 hover:bg-slate-50/50 transition-colors">
                    <div>
                      <span className="text-sm font-bold text-slate-800">Safra {formatHarvestYear(y.id)}</span>
                      <span className="text-xs text-slate-400 block">Ano Início: {y.id}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteYear(y.id)}
                      className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition-colors"
                      aria-label={`Excluir safra ${formatHarvestYear(y.id)}`}
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'months' && (
            <div className="space-y-3">
              <p className="text-[11px] text-slate-400 mb-2">Habilite/desabilite meses de referência ou use as setas para configurar a ordenação personalizada do ano comercial.</p>
              <div className="border border-slate-100 rounded-xl overflow-hidden divide-y divide-slate-100">
                {months.map((m, idx) => (
                  <div key={m.id} className="flex justify-between items-center p-3 hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={m.enabled}
                        onChange={() => handleToggleMonth(m.id, m.enabled)}
                        className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 h-4 w-4"
                        aria-label={`Habilitar ou desabilitar mês ${m.name}`}
                      />
                      <div>
                        <span className={`text-sm font-bold ${m.enabled ? 'text-slate-800' : 'text-slate-400 line-through'}`}>{m.name}</span>
                        <span className="text-[10px] text-slate-400 block">Ordem: {m.order_index + 1}</span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleMoveMonth(idx, 'up')}
                        disabled={idx === 0}
                        className="bg-slate-100 hover:bg-slate-200 disabled:opacity-30 p-1.5 rounded transition-all text-xs"
                        aria-label={`Mover mês ${m.name} para cima`}
                      >
                        ▲
                      </button>
                      <button
                        onClick={() => handleMoveMonth(idx, 'down')}
                        disabled={idx === months.length - 1}
                        className="bg-slate-100 hover:bg-slate-200 disabled:opacity-30 p-1.5 rounded transition-all text-xs"
                        aria-label={`Mover mês ${m.name} para baixo`}
                      >
                        ▼
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'cycle' && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Mês de início do ciclo comercial</label>
                  <select
                    value={startMonth}
                    onChange={(e) => setStartMonth(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
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
        </div>

      </div>
    </div>
  );
};
