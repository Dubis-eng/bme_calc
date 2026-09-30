import React, { useState } from 'react';
import axios from 'axios';
import apiClient from '../../api/client';
import { formatHarvestYear } from '../../utils/helpers';

interface SystemSettingsYearsTabProps {
  years: { id: number; active: boolean }[];
  fetchYearsAndMonths: () => void;
}

export const SystemSettingsYearsTab: React.FC<SystemSettingsYearsTabProps> = ({
  years,
  fetchYearsAndMonths,
}) => {
  const [newYear, setNewYear] = useState<number>(2029);
  const [savingYear, setSavingYear] = useState(false);

  const handleAddYear = async () => {
    setSavingYear(true);
    try {
      await apiClient.post('/api/settings/years', { id: newYear });
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
      await apiClient.delete(`/api/settings/years/${id}`);
      fetchYearsAndMonths();
      alert('Ano safra excluído.');
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err) && err.response?.data?.detail
        ? err.response.data.detail
        : 'Erro ao excluir ano safra.';
      alert(msg);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-3 bg-slate-50 p-4 rounded-2xl border border-slate-300 shadow-sm">
        <div className="flex-1">
          <label className="text-xs font-bold text-black uppercase tracking-wider block mb-1">
            Novo Ano Safra (Ano de Início)
          </label>
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
          className="bg-teal-700 hover:bg-teal-800 text-white mt-5 py-2 px-5 text-xs font-bold rounded-xl shadow-sm transition-all disabled:opacity-50"
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
  );
};
