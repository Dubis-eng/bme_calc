import { useState, useEffect, useCallback, useRef } from 'react';
import { Variable } from '../types';

interface SearchState {
  searchQuery: string;
  isSearchPanelOpen: boolean;
  highlightedVarId: string | null;
}

interface SearchActions {
  handleSearchInput: (value: string) => void;
  handleScrollTo: (varId: string) => void;
  handleSearchEdit: (varId: string, onEdit: (v: Variable) => void) => void;
  closeSearchPanel: () => void;
}

export type UseSearchReturn = SearchState & SearchActions & { debouncedQuery: string };

export function useSearch(variables: Variable[]): UseSearchReturn {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isSearchPanelOpen, setIsSearchPanelOpen] = useState(false);
  const [highlightedVarId, setHighlightedVarId] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchInput = (value: string) => {
    setSearchQuery(value);
    if (value.trim().length > 0) setIsSearchPanelOpen(true);
  };

  const handleScrollTo = useCallback((varId: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setHighlightedVarId(varId);

    let attempts = 0;
    const tryScroll = () => {
      const row = document.querySelector(`[data-var-id="${varId}"]`);
      if (row) {
        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
        row.classList.add('bg-amber-100/90', 'ring-2', 'ring-amber-400');
        setTimeout(() => {
          row.classList.remove('bg-amber-100/90', 'ring-2', 'ring-amber-400');
        }, 2500);
      } else if (attempts < 10) {
        attempts++;
        setTimeout(tryScroll, 60);
      }
    };

    setTimeout(tryScroll, 30);
    timerRef.current = setTimeout(() => setHighlightedVarId(null), 3000);
  }, []);

  const handleSearchEdit = useCallback(
    (varId: string, onEdit: (v: Variable) => void) => {
      const targetVar = variables.find(v => v['ID - REF'] === varId);
      if (targetVar) onEdit(targetVar);
    },
    [variables]
  );

  const closeSearchPanel = () => {
    setIsSearchPanelOpen(false);
    setSearchQuery('');
  };

  return {
    searchQuery,
    debouncedQuery,
    isSearchPanelOpen,
    highlightedVarId,
    handleSearchInput,
    handleScrollTo,
    handleSearchEdit,
    closeSearchPanel,
  };
}
