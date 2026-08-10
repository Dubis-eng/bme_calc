import React from 'react';
import { Variable } from '../../types';
import { FormattedVariableInput } from '../ui/Input';

interface ScenarioPremisesProps {
  scenarioVars: Variable[];
  isLocked: boolean;
}

export function ScenarioPremises({
  scenarioVars,
  isLocked
}: ScenarioPremisesProps) {
  if (scenarioVars.length === 0) return null;

  return (
    <div className="bg-white border border-slate-300 rounded-2xl p-4 space-y-3 shadow-sm">
      <h3 className="text-xs font-extrabold text-black uppercase tracking-wider">
        Premissas do Cenário
      </h3>
      <div className="space-y-2.5">
        {scenarioVars.map((v) => {
          const id = v['ID - REF'];
          return (
            <div key={id} className="flex flex-col space-y-1">
              <div className="flex justify-between items-center text-[11px] font-bold text-black uppercase tracking-wide">
                <label htmlFor={`input-val-${id}`} className="truncate cursor-pointer">
                  {v['PONTO DE CONTROLE'] || v['DESCRIÇÃO'] || id}
                </label>
                <span className="text-black font-mono lowercase ml-2 shrink-0">{v['UNIDADE DE MEDIDA']}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <FormattedVariableInput
                  id={`input-val-${id}`}
                  variable={v}
                  isLocked={isLocked}
                  className="px-2.5 py-1.5 text-xs font-mono font-bold text-black bg-white border border-slate-300 rounded-xl w-full focus:outline-none focus:border-teal-600 shadow-sm disabled:opacity-60"
                />
                {v.tipo_exibicao === 'PERCENTAGE' && (
                  <span className="text-xs font-bold text-black w-4 shrink-0 select-none text-left">%</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
