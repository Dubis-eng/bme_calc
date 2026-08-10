import React, { useMemo } from 'react';
import { Variable, Sector, FilterStatus } from '../../types';
import { getFriendlySectorName } from '../../utils/helpers';

interface StatusDashboardProps {
  sectors: Sector[];
  variables: Variable[];
  results: Record<string, { value: number | null; status: string }>;
  filter: FilterStatus;
  setFilter: (filter: FilterStatus) => void;
  onSectorClick: (sectorId: string) => void;
}

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
  ok:    { label: 'Convergido',  dot: 'status-dot-ok',    badge: 'badge-ok',    card: 'border-slate-200 hover:border-emerald-500' },
  error: { label: 'Com Erro',    dot: 'status-dot-error',  badge: 'badge-error', card: 'border-rose-300 hover:border-rose-500 bg-rose-50/20' },
  idle:  { label: 'Pendente',    dot: 'status-dot-idle',   badge: 'badge-idle',  card: 'border-slate-200 hover:border-teal-500' },
};

const FILTER_TABS: { id: FilterStatus; label: string }[] = [
  { id: 'all',   label: 'Todos' },
  { id: 'ok',    label: 'Convergido' },
  { id: 'error', label: 'Com Erro' },
  { id: 'idle',  label: 'Pendente' },
];

export function StatusDashboard({ sectors, variables, results, filter, setFilter, onSectorClick }: StatusDashboardProps) {
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
    <div className="flex-1 overflow-y-auto p-6 bg-white animate-fade-in-up">
      {/* ── Top Metrics ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Setores',        value: uniqueSectorIds.length, color: 'text-black'  },
          { label: 'Variáveis',      value: totalVars,              color: 'text-teal-700'   },
          { label: 'Convergidos',    value: okCount,                color: 'text-emerald-700'},
          { label: 'Erros Ativos',   value: errorTotal,             color: errorTotal > 0 ? 'text-rose-700' : 'text-emerald-700' },
        ].map(m => (
          <div key={m.label} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">{m.label}</p>
            <p className={`text-3xl font-extrabold font-mono ${m.color}`}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* ── Title + Filter ── */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-extrabold text-black">Visão Geral dos Setores</h2>
          <p className="text-xs text-slate-600 font-medium mt-0.5">Selecione um setor para visualizar e editar as variáveis</p>
        </div>
        <div className="flex gap-1 bg-slate-100 border border-slate-200 rounded-xl p-1 shadow-sm">
          {FILTER_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              aria-label={`Filtrar por ${tab.label}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === tab.id
                  ? 'bg-white text-teal-800 border border-slate-300 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-black hover:bg-white/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Sector Cards Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(s => {
          const cfg = STATUS_CONFIG[s.status];
          return (
            <button
              key={s.id}
              id={`sector-card-${s.id}`}
              onClick={() => onSectorClick(s.id)}
              className={`bg-white p-5 text-left group cursor-pointer border ${cfg.card} rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md`}
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

              <h3 className="text-base font-bold text-black mb-1 group-hover:text-teal-700 transition-colors">
                {s.name}
              </h3>
              <p className="text-xs text-slate-500 mb-3 font-mono font-semibold">{s.id}</p>

              <div className="flex items-center justify-between text-xs text-slate-700 font-semibold pt-3 border-t border-slate-200">
                <span>{s.totalVars} variáveis</span>
                <div className="flex gap-3">
                  <span className="text-teal-700 font-mono">{s.inputVars} in</span>
                  <span className="text-indigo-700 font-mono">{s.outputVars} out</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center h-48 text-slate-500 bg-white border border-slate-200 rounded-2xl mt-4">
          <span className="text-3xl mb-2">◎</span>
          <p className="text-sm font-semibold">Nenhum setor com status "{filter}"</p>
        </div>
      )}
    </div>
  );
}
