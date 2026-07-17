import { atom } from 'jotai';
import { atomFamily } from 'jotai/utils';
import { Variable } from '../types';

export const variablesAtom = atom<Variable[]>([]);
export const resultsAtom = atom<Record<string, any>>({});
export const selectedFieldIdAtom = atom<string | null>(null);
export const activeSectorAtom = atom<string>('');
export const currentScenarioAtom = atom<any>(null);
export const anoSafraAtom = atom<number>(2026);
export const mesReferenciaAtom = atom<string>('Abril');
export const hasUnsavedChangesAtom = atom<boolean>(false);
export const calculatingAtom = atom<boolean>(false);
export const loadingAtom = atom<boolean>(true);
export const convergenceErrorAtom = atom<boolean>(false);
export const iterationsAtom = atom<number>(1);
export const residualAtom = atom<number>(0);
export const isOfflineAtom = atom<boolean>(false);

// Local input values atom family to avoid global re-renders on every keystroke
export const variableValueAtomFamily = atomFamily((id: string) => atom(''));

// Write-only atom to initialize variables and populate the local value atom family
export const setVariablesWithValuesAtom = atom(
  null,
  (get, set, newVars: Variable[]) => {
    set(variablesAtom, newVars);
    for (const v of newVars) {
      const id = v['ID - REF'];
      const val = String(v['EQUAÇÕES E VALORES']);
      set(variableValueAtomFamily(id), val);
    }
  }
);

// Write-only atom to update a single variable's input value in the atom family
export const updateVariableValueAtom = atom(
  null,
  (get, set, { id, value }: { id: string; value: string }) => {
    set(variableValueAtomFamily(id), value);
    set(hasUnsavedChangesAtom, true);
  }
);

// Read-only atom to retrieve variables merged with their latest local values from the atom family
export const getMergedVariablesAtom = atom((get) => {
  const vars = get(variablesAtom);
  return vars.map(v => {
    const id = v['ID - REF'];
    const currentVal = get(variableValueAtomFamily(id));
    return {
      ...v,
      'EQUAÇÕES E VALORES': currentVal
    };
  });
});
