import React, { useState, useEffect } from 'react';

type ActiveTab = 'calculator' | 'harvest_plan' | 'flowchart';

interface HeaderProps {
  searchQuery: string;
  onSearchInput: (val: string) => void;
  iterations: number;
  handleCalculate: () => void;
  calculating: boolean;
  isLocked: boolean;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

type ConnectionStatus = 'connected' | 'disconnected' | 'checking';

function useBackendStatus(): ConnectionStatus {
  const [status, setStatus] = useState<ConnectionStatus>('checking');

  useEffect(() => {
    const check = () => {
      fetch('http://localhost:8000/api/sectors', { signal: AbortSignal.timeout(3000) })
        .then(() => setStatus('connected'))
        .catch(() => setStatus('disconnected'));
    };
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, []);

  return status;
}

const TABS: { id: ActiveTab; label: string; icon: string }[] = [
  { id: 'calculator',   label: 'Calculadora',   icon: '⚙️' },
  { id: 'harvest_plan', label: 'Plano de Safra', icon: '📆' },
  { id: 'flowchart',   label: 'Fluxograma',    icon: '🔀' },
];

export function Header({
  searchQuery,
  onSearchInput,
  iterations,
  handleCalculate,
  calculating,
  isLocked,
  activeTab,
  setActiveTab,
}: HeaderProps) {
  const connStatus = useBackendStatus();

  const statusColors: Record<ConnectionStatus, string> = {
    connected:    'bg-emerald-400',
    disconnected: 'bg-rose-400',
    checking:     'bg-amber-400',
  };
  const statusLabels: Record<ConnectionStatus, string> = {
    connected:    'Backend Conectado',
    disconnected: 'Desconectado',
    checking:     'Verificando...',
  };

  return (
    <header className="flex items-center justify-between bg-slate-950 border-b border-slate-800/60 px-5 py-0 z-20 h-[56px] shrink-0">
      {/* ── Logo ── */}
      <div className="flex items-center gap-3 min-w-[200px]">
        <div className="h-8 w-8 bg-gradient-to-tr from-teal-500 to-cyan-400 rounded-lg flex items-center justify-center font-black text-slate-950 text-lg shadow-glow-sm shrink-0">
          ⚡
        </div>
        <div className="leading-none">
          <p className="text-[13px] font-bold text-white tracking-tight">BME Calc</p>
          <p className="text-[10px] text-slate-500 tracking-wide">Balanço de Massa & Energia</p>
        </div>
      </div>

      {/* ── Tabs ── */}
      <nav className="flex items-center gap-0.5 bg-slate-900/60 border border-slate-800/60 rounded-xl p-1">
        {TABS.map(tab => (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* ── Right Side ── */}
      <div className="flex items-center gap-3 min-w-[200px] justify-end">
        {/* Connection status */}
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${statusColors[connStatus]} animate-pulse-dot`} />
          <span className="text-[10px] text-slate-500 hidden lg:block">{statusLabels[connStatus]}</span>
        </div>

        {/* Lock badge */}
        {isLocked && (
          <span className="badge-warn">🔒 Congelado</span>
        )}

        {/* Search (calculator only) */}
        {activeTab === 'calculator' && (
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs pointer-events-none">🔍</span>
            <input
              id="global-search"
              type="search"
              placeholder="Buscar variável..."
              value={searchQuery}
              onChange={e => onSearchInput(e.target.value)}
              onFocus={() => { if (searchQuery.trim()) onSearchInput(searchQuery); }}
              className="input-field pl-8 pr-3 py-1.5 w-44 text-xs"
              aria-label="Buscar variável por ID, Descrição ou Definição"
            />
          </div>
        )}

        {/* Iterations badge */}
        {iterations > 1 && activeTab === 'calculator' && (
          <span className="badge-info">{iterations} it.</span>
        )}

        {/* Calculate button */}
        {activeTab === 'calculator' && (
          <button
            id="btn-calculate"
            onClick={handleCalculate}
            disabled={calculating || isLocked}
            className="btn-primary flex items-center gap-2 px-4 py-1.5 text-xs"
          >
            {calculating && (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            <span>{calculating ? 'Calculando...' : '▶ Calcular'}</span>
          </button>
        )}
      </div>
    </header>
  );
}
