import React from 'react';
import apiClient from '../../api/client';

interface SystemSettingsMonthsTabProps {
  months: { id: number; name: string; order_index: number; enabled: boolean }[];
  fetchYearsAndMonths: () => void;
}

export const SystemSettingsMonthsTab: React.FC<SystemSettingsMonthsTabProps> = ({
  months,
  fetchYearsAndMonths,
}) => {
  const handleToggleMonth = async (id: number, currentEnabled: boolean) => {
    try {
      await apiClient.patch(`/api/settings/months/${id}`, {
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
      await apiClient.patch('/api/settings/months/reorder', {
        reorderings: payload
      });
      fetchYearsAndMonths();
    } catch (err) {
      console.error(err);
      alert('Erro ao reordenar meses.');
    }
  };

  return (
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
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      m.enabled
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        : 'bg-slate-100 text-slate-700 border border-slate-300'
                    }`}
                  >
                    {m.enabled ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="p-3.5 text-right flex justify-end items-center gap-2">
                  <button
                    onClick={() => handleMoveMonth(idx, 'up')}
                    disabled={idx === 0}
                    className="text-black font-bold hover:text-teal-700 disabled:opacity-30 p-1"
                    title="Mover para cima"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => handleMoveMonth(idx, 'down')}
                    disabled={idx === months.length - 1}
                    className="text-black font-bold hover:text-teal-700 disabled:opacity-30 p-1"
                    title="Mover para baixo"
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
  );
};
