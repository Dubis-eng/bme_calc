import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Variable } from '../../types';
import { BmeIcon, TYPE_BADGE } from '../../styles/design-system';

interface SearchDropdownProps {
  variables?: Variable[];
  onSelectVariable?: (varId: string) => void;
  onSelect?: (varId: string) => void;
}

export const SearchDropdown: React.FC<SearchDropdownProps> = ({
  variables = [],
  onSelectVariable,
  onSelect,
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dropdownCoords, setDropdownCoords] = useState<{ top: number; left: number; width: number } | null>(null);

  const results = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return (variables || []).filter((v) => {
      if (!v) return false;
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
        !containerRef.current.contains(e.target as Node) &&
        !(e.target as HTMLElement).closest('.search-dropdown-portal')
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (varId: string) => {
    if (onSelectVariable) onSelectVariable(varId);
    if (onSelect) onSelect(varId);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div ref={containerRef} className="relative w-64 md:w-80">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Buscar variável (ex: EXTRACAO_ART)..."
          className="w-full bg-slate-50 border border-slate-300 rounded-xl py-1.5 pl-9 pr-8 text-xs font-semibold text-black placeholder:text-slate-600 focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none transition-all shadow-sm"
        />
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
          <BmeIcon name="search" size={14} />
        </div>
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setIsOpen(false);
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold p-0.5"
            aria-label="Limpar busca"
          >
            ✕
          </button>
        )}
      </div>

      {/* Portal Dropdown Menu */}
      {isOpen && query.trim() !== '' && dropdownCoords && ReactDOM.createPortal(
        <div
          className="search-dropdown-portal fixed z-[9999] bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden max-h-[380px] flex flex-col animate-fade-in-up"
          style={{
            top: `${dropdownCoords.top}px`,
            left: `${dropdownCoords.left}px`,
            width: `${dropdownCoords.width}px`,
          }}
        >
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-[10px] uppercase font-bold text-slate-500">
            <span>Resultados da Busca</span>
            <span>{results.length} encontrado(s)</span>
          </div>

          <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
            {results.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500">
                Nenhuma variável encontrada para "<span className="font-semibold text-slate-700">{query}</span>"
              </div>
            ) : (
              results.map((v) => (
                <button
                  key={v['ID - REF']}
                  type="button"
                  onClick={() => handleSelect(v['ID - REF'])}
                  className="w-full text-left p-3 hover:bg-teal-50/60 transition-colors flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex flex-col min-w-0 pr-2">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono font-bold text-xs text-black group-hover:text-teal-700 transition-colors truncate">
                        {v['ID - REF']}
                      </span>
                      <span
                        className={`px-1.5 py-0.2 text-[9px] font-bold rounded-full border ${
                          TYPE_BADGE[v.TIPO] ?? 'bg-slate-100 text-slate-700 border-slate-300'
                        }`}
                      >
                        {v.TIPO}
                      </span>
                    </div>
                    <span className="text-xs text-slate-600 truncate font-medium">
                      {v['DESCRIÇÃO'] || 'Sem descrição'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                      Setor: {v.SETOR}
                    </span>
                  </div>
                  <span className="text-teal-600 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold shrink-0">
                    Ir →
                  </span>
                </button>
              ))
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
