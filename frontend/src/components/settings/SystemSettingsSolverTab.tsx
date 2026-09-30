import React, { useState } from 'react';

interface SystemSettingsSolverTabProps {
  tolerance: number;
  onUpdateTolerance: (val: number) => void;
}

export const SystemSettingsSolverTab: React.FC<SystemSettingsSolverTabProps> = ({
  tolerance,
  onUpdateTolerance,
}) => {
  const [localTolerance, setLocalTolerance] = useState<string>(String(tolerance));

  const handleSaveTolerance = () => {
    const parsed = parseFloat(localTolerance);
    if (isNaN(parsed) || parsed <= 0) {
      alert('Insira um número maior que zero (ex: 1e-5).');
      return;
    }
    onUpdateTolerance(parsed);
    alert('Tolerância atualizada com sucesso!');
  };

  return (
    <div className="space-y-4">
      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-300 space-y-4 shadow-sm">
        <div>
          <label className="text-xs font-bold text-black uppercase tracking-wider block mb-1.5">
            Tolerância de Resíduo de Reciclo
          </label>
          <input
            type="text"
            value={localTolerance}
            onChange={(e) => setLocalTolerance(e.target.value)}
            className="w-full border border-slate-300 rounded-xl p-2.5 text-sm font-bold font-mono text-black bg-white focus:outline-none focus:border-teal-600 shadow-sm"
            placeholder="Ex: 1e-5"
          />
          <p className="text-xs text-black font-semibold mt-2">
            Determina o critério de convergência para o balanço de malhas fechadas. Valores menores aumentam a precisão do cálculo.
          </p>
        </div>
        <button
          onClick={handleSaveTolerance}
          className="w-full bg-teal-700 hover:bg-teal-800 text-white py-3 px-4 text-xs font-bold rounded-xl shadow-sm transition-all"
        >
          Salvar Tolerância
        </button>
      </div>
    </div>
  );
};
