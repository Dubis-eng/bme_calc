import React, { useState } from 'react';
import { Variable, FilterStatus } from '../types';
import { BmeIcon, TYPE_BADGE, ERROR_BADGE } from '../theme/design-system';
import { SectorFilterBar } from './SectorFilterBar';
import { SectorFormulaPopover } from './SectorFormulaPopover';
import { SectorAuditCard } from './SectorAuditCard';

interface SectorModulesProps {
  activeSector: string;
  variables: Variable[];
  results: Record<string, any>;
  isLocked: boolean;
  highlightedVarId: string | null;
  onEditVariable: (variable: Variable) => void;
  onAddVariable: (sector: string, definition: string) => void;
  onVariableChange: (id: string, value: string) => void;
  onNavigateToVariable?: (id: string) => void;
  activeStatusFilter: FilterStatus;
  setActiveStatusFilter: (filter: FilterStatus) => void;
}

const FUNCTIONS = new Set([
  'SE', 'SEERRO', 'SOMA', 'PROCV', 'LN', 'SUBTOTAL', 'SOMASES',
  'VAPOR_H', 'VAPOR_S', 'VAPOR_H_SAT', 'VAPOR_H_LIQ', 'VAPOR_H_PS', 'VAPOR_T_SAT', 'VAPOR_LATENT',
  'TRUE', 'FALSE', 'VERDADEIRO', 'FALSO'
]);

