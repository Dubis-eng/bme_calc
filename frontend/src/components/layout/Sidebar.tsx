import React, { useState } from 'react';
import { Variable, Sector } from '../../types';
import { getFriendlySectorName } from '../../utils/helpers';
import { BmeIcon } from '../../styles/design-system';

interface SidebarProps {
  isSidebarExpanded: boolean;
  setIsSidebarExpanded: (val: boolean) => void;
  uniqueSectors: string[];
  activeSector: string;
  setActiveSector: (val: string) => void;
  variables: Variable[];
  sectors: Sector[];
  results: Record<string, { value: number | null; status: string }>;
  onSubgroupClick: (sectorId: string, subgroupName: string) => void;
  onVariableClick: (varId: string) => void;
  onSettingsClick: () => void;
}

type SectorStatus = 'ok' | 'error' | 'idle';

function getSectorStatus(
  sectorId: string,
  variables: Variable[],
  results: Record<string, { value: number | null; status: string }>
): SectorStatus {
  const sectorVarIds = variables.filter(v => v.SETOR === sectorId).map(v => v['ID - REF']);
  if (sectorVarIds.length === 0) return 'idle';
  const hasError = sectorVarIds.some(id => results[id]?.status && results[id].status !== 'OK');
  return hasError ? 'error' : 'ok';
}

const STATUS_DOT: Record<SectorStatus, string> = {
  ok:    'bg-emerald-400',
  error: 'bg-rose-400',
  idle:  'bg-slate-600',
};

