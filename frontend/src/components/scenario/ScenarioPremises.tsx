import React from 'react';
import { Variable } from '../../types';
import { FormattedVariableInput } from '../ui/Input';

interface ScenarioPremisesProps {
  scenarioVars: Variable[];
  isLocked: boolean;
  onVariableChange: (id: string, value: string) => void;
}

export function ScenarioPremises({
  scenarioVars,
  isLocked,
  onVariableChange
}: ScenarioPremisesProps) {
  if (scenarioVars.length === 0) return null;

  return (
    <div className="glass-card p-4 space-y-3">
      <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
        Premissas do Cenário
      </h3>
      <div className="space-y-2.5">
        {scenarioVars.map((v) => {
          const id = v['ID - REF'];
          return (
            <div key={id} className="flex flex-col space-y-1">
              <div className="flex justify-between items-center text-[10px] font-semibold text-slate-600 uppercase tracking-wide">
                <label htmlFor={`input-val-${id}`} className="truncate cursor-pointer">
                  {v['PONTO DE CONTROLE'] || v['DESCRIÇÃO'] || id}
                </label>
                <span className="text-slate-700 font-mono lowercase ml-2 shrink-0">{v['UNIDADE DE MEDIDA']}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <FormattedVariableInput
                  id={`input-val-${id}`}
                  variable={v}
                  isLocked={isLocked}
                  onVariableChange={onVariableChange}
                  className="input-field px-2.5 py-1.5 text-xs font-mono font-semibold w-full
                    disabled:bg-slate-900 disabled:text-slate-600 disabled:border-slate-800"
                />
                {v.tipo_exibicao === 'PERCENTAGE' && (
                  <span className="text-[10px] font-bold text-slate-500 w-4 shrink-0 select-none text-left">%</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

