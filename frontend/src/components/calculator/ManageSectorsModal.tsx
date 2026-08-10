import React from 'react';

interface FlowSectorOption {
  id: string;
  label: string;
  isCustom?: boolean;
}

interface ManageSectorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  allFlowSectors: FlowSectorOption[];
  hiddenFlowSectors: string[];
  onToggleHideSector: (sectorId: string) => void;
  onRestoreAll: () => void;
  onDeleteSector?: (sectorId: string) => void;
}

export const ManageSectorsModal: React.FC<ManageSectorsModalProps> = ({
  isOpen,
  onClose,
  allFlowSectors,
  hiddenFlowSectors,
  onToggleHideSector,
  onRestoreAll,
  onDeleteSector,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in-up">
      <div className="w-full max-w-md rounded-2xl border border-slate-300 bg-white p-6 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3.5 bg-slate-900 text-white -mx-6 -mt-6 p-6 mb-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span>👁️‍🗨️</span> Gerenciar Setores do Fluxograma
          </h3>
          <button onClick={onClose} className="text-slate-300 hover:text-white text-lg font-bold">
            ✕
          </button>
        </div>

        <p className="text-xs font-bold text-black mb-3">
          Alterne a visibilidade dos setores ou exclua setores customizados do fluxograma:
        </p>

        <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
          {allFlowSectors.map((s) => {
            const isHidden = hiddenFlowSectors.includes(s.id);
            return (
              <div
                key={s.id}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                  isHidden
                    ? 'border-slate-300 bg-slate-100 text-slate-500'
                    : 'border-teal-300 bg-teal-50 text-teal-950 shadow-sm'
                }`}
              >
                <div
                  className="flex items-center gap-2 flex-1 cursor-pointer"
                  onClick={() => onToggleHideSector(s.id)}
                >
                  <span className="text-xs font-bold text-black">{s.label}</span>
                  {s.isCustom && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-900 border border-teal-300">
                      Custom
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span
                    onClick={() => onToggleHideSector(s.id)}
                    className={`text-xs font-bold px-2.5 py-1 rounded-lg cursor-pointer shadow-sm ${
                      isHidden
                        ? 'bg-red-100 text-red-900 border border-red-300'
                        : 'bg-teal-700 text-white border border-teal-700'
                    }`}
                  >
                    {isHidden ? 'Oculto' : 'Visível'}
                  </span>

                  {onDeleteSector && s.isCustom && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSector(s.id);
                      }}
                      className="p-1 rounded-lg bg-red-100 hover:bg-red-200 border border-red-300 text-red-900 text-xs font-bold transition-all cursor-pointer shadow-sm"
                      title={`Excluir permanentemente o setor customizado '${s.label}'`}
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-slate-300 pt-4">
          {hiddenFlowSectors.length > 0 && (
            <button
              onClick={onRestoreAll}
              className="text-xs font-bold text-amber-900 hover:underline"
            >
              Restaurar Visibilidade
            </button>
          )}
          <button
            onClick={onClose}
            className="ml-auto px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-sm transition-all"
          >
            Concluído
          </button>
        </div>
      </div>
    </div>
  );
};
