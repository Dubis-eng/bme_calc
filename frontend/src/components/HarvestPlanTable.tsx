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
  casas_decimais?: number | null;
  tipo_exibicao?: 'NUMBER' | 'PERCENTAGE';
  percent_base?: 'DECIMAL' | 'INTEGER';
  tipo_item?: 'variable' | 'divider';
  label?: string | null;
}

interface HarvestPlanTableProps {
  months: string[];
  filteredConsolidated: ConsolidatedItem[];
  selections: Array<{ month: string; scenario_id: string | null; exclude: boolean }>;
  availableScenarios: Record<string, Array<{ id: string; nome: string; version: number; status: string }>>;
  handleSelectScenario: (month: string, scenarioId: string | null, exclude: boolean) => void;
  isEditing: boolean;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onDeleteDivider: (dividerId: string) => void;
  onRenameDivider: (dividerId: string, newLabel: string) => void;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDrop: (e: React.DragEvent, index: number) => void;
}

export const HarvestPlanTable: React.FC<HarvestPlanTableProps> = ({
  months,
  filteredConsolidated,
  selections,
  availableScenarios,
  handleSelectScenario,
  isEditing,
  onMoveUp,
  onMoveDown,
  onDeleteDivider,
  onRenameDivider,
  onDragStart,
  onDragOver,
  onDrop,
}) => {
  const formatConsolidatedValue = (val: number | null | undefined, item: ConsolidatedItem) => {
    if (val === null || val === undefined || isNaN(Number(val))) return '—';
    const isPercent = item.tipo_exibicao === 'PERCENTAGE';
    const base = item.percent_base || 'DECIMAL';
    const decimals = item.casas_decimais !== undefined && item.casas_decimais !== null 
      ? item.casas_decimais 
      : (isPercent ? 2 : 4);
    
    let displayVal = Number(val);
    if (isPercent && base === 'DECIMAL') {
      displayVal = displayVal * 100;
    }
    
    const numStr = displayVal.toLocaleString('pt-BR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
    
    return isPercent ? `${numStr}%` : numStr;
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
              <th className="bme-table-header-cell min-w-[130px] sticky left-0 bg-slate-950 z-10">ID</th>
              <th className="bme-table-header-cell min-w-[150px] sticky left-[130px] bg-slate-950 z-10">Descrição</th>
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
                        disabled={isEditing}
                        aria-label={`Selecionar cenário para ${m}`}
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
                        className="bg-slate-900 text-slate-300 border border-slate-750 text-[8px] py-0.5 px-1 rounded cursor-pointer max-w-[115px] focus:outline-none focus:ring-1 focus:ring-teal-500 font-bold uppercase disabled:opacity-50"
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
            {filteredConsolidated.map((item, idx) => {
              if (item.tipo_item === 'divider') {
                return (
                  <tr
                    key={item.variable_id}
                    onDragOver={(e) => onDragOver(e, idx)}
                    onDrop={(e) => onDrop(e, idx)}
                    className="bg-slate-900/80 border-y border-slate-800 text-xs font-bold text-teal-400 select-none"
                  >
                    <td colSpan={months.length + 6} className="px-4 py-2 bg-slate-900/90 text-left tracking-wider uppercase">
                      {isEditing ? (
                        <div className="flex items-center space-x-2.5 w-full">
                          <span
                            className="cursor-grab active:cursor-grabbing text-slate-500 hover:text-slate-300 select-none font-normal text-sm"
                            draggable
                            onDragStart={(e) => onDragStart(e, idx)}
                            title="Arrastar"
                          >
                            ⋮⋮
                          </span>
                          <button type="button" onClick={() => onMoveUp(idx)} className="text-slate-500 hover:text-teal-400 p-0.5" title="Subir">▲</button>
                          <button type="button" onClick={() => onMoveDown(idx)} className="text-slate-500 hover:text-teal-400 p-0.5" title="Descer">▼</button>
                          <input
                            type="text"
                            aria-label="Título do divisor"
                            value={item.label || ''}
                            onChange={(e) => onRenameDivider(item.variable_id, e.target.value)}
                            className="bg-slate-950 text-teal-400 border border-slate-800 rounded px-2 py-0.5 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-teal-500 w-64 uppercase"
                          />
                          <button
                            type="button"
                            onClick={() => onDeleteDivider(item.variable_id)}
                            className="text-red-500 hover:text-red-400 font-bold px-2 py-0.5 bg-red-950/30 border border-red-800/40 rounded text-[10px]"
                            title="Excluir agrupador"
                          >
                            🗑️ Excluir
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <span className="w-1.5 h-3 bg-teal-500 rounded mr-2 inline-block"></span>
                          <span>{item.label}</span>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              }

              const opLabel = item.harvest_plan_op === 'SUM' ? 'Soma' :
                              item.harvest_plan_op === 'AVERAGE' ? 'Média' :
                              item.harvest_plan_op === 'WEIGHTED_AVERAGE' ? `M.Pond.` :
                              item.harvest_plan_op === 'CALCULATE' ? 'Cálculo' : 'Padrão';

              return (
                <tr
                  key={item.variable_id}
                  onDragOver={(e) => onDragOver(e, idx)}
                  onDrop={(e) => onDrop(e, idx)}
                  className="bme-table-row divide-x divide-slate-900/40 text-xs"
                >
                  {/* Variable ID (Sticky) */}
                  <td className="bme-table-cell font-mono font-bold text-teal-400 bg-slate-950 sticky left-0 z-10 border-r border-slate-850 truncate max-w-[130px]" title={item.variable_id}>
                    <div className="flex items-center space-x-1.5">
                      {isEditing && (
                        <>
                          <span
                            className="cursor-grab active:cursor-grabbing text-slate-500 hover:text-slate-350 select-none text-[10px]"
                            draggable
                            onDragStart={(e) => onDragStart(e, idx)}
                            title="Arrastar"
                          >
                            ⋮⋮
                          </span>
                          <button type="button" onClick={() => onMoveUp(idx)} className="text-slate-500 hover:text-teal-400 text-[8px] p-0.5" title="Subir">▲</button>
                          <button type="button" onClick={() => onMoveDown(idx)} className="text-slate-500 hover:text-teal-400 text-[8px] p-0.5" title="Descer">▼</button>
                        </>
                      )}
                      <span>{item.variable_id}</span>
                    </div>
                  </td>
                  {/* Description (Sticky) */}
                  <td className="bme-table-cell font-medium text-slate-200 bg-slate-950 sticky left-[130px] z-10 border-r border-slate-850 truncate max-w-[150px]" title={item.descricao}>
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
                          formatConsolidatedValue(val, item)
                        ) : (
                          renderStatusBadge(status)
                        )}
                      </td>
                    );
                  })}
                  {/* Accumulated column */}
                  <td className="bme-table-cell text-right font-mono font-bold bg-teal-500/10 text-teal-300 border-l border-slate-850">
                    {item.accumulated.status === 'OK' && item.accumulated.value !== null ? (
                      formatConsolidatedValue(item.accumulated.value, item)
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
