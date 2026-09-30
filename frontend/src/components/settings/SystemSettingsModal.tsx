import React, { useState } from 'react';
import { BmeIcon } from '../../styles/design-system';
import { SystemSettingsYearsTab } from './SystemSettingsYearsTab';
import { SystemSettingsMonthsTab } from './SystemSettingsMonthsTab';
import { SystemSettingsCycleTab } from './SystemSettingsCycleTab';
import { SystemSettingsSolverTab } from './SystemSettingsSolverTab';

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

const TAB_LABELS = {
  years: 'Safras',
  months: 'Meses',
  cycle: 'Ciclo Comercial',
  solver: 'Solver (Tolerância)'
} as const;

type SettingsTab = keyof typeof TAB_LABELS;

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
  const [activeTab, setActiveTab] = useState<SettingsTab>('years');

  if (!isOpen) return null;

  const content = (
    <div className="flex flex-col h-full bg-white text-black min-h-0">
      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-300 bg-slate-100 flex-shrink-0">
        {(Object.keys(TAB_LABELS) as SettingsTab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 px-4 text-xs font-bold transition-all border-b-2 text-center uppercase tracking-wider ${
              activeTab === tab
                ? 'border-teal-600 text-teal-700 bg-white font-extrabold shadow-sm'
                : 'border-transparent text-slate-700 hover:text-black hover:bg-slate-200/60'
            }`}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      {/* Content Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-white">
        {activeTab === 'years' && (
          <SystemSettingsYearsTab
            years={years}
            fetchYearsAndMonths={fetchYearsAndMonths}
          />
        )}
        {activeTab === 'months' && (
          <SystemSettingsMonthsTab
            months={months}
            fetchYearsAndMonths={fetchYearsAndMonths}
          />
        )}
        {activeTab === 'cycle' && (
          <SystemSettingsCycleTab
            months={months}
            fetchYearsAndMonths={fetchYearsAndMonths}
          />
        )}
        {activeTab === 'solver' && (
          <SystemSettingsSolverTab
            tolerance={tolerance}
            onUpdateTolerance={onUpdateTolerance}
          />
        )}
      </div>
    </div>
  );

  if (embedded) return content;

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-300 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in-up">
        <div className="bg-slate-900 text-white px-5 py-3.5 flex justify-between items-center border-b border-slate-800 flex-shrink-0">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <BmeIcon name="gear" className="text-teal-400" /> Configurações do Sistema
            </h2>
            <p className="text-[11px] text-slate-300 font-medium mt-0.5">
              Gerenciamento de parâmetros estruturais do simulador
            </p>
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
