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
      return <span className="badge-error font-bold" title="Divisão por Zero">⚠️ Div/0</span>;
    }
    if (status === 'MISSING_VAR') {
      return <span className="badge-warn font-bold" title="Variável Faltando">⚠️ Var Faltando</span>;
    }
    if (status === 'PENDING') {
      return <span className="badge-idle font-bold text-slate-700">Pendente</span>;
    }
    return <span className="badge-idle font-bold text-slate-700">{status}</span>;
  };

  return (
    <div className="border border-slate-300 rounded-2xl overflow-hidden bg-white shadow-xl">
      <div className="overflow-x-auto max-w-full">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-100 text-black border-b border-slate-300">
            <tr className="divide-x divide-slate-200">
              <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider min-w-[130px] sticky left-0 bg-slate-100 z-10 text-black">ID</th>
              <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider min-w-[150px] sticky left-[130px] bg-slate-100 z-10 text-black">Descrição</th>
              <th className="px-3 py-3 text-xs font-bold uppercase tracking-wider min-w-[70px] text-black">Setor</th>
              <th className="px-3 py-3 text-xs font-bold uppercase tracking-wider min-w-[50px] text-center text-black">Un.</th>
              <th className="px-3 py-3 text-xs font-bold uppercase tracking-wider min-w-[70px] text-center text-black">Regra</th>
              {months.map(m => {
                const currentSel = selections.find(s => s.month === m);
                const availScs = availableScenarios[m] || [];
                const value = currentSel?.exclude ? 'exclude' : (currentSel?.scenario_id || 'auto');

                return (
                  <th key={m} className="px-3 py-2 min-w-[125px] text-right bg-slate-100 sticky top-0 border-l border-slate-200">
                    <div className="flex flex-col items-end">
                      <span className="text-[11px] font-bold text-black uppercase mb-1">{m}</span>
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
                        className="bg-white text-black border border-slate-300 text-[10px] py-1 px-1.5 rounded-lg cursor-pointer max-w-[115px] focus:outline-none focus:border-teal-600 font-bold uppercase shadow-sm disabled:opacity-50"
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
              <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider min-w-[120px] text-right bg-teal-100/60 text-teal-950 border-l border-teal-200">Acumulado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {filteredConsolidated.map((item, idx) => {
              if (item.tipo_item === 'divider') {
                return (
                  <tr
                    key={item.variable_id}
                    onDragOver={(e) => onDragOver(e, idx)}
                    onDrop={(e) => onDrop(e, idx)}
                    className="bg-teal-50/90 border-y border-teal-200 text-xs font-bold text-teal-950 select-none"
                  >
                    <td colSpan={months.length + 6} className="px-4 py-2.5 text-left tracking-wider uppercase">
                      {isEditing ? (
                        <div className="flex items-center space-x-2.5 w-full">
                          <span
                            className="cursor-grab active:cursor-grabbing text-teal-700 hover:text-teal-900 select-none font-bold text-sm"
                            draggable
                            onDragStart={(e) => onDragStart(e, idx)}
                            title="Arrastar"
                          >
                            ⋮⋮
                          </span>
                          <button type="button" onClick={() => onMoveUp(idx)} className="text-teal-700 hover:text-teal-950 p-0.5 font-bold" title="Subir">▲</button>
                          <button type="button" onClick={() => onMoveDown(idx)} className="text-teal-700 hover:text-teal-950 p-0.5 font-bold" title="Descer">▼</button>
                          <input
                            type="text"
                            aria-label="Título do divisor"
                            value={item.label || ''}
                            onChange={(e) => onRenameDivider(item.variable_id, e.target.value)}
                            className="bg-white text-teal-950 border border-teal-300 rounded-lg px-2.5 py-1 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-teal-500 w-64 uppercase shadow-sm"
                          />
                          <button
                            type="button"
                            onClick={() => onDeleteDivider(item.variable_id)}
                            className="text-red-700 hover:text-red-800 font-bold px-2.5 py-1 bg-red-100 border border-red-300 rounded-lg text-xs"
                            title="Excluir agrupador"
                          >
                            🗑️ Excluir
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <span className="w-2 h-4 bg-teal-600 rounded-sm inline-block"></span>
                          <span className="font-bold text-teal-950 text-xs">{item.label}</span>
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
                  className="hover:bg-slate-50 transition-colors divide-x divide-slate-200 text-xs"
                >
                  {/* Variable ID (Sticky) */}
                  <td className="px-4 py-2.5 font-mono font-bold text-black bg-white sticky left-0 z-10 border-r border-slate-200 truncate max-w-[130px]" title={item.variable_id}>
                    <div className="flex items-center space-x-1.5">
                      {isEditing && (
                        <>
                          <span
                            className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-black select-none text-xs font-bold"
                            draggable
                            onDragStart={(e) => onDragStart(e, idx)}
                            title="Arrastar"
                          >
                            ⋮⋮
                          </span>
                          <button type="button" onClick={() => onMoveUp(idx)} className="text-slate-500 hover:text-black text-[9px] p-0.5 font-bold" title="Subir">▲</button>
                          <button type="button" onClick={() => onMoveDown(idx)} className="text-slate-500 hover:text-black text-[9px] p-0.5 font-bold" title="Descer">▼</button>
                        </>
                      )}
                      <span>{item.variable_id}</span>
                    </div>
                  </td>
                  {/* Description (Sticky) */}
                  <td className="px-4 py-2.5 font-semibold text-black bg-white sticky left-[130px] z-10 border-r border-slate-200 truncate max-w-[150px]" title={item.descricao}>
                    {item.nome}
                  </td>
                  {/* Sector */}
                  <td className="px-3 py-2.5 text-black font-semibold truncate max-w-[80px]" title={item.setor_id}>
                    {item.setor_id}
                  </td>
                  {/* Unit */}
                  <td className="px-3 py-2.5 text-black font-mono font-semibold text-center">
                    {item.unidade}
                  </td>
                  {/* Op Rule */}
                  <td className="px-3 py-2.5 text-center" title={item.harvest_plan_op === 'WEIGHTED_AVERAGE' ? `Média ponderada por ${item.harvest_plan_weight_var_id}` : opLabel}>
                    <span className="px-2 py-0.5 inline-flex leading-4 font-bold rounded-full bg-slate-100 text-slate-800 border border-slate-300 text-[10px]">
                      {opLabel}
                    </span>
                  </td>
                  {/* Months columns */}
                  {months.map(m => {
                    const val = item.monthly_values[m];
                    const status = item.monthly_statuses[m];
                    return (
                      <td key={m} className="px-3 py-2.5 text-right font-mono font-bold text-black">
                        {status === 'OK' && val !== null ? (
                          formatConsolidatedValue(val, item)
                        ) : (
                          renderStatusBadge(status)
                        )}
                      </td>
                    );
                  })}
                  {/* Accumulated column */}
                  <td className="px-4 py-2.5 text-right font-mono font-bold bg-teal-50/70 text-teal-950 border-l border-teal-200">
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
