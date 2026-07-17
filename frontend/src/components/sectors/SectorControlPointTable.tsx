import React from 'react';
import { useAtom } from 'jotai';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';
import { Variable } from '../../types';
import { BmeIcon, TYPE_BADGE } from '../../styles/design-system';
import { selectedFieldIdAtom } from '../../state/atoms';
import { ValueCell } from '../calculator/ValueCell';

interface SectorControlPointTableProps {
  cp: { cpName: string; cpId: string; variables: Variable[] };
  results: Record<string, any>;
  isLocked: boolean;
  auditVarId: string | null;
  setAuditVarId: React.Dispatch<React.SetStateAction<string | null>>;
  internalAuditDeps: string[];
  onEditVariable: (variable: Variable) => void;
  setActiveFormulaPopover: (popover: { varId: string; formula: string } | null) => void;
  handleDragStart: (e: React.DragEvent, type: 'stage' | 'cp' | 'var', id: string) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent, targetType: 'stage' | 'cp' | 'var', targetId: string) => void;
  handleMove: (type: 'stage' | 'cp' | 'var', id: string, direction: 'up' | 'down') => void;
}

export const SectorControlPointTable: React.FC<SectorControlPointTableProps> = ({
  cp, results, isLocked, auditVarId, setAuditVarId,
  internalAuditDeps, onEditVariable, setActiveFormulaPopover,
  handleDragStart, handleDragOver, handleDrop, handleMove
}) => {
  const [highlightedVarId, setSelectedFieldId] = useAtom(selectedFieldIdAtom);

  const columnHelper = createColumnHelper<Variable>();

  const columns = [
    columnHelper.display({
      id: 'drag',
      cell: (info) => {
        const id = info.row.original['ID - REF'];
        return (
          <div className="flex items-center justify-center gap-1">
            <span className="cursor-grab text-slate-600 hover:text-teal-400 select-none font-bold text-xs" title="Arrastar para reordenar variável">⋮⋮</span>
            <div className="flex flex-col text-[8px] leading-none text-slate-500">
              <button type="button" onClick={(e) => { e.stopPropagation(); handleMove('var', id, 'up'); }} disabled={isLocked || info.row.original.STATUS === 'inativa'} className="hover:text-teal-400 disabled:opacity-30 font-bold" title="Subir variável">▲</button>
              <button type="button" onClick={(e) => { e.stopPropagation(); handleMove('var', id, 'down'); }} disabled={isLocked || info.row.original.STATUS === 'inativa'} className="hover:text-teal-400 disabled:opacity-30 font-bold" title="Descer variável">▼</button>
            </div>
          </div>
        );
      },
    }),
    columnHelper.accessor('ID - REF', {
      header: 'ID',
      cell: (info) => <span className="font-mono font-semibold text-teal-500 truncate block max-w-[120px]" title={info.getValue()}>{info.getValue()}</span>,
    }),
    columnHelper.accessor('DESCRIÇÃO', {
      header: 'Descrição',
      cell: (info) => <span className="text-slate-300 truncate block max-w-[200px]" title={info.getValue()}>{info.getValue() || '—'}</span>,
    }),
    columnHelper.accessor('TIPO', {
      header: 'Tipo',
      cell: (info) => {
        const val = info.getValue();
        const isInactive = info.row.original.STATUS === 'inativa';
        return (
          <div className="flex items-center">
            <span className={`px-2 py-0.5 inline-flex text-[9px] font-bold leading-4 rounded-full border ${TYPE_BADGE[val] ?? 'bg-slate-700/40 text-slate-400 border-slate-700/60'}`}>{val}</span>
            {isInactive && <span className="ml-1 px-1.5 py-0.5 inline-flex text-[8px] font-semibold leading-3 rounded bg-slate-800 text-slate-400 border border-slate-700 uppercase">Inativa</span>}
          </div>
        );
      },
    }),
    columnHelper.accessor('UNIDADE DE MEDIDA', {
      header: 'Unidade',
      cell: (info) => <span className="text-slate-500">{info.getValue() || '—'}</span>,
    }),
    columnHelper.display({
      id: 'formula',
      header: 'Fórmula',
      cell: (info) => {
        const v = info.row.original;
        const id = v['ID - REF'];
        const isInput = v.TIPO === 'INPUT' || v.TIPO === 'CENARIO';
        const isAuditedOrigin = auditVarId === id;
        return isInput ? <span className="text-slate-700">—</span> : (
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <span onClick={() => setActiveFormulaPopover({ varId: id, formula: String(v['EQUAÇÕES E VALORES']) })} className="truncate max-w-[110px] hover:text-teal-400 cursor-pointer transition-colors">{v['EQUAÇÕES E VALORES']}</span>
            <div className="absolute left-0 bottom-full mb-1.5 hidden group-hover:block z-50 bg-slate-950 text-slate-300 font-mono text-[10px] p-2 rounded-lg border border-slate-800 shadow-xl max-w-xs whitespace-pre-wrap break-all pointer-events-none">{v['EQUAÇÕES E VALORES']}</div>
            <button type="button" onClick={() => setAuditVarId(prev => prev === id ? null : id)} className={`p-1 rounded transition-colors ${isAuditedOrigin ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-600 hover:text-teal-400 hover:bg-slate-800/40'}`} title="Auditar fluxo de variáveis"><BmeIcon name="eye" size={10} /></button>
          </div>
        );
      },
    }),
    columnHelper.display({
      id: 'value',
      header: 'Valor',
      cell: (info) => {
        const v = info.row.original;
        const id = v['ID - REF'];
        const res = results[id];
        return (
          <ValueCell
            variable={v}
            result={res}
            isLocked={isLocked}
          />
        );
      },
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Ações',
      cell: (info) => {
        const v = info.row.original;
        const isInactive = v.STATUS === 'inativa';
        return (
          <button type="button" disabled={isLocked || isInactive} onClick={(e) => { e.stopPropagation(); onEditVariable(v); }} className="text-slate-500 hover:text-teal-400 hover:bg-teal-500/10 disabled:opacity-35 disabled:hover:bg-transparent p-1.5 rounded-md transition-all focus:outline-none" title="Editar variável"><BmeIcon name="pencil" /></button>
        );
      },
    }),
  ];

  const table = useReactTable({
    data: cp.variables,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

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
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id} className="bme-table-header-row">
                {headerGroup.headers.map((header, idx) => {
                  const widths = [
                    'w-10 text-center', // drag
                    'w-28',             // ID
                    '',                 // Descrição
                    'w-20',             // Tipo
                    'w-20',             // Unidade
                    '',                 // Fórmula
                    'w-36 text-right',  // Valor
                    'w-20 text-center'  // Ações
                  ];
                  return (
                    <th
                      key={header.id}
                      className={`bme-table-header-cell ${widths[idx] || ''}`}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-slate-800/30">
            {table.getRowModel().rows.map(row => {
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
                  className={`bme-table-row transition-all duration-200 ${isHighlight ? 'var-row-highlight' : ''} ${isAuditedOrigin ? 'bg-cyan-950/20 border-l-2 border-cyan-500' : ''} ${isAuditedDep ? 'bg-teal-950/20 border-l-2 border-teal-500 shadow-[inset_0_0_8px_rgba(20,184,166,0.1)]' : ''} ${isInactive ? 'opacity-40 italic bg-slate-950/20' : ''}`}
                  draggable={!isLocked && !isInactive}
                  onDragStart={(e) => handleDragStart(e, 'var', id)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, 'var', id)}
                  onClick={() => setSelectedFieldId(id)}
                >
                  {row.getVisibleCells().map((cell, idx) => {
                    const aligns = [
                      'text-center select-none w-10', // drag
                      'font-mono font-semibold text-teal-500 truncate max-w-[120px]', // ID
                      'text-slate-300 truncate max-w-[200px]', // Descrição
                      '', // Tipo
                      'text-slate-500', // Unidade
                      'text-slate-600 font-mono max-w-[160px] relative group', // Fórmula
                      'font-mono font-bold text-right', // Valor
                      'text-center' // Ações
                    ];
                    return (
                      <td
                        key={cell.id}
                        className={`bme-table-cell ${aligns[idx] || ''}`}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
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
