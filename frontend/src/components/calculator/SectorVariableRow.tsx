import React from 'react';
import { Variable } from '../../types';
import { BmeIcon, TYPE_BADGE, ERROR_BADGE } from '../../theme/design-system';
import { formatVariableValue } from '../../utils/helpers';
import { FormattedVariableInput } from '../ui/Input';


interface SectorVariableRowProps {
  variable: Variable;
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

export const SectorVariableRow: React.FC<SectorVariableRowProps> = ({
  variable, results, isLocked, highlightedVarId, auditVarId, setAuditVarId,
  internalAuditDeps, onEditVariable, onVariableChange, setActiveFormulaPopover,
  handleDragStart, handleDragOver, handleDrop, handleMove
}) => {
  const v = variable;
  const id = v['ID - REF'];
  const res = results[id];
  const isInput = v.TIPO === 'INPUT' || v.TIPO === 'CENARIO';
  const isHighlight = highlightedVarId === id;
  const isAuditedOrigin = auditVarId === id;
  const isAuditedDep = auditVarId !== null && internalAuditDeps.includes(id);
  const isInactive = v.STATUS === 'inativa';

  return (
    <tr
      data-var-id={id}
      className={`bme-table-row transition-all duration-200 ${isHighlight ? 'var-row-highlight' : ''} ${isAuditedOrigin ? 'bg-cyan-950/20 border-l-2 border-cyan-500' : ''} ${isAuditedDep ? 'bg-teal-950/20 border-l-2 border-teal-500 shadow-[inset_0_0_8px_rgba(20,184,166,0.1)]' : ''} ${isInactive ? 'opacity-40 italic bg-slate-950/20' : ''}`}
      draggable={!isLocked && !isInactive}
      onDragStart={(e) => handleDragStart(e, 'var', id)}
      onDragOver={handleDragOver}
      onDrop={(e) => handleDrop(e, 'var', id)}
    >
      <td className="bme-table-cell text-center select-none w-10">
        <div className="flex items-center justify-center gap-1">
          <span className="cursor-grab text-slate-600 hover:text-teal-400 font-bold text-xs" title="Arrastar para reordenar variável">⋮⋮</span>
          <div className="flex flex-col text-[8px] leading-none text-slate-500">
            <button type="button" onClick={() => handleMove('var', id, 'up')} disabled={isLocked || isInactive} className="hover:text-teal-400 disabled:opacity-30 font-bold" title="Subir variável">▲</button>
            <button type="button" onClick={() => handleMove('var', id, 'down')} disabled={isLocked || isInactive} className="hover:text-teal-400 disabled:opacity-30 font-bold" title="Descer variável">▼</button>
          </div>
        </div>
      </td>
      <td className="bme-table-cell font-mono font-semibold text-teal-500 truncate max-w-[120px]" title={id}>{id}</td>
      <td className="bme-table-cell text-slate-300 truncate max-w-[200px]" title={v['DESCRIÇÃO']}>{v['DESCRIÇÃO']}</td>
      <td className="bme-table-cell">
        <span className={`px-2 py-0.5 inline-flex text-[9px] font-bold leading-4 rounded-full border ${TYPE_BADGE[v.TIPO] ?? 'bg-slate-700/40 text-slate-400 border-slate-700/60'}`}>{v.TIPO}</span>
        {isInactive && <span className="ml-1 px-1.5 py-0.5 inline-flex text-[8px] font-semibold leading-3 rounded bg-slate-800 text-slate-400 border border-slate-700 uppercase">Inativa</span>}
      </td>
      <td className="bme-table-cell text-slate-500">{v['UNIDADE DE MEDIDA'] || '—'}</td>

      {/* Formula */}
      <td className="bme-table-cell text-slate-600 font-mono max-w-[160px] relative group">
        {isInput ? <span className="text-slate-700">—</span> : (
          <div className="flex items-center gap-1.5">
            <span onClick={() => setActiveFormulaPopover({ varId: id, formula: String(v['EQUAÇÕES E VALORES']) })} className="truncate max-w-[110px] hover:text-teal-400 cursor-pointer transition-colors">{v['EQUAÇÕES E VALORES']}</span>
            <div className="absolute left-0 bottom-full mb-1.5 hidden group-hover:block z-50 bg-slate-950 text-slate-300 font-mono text-[10px] p-2 rounded-lg border border-slate-800 shadow-xl max-w-xs whitespace-pre-wrap break-all pointer-events-none">{v['EQUAÇÕES E VALORES']}</div>
            <button type="button" onClick={() => setAuditVarId(prev => prev === id ? null : id)} className={`p-1 rounded transition-colors ${isAuditedOrigin ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-600 hover:text-teal-400 hover:bg-slate-800/40'}`} title="Auditar fluxo de variáveis"><BmeIcon name="eye" size={10} /></button>
          </div>
        )}
      </td>

      {/* Value / Input */}
      <td className="bme-table-cell font-mono font-bold text-right">
        {isInput ? (
          <div className="flex justify-end items-center gap-1.5">
            <label htmlFor={`input-val-${id}`} className="sr-only">Valor para {id}</label>
            <FormattedVariableInput
              id={`input-val-${id}`}
              variable={v}
              isLocked={isLocked}
              onVariableChange={onVariableChange}
              className={`${v.tipo_exibicao === 'PERCENTAGE' ? 'w-24' : 'w-28'} px-2.5 py-1 text-xs font-mono font-semibold rounded-md bg-slate-800 border border-slate-700/60 text-slate-200 placeholder-slate-600 text-right focus:outline-none focus:ring-1 focus:ring-teal-500/60 focus:border-teal-500/50 disabled:bg-slate-900 disabled:text-slate-600 disabled:border-slate-800`}
            />
            {v.tipo_exibicao === 'PERCENTAGE' && (
              <span className="text-[10px] font-bold text-slate-500 w-4 shrink-0 select-none text-left">%</span>
            )}
          </div>
        ) : (
          res !== undefined ? (
            res.status === 'OK' && res.value !== null ? (
              <span className="text-slate-200 tabular-nums">{formatVariableValue(res.value, v)}</span>
            ) : (
              <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold ${ERROR_BADGE[res.status] ?? 'bg-slate-700/40 text-slate-400 border-slate-700/60'}`} title={res.error_message || res.status}>⚠ {res.status}</span>
            )
          ) : <span className="text-slate-700">—</span>
        )}
      </td>

      <td className="bme-table-cell text-center">
        <button type="button" disabled={isLocked || isInactive} onClick={() => onEditVariable(v)} className="text-slate-500 hover:text-teal-400 hover:bg-teal-500/10 disabled:opacity-35 disabled:hover:bg-transparent p-1.5 rounded-md transition-all focus:outline-none" title="Editar variável"><BmeIcon name="pencil" /></button>
      </td>
    </tr>
  );
};
