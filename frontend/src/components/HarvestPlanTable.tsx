import React from 'react';

export interface ConsolidatedItem {
  variable_id: string;
  nome: string;
  descricao: string;
  setor_id: string;
  unidade: string;
  tipo: string;
  harvest_plan_op: 'SUM' | 'AVERAGE' | 'WEIGHTED_AVERAGE' | 'CALCULATE' | null;
  harvest_plan_weight_var_id: string | null;
  monthly_values: Record<string, number | null>;
  monthly_statuses: Record<string, string>;
  accumulated: {
    value: number | null;
    status: string;
    error_message: string;
  };
}

interface HarvestPlanTableProps {
  months: string[];
  filteredConsolidated: ConsolidatedItem[];
  selections: Array<{ month: string; scenario_id: string | null; exclude: boolean }>;
  availableScenarios: Record<string, Array<{ id: string; nome: string; version: number; status: string }>>;
  handleSelectScenario: (month: string, scenarioId: string | null, exclude: boolean) => void;
}

export const HarvestPlanTable: React.FC<HarvestPlanTableProps> = ({
  months,
  filteredConsolidated,
  selections,
  availableScenarios,
  handleSelectScenario,
}) => {
  const formatNumber = (num: number) => {
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  };

  const renderStatusBadge = (status: string) => {
    if (status === 'DIV_BY_ZERO') {
      return <span className="badge-error" title="Divisão por Zero">⚠️ Div/0</span>;
    }
    if (status === 'MISSING_VAR') {
      return <span className="badge-warn" title="Variável Faltando">⚠️ Var Faltando</span>;
    }
    if (status === 'PENDING') {
      return <span className="badge-idle">Pendente</span>;
    }
    return <span className="badge-idle">{status}</span>;
  };
  return (
    <div className="border border-slate-800/60 rounded-xl overflow-hidden">
      <div className="overflow-x-auto max-w-full">
        <table className="bme-table">
          <thead className="bg-slate-950 text-slate-200">
            <tr className="divide-x divide-slate-900/60 border-b border-slate-850">
              <th className="bme-table-header-cell min-w-[90px] sticky left-0 bg-slate-950 z-10">ID</th>
              <th className="bme-table-header-cell min-w-[150px] sticky left-[90px] bg-slate-950 z-10">Descrição</th>
              <th className="bme-table-header-cell min-w-[70px]">Setor</th>
              <th className="bme-table-header-cell min-w-[50px] text-center">Un.</th>
              <th className="bme-table-header-cell min-w-[70px] text-center">Regra</th>
              {months.map(m => {
                const currentSel = selections.find(s => s.month === m);
                const availScs = availableScenarios[m] || [];
                const value = currentSel?.exclude ? 'exclude' : (currentSel?.scenario_id || 'auto');

                return (
                  <th key={m} className="bme-table-header-cell min-w-[125px] text-right bg-slate-950 sticky top-0">
                    <div className="flex flex-col items-end">
                      <span className="text-[9px] text-slate-500 mb-0.5">{m}</span>
                      <select
                        value={value}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === 'exclude') {
                            handleSelectScenario(m, null, true);
                          } else if (val === 'auto') {
                            handleSelectScenario(m, null, false);
                          } else {
                            handleSelectScenario(m, val, false);
                          }
                        }}
                        className="bg-slate-900 text-slate-300 border border-slate-750 text-[8px] py-0.5 px-1 rounded cursor-pointer max-w-[115px] focus:outline-none focus:ring-1 focus:ring-teal-500 font-bold uppercase"
                      >
                        <option value="auto">⚙️ Padrão</option>
                        {availScs.map(sc => (
                          <option key={sc.id} value={sc.id}>v{sc.version} ({sc.status})</option>
                        ))}
                        <option value="exclude">❌ Ocultar</option>
                      </select>
                    </div>
                  </th>
                );
              })}
              <th className="bme-table-header-cell min-w-[120px] text-right bg-teal-950/40 text-teal-400">Acumulado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/30 bg-slate-950/20">
            {filteredConsolidated.map(item => {
              const opLabel = item.harvest_plan_op === 'SUM' ? 'Soma' :
                              item.harvest_plan_op === 'AVERAGE' ? 'Média' :
                              item.harvest_plan_op === 'WEIGHTED_AVERAGE' ? `M.Pond.` :
                              item.harvest_plan_op === 'CALCULATE' ? 'Cálculo' : 'Padrão';

              return (
                <tr key={item.variable_id} className="bme-table-row divide-x divide-slate-900/40 text-xs">
                  {/* Variable ID (Sticky) */}
                  <td className="bme-table-cell font-mono font-bold text-teal-400 bg-slate-950 sticky left-0 z-10 border-r border-slate-850 truncate max-w-[90px]" title={item.variable_id}>
                    {item.variable_id}
                  </td>
                  {/* Description (Sticky) */}
                  <td className="bme-table-cell font-medium text-slate-200 bg-slate-950 sticky left-[90px] z-10 border-r border-slate-850 truncate max-w-[150px]" title={item.descricao}>
                    {item.nome}
                  </td>
                  {/* Sector */}
                  <td className="bme-table-cell text-slate-500 font-semibold truncate max-w-[80px]" title={item.setor_id}>
                    {item.setor_id}
                  </td>
                  {/* Unit */}
                  <td className="bme-table-cell text-slate-400 font-semibold text-center">
                    {item.unidade}
                  </td>
                  {/* Op Rule */}
                  <td className="bme-table-cell text-center" title={item.harvest_plan_op === 'WEIGHTED_AVERAGE' ? `Média ponderada por ${item.harvest_plan_weight_var_id}` : opLabel}>
                    <span className="px-1.5 py-0.5 inline-flex leading-4 font-bold rounded-full bg-slate-900 text-slate-400 border border-slate-800/60 text-[9px]">
                      {opLabel}
                    </span>
                  </td>
                  {/* Months columns */}
                  {months.map(m => {
                    const val = item.monthly_values[m];
                    const status = item.monthly_statuses[m];
                    return (
                      <td key={m} className="bme-table-cell text-right font-mono font-semibold text-slate-400">
                        {status === 'OK' && val !== null ? (
                          formatNumber(val)
                        ) : (
                          renderStatusBadge(status)
                        )}
                      </td>
                    );
                  })}
                  {/* Accumulated column */}
                  <td className="bme-table-cell text-right font-mono font-bold bg-teal-500/10 text-teal-300 border-l border-slate-850">
                    {item.accumulated.status === 'OK' && item.accumulated.value !== null ? (
                      formatNumber(item.accumulated.value)
                    ) : (
                      <div className="flex justify-end">
                        {renderStatusBadge(item.accumulated.status)}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
