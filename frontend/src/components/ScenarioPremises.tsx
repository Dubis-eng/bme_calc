import React from 'react';
import { Variable } from '../types';

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
          const id  = v['ID - REF'];
          const val = v['EQUAÇÕES E VALORES'];
          return (
            <div key={id} className="flex flex-col space-y-1">
              <div className="flex justify-between items-center text-[10px] font-semibold text-slate-600 uppercase tracking-wide">
                <span className="truncate">{v['PONTO DE CONTROLE'] || v['DESCRIÇÃO'] || id}</span>
                <span className="text-slate-700 font-mono lowercase ml-2 shrink-0">{v['UNIDADE DE MEDIDA']}</span>
              </div>
              <input
                type="text"
                disabled={isLocked}
                value={val}
                onChange={e => onVariableChange(id, e.target.value)}
                className="input-field px-2.5 py-1.5 text-xs font-mono font-semibold
                  disabled:bg-slate-900 disabled:text-slate-600 disabled:border-slate-800"
                aria-label={`Valor para ${id}`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
