import React from 'react';
import { SearchResult, SearchMatch } from '../../utils/useVariableSearch';
import { BmeIcon } from '../../theme/design-system';

interface SearchPanelProps {
  isOpen: boolean;
  query: string;
  results: SearchResult[];
  onClose: () => void;
  onScrollTo: (varId: string) => void;
  onEdit: (varId: string) => void;
}

function HighlightedSnippet({ match }: { match: SearchMatch }) {
  const fieldLabel: Record<SearchMatch['field'], string> = {
    id: 'ID',
    description: 'Descrição',
    definition: 'Ponto de Controle',
  };

  return (
    <p className="text-[10px] text-slate-600 mt-0.5 truncate">
      <span className="text-slate-500 font-semibold">{fieldLabel[match.field]}: </span>
      {match.pre}
      <mark className="bg-teal-500/20 text-teal-300 font-semibold rounded-sm px-0.5 not-italic">
        {match.match}
      </mark>
      {match.post}
    </p>
  );
}

function ResultCard({ result, onScrollTo, onEdit }: {
  result: SearchResult;
  onScrollTo: (id: string) => void;
  onEdit: (id: string) => void;
}) {
  const varId       = result.variable['ID - REF'];
  const description = result.variable['DESCRIÇÃO'];

  const handleClick       = () => onScrollTo(varId);
  const handleDoubleClick = () => onEdit(varId);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onKeyDown={e => e.key === 'Enter' && handleClick()}
      className="group p-3 rounded-lg border border-slate-800/60 bg-slate-900/60 hover:border-teal-500/40 hover:bg-teal-500/5 cursor-pointer transition-all"
      aria-label={`Variável ${varId}. Clique para navegar, duplo-clique para editar.`}
    >
      <div className="flex justify-between items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-slate-200 truncate">
            <span className="text-teal-400 font-mono">{varId}</span>
            {description && (
              <span className="text-slate-500 font-medium"> — {description}</span>
            )}
          </p>
          <HighlightedSnippet match={result.matchedField} />
          <p className="text-[10px] text-slate-700 mt-0.5">
            Setor: <span className="text-slate-600">{result.sector}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={e => { e.stopPropagation(); onEdit(varId); }}
          className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-slate-500 hover:text-teal-400 hover:bg-teal-500/10 p-1.5 rounded transition-all focus:outline-none focus:opacity-100"
          aria-label={`Editar variável ${varId}`}
          title="Editar variável"
        >
          <BmeIcon name="pencil" size={12} />
        </button>
      </div>
    </div>
  );
}

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
      className={`fixed top-0 right-0 h-full w-80 bg-slate-950 border-l border-slate-800/60 shadow-2xl z-30 flex flex-col transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
      aria-label="Painel de busca de variáveis"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/60 bg-slate-900/60">
        <div>
          <p className="text-sm font-bold text-white">Busca de Variáveis</p>
          {query.trim().length > 0 && (
            <p className="text-[10px] text-slate-500 mt-0.5">
              {results.length} resultado{results.length !== 1 ? 's' : ''} para &quot;{query}&quot;
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="btn-ghost p-1.5 rounded-lg text-slate-500 text-sm flex items-center justify-center"
          aria-label="Fechar painel de busca"
        >
          <BmeIcon name="close" size={14} />
        </button>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {query.trim().length === 0 && (
          <p className="text-center text-xs text-slate-600 mt-8 px-4 leading-relaxed">
            Digite na barra de busca para localizar variáveis por ID, Descrição ou Definição.
          </p>
        )}
        {query.trim().length > 0 && results.length === 0 && (
          <p className="text-center text-xs text-slate-600 mt-8 px-4">
            Nenhuma variável encontrada para &quot;{query}&quot;.
          </p>
        )}
        {results.map(result => (
          <ResultCard
            key={result.variable['ID - REF']}
            result={result}
            onScrollTo={onScrollTo}
            onEdit={onEdit}
          />
        ))}
      </div>

      {/* Footer */}
      {results.length > 0 && (
        <div className="px-4 py-2 bg-slate-900/40 border-t border-slate-800/60">
          <p className="text-[10px] text-slate-600 text-center">
            Clique para navegar • Duplo-clique para editar
          </p>
        </div>
      )}
    </aside>
  );
};
