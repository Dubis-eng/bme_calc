import React, { useState } from 'react';
import { Sector } from '../../types';
import { SectorConfig } from '../sectors/SectorConfig';
import { SystemSettingsModal } from './SystemSettingsModal';
import { BmeIcon } from '../../styles/design-system';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectors: Sector[];
  onRefreshSectors: () => void;
  isLocked: boolean;
  years: { id: number; active: boolean }[];
  months: { id: number; name: string; order_index: number; enabled: boolean }[];
  fetchYearsAndMonths: () => void;
  tolerance: number;
  onUpdateTolerance: (val: number) => void;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({
  isOpen,
  onClose,
  sectors,
  onRefreshSectors,
  isLocked,
  years,
  months,
  fetchYearsAndMonths,
  tolerance,
  onUpdateTolerance,
}) => {
  const [activeTab, setActiveTab] = useState<'system' | 'sectors'>('system');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 animate-fade-in-up">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl border border-slate-300 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-600/20 border border-teal-500/40 flex items-center justify-center">
              <BmeIcon name="gear" size={18} className="text-teal-400" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">Configurações do Sistema</h2>
              <p className="text-xs text-slate-300 font-medium">Gerencie parâmetros globais, safras e setores</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <BmeIcon name="close" size={18} />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-300 bg-slate-100 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('system')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-t border-x ${
              activeTab === 'system'
                ? 'bg-white text-teal-800 border-slate-300 shadow-sm -mb-px font-extrabold'
                : 'text-slate-700 hover:text-black border-transparent hover:bg-slate-200/60'
            }`}
          >
            <span>⚙️</span>
            <span>Parâmetros & Safras</span>
          </button>

          <button
            onClick={() => setActiveTab('sectors')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-t border-x ${
              activeTab === 'sectors'
                ? 'bg-white text-teal-800 border-slate-300 shadow-sm -mb-px font-extrabold'
                : 'text-slate-700 hover:text-black border-transparent hover:bg-slate-200/60'
            }`}
          >
            <span>🏢</span>
            <span>Gerenciador de Setores</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-white">
          {activeTab === 'system' ? (
            <SystemSettingsModal
              isOpen={true}
              onClose={onClose}
              years={years}
              months={months}
              fetchYearsAndMonths={fetchYearsAndMonths}
              tolerance={tolerance}
              onUpdateTolerance={onUpdateTolerance}
              embedded={true}
            />
          ) : (
            <SectorConfig
              sectors={sectors}
              onRefreshSectors={onRefreshSectors}
              isLocked={isLocked}
            />
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-300 px-6 py-3.5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="bg-teal-700 hover:bg-teal-800 text-white px-6 py-2 text-xs font-bold rounded-xl shadow-sm transition-all"
          >
            Concluído
          </button>
        </div>
      </div>
    </div>
  );
};
