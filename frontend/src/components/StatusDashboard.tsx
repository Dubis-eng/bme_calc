import React, { useMemo, useState } from 'react';
import { Variable, Sector } from '../types';
import { getFriendlySectorName } from '../utils/helpers';

interface StatusDashboardProps {
  sectors: Sector[];
  variables: Variable[];
  results: Record<string, { value: number | null; status: string }>;
  onSectorClick: (sectorId: string) => void;
}

type FilterStatus = 'all' | 'ok' | 'error' | 'idle';

interface SectorSummary {
  id: string;
  name: string;
  totalVars: number;
  inputVars: number;
  outputVars: number;
  errorCount: number;
  status: 'ok' | 'error' | 'idle';
}

function buildSectorSummary(
  sectors: Sector[],
  variables: Variable[],
  results: Record<string, { value: number | null; status: string }>,
  uniqueSectorIds: string[]
): SectorSummary[] {
  return uniqueSectorIds.map(id => {
    const dbSector  = sectors.find(s => s.id === id);
    const name      = dbSector ? dbSector.nome : getFriendlySectorName(id);
    const vars      = variables.filter(v => v.SETOR === id);
    const inputVars = vars.filter(v => v.TIPO === 'INPUT').length;
    const outputVars = vars.filter(v => v.TIPO !== 'INPUT').length;
    const errorCount = vars.filter(v => {
      const r = results[v['ID - REF']];
      return r && r.status !== 'OK' && r.status !== 'PENDING';
    }).length;

    let status: 'ok' | 'error' | 'idle' = 'idle';
    if (vars.length > 0 && Object.keys(results).length > 0) {
      status = errorCount > 0 ? 'error' : 'ok';
    }

    return { id, name, totalVars: vars.length, inputVars, outputVars, errorCount, status };
  });
}

const STATUS_CONFIG = {
  ok:    { label: 'Convergido',  dot: 'status-dot-ok',    badge: 'badge-ok',    card: 'border-emerald-500/20 hover:border-emerald-500/40' },
  error: { label: 'Com Erro',    dot: 'status-dot-error',  badge: 'badge-error', card: 'border-rose-500/20 hover:border-rose-500/40' },
  idle:  { label: 'Pendente',    dot: 'status-dot-idle',   badge: 'badge-idle',  card: 'border-slate-700/40 hover:border-teal-500/30' },
};

const FILTER_TABS: { id: FilterStatus; label: string }[] = [
  { id: 'all',   label: 'Todos' },
  { id: 'ok',    label: 'Convergido' },
  { id: 'error', label: 'Com Erro' },
  { id: 'idle',  label: 'Pendente' },
];

export function StatusDashboard({ sectors, variables, results, onSectorClick }: StatusDashboardProps) {
  const [filter, setFilter] = useState<FilterStatus>('all');

  const uniqueSectorIds = useMemo(() => Array.from(new Set([
    ...sectors.map(s => s.id),
    ...variables.map(v => v.SETOR),
  ])), [sectors, variables]);

  const summaries = useMemo(
    () => buildSectorSummary(sectors, variables, results, uniqueSectorIds),
    [sectors, variables, results, uniqueSectorIds]
  );

  const filtered = filter === 'all' ? summaries : summaries.filter(s => s.status === filter);
  const totalVars = variables.length;
  const errorTotal = summaries.reduce((acc, s) => acc + s.errorCount, 0);
  const okCount  = summaries.filter(s => s.status === 'ok').length;

  return (
    <div className="flex-1 overflow-y-auto p-6 animate-fade-in-up">
      {/* ── Top Metrics ── */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Setores',        value: uniqueSectorIds.length, color: 'text-slate-300'  },
          { label: 'Variáveis',      value: totalVars,              color: 'text-teal-400'   },
          { label: 'Convergidos',    value: okCount,                color: 'text-emerald-400'},
          { label: 'Erros Ativos',   value: errorTotal,             color: errorTotal > 0 ? 'text-rose-400' : 'text-emerald-400' },
        ].map(m => (
          <div key={m.label} className="glass-card p-4">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{m.label}</p>
            <p className={`text-2xl font-bold font-mono ${m.color}`}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* ── Title + Filter ── */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-white">Visão Geral dos Setores</h2>
          <p className="text-xs text-slate-500 mt-0.5">Selecione um setor para editar as variáveis</p>
        </div>
        <div className="flex gap-1 bg-slate-900/60 border border-slate-800/60 rounded-lg p-1">
          {FILTER_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1 rounded text-[11px] font-semibold transition-all ${
                filter === tab.id
                  ? 'bg-teal-600/20 text-teal-400 border border-teal-500/30'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Sector Cards Grid ── */}
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(s => {
          const cfg = STATUS_CONFIG[s.status];
          return (
            <button
              key={s.id}
              id={`sector-card-${s.id}`}
              onClick={() => onSectorClick(s.id)}
              className={`glass-card p-5 text-left group cursor-pointer border ${cfg.card} transition-all duration-200 hover:shadow-glow-teal`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={cfg.dot} />
                  <span className={cfg.badge}>{cfg.label}</span>
                </div>
                {s.errorCount > 0 && (
                  <span className="badge-error">{s.errorCount} erro{s.errorCount > 1 ? 's' : ''}</span>
                )}
              </div>

              <h3 className="text-sm font-bold text-white mb-1 group-hover:text-teal-300 transition-colors">
                {s.name}
              </h3>
              <p className="text-[10px] text-slate-600 mb-3 font-mono">{s.id}</p>

              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-3 border-t border-slate-800/60">
                <span>{s.totalVars} variáveis</span>
                <div className="flex gap-3">
                  <span className="text-teal-600">{s.inputVars} in</span>
                  <span className="text-cyan-700">{s.outputVars} out</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center h-48 text-slate-600">
          <span className="text-3xl mb-2">◎</span>
          <p className="text-sm">Nenhum setor com status "{filter}"</p>
        </div>
      )}
    </div>
  );
}
