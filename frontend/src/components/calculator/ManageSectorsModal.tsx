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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <span>👁️‍🗨️</span> Gerenciar Setores do Fluxograma
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 text-lg font-bold">
            ✕
          </button>
        </div>

        <p className="mt-3 text-xs text-slate-400">
          Alterne a visibilidade dos setores ou exclua setores customizados do fluxograma:
        </p>

        <div className="mt-4 max-h-60 overflow-y-auto space-y-2 pr-1">
          {allFlowSectors.map((s) => {
            const isHidden = hiddenFlowSectors.includes(s.id);
            return (
              <div
                key={s.id}
                className={`flex items-center justify-between p-2.5 rounded-lg border transition-all ${
                  isHidden
                    ? 'border-slate-800 bg-slate-950/50 text-slate-500'
                    : 'border-teal-500/30 bg-teal-950/20 text-slate-200'
                }`}
              >
                <div
                  className="flex items-center gap-2 flex-1 cursor-pointer"
                  onClick={() => onToggleHideSector(s.id)}
                >
                  <span className="text-xs font-semibold">{s.label}</span>
                  {s.isCustom && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-950/80 text-teal-400 border border-teal-800/50">
                      Custom
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span
                    onClick={() => onToggleHideSector(s.id)}
                    className={`text-xs font-bold px-2 py-0.5 rounded cursor-pointer ${
                      isHidden
                        ? 'bg-rose-950/60 text-rose-400 border border-rose-800/40'
                        : 'bg-teal-950/60 text-teal-300 border border-teal-800/40'
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
                      className="p-1 rounded bg-rose-950/60 hover:bg-rose-900 border border-rose-800/60 text-rose-300 text-xs font-bold transition-all cursor-pointer"
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

        <div className="mt-5 flex items-center justify-between border-t border-slate-800 pt-3">
          {hiddenFlowSectors.length > 0 && (
            <button
              onClick={onRestoreAll}
              className="text-xs font-medium text-amber-400 hover:underline"
            >
              Restaurar Visibilidade
            </button>
          )}
          <button
            onClick={onClose}
            className="ml-auto px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow"
          >
            Concluído
          </button>
        </div>
      </div>
    </div>
  );
};
