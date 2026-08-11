import React, { useState, useMemo } from 'react';
import { Variable, Sector, FilterStatus } from '../../types';
import { SectorFilterBar } from './SectorFilterBar';
import { SectorAuditCard } from './SectorAuditCard';
import { groupAndSortVariables } from '../../utils/sorting';
import { SectorControlPointTable } from '../sectors/SectorControlPointTable';
import { getDependencies } from '../../utils/helpers';
import { useSectorReorder } from '../../hooks/useSectorReorder';

interface SectorModulesProps {
  sectors?: Sector[];
  activeSector: string;
  variables: Variable[];
  results: Record<string, any>;
  isLocked: boolean;
  statusFilter?: FilterStatus;
  activeStatusFilter?: FilterStatus;
  onStatusFilterChange?: (filter: FilterStatus) => void;
  setActiveStatusFilter?: (filter: FilterStatus) => void;
  searchMatchIds?: string[];
  currentMatchId?: string;
  onEditVariable: (variable: Variable) => void;
  onAddVariable: (sector: string, definition: string) => void;
  onNavigateToVariable?: (id: string) => void;
  onReorderSuccess?: () => void;
}

export const SectorModules: React.FC<SectorModulesProps> = ({
  sectors = [],
  activeSector,
  variables = [],
  results = {},
  isLocked,
  statusFilter,
  activeStatusFilter,
  onStatusFilterChange,
  setActiveStatusFilter,
  searchMatchIds,
  currentMatchId,
  onEditVariable,
  onAddVariable,
  onNavigateToVariable,
  onReorderSuccess
}) => {
  const [activeTypeFilter, setActiveTypeFilter] = useState<'ALL' | 'INPUT' | 'OUTPUT' | 'CENARIO' | 'DERIVADA'>('ALL');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [showInactive, setShowInactive] = useState(false);
  const [auditVarId, setAuditVarId] = useState<string | null>(null);

  const effectiveStatusFilter: FilterStatus = activeStatusFilter || statusFilter || 'all';

  const handleStatusFilterChange = (f: FilterStatus) => {
    if (setActiveStatusFilter) setActiveStatusFilter(f);
    if (onStatusFilterChange) onStatusFilterChange(f);
  };

  const matchesStatus = (v: Variable): boolean => {
    const f = (effectiveStatusFilter || 'all').toLowerCase();
    if (f === 'all') return true;
    const isInput = v.TIPO === 'INPUT' || v.TIPO === 'CENARIO';
    const res = results[v['ID - REF']];
    if (isInput) {
      if (f === 'idle' || f === 'pendente') return (!v['EQUAÇÕES E VALORES'] || String(v['EQUAÇÕES E VALORES']).trim() === '');
      if (f === 'ok' || f === 'convergido') return !!v['EQUAÇÕES E VALORES'] && String(v['EQUAÇÕES E VALORES']).trim() !== '';
      return true;
    }
    const st = res?.status;
    if (f === 'ok' || f === 'convergido') return st === 'OK';
    if (f === 'error' || f === 'com erro') return !!st && st !== 'OK' && st !== 'PENDING';
    if (f === 'idle' || f === 'pendente') return !st || st === 'PENDING';
    return true;
  };

  const sectorVariables = useMemo(() => (variables || []).filter(v => {
    if (!v || !v.SETOR) return false;

    const vSetorNorm = String(v.SETOR).trim().toLowerCase();
    const activeSectorNorm = String(activeSector || '').trim().toLowerCase();

    const sectorObj = (sectors || []).find(s => 
      s && (s.id === activeSector || s.nome === activeSector || s.id.toLowerCase() === activeSectorNorm || s.nome.toLowerCase() === activeSectorNorm)
    );

    const matchesSector = 
      vSetorNorm === activeSectorNorm ||
      (sectorObj && (vSetorNorm === sectorObj.id.toLowerCase() || vSetorNorm === sectorObj.nome.toLowerCase()));

    if (!matchesSector) return false;
    if (v.STATUS === 'inativa' && !showInactive) return false;
    if (activeTypeFilter !== 'ALL' && v.TIPO !== activeTypeFilter) return false;
    return matchesStatus(v);
  }), [variables, sectors, activeSector, showInactive, activeTypeFilter, effectiveStatusFilter, results]);

  const groupedStages = useMemo(() => groupAndSortVariables(sectorVariables), [sectorVariables]);

  const { handleDragStart, handleDragOver, handleDrop, handleMove } = useSectorReorder({
    activeSector,
    groupedStages,
    isLocked,
    onReorderSuccess,
  });

  const activeAuditFormula = variables.find(v => v['ID - REF'] === auditVarId)?.['EQUAÇÕES E VALORES'] || '';
  const auditDeps = getDependencies(String(activeAuditFormula), variables);
  const internalAuditDeps = auditDeps.filter(depId => variables.find(v => v['ID - REF'] === depId)?.SETOR === activeSector);
  const externalAuditDeps = auditDeps.filter(depId => {
    const depVar = variables.find(v => v['ID - REF'] === depId);
    return depVar && depVar.SETOR !== activeSector;
  });

  return (
    <div className="space-y-4 relative">
      <SectorFilterBar
        activeTypeFilter={activeTypeFilter}
        setActiveTypeFilter={setActiveTypeFilter}
        showInactive={showInactive}
        setShowInactive={setShowInactive}
        activeStatusFilter={effectiveStatusFilter}
        setActiveStatusFilter={handleStatusFilterChange}
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
      {groupedStages.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bme-card text-bme-text-sec">
          <span className="text-3xl mb-3 opacity-40">◈</span>
          <p className="text-sm font-semibold text-bme-text mb-1">Nenhuma variável cadastrada neste setor</p>
          <p className="text-xs text-bme-text-muted mb-4">Clique no botão abaixo para adicionar a primeira variável.</p>
          {activeTypeFilter === 'ALL' && (
            <button onClick={() => onAddVariable(activeSector, 'GERAL')} disabled={isLocked} className="btn-primary px-4 py-2 text-xs disabled:opacity-50">+ Cadastrar Primeira Variável</button>
          )}
        </div>
      ) : (
        groupedStages.map(stage => {
          const isCollapsed = !!collapsedGroups[stage.stageId];
          const totalVars   = stage.controlPoints.reduce((acc, curr) => acc + curr.variables.length, 0);

          return (
            <div
              key={stage.stageId}
              className="bme-card overflow-hidden animate-fade-in-up"
              draggable={!isLocked}
              onDragStart={(e) => handleDragStart(e, 'stage', stage.stageId)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'stage', stage.stageId)}
            >
              <div className="px-5 py-3 flex justify-between items-center border-b border-bme-border bg-slate-100/90">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setCollapsedGroups(prev => ({ ...prev, [stage.stageId]: !prev[stage.stageId] }))}
                    className="text-bme-text-sec hover:text-bme-text transition-colors p-1"
                    aria-label={isCollapsed ? "Expandir etapa" : "Recolher etapa"}
                  >
                    <span className={`inline-block transition-transform duration-200 ${isCollapsed ? '' : 'rotate-90'}`}>▶</span>
                  </button>
                  <h3 className="font-bold text-sm text-bme-text">{stage.stageName}</h3>
                  <span className="text-xs text-bme-text-sec font-mono">({totalVars} variáveis)</span>
                </div>
                <div className="flex items-center gap-2">
                  {!isLocked && (
                    <div className="flex items-center gap-1 border-r border-bme-border pr-2 mr-1">
                      <button onClick={() => handleMove('stage', stage.stageId, 'up')} className="p-1 hover:bg-slate-200 rounded text-xs">▲</button>
                      <button onClick={() => handleMove('stage', stage.stageId, 'down')} className="p-1 hover:bg-slate-200 rounded text-xs">▼</button>
                    </div>
                  )}
                  <button
                    onClick={() => onAddVariable(activeSector, stage.stageName)}
                    disabled={isLocked}
                    className="btn-secondary text-[11px] py-1 px-2.5 disabled:opacity-50"
                  >
                    + Variável
                  </button>
                </div>
              </div>

              {!isCollapsed && (
                <div className="p-4 space-y-4">
                  {stage.controlPoints.map(cp => (
                    <div
                      key={cp.cpId}
                      draggable={!isLocked}
                      onDragStart={(e) => handleDragStart(e, 'cp', cp.cpId)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, 'cp', cp.cpId)}
                    >
                      <div className="flex items-center justify-between mb-2 px-1" data-group-name={cp.cpName}>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-bme-text">{cp.cpName}</span>
                          <span className="text-[10px] text-bme-text-sec font-mono">({cp.variables.length})</span>
                        </div>
                        {!isLocked && (
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleMove('cp', cp.cpId, 'up')} className="p-0.5 hover:bg-slate-200 rounded text-[10px]">▲</button>
                            <button onClick={() => handleMove('cp', cp.cpId, 'down')} className="p-0.5 hover:bg-slate-200 rounded text-[10px]">▼</button>
                          </div>
                        )}
                      </div>

                      <SectorControlPointTable
                        cp={cp}
                        controlPointId={cp.cpId}
                        variables={cp.variables}
                        results={results}
                        isLocked={isLocked}
                        searchMatchIds={searchMatchIds}
                        currentMatchId={currentMatchId}
                        onEditVariable={onEditVariable}
                        onAuditClick={setAuditVarId}
                        onMoveVar={(id, dir) => handleMove('var', id, dir)}
                        handleDragStart={(e, type, id) => handleDragStart(e, type, id)}
                        handleDragOver={handleDragOver}
                        handleDrop={(e, type, id) => handleDrop(e, type, id)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};
