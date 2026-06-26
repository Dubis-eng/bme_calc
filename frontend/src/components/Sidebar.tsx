import React, { useState } from 'react';
import { Variable, Sector } from '../types';
import { getFriendlySectorName } from '../utils/helpers';

interface SidebarProps {
  isSidebarExpanded: boolean;
  setIsSidebarExpanded: (val: boolean) => void;
  uniqueSectors: string[];
  activeSector: string;
  setActiveSector: (val: string) => void;
  variables: Variable[];
  sectors: Sector[];
  onSubgroupClick: (sectorId: string, subgroupName: string) => void;
  onVariableClick: (varId: string) => void;
}

export function Sidebar({
  isSidebarExpanded,
  setIsSidebarExpanded,
  uniqueSectors,
  activeSector,
  setActiveSector,
  variables,
  sectors,
  onSubgroupClick,
  onVariableClick
}: SidebarProps) {
  const [expandedSectors, setExpandedSectors] = useState<Record<string, boolean>>({});
  const [expandedStages, setExpandedStages] = useState<Record<string, boolean>>({});
  const [expandedCps, setExpandedCps] = useState<Record<string, boolean>>({});

  const handleSectorClick = (sectorId: string) => {
    setActiveSector(sectorId);
    setExpandedSectors(prev => ({
      ...prev,
      [sectorId]: !prev[sectorId]
    }));
  };

  const handleStageClick = (e: React.MouseEvent, sectorId: string, stageName: string) => {
    e.stopPropagation();
    setExpandedStages(prev => ({
      ...prev,
      [`${sectorId}:${stageName}`]: !prev[`${sectorId}:${stageName}`]
    }));
  };

  const handleCpClick = (e: React.MouseEvent, sectorId: string, stageName: string, cpName: string) => {
    e.stopPropagation();
    setExpandedCps(prev => ({
      ...prev,
      [`${sectorId}:${stageName}:${cpName}`]: !prev[`${sectorId}:${stageName}:${cpName}`]
    }));
  };

  return (
    <aside className={`flex flex-col bg-slate-950 text-slate-300 border-r border-slate-800 transition-all duration-300 ${isSidebarExpanded ? 'w-64' : 'w-16'}`}>
      <div className="flex justify-between items-center p-4 border-b border-slate-900 bg-slate-950/50">
        {isSidebarExpanded && <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Setores</span>}
        <button
          onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
          className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors focus:outline-none ml-auto"
          aria-label={isSidebarExpanded ? "Recolher menu" : "Expandir menu"}
        >
          {isSidebarExpanded ? '◀' : '▶'}
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto py-2">
        {uniqueSectors.map((sectorId) => {
          const dbSector = sectors.find(s => s.id === sectorId);
          const friendly = dbSector ? dbSector.nome : getFriendlySectorName(sectorId);
          const initials = friendly.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
          
          const sectorVars = variables.filter(v => v.SETOR === sectorId);
          const count = sectorVars.length;
          const isActive = activeSector === sectorId;
          const isExpanded = !!expandedSectors[sectorId];

          // Get unique stages (ETAPA) for this sector
          const stages = Array.from(new Set(sectorVars.map(v => v.ETAPA || 'GERAL')));

          return (
            <div key={sectorId} className="flex flex-col">
              <button
                onClick={() => handleSectorClick(sectorId)}
                className={`w-full flex items-center p-3 text-left transition-all relative ${isActive ? 'bg-gradient-to-r from-teal-900/40 to-cyan-900/10 text-white font-semibold border-l-4 border-teal-500' : 'hover:bg-slate-900/50 text-slate-400 hover:text-slate-200'}`}
                title={friendly}
              >
                {isSidebarExpanded && (
                  <span className="text-[9px] text-slate-500 mr-2 transition-transform duration-200">
                    {isExpanded ? '▼' : '▶'}
                  </span>
                )}
                <span className={`flex-shrink-0 h-6 w-6 rounded flex items-center justify-center text-[10px] font-bold ${isActive ? 'bg-teal-600 text-white' : 'bg-slate-800 text-slate-500'}`}>
                  {initials}
                </span>
                {isSidebarExpanded && (
                  <div className="ml-3 flex-1 flex justify-between items-center min-w-0">
                    <span className="truncate text-xs">{friendly}</span>
                    <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-500 ml-2">{count}</span>
                  </div>
                )}
              </button>

              {/* Nested Stages and Control Points Tree */}
              {isSidebarExpanded && isExpanded && stages.length > 0 && (
                <div className="bg-slate-950/40 pl-4 pr-1 py-1 flex flex-col space-y-1 border-l border-slate-900 ml-6">
                  {stages.map((stage) => {
                    const isStageExpanded = !!expandedStages[`${sectorId}:${stage}`];
                    const stageVars = sectorVars.filter(v => (v.ETAPA || 'GERAL') === stage);
                    const controlPoints = Array.from(new Set(stageVars.map(v => v["PONTO DE CONTROLE"] || 'GERAL')));

                    return (
                      <div key={stage} className="flex flex-col">
                        <button
                          onClick={(e) => handleStageClick(e, sectorId, stage)}
                          className="w-full text-left py-1 px-2 rounded text-[11px] font-bold text-slate-400 hover:text-slate-200 hover:bg-slate-900/30 truncate transition-colors flex items-center justify-between"
                        >
                          <div className="flex items-center space-x-1.5 min-w-0">
                            <span className="text-[8px] text-slate-600">
                              {isStageExpanded ? '▼' : '▶'}
                            </span>
                            <span className="truncate">{stage}</span>
                          </div>
                          <span className="text-[9px] bg-slate-900/80 px-1.5 py-0.2 rounded text-slate-500">{stageVars.length}</span>
                        </button>

                        {/* Control Points */}
                        {isStageExpanded && controlPoints.length > 0 && (
                          <div className="pl-4 py-0.5 flex flex-col space-y-0.5 border-l border-slate-900/50 ml-3">
                            {controlPoints.map((cp) => {
                              const isCpExpanded = !!expandedCps[`${sectorId}:${stage}:${cp}`];
                              const cpVars = stageVars.filter(v => (v["PONTO DE CONTROLE"] || 'GERAL') === cp);

                              return (
                                <div key={cp} className="flex flex-col">
                                  <div
                                    onClick={() => onSubgroupClick(sectorId, cp)}
                                    className="w-full flex items-center justify-between py-1 px-2 rounded text-[10px] text-slate-500 hover:text-teal-400 hover:bg-teal-950/20 cursor-pointer transition-colors"
                                  >
                                    <div className="flex items-center space-x-1.5 min-w-0 flex-1">
                                      <button
                                        onClick={(e) => handleCpClick(e, sectorId, stage, cp)}
                                        className="text-[8px] text-slate-600 focus:outline-none p-0.5 hover:text-slate-200 transition-colors"
                                        aria-label={isCpExpanded ? "Recolher variáveis" : "Expandir variáveis"}
                                      >
                                        {isCpExpanded ? '▼' : '▶'}
                                      </button>
                                      <span className="truncate" title={cp}>{cp}</span>
                                    </div>
                                    <span className="text-[9px] bg-slate-900/60 px-1.5 py-0.1 rounded text-slate-500">{cpVars.length}</span>
                                  </div>

                                  {/* Variables inside Control Point */}
                                  {isCpExpanded && cpVars.length > 0 && (
                                    <div className="pl-4 py-0.5 flex flex-col space-y-0.5 border-l border-slate-900/30 ml-2">
                                      {cpVars.map((v) => {
                                        const id = v['ID - REF'];
                                        return (
                                          <button
                                            key={id}
                                            onClick={() => onVariableClick(id)}
                                            className="w-full text-left py-0.5 px-2 rounded text-[9px] text-slate-500 hover:text-teal-400 hover:bg-teal-950/10 truncate transition-colors flex items-center space-x-1.5"
                                            title={`${id}: ${v['DESCRIÇÃO']}`}
                                          >
                                            <span className="text-teal-900 text-[6px]">•</span>
                                            <span className="truncate font-mono font-semibold text-teal-600">{id}</span>
                                            <span className="truncate text-slate-400">— {v['DESCRIÇÃO']}</span>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
