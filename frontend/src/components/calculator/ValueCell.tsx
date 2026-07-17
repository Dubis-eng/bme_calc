import React, { memo } from 'react';
import { Variable, Result } from '../../types';
import { FormattedVariableInput } from '../ui/Input';
import { formatVariableValue } from '../../utils/helpers';
import { ERROR_BADGE } from '../../styles/design-system';

interface ValueCellProps {
  variable: Variable;
  result: Result | undefined;
  isLocked: boolean;
}

export const ValueCell = memo<ValueCellProps>(({ variable, result, isLocked }) => {
  const v = variable;
  const id = v['ID - REF'];
  const isInput = v.TIPO === 'INPUT' || v.TIPO === 'CENARIO';
  const isConstant = (v.TIPO as string) === 'CONSTANT';

  const fieldClass = isInput
    ? 'field-input'
    : isConstant
    ? 'field-constant'
    : 'field-output';

  const getReadOnlyValue = () => {
    if (result !== undefined && result.status === 'OK' && result.value !== null) {
      return formatVariableValue(result.value, v);
    }
    if (isConstant) {
      const num = Number(String(v['EQUAÇÕES E VALORES']).replace(',', '.'));
      if (!isNaN(num)) {
        return formatVariableValue(num, v);
      }
      return String(v['EQUAÇÕES E VALORES']);
    }
    return '—';
  };

  if (isInput) {
    return (
      <div className="flex justify-end items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
        <label htmlFor={`input-val-${id}`} className="sr-only">Valor para {id}</label>
        <FormattedVariableInput
          id={`input-val-${id}`}
          variable={v}
          isLocked={isLocked}
          className={`${v.tipo_exibicao === 'PERCENTAGE' ? 'w-24' : 'w-28'} px-2.5 py-1 text-xs font-mono font-semibold rounded-md border text-right focus:outline-none transition-all duration-150 disabled:opacity-50 ${fieldClass}`}
        />
        {v.tipo_exibicao === 'PERCENTAGE' && (
          <span className="text-[10px] font-bold text-slate-500 w-4 shrink-0 select-none text-left">%</span>
        )}
      </div>
    );
  }

  if (result !== undefined && result.status !== 'OK') {
    return (
      <div className="flex justify-end items-center">
        <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold ${ERROR_BADGE[result.status] ?? 'bg-slate-700/40 text-slate-400 border-slate-700/60'}`} title={result.error_message || result.status}>⚠ {result.status}</span>
      </div>
    );
  }

  return (
    <div className="flex justify-end items-center gap-1.5">
      <label htmlFor={`input-val-${id}`} className="sr-only">Valor para {id}</label>
      <input
        id={`input-val-${id}`}
        type="text"
        readOnly
        value={getReadOnlyValue()}
        className={`${v.tipo_exibicao === 'PERCENTAGE' ? 'w-24' : 'w-28'} px-2.5 py-1 text-xs font-mono font-semibold rounded-md border text-right focus:outline-none transition-all duration-150 ${fieldClass}`}
      />
      {v.tipo_exibicao === 'PERCENTAGE' && (
        <span className="text-[10px] font-bold text-slate-500 w-4 shrink-0 select-none text-left">%</span>
      )}
    </div>
  );
});
