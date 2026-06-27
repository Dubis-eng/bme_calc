import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Variable } from '../types';

interface FormulaEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  variables: Variable[];
  isLocked: boolean;
  onValidationChange: (isValid: boolean, errorMsg: string | null) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onBlur?: () => void;
  inputRef?: React.RefObject<HTMLTextAreaElement | null>;
}

const FUNCTIONS = new Set([
  'SE', 'SEERRO', 'SOMA', 'PROCV', 'LN', 'SUBTOTAL', 'SOMASES',
  'VAPOR_H', 'VAPOR_S', 'VAPOR_H_SAT', 'VAPOR_H_LIQ', 'VAPOR_H_PS', 'VAPOR_T_SAT', 'VAPOR_LATENT',
  'TRUE', 'FALSE', 'VERDADEIRO', 'FALSO'
]);

export const FormulaEditor: React.FC<FormulaEditorProps> = ({
  value,
  onChange,
  placeholder,
  variables,
  isLocked,
  onValidationChange,
  onKeyDown,
  onBlur,
  inputRef
}) => {
  const localRef = useRef<HTMLTextAreaElement | null>(null);
  const textareaRef = inputRef || localRef;
  const highlightRef = useRef<HTMLDivElement>(null);

  const [validationError, setValidationError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  // 1. Syntax highlighting formatter
  const renderHighlightedText = (text: string) => {
    if (!text.startsWith('=')) {
      return <span className="text-slate-300">{text}</span>;
    }

    // Split text into tokens keeping whitespaces/newlines
    const tokens = text.split(/([a-zA-Z_][a-zA-Z0-9_]*|\d+(?:\.\d+)?|"[^"]*"|'[^']*'|[+\-*^=<>!\u002f]+|[()])/);
    const knownIds = new Set(variables.map(v => v['ID - REF'].toUpperCase()));

    return tokens.map((token, index) => {
      if (!token) return null;

      const upperToken = token.toUpperCase();
      // Functions
      if (FUNCTIONS.has(upperToken)) {
        return <span key={index} className="text-cyan-400 font-semibold">{token}</span>;
      }
      // Known Variables
      if (knownIds.has(upperToken)) {
        return <span key={index} className="text-teal-400 font-bold">{token}</span>;
      }
      // Operators
      if (/^[+\-*^=<>!\u002f]+$/.test(token)) {
        return <span key={index} className="text-white font-medium">{token}</span>;
      }
      // Parentheses
      if (token === '(' || token === ')') {
        return <span key={index} className="text-slate-300 font-bold">{token}</span>;
      }
      // Numbers
      if (/^\d+(?:\.\d+)?$/.test(token)) {
        return <span key={index} className="text-amber-400 font-mono">{token}</span>;
      }
      // Strings
      if (/^(?:"[^"]*"|'[^']*')$/.test(token)) {
        return <span key={index} className="text-emerald-400">{token}</span>;
      }
      // Default
      return <span key={index} className="text-slate-500">{token}</span>;
    });
  };

  // 2. Real-time validation
  useEffect(() => {
    if (!value.trim()) {
      setValidationError(null);
      setWarnings([]);
      onValidationChange(true, null);
      return;
    }

    let criticalError: string | null = null;
    const currentWarnings: string[] = [];

    // Check parenthesis balance
    let openCount = 0;
    let closeCount = 0;
    for (let i = 0; i < value.length; i++) {
      if (value[i] === '(') openCount++;
      if (value[i] === ')') closeCount++;
    }

    if (openCount !== closeCount) {
      criticalError = `Parênteses desbalanceados: ${openCount} abertos e ${closeCount} fechados.`;
    }

    // Check variable spelling if starts with =
    if (value.startsWith('=')) {
      const knownIds = new Set(variables.map(v => v['ID - REF'].toUpperCase()));
      // Extract alphanumeric tokens that start with a letter
      const tokens = value.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g) || [];

      tokens.forEach(tok => {
        const upperTok = tok.toUpperCase();
        if (!FUNCTIONS.has(upperTok) && !knownIds.has(upperTok) && upperTok !== 'VAPOR') {
          currentWarnings.push(`Variável desconhecida detectada: "${tok}"`);
        }
      });
    }

    setValidationError(criticalError);
    setWarnings(currentWarnings);

    const hasCritical = criticalError !== null;
    onValidationChange(!hasCritical, criticalError || (currentWarnings.length > 0 ? currentWarnings[0] : null));
  }, [value, variables, onValidationChange]);

  // 3. Sync scroll and auto height
  const syncScrollAndHeight = useCallback(() => {
    const textarea = textareaRef.current;
    const highlight = highlightRef.current;
    if (textarea && highlight) {
      highlight.scrollTop = textarea.scrollTop;
      highlight.scrollLeft = textarea.scrollLeft;

      // Adjust height to content to prevent scrolling issues
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [textareaRef, highlightRef]);

  useEffect(() => {
    syncScrollAndHeight();
  }, [value, syncScrollAndHeight]);

  return (
    <div className="flex flex-col gap-2">
      <div className="relative w-full rounded-lg bg-slate-900 border border-slate-700/60 focus-within:ring-2 focus-within:ring-teal-500/50 focus-within:border-teal-500/40 overflow-hidden min-h-[64px]">
        {/* Underlay Highlighted Text */}
        <div
          ref={highlightRef}
          className="absolute inset-0 p-2.5 text-xs font-mono whitespace-pre-wrap break-all pointer-events-none border border-transparent overflow-hidden leading-relaxed text-slate-500"
          style={{ boxSizing: 'border-box' }}
        >
          {renderHighlightedText(value)}
        </div>

        {/* Textarea Input Overlay */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onScroll={syncScrollAndHeight}
          onKeyDown={onKeyDown}
          onBlur={onBlur}
          disabled={isLocked}
          placeholder={placeholder}
          className="absolute inset-0 w-full p-2.5 text-xs font-mono bg-transparent text-transparent caret-slate-200 resize-none outline-none border border-transparent overflow-hidden leading-relaxed focus:ring-0 focus:outline-none"
          style={{ boxSizing: 'border-box' }}
          rows={2}
          autoComplete="off"
          spellCheck="false"
        />
      </div>

      {/* Real-time Alerts */}
      {validationError && (
        <div className="text-[11px] font-semibold text-rose-400 bg-rose-950/20 border border-rose-900/40 px-3 py-1.5 rounded-md flex items-center gap-1.5">
          <span>⚠️ Erro:</span>
          <span>{validationError}</span>
        </div>
      )}

      {!validationError && warnings.length > 0 && (
        <div className="text-[11px] font-semibold text-amber-400 bg-amber-950/20 border border-amber-900/40 px-3 py-1.5 rounded-md flex flex-col gap-1">
          {warnings.map((warn, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <span>⚠️ Aviso:</span>
              <span>{warn}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
