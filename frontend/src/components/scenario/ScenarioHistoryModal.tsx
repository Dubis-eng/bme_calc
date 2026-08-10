import React from 'react';
import { Variable, ScenarioMetadata } from '../../types';
import { ScenarioManager } from './ScenarioManager';
import { BmeIcon } from '../../styles/design-system';

interface ScenarioHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  variables: Variable[];
  onLoadScenario: (variables: Variable[], metadata: ScenarioMetadata) => void;
  currentScenario: ScenarioMetadata | null;
  onStatusChange: (status: 'Em Edição' | 'Aprovado' | 'Final') => void;
  anoSafra: number;
  setAnoSafra: (val: number) => void;
  mesReferencia: string;
  setMesReferencia: (val: string) => void;
  onSaveNew: () => Promise<void>;
  saving: boolean;
  onSaveActive?: () => Promise<void>;
  savingActive?: boolean;
  hasUnsavedChanges?: boolean;
  years: { id: number; active: boolean }[];
  months: { id: number; name: string; order_index: number; enabled: boolean }[];
}

export const ScenarioHistoryModal: React.FC<ScenarioHistoryModalProps> = ({
  isOpen,
  onClose,
  variables,
  onLoadScenario,
  currentScenario,
  onStatusChange,
  anoSafra,
  setAnoSafra,
  mesReferencia,
  setMesReferencia,
  onSaveNew,
  saving,
  onSaveActive,
  savingActive,
  hasUnsavedChanges,
  years,
  months,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 animate-fade-in-up">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-bme-teal flex items-center justify-center">
              <span className="text-base">📜</span>
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">Histórico de Cenários &amp; Versões</h2>
              <p className="text-xs text-slate-400 font-medium">Visualize, alterne ou crie novos cenários salvos</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <BmeIcon name="close" size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-white">
          <ScenarioManager
            variables={variables}
            onLoadScenario={(vars, meta) => {
              onLoadScenario(vars, meta);
              onClose();
            }}
            currentScenario={currentScenario}
            onStatusChange={onStatusChange}
            anoSafra={anoSafra}
            setAnoSafra={setAnoSafra}
            mesReferencia={mesReferencia}
            setMesReferencia={setMesReferencia}
            onSaveNew={onSaveNew}
            saving={saving}
            onSaveActive={onSaveActive}
            savingActive={savingActive}
            hasUnsavedChanges={hasUnsavedChanges}
            years={years}
            months={months}
          />
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="btn-outline px-5 py-2 text-xs font-bold"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
