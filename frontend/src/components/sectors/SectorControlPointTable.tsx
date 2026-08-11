import React from 'react';
import { useAtom } from 'jotai';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from '@tanstack/react-table';
import { Variable } from '../../types';
import { selectedFieldIdAtom } from '../../state/atoms';
import { useControlPointColumns } from './useControlPointColumns';

interface SectorControlPointTableProps {
  cp?: { cpName: string; cpId: string; variables: Variable[] };
  controlPointId?: string;
  variables?: Variable[];
  results?: Record<string, any>;
  isLocked?: boolean;
  searchMatchIds?: string[];
  currentMatchId?: string;
  auditVarId?: string | null;
  setAuditVarId?: React.Dispatch<React.SetStateAction<string | null>>;
  onAuditClick?: (id: string | null) => void;
  internalAuditDeps?: string[];
  onEditVariable?: (variable: Variable) => void;
  setActiveFormulaPopover?: (popover: { varId: string; formula: string } | null) => void;
  onMoveVar?: (id: string, direction: 'up' | 'down') => void;
  handleDragStart?: (e: React.DragEvent, type: 'stage' | 'cp' | 'var', id: string) => void;
  handleDragOver?: (e: React.DragEvent) => void;
  handleDrop?: (e: React.DragEvent, targetType: 'stage' | 'cp' | 'var', targetId: string) => void;
  handleMove?: (type: 'stage' | 'cp' | 'var', id: string, direction: 'up' | 'down') => void;
}

export const SectorControlPointTable: React.FC<SectorControlPointTableProps> = ({
  cp,
  controlPointId,
  variables,
  results = {},
  isLocked = false,
  auditVarId = null,
  setAuditVarId,
  onAuditClick,
  internalAuditDeps = [],
  onEditVariable,
  setActiveFormulaPopover,
  onMoveVar,
  handleDragStart,
  handleDragOver,
  handleDrop,
  handleMove,
}) => {
  const [highlightedVarId, setSelectedFieldId] = useAtom(selectedFieldIdAtom);

  const cpName = cp?.cpName || controlPointId || '';
  const cpId = cp?.cpId || controlPointId || '';
  const tableVariables = cp?.variables || variables || [];

  const handleMoveAction = (type: 'stage' | 'cp' | 'var', id: string, direction: 'up' | 'down') => {
    if (onMoveVar && type === 'var') {
      onMoveVar(id, direction);
    } else if (handleMove) {
      handleMove(type, id, direction);
    }
  };

  const safeDragStart = (e: React.DragEvent, type: 'stage' | 'cp' | 'var', id: string) => {
    if (handleDragStart) handleDragStart(e, type, id);
  };

  const safeDragOver = (e: React.DragEvent) => {
    if (handleDragOver) handleDragOver(e);
  };

  const safeDrop = (e: React.DragEvent, type: 'stage' | 'cp' | 'var', id: string) => {
    if (handleDrop) handleDrop(e, type, id);
  };

  const columns = useControlPointColumns({
    isLocked,
    auditVarId,
    results,
    setAuditVarId,
    onAuditClick,
    setActiveFormulaPopover,
    onEditVariable,
    handleMoveAction,
  });

  const table = useReactTable({
    data: tableVariables,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row['ID - REF'],
  });

  return (
    <div
      data-group-name={cpName}
      className="flex flex-col border-b border-slate-200 last:border-b-0"
      draggable={!isLocked}
      onDragStart={(e) => safeDragStart(e, 'cp', cpId)}
      onDragOver={safeDragOver}
      onDrop={(e) => safeDrop(e, 'cp', cpId)}
    >
      <div className="flex items-center gap-3 px-5 py-2.5 bg-teal-50/70 border-b border-teal-100">
        <span
          className="cursor-grab text-slate-400 hover:text-teal-700 select-none font-bold text-[10px]"
          title="Arrastar para reordenar ponto de controle"
        >
          ⋮⋮
        </span>
        <span className="w-[4px] h-4 rounded-full bg-teal-600 shrink-0" />
        <span className="text-xs font-bold uppercase tracking-wider text-teal-900 font-mono">
          {cpName}
        </span>
        <div className="flex items-center gap-1.5 ml-2">
          <button
            type="button"
            onClick={() => handleMoveAction('cp', cpId, 'up')}
            disabled={isLocked}
            className="text-slate-400 hover:text-teal-700 disabled:opacity-30 text-[9px]"
            title="Subir ponto de controle"
          >
            ▲
          </button>
          <button
            type="button"
            onClick={() => handleMoveAction('cp', cpId, 'down')}
            disabled={isLocked}
            className="text-slate-400 hover:text-teal-700 disabled:opacity-30 text-[9px]"
            title="Descer ponto de controle"
          >
            ▼
          </button>
        </div>
      </div>

      <div className="bme-table-wrapper">
        <table className="bme-table">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="bme-table-header-row bg-slate-50 border-b border-slate-200">
                {headerGroup.headers.map((header, idx) => {
                  const widths = [
                    'w-10 text-center', // drag
                    'w-32',             // ID
                    '',                 // Descrição
                    'w-24',             // Tipo
                    'w-20',             // Unidade
                    'w-36',             // Fórmula
                    'w-36 text-right',  // Valor
                    'w-16 text-center', // Ações
                  ];
                  return (
                    <th key={header.id} className={`bme-table-header-cell text-black font-bold uppercase ${widths[idx] || ''}`}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {table.getRowModel().rows.map((row) => {
              const v = row.original;
              const id = v['ID - REF'];
              const isHighlight = highlightedVarId === id;
              const isAuditedOrigin = auditVarId === id;
              const isAuditedDep = auditVarId !== null && internalAuditDeps.includes(id);
              const isInactive = v.STATUS === 'inativa';

              return (
                <tr
                  key={row.id}
                  data-var-id={id}
                  className={`bme-table-row transition-colors ${
                    isHighlight ? 'var-row-highlight' : ''
                  } ${
                    isAuditedOrigin ? 'bg-teal-100/80 border-l-4 border-teal-600' : ''
                  } ${
                    isAuditedDep ? 'bg-teal-50 border-l-4 border-teal-400' : ''
                  } ${isInactive ? 'opacity-40 italic bg-gray-50' : ''}`}
                  draggable={!isLocked && !isInactive}
                  onDragStart={(e) => safeDragStart(e, 'var', id)}
                  onDragOver={safeDragOver}
                  onDrop={(e) => safeDrop(e, 'var', id)}
                  onClick={() => setSelectedFieldId(id)}
                >
                  {row.getVisibleCells().map((cell, idx) => {
                    const aligns = [
                      'text-center select-none w-10', // drag
                      'font-mono font-bold text-black truncate max-w-[140px]', // ID
                      'text-black font-semibold truncate max-w-[260px]', // Descrição
                      '', // Tipo
                      'text-black font-mono font-semibold text-xs', // Unidade
                      'text-black font-mono font-semibold max-w-[160px] relative group', // Fórmula
                      'font-mono font-bold text-right', // Valor
                      'text-center', // Ações
                    ];
                    return (
                      <td key={cell.id} className={`bme-table-cell py-2.5 px-4 ${aligns[idx] || ''}`}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
