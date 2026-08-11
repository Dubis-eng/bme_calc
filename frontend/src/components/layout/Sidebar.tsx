import React, { useState } from 'react';
import { Variable, Sector } from '../../types';
import { getFriendlySectorName } from '../../utils/helpers';
import { BmeIcon } from '../../styles/design-system';

interface SidebarProps {
  isSidebarExpanded?: boolean;
  setIsSidebarExpanded?: React.Dispatch<React.SetStateAction<boolean>>;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  uniqueSectors?: string[];
  activeSector?: string;
  setActiveSector?: (val: string) => void;
  onSelectSector?: (val: string) => void;
  variables?: Variable[];
  sectors?: Sector[];
  results?: Record<string, { value: number | null; status: string }>;
  onSubgroupClick?: (sectorId: string, subgroupName: string) => void;
  onSelectSubgroup?: (sectorId: string, subgroupName: string) => void;
  onVariableClick?: (varId: string) => void;
  onSettingsClick?: () => void;
  onShowAll?: () => void;
}

type SectorStatus = 'ok' | 'error' | 'idle';

function getSectorStatus(
  sectorId: string,
  variables: Variable[] = [],
  results: Record<string, { value: number | null; status: string }> = {}
): SectorStatus {
  const sectorVarIds = (variables || []).filter(v => v && v.SETOR === sectorId).map(v => v['ID - REF']);
  if (sectorVarIds.length === 0) return 'idle';
  const hasError = sectorVarIds.some(id => results && results[id]?.status && results[id].status !== 'OK');
  return hasError ? 'error' : 'ok';
}

const STATUS_DOT: Record<SectorStatus, string> = {
  ok:    'bg-emerald-400',
  error: 'bg-rose-400',
  idle:  'bg-slate-500',
};

