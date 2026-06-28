import React, { useState } from 'react';
import { Variable } from '../types';
import { BmeIcon, TYPE_BADGE, ERROR_BADGE } from '../theme/design-system';

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
}

const FUNCTIONS = new Set([
  'SE', 'SEERRO', 'SOMA', 'PROCV', 'LN', 'SUBTOTAL', 'SOMASES',
  'VAPOR_H', 'VAPOR_S', 'VAPOR_H_SAT', 'VAPOR_H_LIQ', 'VAPOR_H_PS', 'VAPOR_T_SAT', 'VAPOR_LATENT',
  'TRUE', 'FALSE', 'VERDADEIRO', 'FALSO'
]);

export const SectorModules: React.FC<SectorModulesProps> = ({
  activeSector,
  variables,
  results,
  isLocked,
  highlightedVarId,
  onEditVariable,
  onAddVariable,
  onVariableChange,
  onNavigateToVariable
}) => {
  const [activeTypeFilter, setActiveTypeFilter] = useState<'ALL' | 'INPUT' | 'OUTPUT' | 'CENARIO' | 'DERIVADA'>('ALL');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [showInactive, setShowInactive] = useState(false);
  const [auditVarId, setAuditVarId] = useState<string | null>(null);
  const [activeFormulaPopover, setActiveFormulaPopover] = useState<{ varId: string; formula: string } | null>(null);

  const sectorVariables = variables.filter(v => {
    if (v.SETOR !== activeSector) return false;
    if (v.STATUS === 'inativa' && !showInactive) return false;
    return activeTypeFilter === 'ALL' || v.TIPO === activeTypeFilter;
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
      {/* Type Filter Bar */}
      <div className="flex flex-wrap items-center gap-1.5 bg-slate-900/40 p-2 rounded-xl border border-slate-800/60">
        <span className="text-[10px] uppercase font-bold text-slate-500 mr-2 px-1">Filtrar Tipo:</span>
        {([
          { id: 'ALL', label: 'Todos' },
          { id: 'INPUT', label: 'INPUT' },
          { id: 'OUTPUT', label: 'OUTPUT' },
          { id: 'CENARIO', label: 'Cenário' },
          { id: 'DERIVADA', label: 'Derivada' }
        ] as const).map(opt => (
          <button
            key={opt.id}
            onClick={() => setActiveTypeFilter(opt.id)}
            className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
              activeTypeFilter === opt.id
                ? 'bg-teal-500/20 text-teal-400 border border-teal-500/40 shadow-sm'
                : 'text-slate-500 hover:text-slate-350 bg-transparent border border-transparent'
            }`}
          >
            {opt.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setShowInactive(prev => !prev)}
          className={`ml-auto px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
            showInactive
              ? 'bg-amber-600/20 text-amber-400 border border-amber-600/30 shadow-sm'
              : 'text-slate-500 hover:text-slate-350 bg-transparent border border-transparent'
          }`}
        >
          {showInactive ? 'Ocultar Inativas' : 'Mostrar Inativas'}
        </button>
      </div>

      {/* Floating Audit Card */}
      {auditVarId && (
        <div className="glass-card p-4 border border-teal-500/40 bg-slate-950 shadow-2xl space-y-3 max-w-md w-full sticky top-0 z-40 animate-fade-in-up">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-slate-300">Auditoria de Fluxo: <span className="font-mono text-teal-400">{auditVarId}</span></span>
            <button onClick={() => setAuditVarId(null)} className="btn-ghost p-1 text-slate-500 hover:text-white"><BmeIcon name="close" size={10} /></button>
          </div>
          <div className="text-xs space-y-2">
            <p className="text-slate-400">{internalAuditDeps.length > 0 ? `Destacando ${internalAuditDeps.length} células dependentes neste setor.` : 'Nenhuma célula dependente no setor ativo.'}</p>
            {externalAuditDeps.length > 0 && (
              <>
                <p className="font-bold text-teal-500 mt-2">Dependências Externas:</p>
                <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                  {externalAuditDeps.map(depId => {
                    const depVar = variables.find(v => v['ID - REF'] === depId), depRes = results[depId];
                    if (!depVar) return null;
                    return (
                      <div key={depId} className="flex justify-between items-center bg-slate-900/60 p-2 rounded border border-slate-800/40">
                        <div className="min-w-0">
                          <p className="font-mono text-slate-200 font-semibold truncate">{depId} <span className="text-[9px] text-slate-500 uppercase">({depVar.SETOR})</span></p>
                          <p className="text-[10px] text-slate-500 truncate">{depVar['DESCRIÇÃO']}</p>
                        </div>
                        <div className="flex items-center gap-2 ml-4 shrink-0">
                          <span className="font-mono text-slate-300">{depRes?.status === 'OK' && depRes.value !== null ? depRes.value.toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 }) : '—'}</span>
                          <button onClick={() => onNavigateToVariable && onNavigateToVariable(depId)} className="text-[10px] text-teal-400 hover:text-teal-300 border border-teal-500/20 hover:border-teal-500/50 px-1.5 py-0.5 rounded transition-all">Ir para</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      )}

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
                                        <div className="flex justify-end">
                                          <input type="text" aria-label={`Valor para ${id}`} disabled={isLocked || isInactive} value={String(v['EQUAÇÕES E VALORES'])} onChange={e => onVariableChange(id, e.target.value)} className="w-28 px-2.5 py-1 text-xs font-mono font-semibold rounded-md bg-slate-800 border border-slate-700/60 text-slate-200 placeholder-slate-600 text-right focus:outline-none focus:ring-1 focus:ring-teal-500/60 focus:border-teal-500/50 disabled:bg-slate-900 disabled:text-slate-600 disabled:border-slate-800" />
                                        </div>
                                      ) : (
                                        res !== undefined ? (
                                          res.status === 'OK' && res.value !== null ? (
                                            <span className="text-slate-200 tabular-nums">{res.value.toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</span>
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

      {/* Expanded Formula Popover Modal */}
      {activeFormulaPopover && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4" onClick={() => setActiveFormulaPopover(null)}>
          <div className="glass-card max-w-lg w-full p-4 relative flex flex-col gap-3 border border-slate-700/40" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-teal-400 font-mono">{activeFormulaPopover.varId}</span>
              <button className="btn-ghost p-1" onClick={() => setActiveFormulaPopover(null)}><BmeIcon name="close" size={12} /></button>
            </div>
            <div className="bg-slate-950 p-3 rounded border border-slate-800 font-mono text-xs text-slate-300 break-all whitespace-pre-wrap leading-relaxed select-all">{activeFormulaPopover.formula}</div>
            <div className="flex justify-end">
              <button className="btn-primary px-3 py-1.5 text-[11px] flex items-center gap-1.5" onClick={() => { navigator.clipboard.writeText(activeFormulaPopover.formula); alert('Fórmula copiada com sucesso!'); }}>📋 Copiar Fórmula</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
