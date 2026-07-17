import React from 'react';
import { Variable } from '../../types';
import { SectorVariableRow } from '../calculator/SectorVariableRow';

interface SectorControlPointTableProps {
  cp: { cpName: string; cpId: string; variables: Variable[] };
  results: Record<string, any>;
  isLocked: boolean;
  highlightedVarId: string | null;
  auditVarId: string | null;
  setAuditVarId: React.Dispatch<React.SetStateAction<string | null>>;
  internalAuditDeps: string[];
  onEditVariable: (variable: Variable) => void;
  onVariableChange: (id: string, value: string) => void;
  setActiveFormulaPopover: (popover: { varId: string; formula: string } | null) => void;
  handleDragStart: (e: React.DragEvent, type: 'stage' | 'cp' | 'var', id: string) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent, targetType: 'stage' | 'cp' | 'var', targetId: string) => void;
  handleMove: (type: 'stage' | 'cp' | 'var', id: string, direction: 'up' | 'down') => void;
}

export const SectorControlPointTable: React.FC<SectorControlPointTableProps> = ({
  cp, results, isLocked, highlightedVarId, auditVarId, setAuditVarId,
  internalAuditDeps, onEditVariable, onVariableChange, setActiveFormulaPopover,
  handleDragStart, handleDragOver, handleDrop, handleMove
}) => {
  return (
    <div
      data-group-name={cp.cpName}
      className="flex flex-col"
      draggable={!isLocked}
      onDragStart={(e) => handleDragStart(e, 'cp', cp.cpId)}
      onDragOver={handleDragOver}
      onDrop={(e) => handleDrop(e, 'cp', cp.cpId)}
    >
      <div className="flex items-center gap-3 px-5 py-2 bg-slate-900/60 border-b border-slate-800/30">
        <span className="cursor-grab text-slate-600 hover:text-teal-400 select-none font-bold text-[10px]" title="Arrastar para reordenar ponto de controle">⋮⋮</span>
        <span className="w-[3px] h-4 rounded-full bg-teal-500/70 shrink-0" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-teal-400">{cp.cpName}</span>
        <div className="flex items-center gap-1.5 ml-2">
          <button type="button" onClick={() => handleMove('cp', cp.cpId, 'up')} disabled={isLocked} className="text-slate-600 hover:text-teal-400 disabled:opacity-30 text-[9px]" title="Subir ponto de controle">▲</button>
          <button type="button" onClick={() => handleMove('cp', cp.cpId, 'down')} disabled={isLocked} className="text-slate-600 hover:text-teal-400 disabled:opacity-30 text-[9px]" title="Descer ponto de controle">▼</button>
        </div>
      </div>

      <div className="bme-table-wrapper">
        <table className="bme-table">
          <thead>
            <tr className="bme-table-header-row">
              <th className="bme-table-header-cell w-10 text-center"></th>
              <th className="bme-table-header-cell w-28">ID</th>
              <th className="bme-table-header-cell">Descrição</th>
              <th className="bme-table-header-cell w-20">Tipo</th>
              <th className="bme-table-header-cell w-20">Unidade</th>
              <th className="bme-table-header-cell">Fórmula</th>
              <th className="bme-table-header-cell w-36 text-right">Valor</th>
              <th className="bme-table-header-cell w-20 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/30">
            {cp.variables.map(v => (
              <SectorVariableRow
                key={v['ID - REF']}
                variable={v}
                results={results}
                isLocked={isLocked}
                highlightedVarId={highlightedVarId}
                auditVarId={auditVarId}
                setAuditVarId={setAuditVarId}
                internalAuditDeps={internalAuditDeps}
                onEditVariable={onEditVariable}
                onVariableChange={onVariableChange}
                setActiveFormulaPopover={setActiveFormulaPopover}
                handleDragStart={handleDragStart}
                handleDragOver={handleDragOver}
                handleDrop={handleDrop}
                handleMove={handleMove}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
