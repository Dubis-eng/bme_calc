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
}

export function Sidebar({
  isSidebarExpanded,
  setIsSidebarExpanded,
  uniqueSectors,
  activeSector,
  setActiveSector,
  variables,
  sectors,
  onSubgroupClick
}: SidebarProps) {
  const [expandedSectors, setExpandedSectors] = useState<Record<string, boolean>>({});

  const handleSectorClick = (sectorId: string) => {
    setActiveSector(sectorId);
    setExpandedSectors(prev => ({
      ...prev,
      [sectorId]: !prev[sectorId]
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

          // Get unique subgroups for this sector
          const subgroups = Array.from(new Set(sectorVars.map(v => v.DEFINIÇÃO || 'GERAL')));

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

              {/* Nested Subgroups Tree */}
              {isSidebarExpanded && isExpanded && subgroups.length > 0 && (
                <div className="bg-slate-950/40 pl-8 pr-2 py-1 flex flex-col space-y-0.5 border-l border-slate-900 ml-6">
                  {subgroups.map((subgroup) => (
                    <button
                      key={subgroup}
                      onClick={() => onSubgroupClick(sectorId, subgroup)}
                      className="w-full text-left py-1.5 px-2.5 rounded text-[11px] text-slate-400 hover:text-white hover:bg-slate-900/30 truncate transition-colors flex items-center space-x-1.5"
                    >
                      <span className="text-slate-600 font-mono text-[9px]">•</span>
                      <span className="truncate">{subgroup}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
