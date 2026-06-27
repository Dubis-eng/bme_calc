import React from 'react';
import { Variable } from '../types';

interface DropdownProps {
  isOpen: boolean;
  results: import('../utils/useEquationAutocomplete').AutocompleteResult[];
  selectedIndex: number;
  token: string;
  onSelect: (variable: Variable) => void;
}

export function HighlightMatch({ text, token }: { text: string; token: string }) {
  const idx = text.toLowerCase().indexOf(token.toLowerCase());
  if (idx === -1) return <span>{text}</span>;
  return (
    <span>
      {text.slice(0, idx)}
      <mark className="bg-yellow-200 text-yellow-900 font-semibold rounded-sm px-0.5 not-italic">
        {text.slice(idx, idx + token.length)}
      </mark>
      {text.slice(idx + token.length)}
    </span>
  );
}

export function EquationDropdown({ isOpen, results, selectedIndex, token, onSelect }: DropdownProps) {
  if (!isOpen || results.length === 0) return null;

  return (
    <ul
      role="listbox"
      aria-label="Sugestões de variáveis"
      className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700/60 rounded-lg shadow-xl z-50 max-h-52 overflow-y-auto"
    >
      {results.map(({ variable, matchedField }, index) => {
        const varId = variable['ID - REF'];
        const varDesc = variable['DESCRIÇÃO'];
        const isSelected = index === selectedIndex;

        return (
          <li
            key={varId}
            role="option"
            aria-selected={isSelected}
            onMouseDown={(e) => { e.preventDefault(); onSelect(variable); }}
            className={`flex items-center gap-2 px-3 py-2 cursor-pointer text-xs transition-colors ${
              isSelected ? 'bg-teal-50 border-l-2 border-teal-500' : 'hover:bg-slate-50'
            }`}
          >
            <span className="font-mono font-bold text-teal-600 flex-shrink-0">
              {matchedField === 'id' ? <HighlightMatch text={varId} token={token} /> : varId}
            </span>
            <span className="text-slate-400">—</span>
            <span className="text-slate-600 truncate">
              {matchedField === 'description' ? <HighlightMatch text={varDesc} token={token} /> : varDesc}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
