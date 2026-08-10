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
    <div className="flex flex-col gap-2.5 bg-white p-3.5 rounded-2xl border border-bme-border shadow-card">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[10px] uppercase font-bold text-bme-text-sec mr-2 px-1 tracking-wider">Filtrar Tipo:</span>
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
                ? 'bg-teal-50 text-teal-700 border border-teal-200 shadow-sm'
                : 'text-bme-text-sec hover:text-bme-text hover:bg-bme-muted bg-transparent border border-transparent'
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
              ? 'bg-amber-50 text-amber-700 border border-amber-200 shadow-sm'
              : 'text-bme-text-sec hover:text-bme-text hover:bg-bme-muted bg-transparent border border-transparent'
          }`}
        >
          {showInactive ? 'Ocultar Inativas' : 'Mostrar Inativas'}
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 border-t border-bme-border pt-2.5">
        <span className="text-[10px] uppercase font-bold text-bme-text-sec mr-2 px-1 tracking-wider">Filtrar Status:</span>
        {([
          { id: 'all', label: 'Todos', style: 'bg-teal-50 text-teal-700 border-teal-200 shadow-sm' },
          { id: 'ok', label: 'Convergido', style: 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm' },
          { id: 'error', label: 'Com Erro', style: 'bg-rose-50 text-rose-700 border-rose-200 shadow-sm' },
          { id: 'idle', label: 'Pendente', style: 'bg-gray-100 text-gray-700 border-gray-200 shadow-sm' },
        ] as const).map((opt) => (
          <button
            key={opt.id}
            onClick={() => setActiveStatusFilter(opt.id)}
            aria-label={`Filtrar status por ${opt.label}`}
            className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all border ${
              activeStatusFilter === opt.id ? opt.style : 'text-bme-text-sec hover:text-bme-text border-transparent bg-transparent'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
};
