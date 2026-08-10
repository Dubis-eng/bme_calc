import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Variable } from '../../types';

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

  // 1. Syntax highlighting formatter (light mode)
  const renderHighlightedText = (text: string) => {
    if (!text.startsWith('=')) {
      return <span className="text-gray-700">{text}</span>;
    }

    // Split text into tokens keeping whitespaces/newlines
    const tokens = text.split(/([a-zA-Z_][a-zA-Z0-9_]*|\d+(?:\.\d+)?|"[^"]*"|'[^']*'|[+\-*^=<>!\/]+|[()])/);
    const knownIds = new Set(variables.map(v => v['ID - REF'].toUpperCase()));

    return tokens.map((token, index) => {
      if (!token) return null;

      const upperToken = token.toUpperCase();
      // Functions
      if (FUNCTIONS.has(upperToken)) {
        return <span key={index} className="text-blue-600 font-semibold">{token}</span>;
      }
      // Known Variables
      if (knownIds.has(upperToken)) {
        return <span key={index} className="text-teal-700 font-bold">{token}</span>;
      }
      // Operators
      if (/^[+\-*^=<>!\/]+$/.test(token)) {
        return <span key={index} className="text-gray-500 font-medium">{token}</span>;
      }
      // Parentheses
      if (token === '(' || token === ')') {
        return <span key={index} className="text-gray-600 font-bold">{token}</span>;
      }
      // Numbers
      if (/^\d+(?:\.\d+)?$/.test(token)) {
        return <span key={index} className="text-amber-600 font-mono">{token}</span>;
      }
      // Strings
      if (/^(?:"[^"]*"|'[^']*')$/.test(token)) {
        return <span key={index} className="text-emerald-600">{token}</span>;
      }
      // Default
      return <span key={index} className="text-gray-400">{token}</span>;
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
      {/* Container com highlight + textarea transparente sobrepostos */}
      <div className="formula-editor-wrap">
        {/* Underlay: texto com highlight de sintaxe */}
        <div
          ref={highlightRef}
          className="absolute inset-0 p-3 text-sm font-mono whitespace-pre-wrap break-all pointer-events-none border border-transparent overflow-hidden leading-relaxed text-gray-400"
          style={{ boxSizing: 'border-box' }}
        >
          {renderHighlightedText(value)}
        </div>

        {/* Textarea transparente sobre o highlight */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onScroll={syncScrollAndHeight}
          onKeyDown={onKeyDown}
          onBlur={onBlur}
          disabled={isLocked}
          placeholder={placeholder}
          className="absolute inset-0 w-full p-3 text-sm font-mono bg-transparent text-transparent caret-gray-700 resize-none outline-none border border-transparent overflow-hidden leading-relaxed focus:ring-0 focus:outline-none placeholder-gray-300"
          style={{ boxSizing: 'border-box' }}
          rows={3}
          autoComplete="off"
          spellCheck="false"
        />
      </div>

      {/* Alertas inline */}
      {validationError && (
        <div className="flex items-start gap-2 text-sm text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2 rounded-lg animate-fade-in-up">
          <span className="shrink-0">⚠️</span>
          <div>
            <span className="font-semibold">Erro na fórmula: </span>
            <span>{validationError}</span>
          </div>
        </div>
      )}

      {!validationError && warnings.length > 0 && (
        <div className="flex flex-col gap-1 text-sm text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg animate-fade-in-up">
          {warnings.map((warn, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="shrink-0">⚠️</span>
              <div>
                <span className="font-semibold">Aviso: </span>
                <span>{warn}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {!validationError && warnings.length === 0 && value.startsWith('=') && (
        <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-lg animate-check-in">
          <span>✅</span>
          <span className="font-medium">Fórmula válida — sem erros de sintaxe detectados</span>
        </div>
      )}
    </div>
  );
};
