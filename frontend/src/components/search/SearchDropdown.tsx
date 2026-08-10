import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Variable } from '../../types';
import { BmeIcon, TYPE_BADGE } from '../../styles/design-system';

interface SearchDropdownProps {
  variables: Variable[];
  onSelectVariable: (varId: string) => void;
}

export const SearchDropdown: React.FC<SearchDropdownProps> = ({
  variables,
  onSelectVariable,
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dropdownCoords, setDropdownCoords] = useState<{ top: number; left: number; width: number } | null>(null);

  const results = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return variables.filter((v) => {
      const idMatch = v['ID - REF']?.toLowerCase().includes(q);
      const descMatch = v['DESCRIÇÃO']?.toLowerCase().includes(q);
      const eqMatch = String(v['EQUAÇÕES E VALORES'] || '').toLowerCase().includes(q);
      const sectorMatch = v['SETOR']?.toLowerCase().includes(q);
      return idMatch || descMatch || eqMatch || sectorMatch;
    }).slice(0, 30);
  }, [query, variables]);

  const updateCoords = () => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownCoords({
        top: rect.bottom + window.scrollY + 6,
        left: Math.max(16, rect.left + window.scrollX - 100),
        width: Math.max(380, rect.width + 120),
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updateCoords();
      window.addEventListener('resize', updateCoords);
      window.addEventListener('scroll', updateCoords, true);
    }
    return () => {
      window.removeEventListener('resize', updateCoords);
      window.removeEventListener('scroll', updateCoords, true);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        const portalEl = document.getElementById('search-dropdown-portal');
        if (portalEl && !portalEl.contains(e.target as Node)) {
          setIsOpen(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClear = () => {
    setQuery('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleSelect = (varId: string) => {
    onSelectVariable(varId);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative flex items-center">
        <span className="absolute left-3 text-slate-400 pointer-events-none">
          <BmeIcon name="search" size={14} />
        </span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          placeholder="Buscar variável (ex: EXTRACAO_ART)..."
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (query.trim().length > 0) setIsOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setIsOpen(false);
          }}
          className="w-64 xl:w-80 pl-8 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl text-black font-semibold placeholder-slate-400 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 transition-all shadow-sm"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 text-slate-400 hover:text-black text-xs font-bold w-4 h-4 flex items-center justify-center rounded-full hover:bg-slate-200/60"
            title="Limpar busca"
          >
            ✕
          </button>
        )}
      </div>

      {/* Dropdown de resultados via Portal para NUNCA atropelar o campo de busca */}
      {isOpen && query.trim().length > 0 && dropdownCoords && ReactDOM.createPortal(
        <div
          id="search-dropdown-portal"
          style={{
            position: 'absolute',
            top: `${dropdownCoords.top}px`,
            left: `${dropdownCoords.left}px`,
            width: `${dropdownCoords.width}px`,
          }}
          className="bg-white border border-slate-200 rounded-2xl shadow-2xl z-[99999] overflow-hidden animate-fade-in-up"
        >
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-[11px] font-bold text-slate-600">
            <span>Resultados para "{query}"</span>
            <span className="text-teal-700 font-mono">{results.length} encontrada(s)</span>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {results.length > 0 ? (
              results.map((v) => (
                <button
                  key={v['ID - REF']}
                  type="button"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    handleSelect(v['ID - REF']);
                  }}
                  onClick={() => handleSelect(v['ID - REF'])}
                  className="w-full text-left p-3 hover:bg-teal-50/60 transition-colors flex items-start gap-3 group cursor-pointer"
                >
                  <span
                    className={`mt-0.5 px-2 py-0.5 text-[9px] font-bold rounded-full border shrink-0 ${
                      TYPE_BADGE[v.TIPO] ?? 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {v.TIPO}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-black group-hover:text-teal-700">
                        {v['ID - REF']}
                      </span>
                      <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                        {v.SETOR}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium truncate mt-0.5">
                      {v['DESCRIÇÃO'] || 'Sem descrição'}
                    </p>
                    {v['EQUAÇÕES E VALORES'] && (
                      <p className="text-[10px] text-slate-500 font-mono truncate mt-0.5">
                        = {v['EQUAÇÕES E VALORES']}
                      </p>
                    )}
                  </div>
                </button>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-slate-500">
                Nenhuma variável encontrada para "{query}"
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