export function Sidebar({
  isSidebarExpanded,
  setIsSidebarExpanded,
  uniqueSectors,
  activeSector,
  setActiveSector,
  variables,
  sectors,
  results,
  onSubgroupClick,
  onVariableClick,
  onSettingsClick,
}: SidebarProps) {
  const [expandedSectors, setExpandedSectors] = useState<Record<string, boolean>>({});
  const [expandedStages, setExpandedStages] = useState<Record<string, boolean>>({});
  const [expandedCps, setExpandedCps] = useState<Record<string, boolean>>({});

  const toggleSector = (id: string) => {
    setActiveSector(id);
    setExpandedSectors(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleStage = (e: React.MouseEvent, sectorId: string, stage: string) => {
    e.stopPropagation();
    setExpandedStages(prev => ({ ...prev, [`${sectorId}:${stage}`]: !prev[`${sectorId}:${stage}`] }));
  };

  const toggleCp = (e: React.MouseEvent, sectorId: string, stage: string, cp: string) => {
    e.stopPropagation();
    setExpandedCps(prev => ({ ...prev, [`${sectorId}:${stage}:${cp}`]: !prev[`${sectorId}:${stage}:${cp}`] }));
  };

  return (
    <aside
      className={`flex flex-col bg-slate-950 border-r border-slate-800/60 transition-all duration-300 shrink-0 ${
        isSidebarExpanded ? 'w-64' : 'w-14'
      }`}
    >
      {/* ── Top Header ── */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-slate-800/60 h-[56px]">
        {isSidebarExpanded && (
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Setores</span>
        )}
        <button
          onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
          className="btn-ghost p-1.5 ml-auto text-slate-500 rounded-md flex items-center justify-center"
          aria-label={isSidebarExpanded ? 'Recolher menu' : 'Expandir menu'}
        >
          <BmeIcon name={isSidebarExpanded ? 'chevron-left' : 'chevron-right'} size={12} />
        </button>
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
        {uniqueSectors.map(sectorId => {
          const dbSector   = sectors.find(s => s.id === sectorId);
          const friendly   = dbSector ? dbSector.nome : getFriendlySectorName(sectorId);
          const sectorVars = variables.filter(v => v.SETOR === sectorId);
          const count      = sectorVars.length;
          const isActive   = activeSector === sectorId;
          const isExpanded = !!expandedSectors[sectorId];
          const status     = getSectorStatus(sectorId, variables, results);
          const stages     = Array.from(new Set(sectorVars.map(v => v.ETAPA || 'GERAL')));

          return (
            <div key={sectorId} className="flex flex-col">
              <button
                onClick={() => toggleSector(sectorId)}
                title={friendly}
                className={`sidebar-nav-item p-2 gap-2.5 ${isActive ? 'active' : ''}`}
              >
                {/* Icon */}
                <span className={`shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-sm font-bold transition-colors ${
                  isActive ? 'bg-teal-600/30 text-teal-400' : 'bg-slate-800/60 text-slate-500'
                }`}>
                  <BmeIcon name={sectorId} size={14} />
                </span>

                {isSidebarExpanded && (
                  <>
                    <span className="flex-1 text-xs font-medium truncate text-left">{friendly}</span>
                    <span className={`shrink-0 w-1.5 h-1.5 rounded-full ${STATUS_DOT[status]}`} />
                    <span className="shrink-0 text-[10px] text-slate-600 font-mono">{count}</span>
                    <BmeIcon
                      name="chevron-right"
                      className={`shrink-0 text-slate-600 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                      size={10}
                    />
                  </>
                )}
              </button>

              {/* Stages Tree */}
              {isSidebarExpanded && isExpanded && stages.length > 0 && (
                <div className="ml-6 border-l border-slate-800/60 pl-2 mt-0.5 mb-1 space-y-0.5 animate-fade-in-up">
                  {stages.map(stage => {
                    const stageKey      = `${sectorId}:${stage}`;
                    const isStageExp    = !!expandedStages[stageKey];
                    const stageVars     = sectorVars.filter(v => (v.ETAPA || 'GERAL') === stage);
                    const controlPoints = Array.from(new Set(stageVars.map(v => v['PONTO DE CONTROLE'] || 'GERAL')));

                    return (
                      <div key={stage}>
                        <button
                          onClick={e => toggleStage(e, sectorId, stage)}
                          className="w-full flex items-center gap-1.5 py-1 px-2 rounded text-[11px] font-semibold text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors"
                        >
                          <BmeIcon
                            name="chevron-right"
                            className={`shrink-0 text-slate-600 transition-transform ${isStageExp ? 'rotate-90' : ''}`}
                            size={8}
                          />
                          <span className="truncate">{stage}</span>
                          <span className="ml-auto text-[9px] text-slate-700">{stageVars.length}</span>
                        </button>

                        {isStageExp && controlPoints.map(cp => {
                          const cpKey    = `${sectorId}:${stage}:${cp}`;
                          const isCpExp  = !!expandedCps[cpKey];
                          const cpVars   = stageVars.filter(v => (v['PONTO DE CONTROLE'] || 'GERAL') === cp);

                          return (
                            <div key={cp} className="ml-3 border-l border-slate-800/40 pl-2">
                              <div
                                onClick={() => onSubgroupClick(sectorId, cp)}
                                className="flex items-center gap-1.5 py-0.5 px-1 rounded text-[10px] text-slate-600 hover:text-teal-400 hover:bg-teal-950/20 cursor-pointer transition-colors"
                              >
                                <button
                                  onClick={e => toggleCp(e, sectorId, stage, cp)}
                                  className="text-slate-700 hover:text-slate-400 transition-colors p-0.5"
                                  aria-label={isCpExp ? 'Recolher' : 'Expandir'}
                                >
                                  <BmeIcon
                                    name="chevron-right"
                                    className={`transition-transform ${isCpExp ? 'rotate-90' : ''}`}
                                    size={8}
                                  />
                                </button>
                                <span className="truncate flex-1" title={cp}>{cp}</span>
                                <span className="text-[9px] text-slate-700">{cpVars.length}</span>
                              </div>
                              {isCpExp && cpVars.map(v => (
                                <button
                                  key={v['ID - REF']}
                                  onClick={() => onVariableClick(v['ID - REF'])}
                                  title={`${v['ID - REF']}: ${v['DESCRIÇÃO']}`}
                                  className="w-full text-left flex items-center gap-1.5 py-0.5 px-2 ml-3 text-[9px] text-slate-600 hover:text-teal-400 hover:bg-teal-950/10 rounded transition-colors"
                                >
                                  <span className="text-teal-800">•</span>
                                  <span className="font-mono font-semibold text-teal-700 shrink-0">{v['ID - REF']}</span>
                                  <span className="truncate text-slate-600">— {v['DESCRIÇÃO']}</span>
                                </button>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* ── Footer ── */}
      <div className="border-t border-slate-800/60 p-2">
        <button
          onClick={onSettingsClick}
          id="btn-settings"
          className="sidebar-nav-item p-2 gap-2.5"
          title="Configurações do Sistema"
        >
          <span className="shrink-0 w-7 h-7 rounded-md bg-slate-800/60 flex items-center justify-center">
            <BmeIcon name="gear" size={14} />
          </span>
          {isSidebarExpanded && (
            <span className="text-xs font-medium text-slate-500">Configurações</span>
          )}
        </button>
      </div>
    </aside>
  );
}
