import React, { useState } from 'react';
import { Variable } from '../types';

interface SectorModulesProps {
  activeSector: string;
  variables: Variable[];
  results: Record<string, any>;
  isLocked: boolean;
  highlightedVarId: string | null;
  onEditVariable: (variable: Variable) => void;
  onAddVariable: (sector: string, definition: string) => void;
  onVariableChange: (id: string, value: string) => void;
}

export const SectorModules: React.FC<SectorModulesProps> = ({
  activeSector,
  variables,
  results,
  isLocked,
  highlightedVarId,
  onEditVariable,
  onAddVariable,
  onVariableChange
}) => {
  // Filter variables of the active sector
  const sectorVariables = variables.filter(v => v.SETOR === activeSector);

  // Group by ETAPA and then by PONTO DE CONTROLE
  const stages: Record<string, Record<string, Variable[]>> = {};
  sectorVariables.forEach(v => {
    const stage = v.ETAPA || 'GERAL';
    const pc = v["PONTO DE CONTROLE"] || 'GERAL';
    
    if (!stages[stage]) {
      stages[stage] = {};
    }
    if (!stages[stage][pc]) {
      stages[stage][pc] = [];
    }
    stages[stage][pc].push(v);
  });

  // Track expanded/collapsed state of each stage group panel
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (groupName: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  const stageNames = Object.keys(stages);

  if (stageNames.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white border border-slate-200 rounded-xl text-slate-400">
        <span className="text-xl mb-2">📋</span>
        <p className="text-xs font-semibold">Nenhuma variável cadastrada para este setor.</p>
        <button
          onClick={() => onAddVariable(activeSector, 'GERAL')}
          className="mt-4 bg-teal-600 hover:bg-teal-700 text-white font-bold py-1.5 px-4 rounded text-xs transition-colors"
        >
          ➕ Cadastrar Primeira Variável
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 overflow-y-auto pr-1">
      {stageNames.map(stageName => {
        const isCollapsed = !!collapsedGroups[stageName];
        const pcsInStage = stages[stageName];
        const totalVars = Object.values(pcsInStage).reduce((acc, curr) => acc + curr.length, 0);

        return (
          <div 
            key={stageName} 
            className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden transition-all animate-fade-in"
          >
            {/* Header section with toggle and add variable action */}
            <div className="bg-slate-50 px-5 py-3 flex justify-between items-center border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => toggleGroup(stageName)}
                  className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-200/50 transition-colors focus:outline-none"
                  aria-label={isCollapsed ? `Expandir etapa ${stageName}` : `Recolher etapa ${stageName}`}
                >
                  <span className="text-[10px] inline-block transform transition-transform duration-200">
                    {isCollapsed ? '▶' : '▼'}
                  </span>
                </button>
                <h3 className="text-xs font-bold text-slate-700 tracking-wider uppercase">
                  {stageName}
                </h3>
                <span className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded-full text-slate-500 font-semibold">
                  {totalVars}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onAddVariable(activeSector, stageName)}
                  disabled={isLocked}
                  className="bg-white hover:bg-slate-50 text-teal-600 hover:text-teal-700 disabled:text-slate-300 disabled:bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-[10px] font-bold transition-all flex items-center space-x-1"
                >
                  <span>➕ Nova Variável</span>
                </button>
              </div>
            </div>

            {/* Table wrapper grouped by Control Point */}
            {!isCollapsed && (
              <div className="divide-y divide-slate-100">
                {Object.keys(pcsInStage).map(pcName => {
                  const varsInGroup = pcsInStage[pcName];

                  return (
                    <div 
                      key={pcName}
                      data-group-name={pcName}
                      className="p-5 flex flex-col space-y-3"
                    >
                      <div className="flex items-center justify-between pb-1 border-b border-slate-100 bg-slate-50/20 px-3 py-1.5 rounded-lg">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center">
                          <span className="text-teal-500 mr-1.5">📍</span> {pcName}
                        </span>
                        <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full text-slate-400 font-bold">
                          {varsInGroup.length} {varsInGroup.length === 1 ? 'variável' : 'variáveis'}
                        </span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-100">
                          <thead className="bg-slate-50/40">
                            <tr>
                              <th className="py-2 px-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider w-28">ID</th>
                              <th className="py-2 px-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Descrição</th>
                              <th className="py-2 px-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider w-20">Tipo</th>
                              <th className="py-2 px-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider w-20">Unidade</th>
                              <th className="py-2 px-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fórmula</th>
                              <th className="py-2 px-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider w-36">Valor</th>
                              <th className="py-2 px-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider w-16">Ações</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {varsInGroup.map(v => {
                              const id = v['ID - REF'];
                              const res = results[id];
                              const isInput = v.TIPO === 'INPUT' || v.TIPO === 'CENARIO';
                              const isHighlighted = highlightedVarId === id;

                              return (
                                <tr
                                  key={id}
                                  data-var-id={id}
                                  className={`hover:bg-slate-50/40 transition-colors ${
                                    isHighlighted ? 'var-row-highlight' : ''
                                  }`}
                                >
                                  {/* ID */}
                                  <td className="py-2 px-4 text-xs font-semibold text-slate-600 truncate max-w-[120px]" title={id}>
                                    {id}
                                  </td>

                                  {/* Description */}
                                  <td className="py-2 px-4 text-xs text-slate-700 font-medium truncate max-w-[200px]" title={v['DESCRIÇÃO']}>
                                    {v['DESCRIÇÃO']}
                                  </td>

                                  {/* Badge Type */}
                                  <td className="py-2 px-4 text-[10px]">
                                    <span 
                                      className={`px-1.5 py-0.5 inline-flex leading-4 font-semibold rounded-full border ${
                                        v.TIPO === 'INPUT' 
                                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                          : v.TIPO === 'CENARIO'
                                            ? 'bg-blue-50 text-blue-700 border-blue-100'
                                            : v.TIPO === 'DERIVADA'
                                              ? 'bg-cyan-50 text-cyan-700 border-cyan-100'
                                              : 'bg-slate-50 text-slate-600 border-slate-200'
                                      }`}
                                    >
                                      {v.TIPO}
                                    </span>
                                  </td>

                                  {/* Unit */}
                                  <td className="py-2 px-4 text-xs text-slate-400 font-semibold">
                                    {v['UNIDADE DE MEDIDA']}
                                  </td>

                                  {/* Formula */}
                                  <td className="py-2 px-4 text-xs text-slate-400 font-mono max-w-[150px] truncate" title={String(v['EQUAÇÕES E VALORES'])}>
                                    {isInput ? '-' : v['EQUAÇÕES E VALORES']}
                                  </td>

                                  {/* Calculated / Input Value */}
                                  <td className="py-2 px-4 text-xs font-mono font-bold text-slate-900">
                                    {isInput ? (
                                      <label className="flex items-center">
                                        <span className="sr-only">Valor para {id}</span>
                                        <input
                                          type="text"
                                          aria-label={`Valor para ${id}`}
                                          disabled={isLocked}
                                          value={String(v['EQUAÇÕES E VALORES'])}
                                          onChange={(e) => onVariableChange(id, e.target.value)}
                                          className="border border-slate-200 rounded px-2 py-0.5 w-28 text-xs font-semibold focus:ring-1 focus:ring-teal-500 focus:outline-none bg-slate-50/20 disabled:bg-slate-100 disabled:text-slate-400"
                                        />
                                      </label>
                                    ) : (
                                      res !== undefined ? (
                                        res.status === "OK" && res.value !== null ? (
                                          res.value.toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 })
                                        ) : (
                                          <span 
                                            className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${
                                              res.status === "DIV_BY_ZERO" 
                                                ? "bg-red-50 text-red-700 border-red-150" 
                                                : res.status === "MISSING_VAR"
                                                  ? "bg-amber-50 text-amber-700 border-amber-150"
                                                  : "bg-slate-100 text-slate-700 border-slate-200"
                                            }`} 
                                            title={res.error_message || res.status}
                                            aria-label={`Erro de cálculo: ${res.status}. ${res.error_message}`}
                                          >
                                            ⚠️ {res.status}
                                          </span>
                                        )
                                      ) : '-'
                                    )}
                                  </td>

                                  {/* Row actions */}
                                  <td className="py-2 px-4 text-center">
                                    <button
                                      type="button"
                                      onClick={() => onEditVariable(v)}
                                      className="text-teal-600 hover:text-teal-700 hover:bg-teal-50 p-1.5 rounded transition-all focus:outline-none"
                                      aria-label={`Editar variável ${id}`}
                                    >
                                      ✏️
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
