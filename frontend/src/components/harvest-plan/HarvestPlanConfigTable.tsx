import React from 'react';

export interface VariableConfig {
  id: string;
  nome: string;
  descricao: string;
  setor_id: string;
  unidade: string;
  tipo: string;
  in_harvest_plan: boolean;
  harvest_plan_op: 'SUM' | 'AVERAGE' | 'WEIGHTED_AVERAGE' | 'CALCULATE' | null;
  harvest_plan_weight_var_id: string | null;
}

interface HarvestPlanConfigTableProps {
  filteredConfigs: VariableConfig[];
  variablesConfig: VariableConfig[];
  focusedVarId: string | null;
  weightSearchQuery: string;
  setFocusedVarId: (val: string | null) => void;
  setWeightSearchQuery: (val: string) => void;
  handleConfigChange: (id: string, key: keyof VariableConfig, val: string | boolean | null) => void;
}

export const HarvestPlanConfigTable: React.FC<HarvestPlanConfigTableProps> = ({
  filteredConfigs,
  variablesConfig,
  focusedVarId,
  weightSearchQuery,
  setFocusedVarId,
  setWeightSearchQuery,
  handleConfigChange,
}) => {
  return (
    <div className="border border-slate-800/60 rounded-xl overflow-hidden">
      <table className="bme-table">
        <thead className="bg-slate-950 text-slate-200">
          <tr className="divide-x divide-slate-800">
            <th className="bme-table-header-cell w-16 text-center">No Plano</th>
            <th className="bme-table-header-cell w-28">ID</th>
            <th className="bme-table-header-cell">Descrição</th>
            <th className="bme-table-header-cell w-28">Setor</th>
            <th className="bme-table-header-cell w-36 text-center">Operação</th>
            <th className="bme-table-header-cell w-56">Variável Peso (M.Pond.)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/30 bg-slate-950/20">
          {filteredConfigs.map(item => {
            const isChecked = item.in_harvest_plan;
            const isWeighted = item.harvest_plan_op === 'WEIGHTED_AVERAGE';

            return (
              <tr key={item.id} className={`bme-table-row divide-x divide-slate-900/40 text-xs ${isChecked ? 'bg-teal-500/10' : ''}`}>
                {/* Checkbox */}
                <td className="bme-table-cell text-center">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => handleConfigChange(item.id, 'in_harvest_plan', e.target.checked)}
                    className="h-3.5 w-3.5 rounded text-teal-600 focus:ring-teal-500 border-slate-700 bg-slate-900 cursor-pointer"
                  />
                </td>
                {/* ID */}
                <td className="bme-table-cell font-mono font-bold text-slate-300">
                  {item.id}
                </td>
                {/* Description */}
                <td className="bme-table-cell text-slate-400">
                  {item.nome}
                </td>
                {/* Sector */}
                <td className="bme-table-cell text-slate-500 font-semibold">
                  {item.setor_id}
                </td>
                {/* Op Selector */}
                <td className="bme-table-cell text-center">
                  <select
                    value={item.harvest_plan_op || ''}
                    onChange={(e) => handleConfigChange(item.id, 'harvest_plan_op', e.target.value || null)}
                    className="input-field px-2 py-0.5 text-xs w-32 focus:outline-none"
                  >
                    <option value="">Regra Padrão</option>
                    <option value="SUM">Soma</option>
                    <option value="AVERAGE">Média</option>
                    <option value="WEIGHTED_AVERAGE">Média Ponderada</option>
                    <option value="CALCULATE">Cálculo</option>
                  </select>
                </td>
                {/* Weight Selector */}
                <td className="bme-table-cell relative">
                  {isWeighted ? (
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Pesquise o ID de Peso..."
                        value={focusedVarId === item.id ? weightSearchQuery : (item.harvest_plan_weight_var_id || '')}
                        onFocus={() => {
                          setFocusedVarId(item.id);
                          setWeightSearchQuery(item.harvest_plan_weight_var_id || '');
                        }}
                        onChange={(e) => setWeightSearchQuery(e.target.value)}
                        className="input-field px-2 py-0.5 text-xs w-full focus:outline-none"
                      />
                      {/* Autocomplete Dropdown list */}
                      {focusedVarId === item.id && (
                        <div className="absolute left-0 right-0 mt-1 bg-slate-900 border border-slate-800/60 rounded shadow-lg max-h-32 overflow-y-auto z-20">
                          {variablesConfig
                            .filter(v => {
                              const varId = v.id || '';
                              const nome = v.nome || '';
                              return v.id !== item.id && (
                                varId.toLowerCase().includes(weightSearchQuery.toLowerCase()) ||
                                nome.toLowerCase().includes(weightSearchQuery.toLowerCase())
                              );
                            })
                            .slice(0, 10)
                            .map(v => (
                              <button
                                key={v.id}
                                type="button"
                                onClick={() => {
                                  handleConfigChange(item.id, 'harvest_plan_weight_var_id', v.id);
                                  setFocusedVarId(null);
                                }}
                                className="w-full text-left py-1 px-2 hover:bg-slate-800/60 font-mono text-[10px] text-slate-300 border-b border-slate-800/40 last:border-0"
                              >
                                <span className="font-bold text-teal-400 mr-2">{v.id}</span>
                                <span className="text-slate-500 font-sans">— {v.nome}</span>
                              </button>
                            ))}
                          {weightSearchQuery && (
                            <button
                              type="button"
                              onClick={() => setFocusedVarId(null)}
                              className="w-full text-center py-1 text-[9px] bg-slate-950 text-slate-550 hover:text-slate-300 block border-t border-slate-800/40 font-bold"
                            >
                              Fechar Lista ✕
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-slate-500 text-[10px] italic font-medium">— Não aplicável</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
