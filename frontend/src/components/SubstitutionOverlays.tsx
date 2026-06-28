import React from 'react';

export const PIPELINE_STEPS = [
  { icon: '🔍', label: 'Mapeando dependências do grafo...' },
  { icon: '🧮', label: 'Calculando precedência matemática e parênteses...' },
  { icon: '💾', label: 'Persistindo novas equações no banco de dados...' },
  { icon: '🔄', label: 'Recarregando árvore de cálculos...' },
];

// ── Sub-component: Mini spinner for active step ───────────────────────────────
export const MiniSpinner: React.FC = () => (
  <>
    <style>{`@keyframes bme-spin{to{transform:rotate(360deg)}}`}</style>
    <span style={{ display: 'inline-block', width: '14px', height: '14px', border: '2px solid #0d9488', borderTopColor: 'transparent', borderRadius: '50%', animation: 'bme-spin 0.7s linear infinite', verticalAlign: 'middle' }} />
  </>
);

// ── Sub-component: SVG animated graph nodes ───────────────────────────────────
export const GraphPulseIcon: React.FC = () => (
  <svg width="56" height="36" viewBox="0 0 56 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <style>{`
      @keyframes bme-pulse-node { 0%,100%{opacity:.3;r:4} 50%{opacity:1;r:5.5} }
      @keyframes bme-dash { to{stroke-dashoffset:-20} }
      .bme-n1{animation:bme-pulse-node 1.4s ease-in-out infinite}
      .bme-n2{animation:bme-pulse-node 1.4s ease-in-out .3s infinite}
      .bme-n3{animation:bme-pulse-node 1.4s ease-in-out .6s infinite}
      .bme-n4{animation:bme-pulse-node 1.4s ease-in-out .9s infinite}
      .bme-edge{stroke-dasharray:6 4;animation:bme-dash 1s linear infinite}
    `}</style>
    <line x1="10" y1="18" x2="28" y2="8" stroke="#0d9488" strokeWidth="1.5" className="bme-edge" />
    <line x1="10" y1="18" x2="28" y2="28" stroke="#0d9488" strokeWidth="1.5" className="bme-edge" style={{animationDelay:'-.5s'}} />
    <line x1="28" y1="8" x2="46" y2="18" stroke="#14b8a6" strokeWidth="1.5" className="bme-edge" style={{animationDelay:'-.3s'}} />
    <line x1="28" y1="28" x2="46" y2="18" stroke="#14b8a6" strokeWidth="1.5" className="bme-edge" style={{animationDelay:'-.8s'}} />
    <circle cx="10" cy="18" r="4" fill="#0f766e" className="bme-n1" />
    <circle cx="28" cy="8"  r="4" fill="#0d9488" className="bme-n2" />
    <circle cx="28" cy="28" r="4" fill="#0d9488" className="bme-n3" />
    <circle cx="46" cy="18" r="4" fill="#2dd4bf" className="bme-n4" />
  </svg>
);

// ── Sub-component: Fase 1 — Mapping Overlay ──────────────────────────────────
export const MappingOverlay: React.FC<{ recursive: boolean }> = ({ recursive }) => (
  <div style={{ position: 'absolute', inset: 0, background: 'rgba(2,6,23,0.82)', backdropFilter: 'blur(3px)', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '16px' }}>
    <GraphPulseIcon />
    <p style={{ color: '#5eead4', fontSize: '11px', fontWeight: 600, textAlign: 'center', margin: 0 }}>
      {recursive ? 'Mapeando árvore de dependências a jusante recursivamente...' : 'Calculando impacto direto nas fórmulas...'}
    </p>
  </div>
);

// ── Sub-component: Fase 2 — Confirm Pipeline Overlay ─────────────────────────
export const ConfirmPipelineOverlay: React.FC<{ activeStep: number; progress: number }> = ({ activeStep, progress }) => (
  <div style={{ position: 'absolute', inset: 0, background: 'rgba(2,6,23,0.92)', backdropFilter: 'blur(4px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}>
    <div style={{ background: '#0f172a', border: '1px solid rgba(20,184,166,0.25)', borderRadius: '12px', padding: '28px 32px', minWidth: '320px', maxWidth: '420px', boxShadow: '0 0 40px rgba(20,184,166,0.08)' }}>
      <p style={{ color: '#f59e0b', fontWeight: 700, fontSize: '13px', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '16px' }}>⚡</span> Processando Substituição
      </p>

      {/* Progress bar */}
      <div style={{ background: '#1e293b', borderRadius: '99px', height: '6px', overflow: 'hidden', marginBottom: '20px' }}>
        <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg,#0d9488,#2dd4bf)', borderRadius: '99px', transition: 'width 0.4s ease' }} />
      </div>

      {/* Steps checklist */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {PIPELINE_STEPS.map((step, idx) => {
          const isDone = idx < activeStep;
          const isActive = idx === activeStep;
          return (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', opacity: idx > activeStep ? 0.35 : 1, transition: 'opacity 0.3s' }}>
              <span style={{ fontSize: '15px', minWidth: '22px', textAlign: 'center' }}>
                {isDone ? '✅' : isActive ? <MiniSpinner /> : '⬜'}
              </span>
              <span style={{ fontSize: '11px', color: isDone ? '#34d399' : isActive ? '#5eead4' : '#64748b', fontWeight: isActive ? 600 : 400 }}>
                {step.icon} {step.label}
              </span>
            </div>
          );
        })}
      </div>

      <p style={{ color: '#475569', fontSize: '10px', marginTop: '18px', textAlign: 'center' }}>
        Por favor, não feche esta janela...
      </p>
    </div>
  </div>
);
