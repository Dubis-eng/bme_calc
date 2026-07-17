import React from 'react';
import { FilterStatus } from '../../types';

interface SectorFilterBarProps {
  activeTypeFilter: 'ALL' | 'INPUT' | 'OUTPUT' | 'CENARIO' | 'DERIVADA';
  setActiveTypeFilter: (val: 'ALL' | 'INPUT' | 'OUTPUT' | 'CENARIO' | 'DERIVADA') => void;
  showInactive: boolean;
  setShowInactive: React.Dispatch<React.SetStateAction<boolean>>;
  activeStatusFilter: FilterStatus;
  setActiveStatusFilter: (val: FilterStatus) => void;
}

export const SectorFilterBar: React.FC<SectorFilterBarProps> = ({
  activeTypeFilter,
  setActiveTypeFilter,
  showInactive,
  setShowInactive,
  activeStatusFilter,
  setActiveStatusFilter,
}) => {
  return (
    <div className="flex flex-col gap-2 bg-slate-900/40 p-3 rounded-xl border border-slate-800/60">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[10px] uppercase font-bold text-slate-500 mr-2 px-1">Filtrar Tipo:</span>
        {([
          { id: 'ALL', label: 'Todos' },
          { id: 'INPUT', label: 'INPUT' },
          { id: 'OUTPUT', label: 'OUTPUT' },
          { id: 'CENARIO', label: 'Cenário' },
          { id: 'DERIVADA', label: 'Derivada' },
        ] as const).map((opt) => (
          <button
            key={opt.id}
            onClick={() => setActiveTypeFilter(opt.id)}
            className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
              activeTypeFilter === opt.id
                ? 'bg-teal-500/20 text-teal-400 border border-teal-500/40 shadow-sm'
                : 'text-slate-500 hover:text-slate-300 bg-transparent border border-transparent'
            }`}
          >
            {opt.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setShowInactive((prev) => !prev)}
          className={`ml-auto px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
            showInactive
              ? 'bg-amber-600/20 text-amber-400 border border-amber-600/30 shadow-sm'
              : 'text-slate-500 hover:text-slate-300 bg-transparent border border-transparent'
          }`}
        >
          {showInactive ? 'Ocultar Inativas' : 'Mostrar Inativas'}
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-800/60 pt-2">
        <span className="text-[10px] uppercase font-bold text-slate-500 mr-2 px-1">Filtrar Status:</span>
        {([
          { id: 'all', label: 'Todos', style: 'bg-teal-500/20 text-teal-400 border-teal-500/40 shadow-sm' },
          { id: 'ok', label: 'Convergido', style: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm' },
          { id: 'error', label: 'Com Erro', style: 'bg-rose-500/20 text-rose-400 border-rose-500/40 shadow-sm' },
          { id: 'idle', label: 'Pendente', style: 'bg-slate-700/30 text-teal-500/40 border-teal-500/20' },
        ] as const).map((opt) => (
          <button
            key={opt.id}
            onClick={() => setActiveStatusFilter(opt.id)}
            aria-label={`Filtrar status por ${opt.label}`}
            className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all border ${
              activeStatusFilter === opt.id ? opt.style : 'text-slate-500 hover:text-slate-300 border-transparent bg-transparent'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
};
