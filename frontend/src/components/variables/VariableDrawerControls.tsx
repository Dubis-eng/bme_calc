import React from 'react';
import { FieldTooltip, TooltipPosition } from '../ui/Tooltip';

/* ── Toggle visual ──────────────────────────────────────────── */
export function Toggle({
  checked,
  onChange,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  id: string;
}) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`toggle-track ${checked ? 'on' : 'off'}`}
    >
      <span className="toggle-thumb" />
    </button>
  );
}

/* ── Section divider com título ─────────────────────────────── */
export function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-slate-50/60 p-4 rounded-2xl border border-slate-200/80 space-y-3">
      {title && <p className="section-heading mb-2">{title}</p>}
      {children}
    </div>
  );
}

/* ── Label com tooltip opcional ─────────────────────────────── */
export function FieldLabel({
  htmlFor,
  children,
  tooltip,
  tooltipPosition = 'top',
}: {
  htmlFor?: string;
  children: React.ReactNode;
  tooltip?: string;
  tooltipPosition?: TooltipPosition;
}) {
  return (
    <label htmlFor={htmlFor} className="field-label">
      {children}
      {tooltip && <FieldTooltip content={tooltip} position={tooltipPosition} />}
    </label>
  );
}
