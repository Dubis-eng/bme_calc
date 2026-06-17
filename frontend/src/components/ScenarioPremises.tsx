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
    <div className="flex flex-col space-y-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Premissas do Cenário</h3>
      <div className="space-y-2.5">
        {scenarioVars.map((v) => {
          const id = v['ID - REF'];
          const val = v['EQUAÇÕES E VALORES'];
          return (
            <div key={id} className="flex flex-col space-y-1">
              <div className="flex justify-between items-center text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                <span>{v['DEFINIÇÃO'] || v['DESCRIÇÃO'] || id} ({id})</span>
                <span className="text-slate-400 font-mono lowercase">{v['UNIDADE DE MEDIDA']}</span>
              </div>
              <input
                type="text"
                disabled={isLocked}
                value={val}
                onChange={(e) => onVariableChange(id, e.target.value)}
                className="border border-slate-200 rounded p-1.5 text-xs font-semibold text-slate-700 focus:ring-1 focus:ring-teal-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400"
                aria-label={`Valor para ${id}`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
