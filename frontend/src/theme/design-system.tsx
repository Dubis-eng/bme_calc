import React from 'react';

// ── Variable Type Badges ─────────────────────────────────────
export const TYPE_BADGE: Record<string, string> = {
  INPUT:    'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  CENARIO:  'bg-blue-500/15    text-blue-400    border-blue-500/25',
  DERIVADA: 'bg-cyan-500/15    text-cyan-400    border-cyan-500/25',
  OUTPUT:   'bg-violet-500/15  text-violet-400  border-violet-500/25',
};

// ── Convergence & Calculation Errors ─────────────────────────
export const ERROR_BADGE: Record<string, string> = {
  DIV_BY_ZERO:  'bg-rose-500/15   text-rose-400   border-rose-500/25',
  MISSING_VAR:  'bg-amber-500/15  text-amber-400  border-amber-500/25',
};

// ── Scenario Status Badges ───────────────────────────────────
export const SCENARIO_STATUS_BADGE: Record<string, string> = {
  'Em Edição': 'badge-info',
  'Aprovado':  'badge-ok',
  'Final':     'badge-warn',
};

// ── Sector Icons Map ─────────────────────────────────────────
export const SECTOR_ICONS: Record<string, string> = {
  moenda:       'gear',
  tratamento:   'flask',
  fermentacao:  'bubbles',
  destilacao:   'factory',
  geracao:      'bolt',
  utilidades:   'wrench',
  caldeira:     'fire',
  evaporacao:   'droplet',
  cristalizacao:'crystal',
  centrifugacao:'spinner',
  secagem:      'sun',
};

export type BmeIconName =
  | 'pencil'
  | 'chevron-right'
  | 'chevron-down'
  | 'chevron-left'
  | 'lock'
  | 'warning'
  | 'close'
  | 'gear'
  | 'flask'
  | 'bubbles'
  | 'factory'
  | 'bolt'
  | 'wrench'
  | 'fire'
  | 'droplet'
  | 'crystal'
  | 'spinner'
  | 'sun'
  | 'plus'
  | 'eye'
  | 'default';

interface BmeIconProps {
  name: BmeIconName | string;
  className?: string;
  size?: number;
}

export const BmeIcon: React.FC<BmeIconProps> = ({ name, className = 'shrink-0', size = 16 }) => {
  const iconName = (SECTOR_ICONS[name.toLowerCase()] || name) as BmeIconName;

  const renderPath = () => {
    switch (iconName) {
      case 'pencil': return <path d="M9.5 1.5a1.415 1.415 0 0 1 2 2L4 11H1.5V8.5L9.5 1.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />;
      case 'chevron-right': return <path d="M4.5 2.5l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />;
      case 'chevron-down': return <path d="M2.5 4.5l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />;
      case 'chevron-left': return <path d="M9.5 2.5l-5 5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />;
      case 'lock':
        return <><rect x="3" y="6" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" /><path d="M5 6V4.5a3 3 0 0 1 6 0V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></>;
      case 'warning':
        return <><path d="M8 2l7 12H1L8 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><line x1="8" y1="6" x2="8" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><circle cx="8" cy="12" r="0.5" fill="currentColor" /></>;
      case 'eye':
        return <><path d="M1 8s3-5.5 7-5.5S15 8 15 8s-3 5.5-7 5.5S1 8 1 8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5" /></>;
      case 'close': return <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />;
      case 'gear':
        return <><circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.5" /><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3 3l1.5 1.5M11.5 11.5L13 13M3 13l1.5-1.5M11.5 4.5L13 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></>;
      case 'flask': return <path d="M5 2h6M8 2v4l-5 7a1.5 1.5 0 0 0 1.25 2.25h7.5A1.5 1.5 0 0 0 13 13L8 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />;
      case 'bubbles':
        return <><circle cx="5" cy="11" r="2" stroke="currentColor" strokeWidth="1.5" /><circle cx="11" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.5" /><circle cx="4" cy="4" r="1" stroke="currentColor" strokeWidth="1.5" /><circle cx="12" cy="12" r="1.5" stroke="currentColor" strokeWidth="1.5" /></>;
      case 'factory': return <path d="M2 14V8l4 3V8l4 3V5l4 3v6H2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />;
      case 'bolt': return <path d="M9 2L3 9h5l-2 5 8-7H9l2-5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />;
      case 'wrench': return <path d="M11.5 2.5a3 3 0 0 0-4.24 0L6 3.76l-3.5 3.5a2.5 2.5 0 0 0 3.53 3.53l3.5-3.5 1.25-1.25a3 3 0 0 0 0-4.24zM4.5 9L3 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />;
      case 'fire': return <path d="M8 15c3.5 0 6-2.5 6-6 0-3-2-5.5-4-7-1 2.5-3 3-4 4.5C5 5 4 3 4 3c-2 2-3 4.5-3 6.5 0 3.5 3 5.5 7 5.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />;
      case 'droplet': return <path d="M8 14.5c3.5 0 6-2.5 6-6C14 5 8 1.5 8 1.5S2 5 2 8.5c0 3.5 2.5 6 6 6z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />;
      case 'crystal': return <path d="M8 1.5L14.5 8 8 14.5 1.5 8 8 1.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />;
      case 'spinner': return <path d="M8 1.5a6.5 6.5 0 1 1-6.5 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />;
      case 'sun':
        return <><circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" /><path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3.05 3.05l1.06 1.06M11.89 11.89l1.06 1.06M3.05 12.95l1.06-1.06M11.89 4.11l1.06-1.06" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></>;
      case 'plus': return <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />;
      default: return <path d="M8 2.5L10 6l3.5.5-2.5 2.5.5 3.5-3.5-2-3.5 2 .5-3.5-2.5-2.5 3.5-.5L8 2.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />;
    }
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {renderPath()}
    </svg>
  );
};
