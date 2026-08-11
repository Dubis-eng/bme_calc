import React, { useState } from 'react';
import { BmeIcon } from '../../styles/design-system';

export type ActiveTab = 'calculator' | 'harvest' | 'harvest_plan' | 'flowchart';

interface NavSidebarProps {
  activeTab: ActiveTab;
  setActiveTab?: (tab: ActiveTab) => void;
  onTabChange?: (tab: ActiveTab) => void;
  isNavExpanded?: boolean;
  isExpanded?: boolean;
  setIsNavExpanded?: React.Dispatch<React.SetStateAction<boolean>>;
  onToggleExpand?: () => void;
  onOpenConfig?: () => void;
  isOffline?: boolean;
}

const NAV_ITEMS: { id: ActiveTab; label: string; icon: string }[] = [
  { id: 'calculator', label: 'Calculadora',    icon: 'calculator' },
  { id: 'harvest',    label: 'Plano de Safra', icon: 'calendar' },
  { id: 'flowchart',  label: 'Fluxograma',     icon: 'workflow' },
];

export const NavSidebar: React.FC<NavSidebarProps> = ({
  activeTab,
  setActiveTab: propSetActiveTab,
  onTabChange,
  isNavExpanded: propIsNavExpanded,
  isExpanded,
  setIsNavExpanded: propSetIsNavExpanded,
  onToggleExpand,
  onOpenConfig,
}) => {
  const [internalExpanded, setInternalExpanded] = useState(true);

  const isExpandedActive = isExpanded ?? propIsNavExpanded ?? internalExpanded;

  const handleTabSelect = (tab: ActiveTab) => {
    if (onTabChange) onTabChange(tab);
    if (propSetActiveTab) propSetActiveTab(tab);
  };

  const handleToggleExpand = () => {
    if (onToggleExpand) {
      onToggleExpand();
    } else if (propSetIsNavExpanded) {
      propSetIsNavExpanded((prev) => !prev);
    } else {
      setInternalExpanded((prev) => !prev);
    }
  };

  return (
    <aside
      className={`flex flex-col bg-slate-900 text-white border-r border-slate-800 transition-all duration-300 shrink-0 z-30 select-none ${
        isExpandedActive ? 'w-52' : 'w-14'
      }`}
    >
      {/* ── Top Logo ── */}
      <div className="flex items-center gap-3 px-3 py-3 border-b border-slate-800/80 h-[56px]">
        <div className="h-8 w-8 bg-bme-teal rounded-lg flex items-center justify-center shrink-0 shadow-md">
          <BmeIcon name="zap" size={18} className="text-white" />
        </div>
        {isExpandedActive && (
          <div className="leading-none overflow-hidden truncate">
            <p className="text-xs font-bold text-white tracking-tight">BME Calc</p>
            <p className="text-[9px] text-slate-400 tracking-wide truncate">Balanço de Massa &amp; Energia</p>
          </div>
        )}
      </div>

      {/* ── Main Navigation Items ── */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id || (item.id === 'harvest' && activeTab === 'harvest_plan');
          return (
            <button
              key={item.id}
              onClick={() => handleTabSelect(item.id)}
              title={!isExpandedActive ? item.label : undefined}
              className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all duration-150 relative group ${
                isActive
                  ? 'bg-bme-teal text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60 font-medium'
              }`}
            >
              <span className={`shrink-0 flex items-center justify-center w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>
                <BmeIcon name={item.icon} size={18} />
              </span>

              {isExpandedActive ? (
                <span className="text-xs truncate tracking-wide">{item.label}</span>
              ) : (
                <div className="absolute left-16 px-2.5 py-1 bg-slate-900 text-white text-xs font-bold rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 border border-slate-700">
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* ── Bottom Section: Config & Collapse Toggle ── */}
      <div className="p-2 border-t border-slate-800/80 space-y-1">
        {onOpenConfig && (
          <button
            onClick={onOpenConfig}
            title={!isExpandedActive ? 'Configurações' : undefined}
            className="w-full flex items-center gap-3 p-2.5 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-xl text-xs font-medium transition-colors group relative"
          >
            <BmeIcon name="settings" size={18} className="shrink-0" />
            {isExpandedActive ? (
              <span className="truncate">Configurações</span>
            ) : (
              <div className="absolute left-16 px-2.5 py-1 bg-slate-900 text-white text-xs font-bold rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 border border-slate-700">
                Configurações
              </div>
            )}
          </button>
        )}

        <button
          onClick={handleToggleExpand}
          className="w-full flex items-center justify-center p-2 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-xl transition-colors"
          aria-label={isExpandedActive ? 'Recolher menu' : 'Expandir menu'}
          title={isExpandedActive ? 'Recolher menu' : 'Expandir menu'}
        >
          <BmeIcon name={isExpandedActive ? 'chevron-left' : 'chevron-right'} size={18} />
        </button>
      </div>
    </aside>
  );
};
