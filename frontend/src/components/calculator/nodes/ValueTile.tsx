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
      <div className="rounded-lg border border-dashed border-red-300 bg-red-50 px-2 py-1 text-[10px] text-red-900 font-mono font-bold">
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
      className={`group flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-1.5 text-left transition-all ${
        isInput
          ? 'border-amber-300 bg-amber-50 hover:bg-amber-100'
          : 'border-slate-300 bg-white hover:bg-slate-50'
      } ${isSelected ? 'ring-2 ring-teal-600 border-teal-600 shadow-md' : ''}`}
    >
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-1.5 truncate text-[10px] font-bold text-black">
          <span className="font-mono font-bold text-black">{id}</span>
          <span>·</span>
          <span className="truncate text-black font-semibold">{variable['DESCRIÇÃO']}</span>
        </div>

        {isInput ? (
          <label htmlFor={`input-tile-${id}`} className="mt-1 block" onClick={(e) => e.stopPropagation()}>
            <span className="sr-only">Valor para {id}</span>
            <FormattedVariableInput
              id={`input-tile-${id}`}
              variable={variable}
              isLocked={isLocked}
              className="w-full px-2 py-0.5 text-xs font-mono font-bold text-black bg-white border border-slate-300 rounded-lg text-right focus:outline-none focus:border-teal-600 shadow-sm"
            />
          </label>
        ) : (
          <div className="mt-0.5 flex items-center justify-between text-xs font-mono font-bold text-black">
            <span>
              {result && result.status === 'OK' && result.value !== null
                ? formatVariableValue(result.value, variable)
                : '—'}
            </span>
            {unit && <span className="text-[10px] text-black font-bold font-sans ml-1">{unit}</span>}
          </div>
        )}
      </div>
    </div>
  );
};
