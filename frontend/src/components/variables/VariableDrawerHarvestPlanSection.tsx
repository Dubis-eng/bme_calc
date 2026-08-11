import React, { useState } from 'react';
import { Variable } from '../../types';
import { Section, FieldLabel, Toggle } from './VariableDrawerControls';

export type HarvestPlanOpType = 'SUM' | 'AVERAGE' | 'WEIGHTED_AVERAGE' | 'CALCULATE' | '';

interface HarvestPlanSectionProps {
  idRef: string;
  inHarvestPlan: boolean;
  setInHarvestPlan: (v: boolean) => void;
  harvestPlanOp: HarvestPlanOpType;
  setHarvestPlanOp: (v: HarvestPlanOpType) => void;
  harvestPlanWeightVarId: string;
  setHarvestPlanWeightVarId: (v: string) => void;
  agrupamento: string;
  setAgrupamento: (v: string) => void;
  variables: Variable[];
  uniqueAgrupamentos: string[];
}

export const VariableDrawerHarvestPlanSection: React.FC<HarvestPlanSectionProps> = ({
  idRef,
  inHarvestPlan,
  setInHarvestPlan,
  harvestPlanOp,
  setHarvestPlanOp,
  harvestPlanWeightVarId,
  setHarvestPlanWeightVarId,
  agrupamento,
  setAgrupamento,
  variables,
  uniqueAgrupamentos,
}) => {
  const [weightSearchFocus, setWeightSearchFocus] = useState(false);

  return (
    <Section title="">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">🌾</span>
          <div>
            <p className="text-sm font-semibold text-bme-text">Plano de Safra</p>
            <p className="text-xs text-bme-text-sec">
              Incluir esta variável no relatório acumulado do plano de safra da usina
            </p>
          </div>
        </div>
        <Toggle
          id="toggle-harvest-plan"
          checked={inHarvestPlan}
          onChange={setInHarvestPlan}
        />
      </div>

      {inHarvestPlan && (
        <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in-up">
          {/* Método de acúmulo */}
          <div className="flex flex-col">
            <FieldLabel
              htmlFor="harvest-op"
              tooltip="Define como o valor diário desta variável é acumulado no relatório de safra"
            >
              Método de Acúmulo
            </FieldLabel>
            <select
              id="harvest-op"
              value={harvestPlanOp}
              onChange={(e) => setHarvestPlanOp(e.target.value as HarvestPlanOpType)}
              className="input-field px-3 py-2 text-sm"
            >
              <option value="">Regra Padrão do Sistema</option>
              <option value="SUM">Soma (Total Acumulado)</option>
              <option value="AVERAGE">Média Simples</option>
              <option value="WEIGHTED_AVERAGE">Média Ponderada</option>
              <option value="CALCULATE">Recalcular pela Fórmula</option>
            </select>
          </div>

          {/* Variável de peso */}
          {harvestPlanOp === 'WEIGHTED_AVERAGE' ? (
            <div className="flex flex-col relative animate-fade-in-up">
              <FieldLabel
                htmlFor="harvest-weight"
                tooltip="ID da variável que servirá como peso na média ponderada. Ex: MOAGEM_HORA, TON_CANA_DIA"
              >
                Variável de Peso
              </FieldLabel>
              <input
                id="harvest-weight"
                type="text"
                value={harvestPlanWeightVarId}
                onFocus={() => setWeightSearchFocus(true)}
                onBlur={() => setTimeout(() => setWeightSearchFocus(false), 200)}
                onChange={(e) => setHarvestPlanWeightVarId(e.target.value)}
                placeholder="Ex: MOAGEM_HORA"
                className="input-field px-3 py-2 text-sm font-mono"
              />
              {weightSearchFocus && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-bme-border rounded-xl shadow-md max-h-40 overflow-y-auto z-50">
                  {variables
                    .filter(
                      (v) =>
                        v['ID - REF'] !== idRef &&
                        (v['ID - REF'].toLowerCase().includes(harvestPlanWeightVarId.toLowerCase()) ||
                          v['DESCRIÇÃO'].toLowerCase().includes(harvestPlanWeightVarId.toLowerCase()))
                    )
                    .slice(0, 8)
                    .map((v) => (
                      <button
                        key={v['ID - REF']}
                        type="button"
                        onClick={() => {
                          setHarvestPlanWeightVarId(v['ID - REF']);
                          setWeightSearchFocus(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-bme-muted text-sm border-b border-bme-border last:border-0 transition-colors"
                      >
                        <span className="font-mono font-semibold text-bme-teal mr-2">
                          {v['ID - REF']}
                        </span>
                        <span className="text-bme-text-sec">{v['DESCRIÇÃO']}</span>
                      </button>
                    ))}
                </div>
              )}
            </div>
          ) : (
            <div className="hidden md:block" />
          )}

          {/* Agrupamento */}
          <div className="flex flex-col">
            <FieldLabel
              htmlFor="harvest-group"
              tooltip="Grupo ou categoria no relatório de safra. Ex: Entradas de Cana, Produção de Açúcar"
            >
              Agrupamento no Relatório
            </FieldLabel>
            <input
              id="harvest-group"
              type="text"
              list="agrupamentos-list"
              value={agrupamento}
              onChange={(e) => setAgrupamento(e.target.value)}
              placeholder="Ex: Entradas de Cana"
              className="input-field px-3 py-2 text-sm"
            />
            <datalist id="agrupamentos-list">
              {uniqueAgrupamentos.map((g) => <option key={g} value={g} />)}
            </datalist>
          </div>
        </div>
      )}
    </Section>
  );
};
