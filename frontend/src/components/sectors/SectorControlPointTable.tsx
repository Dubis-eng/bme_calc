import React, { useMemo } from 'react';
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

const columnHelper = createColumnHelper<Variable>();

export const SectorControlPointTable: React.FC<SectorControlPointTableProps> = ({
  cp,
  results,
  isLocked,
  auditVarId,
  setAuditVarId,
  internalAuditDeps,
  onEditVariable,
  setActiveFormulaPopover,
  handleDragStart,
  handleDragOver,
  handleDrop,
  handleMove,
}) => {
  const [highlightedVarId, setSelectedFieldId] = useAtom(selectedFieldIdAtom);

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'drag',
        cell: (info) => {
          const id = info.row.original['ID - REF'];
          return (
            <div className="flex items-center justify-center gap-1">
              <span
                className="cursor-grab text-slate-400 hover:text-teal-700 select-none font-bold text-xs"
                title="Arrastar para reordenar variável"
              >
                ⋮⋮
              </span>
              <div className="flex flex-col text-[8px] leading-none text-slate-500">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMove('var', id, 'up');
                  }}
                  disabled={isLocked || info.row.original.STATUS === 'inativa'}
                  className="hover:text-teal-700 disabled:opacity-30 font-bold"
                  title="Subir variável"
                >
                  ▲
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMove('var', id, 'down');
                  }}
                  disabled={isLocked || info.row.original.STATUS === 'inativa'}
                  className="hover:text-teal-700 disabled:opacity-30 font-bold"
                  title="Descer variável"
                >
                  ▼
                </button>
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor('ID - REF', {
        header: 'ID',
        cell: (info) => (
          <span
            className="font-mono font-bold text-black hover:text-teal-700 truncate block max-w-[140px] cursor-pointer"
            title={info.getValue()}
          >
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor('DESCRIÇÃO', {
        header: 'Descrição',
        cell: (info) => (
          <span
            className="text-black font-semibold truncate block max-w-[260px]"
            title={info.getValue()}
          >
            {info.getValue() || '—'}
          </span>
        ),
      }),
      columnHelper.accessor('TIPO', {
        header: 'Tipo',
        cell: (info) => {
          const val = info.getValue();
          const isInactive = info.row.original.STATUS === 'inativa';
          return (
            <div className="flex items-center">
              <span
                className={`px-2 py-0.5 inline-flex text-[10px] font-bold leading-4 rounded-full border ${
                  TYPE_BADGE[val] ?? 'bg-slate-100 text-slate-700 border-slate-300'
                }`}
              >
                {val}
              </span>
              {isInactive && (
                <span className="ml-1.5 px-1.5 py-0.5 inline-flex text-[9px] font-bold leading-3 rounded bg-slate-100 text-slate-600 border border-slate-300 uppercase">
                  Inativa
                </span>
              )}
            </div>
          );
        },
      }),
      columnHelper.accessor('UNIDADE DE MEDIDA', {
        header: 'Unidade',
        cell: (info) => <span className="text-black font-mono font-semibold text-xs">{info.getValue() || '—'}</span>,
      }),
      columnHelper.display({
        id: 'formula',
        header: 'Fórmula',
        cell: (info) => {
          const v = info.row.original;
          const id = v['ID - REF'];
          const isInput = v.TIPO === 'INPUT' || v.TIPO === 'CENARIO';
          const isAuditedOrigin = auditVarId === id;
          return isInput ? (
            <span className="text-slate-400">—</span>
          ) : (
            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
              <span
                onClick={() =>
                  setActiveFormulaPopover({ varId: id, formula: String(v['EQUAÇÕES E VALORES']) })
                }
                className="font-mono text-black font-semibold hover:text-teal-700 truncate max-w-[140px] cursor-pointer transition-colors"
                title={String(v['EQUAÇÕES E VALORES'])}
              >
                {v['EQUAÇÕES E VALORES']}
              </span>
              <button
                type="button"
                onClick={() => setAuditVarId((prev) => (prev === id ? null : id))}
                className={`p-1 rounded transition-colors ${
                  isAuditedOrigin
                    ? 'bg-teal-100 text-teal-800 font-bold'
                    : 'text-slate-500 hover:text-teal-700 hover:bg-slate-100'
                }`}
                title="Auditar fluxo de variáveis"
              >
                <BmeIcon name="eye" size={12} />
              </button>
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
          return <ValueCell variable={v} result={res} isLocked={isLocked} />;
        },
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Ações',
        cell: (info) => {
          const v = info.row.original;
          const isInactive = v.STATUS === 'inativa';
          return (
            <button
              type="button"
              disabled={isLocked || isInactive}
              onClick={(e) => {
                e.stopPropagation();
                onEditVariable(v);
              }}
              className="text-slate-600 hover:text-teal-700 hover:bg-slate-100 disabled:opacity-30 p-1.5 rounded-lg transition-all focus:outline-none"
              title="Editar variável"
            >
              <BmeIcon name="pencil" size={13} />
            </button>
          );
        },
      }),
    ],
    [isLocked, auditVarId, results, setAuditVarId, setActiveFormulaPopover, handleMove, onEditVariable]
  );

  const table = useReactTable({
    data: cp.variables,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row['ID - REF'],
  });

  return (
    <div
      data-group-name={cp.cpName}
      className="flex flex-col border-b border-slate-200 last:border-b-0"
      draggable={!isLocked}
      onDragStart={(e) => handleDragStart(e, 'cp', cp.cpId)}
      onDragOver={handleDragOver}
      onDrop={(e) => handleDrop(e, 'cp', cp.cpId)}
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
          {cp.cpName}
        </span>
        <div className="flex items-center gap-1.5 ml-2">
          <button
            type="button"
            onClick={() => handleMove('cp', cp.cpId, 'up')}
            disabled={isLocked}
            className="text-slate-400 hover:text-teal-700 disabled:opacity-30 text-[9px]"
            title="Subir ponto de controle"
          >
            ▲
          </button>
          <button
            type="button"
            onClick={() => handleMove('cp', cp.cpId, 'down')}
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
                  onDragStart={(e) => handleDragStart(e, 'var', id)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, 'var', id)}
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
