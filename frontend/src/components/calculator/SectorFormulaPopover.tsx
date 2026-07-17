import React from 'react';
import { BmeIcon } from '../../styles/design-system';

interface SectorFormulaPopoverProps {
  activeFormulaPopover: { varId: string; formula: string } | null;
  onClose: () => void;
}

export const SectorFormulaPopover: React.FC<SectorFormulaPopoverProps> = ({
  activeFormulaPopover,
  onClose,
}) => {
  if (!activeFormulaPopover) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="glass-card max-w-lg w-full p-4 relative flex flex-col gap-3 border border-slate-700/40"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center border-b border-slate-800 pb-2">
          <span className="text-xs font-bold text-teal-400 font-mono">
            {activeFormulaPopover.varId}
          </span>
          <button className="btn-ghost p-1" onClick={onClose} aria-label="Fechar">
            <BmeIcon name="close" size={12} />
          </button>
        </div>
        <div className="bg-slate-950 p-3 rounded border border-slate-800 font-mono text-xs text-slate-300 break-all whitespace-pre-wrap leading-relaxed select-all">
          {activeFormulaPopover.formula}
        </div>
        <div className="flex justify-end">
          <button
            className="btn-primary px-3 py-1.5 text-[11px] flex items-center gap-1.5"
            onClick={() => {
              navigator.clipboard.writeText(activeFormulaPopover.formula);
              alert('Fórmula copiada com sucesso!');
            }}
          >
            📋 Copiar Fórmula
          </button>
        </div>
      </div>
    </div>
  );
};
