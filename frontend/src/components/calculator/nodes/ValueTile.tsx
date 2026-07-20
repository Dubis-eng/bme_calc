import React from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { variablesAtom, resultsAtom, selectedFieldIdAtom } from '../../../state/atoms';
import { FormattedVariableInput } from '../../ui/Input';
import { formatVariableValue } from '../../../utils/helpers';
import { Variable } from '../../../types';

interface ValueTileProps {
  id: string;
  isLocked?: boolean;
}

export const ValueTile: React.FC<ValueTileProps> = ({ id, isLocked = false }) => {
  const variables = useAtomValue(variablesAtom);
  const results = useAtomValue(resultsAtom);
  const selectedFieldId = useAtomValue(selectedFieldIdAtom);
  const setSelectedFieldId = useSetAtom(selectedFieldIdAtom);

  const variable = variables.find(v => v['ID - REF'] === id);

  if (!variable) {
    return (
      <div className="rounded border border-dashed border-rose-500/40 bg-rose-950/20 px-2 py-1 text-[10px] text-rose-400 font-mono">
        {id} (não encontrado)
      </div>
    );
  }

  const isInput = variable.TIPO === 'INPUT' || variable.TIPO === 'CENARIO';
  const isSelected = selectedFieldId === id;
  const result = results[id];
  const unit = variable['UNIDADE DE MEDIDA'];

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFieldId(id);
  };

  return (
    <div
      onClick={handleSelect}
      className={`group flex w-full items-center justify-between gap-2 rounded-md border-l-2 px-2.5 py-1.5 text-left transition-all ${
        isInput
          ? 'border-l-amber-500 bg-amber-950/20 hover:bg-amber-950/40'
          : 'border-l-teal-500 bg-slate-900/60 hover:bg-slate-800/60'
      } ${isSelected ? 'ring-1 ring-teal-400 shadow-glow-teal' : ''}`}
    >
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-1.5 truncate text-[10px] font-medium text-slate-400">
          <span className="font-mono font-bold text-slate-300">{id}</span>
          <span>·</span>
          <span className="truncate text-slate-400">{variable['DESCRIÇÃO']}</span>
        </div>

        {isInput ? (
          <label htmlFor={`input-tile-${id}`} className="mt-1 block" onClick={(e) => e.stopPropagation()}>
            <span className="sr-only">Valor para {id}</span>
            <FormattedVariableInput
              id={`input-tile-${id}`}
              variable={variable}
              isLocked={isLocked}
              className="h-6 w-full max-w-[130px] rounded border border-slate-700 bg-slate-950 px-2 text-xs font-semibold text-amber-300 font-mono focus:border-amber-500 focus:outline-none"
            />
          </label>
        ) : (
          <div className="mt-0.5 font-mono text-xs font-semibold text-slate-100">
            {result?.status === 'OK' && result.value !== null ? (
              <span className="text-teal-300 font-bold">
                {formatVariableValue(result.value, variable)}
              </span>
            ) : result?.status && result.status !== 'OK' && result.status !== 'PENDING' ? (
              <span className="text-rose-400 text-[11px]" title={result.error_message}>
                ⚠️ Erro ({result.status})
              </span>
            ) : (
              <span className="text-slate-500 italic text-[11px]">
                {String(variable['EQUAÇÕES E VALORES'] || '—')}
              </span>
            )}
          </div>
        )}
      </div>

      {unit && unit !== '-' && (
        <span className="shrink-0 font-mono text-[10px] font-medium text-slate-500">
          {unit}
        </span>
      )}
    </div>
  );
};
