import React, { useMemo } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { Variable } from '../../types';
import { BmeIcon, TYPE_BADGE } from '../../styles/design-system';
import { ValueCell } from '../calculator/ValueCell';

const columnHelper = createColumnHelper<Variable>();

interface UseControlPointColumnsParams {
  isLocked: boolean;
  auditVarId: string | null;
  results: Record<string, any>;
  setAuditVarId?: React.Dispatch<React.SetStateAction<string | null>>;
  onAuditClick?: (id: string | null) => void;
  setActiveFormulaPopover?: (popover: { varId: string; formula: string } | null) => void;
  onEditVariable?: (variable: Variable) => void;
  handleMoveAction: (type: 'stage' | 'cp' | 'var', id: string, direction: 'up' | 'down') => void;
}

export function useControlPointColumns({
  isLocked,
  auditVarId,
  results,
  setAuditVarId,
  onAuditClick,
  setActiveFormulaPopover,
  onEditVariable,
  handleMoveAction,
}: UseControlPointColumnsParams) {
  const handleAuditToggle = (id: string) => {
    if (onAuditClick) {
      onAuditClick(auditVarId === id ? null : id);
    } else if (setAuditVarId) {
      setAuditVarId((prev) => (prev === id ? null : id));
    }
  };

  return useMemo(
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
                    handleMoveAction('var', id, 'up');
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
                    handleMoveAction('var', id, 'down');
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
                onClick={() => {
                  if (setActiveFormulaPopover) {
                    setActiveFormulaPopover({ varId: id, formula: String(v['EQUAÇÕES E VALORES']) });
                  }
                }}
                className="font-mono text-black font-semibold hover:text-teal-700 truncate max-w-[140px] cursor-pointer transition-colors"
                title={String(v['EQUAÇÕES E VALORES'])}
              >
                {v['EQUAÇÕES E VALORES']}
              </span>
              <button
                type="button"
                onClick={() => handleAuditToggle(id)}
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
                if (onEditVariable) onEditVariable(v);
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
    [isLocked, auditVarId, results, setAuditVarId, onAuditClick, setActiveFormulaPopover, onEditVariable, handleMoveAction]
  );
}
