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
  const sectorVariables = variables.filter(v => v.SETOR === activeSector);

  // Group by ETAPA → PONTO DE CONTROLE
  const stages: Record<string, Record<string, Variable[]>> = {};
  sectorVariables.forEach(v => {
    const stage = v.ETAPA || 'GERAL';
    const pc    = v['PONTO DE CONTROLE'] || 'GERAL';
    if (!stages[stage])     stages[stage] = {};
    if (!stages[stage][pc]) stages[stage][pc] = [];
    stages[stage][pc].push(v);
  });

  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (groupName: string) => {
    setCollapsedGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  const stageNames = Object.keys(stages);

  if (stageNames.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 glass-card text-slate-500">
        <span className="text-2xl mb-3 opacity-40">◈</span>
        <p className="text-sm font-semibold text-slate-400 mb-1">Setor sem variáveis</p>
        <p className="text-xs text-slate-600 mb-4">Nenhuma variável cadastrada para este setor.</p>
        <button
          onClick={() => onAddVariable(activeSector, 'GERAL')}
          className="btn-primary px-4 py-1.5 text-xs"
        >
          + Cadastrar Primeira Variável
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {stageNames.map(stageName => {
        const isCollapsed = !!collapsedGroups[stageName];
        const pcsInStage  = stages[stageName];
        const totalVars   = Object.values(pcsInStage).reduce((acc, curr) => acc + curr.length, 0);

        return (
          <div key={stageName} className="glass-card overflow-hidden animate-fade-in-up">
            {/* ── Stage Header ── */}
            <div className="px-5 py-3 flex justify-between items-center border-b border-slate-800/60 bg-slate-900/40">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleGroup(stageName)}
                  className="btn-ghost p-1 rounded text-slate-500"
                  aria-label={isCollapsed ? `Expandir ${stageName}` : `Recolher ${stageName}`}
                >
                  <BmeIcon
                    name={isCollapsed ? 'chevron-right' : 'chevron-down'}
                    className="text-slate-500 transition-transform duration-200"
                    size={10}
                  />
                </button>
                <h3 className="text-[11px] font-bold text-slate-300 tracking-widest uppercase">
                  {stageName}
                </h3>
                <span className="badge-idle">{totalVars}</span>
              </div>
              <button
                onClick={() => onAddVariable(activeSector, stageName)}
                disabled={isLocked}
                className="text-[10px] font-semibold text-teal-500 hover:text-teal-300 disabled:text-slate-700 border border-teal-600/30 hover:border-teal-500/50 disabled:border-slate-800 rounded px-2.5 py-1 transition-all"
              >
                + Nova Variável
              </button>
            </div>

            {/* ── Control Point Groups ── */}
            {!isCollapsed && (
              <div className="divide-y divide-slate-800/40">
                {Object.keys(pcsInStage).map(pcName => {
                  const varsInGroup = pcsInStage[pcName];

                  return (
                    <div key={pcName} data-group-name={pcName} className="flex flex-col">
                      {/* ── Control Point title row ── */}
                      <div className="flex items-center gap-3 px-5 py-2 bg-slate-900/60 border-b border-slate-800/30">
                        <span className="w-[3px] h-4 rounded-full bg-teal-500/70 shrink-0" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-teal-400">
                          {pcName}
                        </span>
                        <span className="text-[9px] text-slate-600 ml-auto">
                          {varsInGroup.length} {varsInGroup.length === 1 ? 'variável' : 'variáveis'}
                        </span>
                      </div>

                      {/* ── Variables Table ── */}
                      <div className="bme-table-wrapper">
                        <table className="bme-table">
                          <thead>
                            <tr className="bme-table-header-row">
                              <th className="bme-table-header-cell w-28">ID</th>
                              <th className="bme-table-header-cell">Descrição</th>
                              <th className="bme-table-header-cell w-24">Tipo</th>
                              <th className="bme-table-header-cell w-24">Unidade</th>
                              <th className="bme-table-header-cell">Fórmula</th>
                              <th className="bme-table-header-cell w-36">Valor</th>
                              <th className="bme-table-header-cell w-16 text-center">Ações</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/30">
                            {varsInGroup.map(v => {
                              const id          = v['ID - REF'];
                              const res         = results[id];
                              const isInput     = v.TIPO === 'INPUT' || v.TIPO === 'CENARIO';
                              const isHighlight = highlightedVarId === id;

                              return (
                                <tr
                                  key={id}
                                  data-var-id={id}
                                  className={`bme-table-row ${isHighlight ? 'var-row-highlight' : ''}`}
                                >
                                  {/* ID */}
                                  <td className="bme-table-cell font-mono font-semibold text-teal-500 truncate max-w-[120px]" title={id}>
                                    {id}
                                  </td>

                                  {/* Description */}
                                  <td className="bme-table-cell text-slate-300 truncate max-w-[200px]" title={v['DESCRIÇÃO']}>
                                    {v['DESCRIÇÃO']}
                                  </td>

                                  {/* Type Badge */}
                                  <td className="bme-table-cell">
                                    <span className={`px-2 py-0.5 inline-flex text-[9px] font-bold leading-4 rounded-full border ${TYPE_BADGE[v.TIPO] ?? 'bg-slate-700/40 text-slate-400 border-slate-700/60'}`}>
                                      {v.TIPO}
                                    </span>
                                  </td>

                                  {/* Unit */}
                                  <td className="bme-table-cell text-slate-500">
                                    {v['UNIDADE DE MEDIDA'] || '—'}
                                  </td>

                                  {/* Formula */}
                                  <td className="bme-table-cell text-slate-600 font-mono max-w-[150px] truncate" title={String(v['EQUAÇÕES E VALORES'])}>
                                    {isInput ? <span className="text-slate-700">—</span> : v['EQUAÇÕES E VALORES']}
                                  </td>

                                  {/* Value / Input */}
                                  <td className="bme-table-cell font-mono font-bold">
                                    {isInput ? (
                                      <label className="flex items-center">
                                        <span className="sr-only">Valor para {id}</span>
                                        <input
                                          type="text"
                                          aria-label={`Valor para ${id}`}
                                          disabled={isLocked}
                                          value={String(v['EQUAÇÕES E VALORES'])}
                                          onChange={e => onVariableChange(id, e.target.value)}
                                          className="w-28 px-2.5 py-1 text-xs font-mono font-semibold rounded-md
                                            bg-slate-800 border border-slate-700/60 text-slate-200
                                            placeholder-slate-600
                                            focus:outline-none focus:ring-1 focus:ring-teal-500/60 focus:border-teal-500/50
                                            disabled:bg-slate-900 disabled:text-slate-600 disabled:border-slate-800
                                            transition-all duration-150"
                                        />
                                      </label>
                                    ) : (
                                      res !== undefined ? (
                                        res.status === 'OK' && res.value !== null ? (
                                          <span className="text-slate-200 tabular-nums">
                                            {res.value.toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
                                          </span>
                                        ) : (
                                          <span
                                            className={`px-2 py-0.5 rounded-full border text-[9px] font-bold ${ERROR_BADGE[res.status] ?? 'bg-slate-700/40 text-slate-400 border-slate-700/60'}`}
                                            title={res.error_message || res.status}
                                            aria-label={`Erro: ${res.status}. ${res.error_message}`}
                                          >
                                            ⚠ {res.status}
                                          </span>
                                        )
                                      ) : <span className="text-slate-700">—</span>
                                    )}
                                  </td>

                                  {/* Edit action */}
                                  <td className="bme-table-cell text-center">
                                    <button
                                      type="button"
                                      onClick={() => onEditVariable(v)}
                                      className="text-slate-500 hover:text-teal-400 hover:bg-teal-500/10 p-1.5 rounded-md transition-all focus:outline-none"
                                      aria-label={`Editar variável ${id}`}
                                    >
                                      <BmeIcon name="pencil" />
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