export function Sidebar({
  isSidebarExpanded: propIsSidebarExpanded,
  setIsSidebarExpanded: propSetIsSidebarExpanded,
  isExpanded,
  onToggleExpand,
  uniqueSectors: propUniqueSectors,
  activeSector = '',
  setActiveSector: propSetActiveSector,
  onSelectSector,
  variables = [],
  sectors = [],
  results = {},
  onSubgroupClick,
  onSelectSubgroup,
  onVariableClick,
  onSettingsClick,
  onShowAll,
}: SidebarProps) {
  const [internalExpanded, setInternalExpanded] = useState(true);
  const [expandedSectors, setExpandedSectors] = useState<Record<string, boolean>>({});
  const [expandedStages, setExpandedStages] = useState<Record<string, boolean>>({});
  const [expandedCps, setExpandedCps] = useState<Record<string, boolean>>({});

  const isExpandedActive = isExpanded ?? propIsSidebarExpanded ?? internalExpanded;

  const toggleExpand = () => {
    if (onToggleExpand) {
      onToggleExpand();
    } else if (propSetIsSidebarExpanded) {
      propSetIsSidebarExpanded(prev => !prev);
    } else {
      setInternalExpanded(prev => !prev);
    }
  };

  const handleSelectSector = (id: string) => {
    if (onSelectSector) onSelectSector(id);
    if (propSetActiveSector) propSetActiveSector(id);
  };

  const handleSubgroupSelect = (sectorId: string, subgroupName: string) => {
    if (onSelectSubgroup) onSelectSubgroup(sectorId, subgroupName);
    if (onSubgroupClick) onSubgroupClick(sectorId, subgroupName);
  };

  const toggleSector = (id: string) => {
    handleSelectSector(id);
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

  const uniqueSectorsList = propUniqueSectors ?? Array.from(new Set([
    ...(sectors || []).map(s => s.id),
    ...(variables || []).map(v => v.SETOR)
  ])).filter(Boolean);

  return (
    <aside
      className={`flex flex-col bg-slate-800 text-white border-r border-slate-700/80 transition-all duration-300 shrink-0 z-20 select-none ${
        isExpandedActive ? 'w-60' : 'w-10'
      }`}
    >
      {/* ── Top Header ── */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-slate-700/70 h-[56px]">
        {isExpandedActive ? (
          <button
            onClick={onShowAll}
            className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
          >
            Setores ({uniqueSectorsList.length})
          </button>
        ) : (
          <span className="sr-only">Setores</span>
        )}
        <button
          onClick={toggleExpand}
          className="p-1.5 ml-auto text-slate-400 hover:text-white hover:bg-slate-700/60 rounded-lg flex items-center justify-center transition-colors"
          aria-label={isExpandedActive ? 'Recolher setores' : 'Expandir setores'}
          title={isExpandedActive ? 'Recolher setores' : 'Expandir setores'}
        >
          <BmeIcon name={isExpandedActive ? 'chevron-left' : 'chevron-right'} size={14} />
        </button>
      </div>

      {/* ── Nav ── */}
      {isExpandedActive ? (
        <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-1">
          {uniqueSectorsList.map(sectorId => {
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
                  className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-left transition-all duration-150 group ${
                    isActive
                      ? 'bg-teal-600 text-white font-bold shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/50 font-medium'
                  }`}
                >
                  <span className={`shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-700/80 text-slate-300'
                  }`}>
                    <BmeIcon name={sectorId} size={13} />
                  </span>

                  <span className="flex-1 text-xs truncate">{friendly}</span>
                  <span className={`shrink-0 w-1.5 h-1.5 rounded-full ${STATUS_DOT[status]}`} />
                  <span className="shrink-0 text-[10px] text-slate-400 font-mono font-bold">{count}</span>
                  <BmeIcon
                    name="chevron-right"
                    className={`shrink-0 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                    size={10}
                  />
                </button>

                {/* Stages Tree */}
                {isExpanded && stages.length > 0 && (
                  <div className="ml-5 border-l border-slate-700/60 pl-2 mt-1 mb-1 space-y-0.5 animate-fade-in-up">
                    {stages.map(stage => {
                      const stageKey      = `${sectorId}:${stage}`;
                      const isStageExp    = !!expandedStages[stageKey];
                      const stageVars     = sectorVars.filter(v => (v.ETAPA || 'GERAL') === stage);
                      const controlPoints = Array.from(new Set(stageVars.map(v => v['PONTO DE CONTROLE'] || 'GERAL')));

                      return (
                        <div key={stage}>
                          <button
                            onClick={e => toggleStage(e, sectorId, stage)}
                            className="w-full flex items-center gap-1.5 py-1 px-2 rounded-lg text-[11px] font-semibold text-slate-300 hover:text-white hover:bg-slate-700/40 transition-colors"
                          >
                            <BmeIcon
                              name="chevron-right"
                              className={`shrink-0 text-slate-500 transition-transform ${isStageExp ? 'rotate-90' : ''}`}
                              size={8}
                            />
                            <span className="truncate">{stage}</span>
                            <span className="ml-auto text-[9px] font-mono text-slate-400">{stageVars.length}</span>
                          </button>

                          {isStageExp && controlPoints.map(cp => {
                            const cpKey    = `${sectorId}:${stage}:${cp}`;
                            const isCpExp  = !!expandedCps[cpKey];
                            const cpVars   = stageVars.filter(v => (v['PONTO DE CONTROLE'] || 'GERAL') === cp);

                            return (
                              <div key={cp} className="ml-3 border-l border-slate-700/40 pl-2">
                                <div
                                  onClick={() => handleSubgroupSelect(sectorId, cp)}
                                  className="flex items-center gap-1.5 py-1 px-1.5 rounded text-[10px] text-slate-300 hover:text-teal-300 hover:bg-slate-700/40 cursor-pointer transition-colors"
                                >
                                  <button
                                    onClick={e => toggleCp(e, sectorId, stage, cp)}
                                    className="text-slate-500 hover:text-white transition-colors p-0.5"
                                    aria-label={isCpExp ? 'Recolher' : 'Expandir'}
                                  >
                                    <BmeIcon
                                      name="chevron-right"
                                      className={`transition-transform ${isCpExp ? 'rotate-90' : ''}`}
                                      size={8}
                                    />
                                  </button>
                                  <span className="truncate flex-1 font-medium" title={cp}>{cp}</span>
                                  <span className="text-[9px] font-mono text-slate-400">{cpVars.length}</span>
                                </div>
                                {isCpExp && cpVars.map(v => (
                                  <button
                                    key={v['ID - REF']}
                                    onClick={() => onVariableClick && onVariableClick(v['ID - REF'])}
                                    title={`${v['ID - REF']}: ${v['DESCRIÇÃO']}`}
                                    className="w-full text-left flex items-center gap-1.5 py-0.5 px-2 ml-2 text-[9px] text-slate-400 hover:text-white hover:bg-slate-700/40 rounded transition-colors"
                                  >
                                    <span className="text-teal-400">•</span>
                                    <span className="font-mono font-bold text-teal-300 shrink-0">{v['ID - REF']}</span>
                                    <span className="truncate text-slate-300">— {v['DESCRIÇÃO']}</span>
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
      ) : (
        /* Recolhido: lista vertical com ícones compactos */
        <div className="flex-1 overflow-y-auto py-3 flex flex-col items-center gap-2">
          {uniqueSectorsList.map(sectorId => {
            const dbSector = sectors.find(s => s.id === sectorId);
            const friendly = dbSector ? dbSector.nome : getFriendlySectorName(sectorId);
            const isActive = activeSector === sectorId;
            return (
              <button
                key={sectorId}
                onClick={() => {
                  handleSelectSector(sectorId);
                  toggleExpand();
                }}
                title={friendly}
                className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-all relative group ${
                  isActive ? 'bg-teal-600 text-white shadow-sm' : 'bg-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                <BmeIcon name={sectorId} size={13} />
                <div className="absolute left-10 px-2 py-1 bg-slate-900 text-white text-[11px] font-bold rounded-md shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 border border-slate-700">
                  {friendly}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </aside>
  );
}
