import React from 'react';

export function FlowchartPlaceholder() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 animate-fade-in-up">
      {/* ── Background grid decoration ── */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(20,184,166,0.8) 1px, transparent 1px),
            linear-gradient(90deg, rgba(20,184,166,0.8) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative z-10 max-w-lg text-center">
        {/* ── Icon ── */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-teal-600/20 to-cyan-600/10 border border-teal-500/20 flex items-center justify-center shadow-glow-teal">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="text-teal-500">
            <rect x="4" y="14" width="10" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
            <rect x="15" y="4" width="10" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
            <rect x="26" y="14" width="10" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
            <rect x="15" y="24" width="10" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
            <line x1="14" y1="20" x2="15" y2="20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="20" y1="16" x2="20" y2="24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="25" y1="20" x2="26" y2="20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>

        <h2 className="text-xl font-bold text-white mb-2">Fluxograma de Processo</h2>
        <p className="text-sm text-slate-400 mb-1">Extração do Caldo · Tratamento · Fermentação · Destilação</p>
        <p className="text-xs text-slate-600 mb-8">
          Visualização interativa dos fluxos de massa e energia com valores calculados em tempo real.
        </p>

        {/* ── Feature list ── */}
        <div className="grid grid-cols-2 gap-3 mb-8 text-left">
          {[
            { icon: '🔀', label: 'Nós interativos com drag-and-drop' },
            { icon: '📊', label: 'Valores de fluxo em tempo real' },
            { icon: '🎨', label: 'Coloração por status de convergência' },
            { icon: '🔍', label: 'Zoom e pan no diagrama' },
            { icon: '💾', label: 'Exportação em SVG/PNG' },
            { icon: '🔗', label: 'Rastreio de dependências visuais' },
          ].map(feat => (
            <div key={feat.label} className="flex items-start gap-2.5 glass-card p-3">
              <span className="text-base shrink-0">{feat.icon}</span>
              <span className="text-[11px] text-slate-400 leading-tight">{feat.label}</span>
            </div>
          ))}
        </div>

        {/* ── Tech stack info ── */}
        <div className="glass-card p-4 text-left">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 font-semibold">Stack Prevista</p>
          <div className="flex flex-wrap gap-2">
            {['@xyflow/react v12', 'React Flow', 'TypeScript', 'Custom Nodes', 'Edge Labels'].map(tech => (
              <span key={tech} className="badge-info">{tech}</span>
            ))}
          </div>
          <p className="text-[10px] text-emerald-500 mt-2 flex items-center gap-1">
            <span>✓</span>
            <span>@xyflow/react já instalado e pronto para uso</span>
          </p>
        </div>
      </div>
    </div>
  );
}
