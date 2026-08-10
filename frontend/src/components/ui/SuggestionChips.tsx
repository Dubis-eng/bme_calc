import React from 'react';

interface SuggestionChipsProps {
  suggestions: string[];
  onSelect: (value: string) => void;
  current?: string;
  label?: string;
}

/**
 * Chips clicáveis para sugestão rápida de valores em campos de autocomplete.
 * Exibe os valores existentes no sistema para facilitar a organização.
 */
export const SuggestionChips: React.FC<SuggestionChipsProps> = ({
  suggestions,
  onSelect,
  current,
  label = 'Sugestões:',
}) => {
  if (suggestions.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
      <span className="text-[10px] text-gray-400 font-medium shrink-0">{label}</span>
      {suggestions.slice(0, 8).map((s) => {
        const isSelected = s === current;
        return (
          <button
            key={s}
            type="button"
            onClick={() => onSelect(s)}
            className={`
              px-2 py-0.5 rounded-full text-[11px] font-medium border transition-all duration-100
              ${isSelected
                ? 'bg-teal-50 text-teal-700 border-teal-300 cursor-default'
                : 'bg-white text-gray-600 border-gray-200 hover:border-teal-300 hover:text-teal-700 hover:bg-teal-50 cursor-pointer'
              }
            `}
            aria-pressed={isSelected}
          >
            {s}
          </button>
        );
      })}
    </div>
  );
};
