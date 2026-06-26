import { useMemo } from 'react';
import { Variable } from '../types';

// --- Types ---

export interface SearchMatch {
  field: 'id' | 'description' | 'definition';
  pre: string;
  match: string;
  post: string;
}

export interface SearchResult {
  variable: Variable;
  matchedField: SearchMatch;
  sector: string;
}

// --- Helpers ---

function findMatch(text: string, query: string): SearchMatch | null {
  const normalText = text.toLowerCase();
  const normalQuery = query.toLowerCase().trim();
  const index = normalText.indexOf(normalQuery);
  if (index === -1) return null;

  return {
    field: 'id', // overridden by caller
    pre: text.slice(0, index),
    match: text.slice(index, index + normalQuery.length),
    post: text.slice(index + normalQuery.length),
  };
}

function buildResult(
  variable: Variable,
  rawMatch: Omit<SearchMatch, 'field'>,
  field: SearchMatch['field'],
): SearchResult {
  return {
    variable,
    sector: variable.SETOR,
    matchedField: { ...rawMatch, field },
  };
}

// --- Hook ---

export function useVariableSearch(
  variables: Variable[],
  query: string,
): SearchResult[] {
  return useMemo(() => {
    const trimmed = query.trim();
    if (trimmed.length < 1) return [];

    const results: SearchResult[] = [];

    for (const variable of variables) {
      const idMatch = findMatch(variable['ID - REF'], trimmed);
      if (idMatch) {
        results.push(buildResult(variable, idMatch, 'id'));
        continue;
      }

      const descMatch = findMatch(variable['DESCRIÇÃO'], trimmed);
      if (descMatch) {
        results.push(buildResult(variable, descMatch, 'description'));
        continue;
      }

      const pcMatch = findMatch(variable['PONTO DE CONTROLE'] || '', trimmed);
      if (pcMatch) {
        results.push(buildResult(variable, pcMatch, 'definition'));
        continue;
      }

      const etapaMatch = findMatch(variable['ETAPA'] || '', trimmed);
      if (etapaMatch) {
        results.push(buildResult(variable, etapaMatch, 'definition'));
      }
    }

    return results;
  }, [variables, query]);
}