export const SectorModules: React.FC<SectorModulesProps> = ({
  activeSector, variables, results, isLocked, highlightedVarId,
  onEditVariable, onAddVariable, onVariableChange, onNavigateToVariable,
  activeStatusFilter, setActiveStatusFilter
}) => {
  const [activeTypeFilter, setActiveTypeFilter] = useState<'ALL' | 'INPUT' | 'OUTPUT' | 'CENARIO' | 'DERIVADA'>('ALL');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [showInactive, setShowInactive] = useState(false);
  const [auditVarId, setAuditVarId] = useState<string | null>(null);
  const [activeFormulaPopover, setActiveFormulaPopover] = useState<{ varId: string; formula: string } | null>(null);

  const formatVariableValue = (val: number, variable: Variable) => {
    const isPercent = variable.tipo_exibicao === 'PERCENTAGE';
    const base = variable.percent_base || 'DECIMAL';
    const decimals = variable.casas_decimais !== undefined && variable.casas_decimais !== null 
      ? variable.casas_decimais 
      : (isPercent ? 2 : 4);
    
    let displayVal = val;
    if (isPercent && base === 'DECIMAL') {
      displayVal = val * 100;
    }
    
    const numStr = displayVal.toLocaleString('pt-BR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
    
    return isPercent ? `${numStr}%` : numStr;
  };

  const getInputValue = (v: Variable) => {
    const rawVal = v['EQUAÇÕES E VALORES'];
    if (typeof rawVal === 'string' && rawVal.startsWith('=')) {
      return rawVal;
    }
    if (v.tipo_exibicao === 'PERCENTAGE' && v.percent_base === 'DECIMAL') {
      const num = Number(rawVal);
      if (!isNaN(num) && rawVal !== '') {
        return String(num * 100);
      }
    }
    return String(rawVal);
  };

  const handleInputChange = (id: string, value: string, variable: Variable) => {
    let finalValue = value;
    if (variable.tipo_exibicao === 'PERCENTAGE' && variable.percent_base === 'DECIMAL') {
      const cleaned = value.trim();
      if (!cleaned.startsWith('=')) {
        const num = Number(cleaned.replace(',', '.'));
        if (!isNaN(num) && cleaned !== '') {
          finalValue = String(num / 100);
        }
      }
    }
    onVariableChange(id, finalValue);
  };

  const matchesStatus = (v: Variable): boolean => {
    if (activeStatusFilter === 'all') return true;
    const isInput = v.TIPO === 'INPUT' || v.TIPO === 'CENARIO';
    const res = results[v['ID - REF']];
    if (isInput) return activeStatusFilter === 'idle' && (!v['EQUAÇÕES E VALORES'] || String(v['EQUAÇÕES E VALORES']).trim() === '');
    const st = res?.status;
    if (activeStatusFilter === 'ok') return st === 'OK';
    if (activeStatusFilter === 'error') return !!st && st !== 'OK' && st !== 'PENDING';
    return !st || st === 'PENDING';
  };

  const sectorVariables = variables.filter(v => {
    if (v.SETOR !== activeSector) return false;
    if (v.STATUS === 'inativa' && !showInactive) return false;
    if (activeTypeFilter !== 'ALL' && v.TIPO !== activeTypeFilter) return false;
    return matchesStatus(v);
  });

  const stages: Record<string, Record<string, Variable[]>> = {};
  sectorVariables.forEach(v => {
    const stage = v.ETAPA || 'GERAL', pc = v['PONTO DE CONTROLE'] || 'GERAL';
    if (!stages[stage])     stages[stage] = {};
    if (!stages[stage][pc]) stages[stage][pc] = [];
    stages[stage][pc].push(v);
  });

  const getDependencies = (formula: string): string[] => {
    if (!formula || !formula.startsWith('=')) return [];
    const knownIds = new Set(variables.map(v => v['ID - REF'].toUpperCase()));
    const tokens = formula.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g) || [];
    return Array.from(new Set(tokens.map(t => t.toUpperCase()).filter(t => knownIds.has(t) && !FUNCTIONS.has(t))));
  };

  const activeAuditFormula = variables.find(v => v['ID - REF'] === auditVarId)?.['EQUAÇÕES E VALORES'] || '';
  const auditDeps = getDependencies(String(activeAuditFormula));
  const internalAuditDeps = auditDeps.filter(depId => variables.find(v => v['ID - REF'] === depId)?.SETOR === activeSector);
  const externalAuditDeps = auditDeps.filter(depId => {
    const depVar = variables.find(v => v['ID - REF'] === depId);
    return depVar && depVar.SETOR !== activeSector;
  });

  const stageNames = Object.keys(stages);

  return (
    <div className="space-y-4 relative">
      <SectorFilterBar
        activeTypeFilter={activeTypeFilter}
        setActiveTypeFilter={setActiveTypeFilter}
        showInactive={showInactive}
        setShowInactive={setShowInactive}
        activeStatusFilter={activeStatusFilter}
        setActiveStatusFilter={setActiveStatusFilter}
      />

      <SectorAuditCard
        auditVarId={auditVarId}
        setAuditVarId={setAuditVarId}
        internalAuditDeps={internalAuditDeps}
        externalAuditDeps={externalAuditDeps}
        variables={variables}
        results={results}
        onNavigateToVariable={onNavigateToVariable}
      />

      {/* Tables list */}
      {stageNames.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 glass-card text-slate-500">
          <span className="text-2xl mb-3 opacity-40">◈</span>
          <p className="text-sm font-semibold text-slate-400 mb-1">Nenhuma variável encontrada</p>
          {activeTypeFilter === 'ALL' && (
            <button onClick={() => onAddVariable(activeSector, 'GERAL')} className="btn-primary px-4 py-1.5 text-xs mt-4">+ Cadastrar Primeira Variável</button>
          )}
        </div>
      ) : (
        stageNames.map(stageName => {
          const isCollapsed = !!collapsedGroups[stageName];
          const pcsInStage  = stages[stageName];
          const totalVars   = Object.values(pcsInStage).reduce((acc, curr) => acc + curr.length, 0);

          return (
            <div key={stageName} className="glass-card overflow-hidden animate-fade-in-up">
              <div className="px-5 py-3 flex justify-between items-center border-b border-slate-800/60 bg-slate-900/40">
                <div className="flex items-center gap-3">
                  <button onClick={() => setCollapsedGroups(prev => ({ ...prev, [stageName]: !prev[stageName] }))} className="btn-ghost p-1 rounded text-slate-500">
                    <BmeIcon name={isCollapsed ? 'chevron-right' : 'chevron-down'} size={10} />
                  </button>
                  <h3 className="text-[11px] font-bold text-slate-300 tracking-widest uppercase">{stageName}</h3>
                  <span className="badge-idle">{totalVars}</span>
                </div>
                <button onClick={() => onAddVariable(activeSector, stageName)} disabled={isLocked} className="text-[10px] font-semibold text-teal-500 hover:text-teal-300 disabled:text-slate-700 border border-teal-600/30 hover:border-teal-500/50 disabled:border-slate-800 rounded px-2.5 py-1 transition-all">+ Nova Variável</button>
              </div>

              {!isCollapsed && (
                <div className="divide-y divide-slate-800/40">
                  {Object.keys(pcsInStage).map(pcName => {
                    const varsInGroup = pcsInStage[pcName];
                    return (
                      <div key={pcName} data-group-name={pcName} className="flex flex-col">
                        <div className="flex items-center gap-3 px-5 py-2 bg-slate-900/60 border-b border-slate-800/30">
                          <span className="w-[3px] h-4 rounded-full bg-teal-500/70 shrink-0" />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-teal-400">{pcName}</span>
                        </div>

                        <div className="bme-table-wrapper">
                          <table className="bme-table">
                            <thead>
                              <tr className="bme-table-header-row">
                                <th className="bme-table-header-cell w-28">ID</th>
                                <th className="bme-table-header-cell">Descrição</th>
                                <th className="bme-table-header-cell w-20">Tipo</th>
                                <th className="bme-table-header-cell w-20">Unidade</th>
                                <th className="bme-table-header-cell">Fórmula</th>
                                <th className="bme-table-header-cell w-36 text-right">Valor</th>
                                <th className="bme-table-header-cell w-20 text-center">Ações</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/30">
                              {varsInGroup.map(v => {
                                const id = v['ID - REF'], res = results[id];
                                const isInput = v.TIPO === 'INPUT' || v.TIPO === 'CENARIO';
                                const isHighlight = highlightedVarId === id, isAuditedOrigin = auditVarId === id;
                                const isAuditedDep = auditVarId !== null && internalAuditDeps.includes(id);
                                const isInactive = v.STATUS === 'inativa';

                                return (
                                  <tr key={id} data-var-id={id} className={`bme-table-row transition-all duration-200 ${isHighlight ? 'var-row-highlight' : ''} ${isAuditedOrigin ? 'bg-cyan-950/20 border-l-2 border-cyan-500' : ''} ${isAuditedDep ? 'bg-teal-950/20 border-l-2 border-teal-500 shadow-[inset_0_0_8px_rgba(20,184,166,0.1)]' : ''} ${isInactive ? 'opacity-40 italic bg-slate-950/20' : ''}`}>
                                    <td className="bme-table-cell font-mono font-semibold text-teal-500 truncate max-w-[120px]" title={id}>{id}</td>
                                    <td className="bme-table-cell text-slate-300 truncate max-w-[200px]" title={v['DESCRIÇÃO']}>{v['DESCRIÇÃO']}</td>
                                    <td className="bme-table-cell">
                                      <span className={`px-2 py-0.5 inline-flex text-[9px] font-bold leading-4 rounded-full border ${TYPE_BADGE[v.TIPO] ?? 'bg-slate-700/40 text-slate-400 border-slate-700/60'}`}>{v.TIPO}</span>
                                      {isInactive && <span className="ml-1 px-1.5 py-0.5 inline-flex text-[8px] font-semibold leading-3 rounded bg-slate-800 text-slate-400 border border-slate-700 uppercase">Inativa</span>}
                                    </td>
                                    <td className="bme-table-cell text-slate-500">{v['UNIDADE DE MEDIDA'] || '—'}</td>

                                    {/* Formula */}
                                    <td className="bme-table-cell text-slate-600 font-mono max-w-[160px] relative group">
                                      {isInput ? <span className="text-slate-700">—</span> : (
                                        <div className="flex items-center gap-1.5">
                                          <span onClick={() => setActiveFormulaPopover({ varId: id, formula: String(v['EQUAÇÕES E VALORES']) })} className="truncate max-w-[110px] hover:text-teal-400 cursor-pointer transition-colors">{v['EQUAÇÕES E VALORES']}</span>
                                          <div className="absolute left-0 bottom-full mb-1.5 hidden group-hover:block z-50 bg-slate-950 text-slate-300 font-mono text-[10px] p-2 rounded-lg border border-slate-800 shadow-xl max-w-xs whitespace-pre-wrap break-all pointer-events-none">{v['EQUAÇÕES E VALORES']}</div>
                                          <button onClick={() => setAuditVarId(prev => prev === id ? null : id)} className={`p-1 rounded transition-colors ${isAuditedOrigin ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-600 hover:text-teal-400 hover:bg-slate-800/40'}`} title="Auditar fluxo de variáveis"><BmeIcon name="eye" size={10} /></button>
                                        </div>
                                      )}
                                    </td>

                                    {/* Value / Input (aligned right) */}
                                    <td className="bme-table-cell font-mono font-bold text-right">
                                      {isInput ? (
                                        <div className="flex justify-end items-center gap-1.5">
                                          <input
                                            type="text"
                                            aria-label={`Valor para ${id}`}
                                            disabled={isLocked || isInactive}
                                            value={getInputValue(v)}
                                            onChange={e => handleInputChange(id, e.target.value, v)}
                                            className={`${v.tipo_exibicao === 'PERCENTAGE' ? 'w-24' : 'w-28'} px-2.5 py-1 text-xs font-mono font-semibold rounded-md bg-slate-800 border border-slate-700/60 text-slate-200 placeholder-slate-600 text-right focus:outline-none focus:ring-1 focus:ring-teal-500/60 focus:border-teal-500/50 disabled:bg-slate-900 disabled:text-slate-600 disabled:border-slate-800`}
                                          />
                                          {v.tipo_exibicao === 'PERCENTAGE' && (
                                            <span className="text-[10px] font-bold text-slate-500 w-4 shrink-0 select-none text-left">%</span>
                                          )}
                                        </div>
                                      ) : (
                                        res !== undefined ? (
                                          res.status === 'OK' && res.value !== null ? (
                                            <span className="text-slate-200 tabular-nums">{formatVariableValue(res.value, v)}</span>
                                          ) : (
                                            <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold ${ERROR_BADGE[res.status] ?? 'bg-slate-700/40 text-slate-400 border-slate-700/60'}`} title={res.error_message || res.status}>⚠ {res.status}</span>
                                          )
                                        ) : <span className="text-slate-700">—</span>
                                      )}
                                    </td>

                                    <td className="bme-table-cell text-center flex items-center justify-center gap-1">
                                      <button type="button" disabled={isLocked || isInactive} onClick={() => onEditVariable(v)} className="text-slate-500 hover:text-teal-400 hover:bg-teal-500/10 disabled:opacity-35 disabled:hover:bg-transparent p-1.5 rounded-md transition-all focus:outline-none"><BmeIcon name="pencil" /></button>
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
        })
      )}

      <SectorFormulaPopover
        activeFormulaPopover={activeFormulaPopover}
        onClose={() => setActiveFormulaPopover(null)}
      />
    </div>
  );
};
