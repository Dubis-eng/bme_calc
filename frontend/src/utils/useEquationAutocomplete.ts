import { useState, useMemo } from 'react';
import { Variable } from '../types';

// --- Constants ---

const OPERATOR_CHARS = new Set(['+', '-', '*', '/', ';', '(', '=']);
const MAX_RESULTS = 8;

// --- Types ---

export interface AutocompleteResult {
  variable: Variable;
  matchedField: 'id' | 'description';
}

export interface InjectionResult {
  newFormula: string;
  newCursorPos: number;
}

// --- Token extraction helper ---

function extractToken(formula: string, cursor: number): { token: string; tokenStart: number } {
  const beforeCursor = formula.slice(0, cursor);
  let lastOpIdx = -1;

  for (let i = beforeCursor.length - 1; i >= 0; i--) {
    if (OPERATOR_CHARS.has(beforeCursor[i])) {
      lastOpIdx = i;
      break;
    }
  }

  const tokenStart = lastOpIdx + 1;
  const token = beforeCursor.slice(tokenStart);
  return { token, tokenStart };
}

// --- Filter helper ---

function filterVariables(variables: Variable[], token: string): AutocompleteResult[] {
  const lower = token.toLowerCase();
  const results: AutocompleteResult[] = [];

  for (const variable of variables) {
    if (results.length >= MAX_RESULTS) break;
    const idMatch = variable['ID - REF'].toLowerCase().includes(lower);
    const descMatch = variable['DESCRIÇÃO'].toLowerCase().includes(lower);
    if (idMatch) results.push({ variable, matchedField: 'id' });
    else if (descMatch) results.push({ variable, matchedField: 'description' });
  }

  return results;
}

// --- Hook ---

export function useEquationAutocomplete(variables: Variable[]) {
  const [token, setToken] = useState('');
  const [tokenStart, setTokenStart] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const results = useMemo(
    () => (isOpen && token.length >= 1 ? filterVariables(variables, token) : []),
    [variables, token, isOpen],
  );

  const handleInputChange = (formula: string, cursor: number) => {
    const { token: tok, tokenStart: start } = extractToken(formula, cursor);
    if (tok.length >= 1) {
      setToken(tok);
      setTokenStart(start);
      setSelectedIndex(0);
      setIsOpen(true);
    } else {
      setIsOpen(false);
      setToken('');
    }
  };

  const buildInjection = (variable: Variable, formula: string, cursor: number): InjectionResult => {
    const selectedId = variable['ID - REF'];
    const newFormula = formula.slice(0, tokenStart) + selectedId + formula.slice(cursor);
    const newCursorPos = tokenStart + selectedId.length;
    setIsOpen(false);
    setToken('');
    return { newFormula, newCursorPos };
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
    formula: string,
    cursor: number,
  ): InjectionResult | null => {
    if (!isOpen || results.length === 0) return null;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % results.length);
      return null;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
      return null;
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % results.length);
      return null;
    }
    if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      return buildInjection(results[selectedIndex].variable, formula, cursor);
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      return null;
    }
    return null;
  };

  const selectResult = (variable: Variable, formula: string, cursor: number): InjectionResult =>
    buildInjection(variable, formula, cursor);

  const dismiss = () => {
    setIsOpen(false);
    setToken('');
  };

  return { isOpen, results, selectedIndex, token, handleInputChange, handleKeyDown, selectResult, dismiss };
}
