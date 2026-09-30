import React, { useState } from 'react';
import { Variable } from '../../types';

export type HarvestPlanOpType = 'SUM' | 'AVERAGE' | 'WEIGHTED_AVERAGE' | 'CALCULATE' | '';

interface VariableModalHarvestPlanSectionProps {
  inHarvestPlan: boolean;
  setInHarvestPlan: (val: boolean) => void;
  harvestPlanOp: HarvestPlanOpType;
  setHarvestPlanOp: (val: HarvestPlanOpType) => void;
  harvestPlanWeightVarId: string;
  setHarvestPlanWeightVarId: (val: string) => void;
  agrupamento: string;
  setAgrupamento: (val: string) => void;
  idRef: string;
  variables: Variable[];
  uniqueAgrupamentos: string[];
}

export const VariableModalHarvestPlanSection: React.FC<VariableModalHarvestPlanSectionProps> = ({
  inHarvestPlan,
  setInHarvestPlan,
  harvestPlanOp,
  setHarvestPlanOp,
  harvestPlanWeightVarId,
  setHarvestPlanWeightVarId,
  agrupamento,
  setAgrupamento,
  idRef,
  variables,
  uniqueAgrupamentos
}) => {
  const [weightSearchFocus, setWeightSearchFocus] = useState(false);

  return (
    <div className="mt-4 pt-4 border-t border-slate-800/80">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-base">🌾</span>
          <h3 className="font-bold text-slate-200 text-xs uppercase tracking-wider">
            Configurações do Plano de Safra
          </h3>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={inHarvestPlan}
            onChange={(e) => setInHarvestPlan(e.target.checked)}
            className="h-4 w-4 rounded text-teal-600 focus:ring-teal-500 border-slate-700 bg-slate-900 cursor-pointer"
          />
          <span className="text-xs font-semibold text-teal-400">
            Incluir no Plano de Safra
          </span>
        </label>
      </div>

      {inHarvestPlan && (
        <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Método de Agregação / Acumulado */}
            <div className="flex flex-col">
              <label htmlFor="harvest-op" className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                Método de Acúmulo / Operação
              </label>
              <select
                id="harvest-op"
                value={harvestPlanOp}
                onChange={(e) => setHarvestPlanOp(e.target.value as HarvestPlanOpType)}
                className="input-field p-2 text-xs font-semibold bg-slate-950 border-slate-800"
              >
                <option value="">Regra Padrão</option>
                <option value="SUM">Soma (Acumulado Sumarizado)</option>
                <option value="AVERAGE">Média Simples</option>
                <option value="WEIGHTED_AVERAGE">Média Ponderada</option>
                <option value="CALCULATE">Cálculo pela Fórmula</option>
              </select>
            </div>

            {/* Variável de Peso (apenas para Média Ponderada) */}
            <div className="flex flex-col relative">
              <label htmlFor="harvest-weight" className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                Variável de Peso (M. Ponderada)
              </label>
              <input
                id="harvest-weight"
                type="text"
                disabled={harvestPlanOp !== 'WEIGHTED_AVERAGE'}
                value={harvestPlanWeightVarId}
                onFocus={() => setWeightSearchFocus(true)}
                onBlur={() => setTimeout(() => setWeightSearchFocus(false), 200)}
                onChange={(e) => setHarvestPlanWeightVarId(e.target.value)}
                placeholder={harvestPlanOp === 'WEIGHTED_AVERAGE' ? 'Ex: TON_CANA' : 'Não aplicável'}
                className="input-field p-2 text-xs font-semibold bg-slate-950 border-slate-800 disabled:opacity-50 disabled:bg-slate-900"
              />
              {weightSearchFocus && harvestPlanOp === 'WEIGHTED_AVERAGE' && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-xl max-h-40 overflow-y-auto z-50">
                  {variables
                    .filter((v) => v['ID - REF'] !== idRef && (
                      v['ID - REF'].toLowerCase().includes(harvestPlanWeightVarId.toLowerCase()) ||
                      v['DESCRIÇÃO'].toLowerCase().includes(harvestPlanWeightVarId.toLowerCase())
                    ))
                    .slice(0, 8)
                    .map((v) => (
                      <button
                        key={v['ID - REF']}
                        type="button"
                        onClick={() => {
                          setHarvestPlanWeightVarId(v['ID - REF']);
                          setWeightSearchFocus(false);
                        }}
                        className="w-full text-left p-2 hover:bg-slate-800/80 text-[11px] font-mono border-b border-slate-800/60 last:border-0"
                      >
                        <span className="font-bold text-teal-400 mr-2">{v['ID - REF']}</span>
                        <span className="text-slate-400 font-sans">{v['DESCRIÇÃO']}</span>
                      </button>
                    ))}
                </div>
              )}
            </div>

            {/* Agrupamento / Divisor no Plano de Safra */}
            <div className="flex flex-col">
              <label htmlFor="harvest-group" className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                Agrupamento / Divisor
              </label>
              <input
                id="harvest-group"
                type="text"
                list="agrupamentos-list"
                value={agrupamento}
                onChange={(e) => setAgrupamento(e.target.value)}
                placeholder="Ex: Entradas de Cana"
                className="input-field p-2 text-xs font-semibold bg-slate-950 border-slate-800"
              />
              <datalist id="agrupamentos-list">
                {uniqueAgrupamentos.map((g) => <option key={g} value={g} />)}
              </datalist>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
