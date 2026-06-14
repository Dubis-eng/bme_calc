import React from 'react';
import { SearchResult, SearchMatch } from '../utils/useVariableSearch';

// --- Types ---

interface SearchPanelProps {
  isOpen: boolean;
  query: string;
  results: SearchResult[];
  onClose: () => void;
  onScrollTo: (varId: string) => void;
  onEdit: (varId: string) => void;
}

// --- Sub-components ---

function HighlightedSnippet({ match }: { match: SearchMatch }) {
  const fieldLabel: Record<SearchMatch['field'], string> = {
    id: 'ID',
    description: 'Descrição',
    definition: 'Definição',
  };

  return (
    <p className="text-[10px] text-slate-400 mt-0.5 truncate">
      <span className="text-slate-500 font-semibold">{fieldLabel[match.field]}: </span>
      {match.pre}
      <mark className="bg-yellow-200 text-yellow-900 font-semibold rounded-sm px-0.5 not-italic">
        {match.match}
      </mark>
      {match.post}
    </p>
  );
}

function ResultCard({
  result,
  onScrollTo,
  onEdit,
}: {
  result: SearchResult;
  onScrollTo: (id: string) => void;
  onEdit: (id: string) => void;
}) {
  const varId = result.variable['ID - REF'];
  const description = result.variable['DESCRIÇÃO'];

  const handleClick = () => onScrollTo(varId);
  const handleDoubleClick = () => onEdit(varId);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      className="group p-3 rounded-lg border border-slate-200 bg-white hover:border-teal-400 hover:shadow-md cursor-pointer transition-all"
      aria-label={`Variável ${varId}. Clique para navegar, duplo-clique para editar.`}
    >
      <div className="flex justify-between items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-slate-800 truncate">
            <span className="text-teal-600">{varId}</span>
            {description && (
              <span className="text-slate-500 font-medium"> — {description}</span>
            )}
          </p>
          <HighlightedSnippet match={result.matchedField} />
          <p className="text-[10px] text-slate-400 mt-0.5">
            Setor: <span className="text-slate-500">{result.sector}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onEdit(varId); }}
          className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-teal-600 hover:text-teal-700 hover:bg-teal-50 p-1.5 rounded transition-all focus:outline-none focus:opacity-100 text-xs"
          aria-label={`Editar variável ${varId}`}
          title="Editar variável"
        >
          ✏️
        </button>
      </div>
    </div>
  );
}

// --- Main Component ---

export const SearchPanel: React.FC<SearchPanelProps> = ({
  isOpen,
  query,
  results,
  onClose,
  onScrollTo,
  onEdit,
}) => {
  return (
    <aside
      className={`fixed top-0 right-0 h-full w-80 bg-slate-50 border-l border-slate-200 shadow-2xl z-30 flex flex-col transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
      aria-label="Painel de busca de variáveis"
    >
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900 text-white border-b border-slate-800">
        <div>
          <p className="text-sm font-bold">Busca de Variáveis</p>
          {query.trim().length > 0 && (
            <p className="text-[10px] text-slate-400">
              {results.length} resultado{results.length !== 1 ? 's' : ''} para &quot;{query}&quot;
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1.5 rounded hover:bg-slate-800 transition-colors focus:outline-none"
          aria-label="Fechar painel de busca"
        >
          ✕
        </button>
      </div>

      {/* Results list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {query.trim().length === 0 && (
          <p className="text-center text-xs text-slate-400 mt-8 px-4">
            Digite na barra de busca para localizar variáveis por ID, Descrição ou Definição.
          </p>
        )}

        {query.trim().length > 0 && results.length === 0 && (
          <p className="text-center text-xs text-slate-400 mt-8 px-4">
            Nenhuma variável encontrada para &quot;{query}&quot;.
          </p>
        )}

        {results.map((result) => (
          <ResultCard
            key={result.variable['ID - REF']}
            result={result}
            onScrollTo={onScrollTo}
            onEdit={onEdit}
          />
        ))}
      </div>

      {/* Footer hint */}
      {results.length > 0 && (
        <div className="px-4 py-2 bg-slate-100 border-t border-slate-200">
          <p className="text-[10px] text-slate-400 text-center">
            Clique para navegar • Duplo-clique ou ✏️ para editar
          </p>
        </div>
      )}
    </aside>
  );
};
