import React, { useState } from 'react';
import apiClient from '../../api/client';

interface SystemSettingsCycleTabProps {
  months: { id: number; name: string; order_index: number; enabled: boolean }[];
  fetchYearsAndMonths: () => void;
}

export const SystemSettingsCycleTab: React.FC<SystemSettingsCycleTabProps> = ({
  months,
  fetchYearsAndMonths,
}) => {
  const [startMonth, setStartMonth] = useState<string>(
    months.find(m => m.order_index === 0)?.name || 'Abril'
  );
  const [savingCycle, setSavingCycle] = useState(false);

  const handleSaveCycle = async () => {
    setSavingCycle(true);
    try {
      await apiClient.post('/api/settings/cycle', {
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
    <div className="space-y-4">
      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-300 space-y-4 shadow-sm">
        <div>
          <label className="text-xs font-bold text-black uppercase tracking-wider block mb-1.5">
            Mês de início do ciclo comercial
          </label>
          <select
            value={startMonth}
            onChange={(e) => setStartMonth(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold text-black bg-white focus:outline-none focus:border-teal-600 shadow-sm"
          >
            {months.filter(m => m.enabled).map(m => (
              <option key={m.id} value={m.name}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={handleSaveCycle}
          disabled={savingCycle}
          className="w-full bg-teal-700 hover:bg-teal-800 text-white py-3 px-4 text-xs font-bold rounded-xl shadow-sm transition-all disabled:opacity-50"
        >
          {savingCycle ? 'Salvando...' : 'Salvar Mês de Início'}
        </button>
      </div>
    </div>
  );
};
