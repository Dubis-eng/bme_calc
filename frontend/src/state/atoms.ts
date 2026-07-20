import { atom } from 'jotai';
import { atomFamily } from 'jotai/utils';
import { Variable, Result, ScenarioMetadata } from '../types';



export const variablesAtom = atom<Variable[]>([]);
export const resultsAtom = atom<Record<string, Result>>({});
export const selectedFieldIdAtom = atom<string | null>(null);
export const activeSectorAtom = atom<string>('');
export const currentScenarioAtom = atom<ScenarioMetadata | null>(null);
export const anoSafraAtom = atom<number>(2026);
export const mesReferenciaAtom = atom<string>('Abril');
export const hasUnsavedChangesAtom = atom<boolean>(false);
export const calculatingAtom = atom<boolean>(false);
export const loadingAtom = atom<boolean>(true);
export const convergenceErrorAtom = atom<boolean>(false);
export const iterationsAtom = atom<number>(1);
export const residualAtom = atom<number>(0);
export const isOfflineAtom = atom<boolean>(false);
export const savingAtom = atom<boolean>(false);
export const savingActiveAtom = atom<boolean>(false);

const baseToleranceAtom = atom<number>(parseFloat(localStorage.getItem('bme_calc_tolerance') || '1e-5'));
export const toleranceAtom = atom(
  (get) => get(baseToleranceAtom),
  (get, set, newVal: number) => {
    set(baseToleranceAtom, newVal);
    localStorage.setItem('bme_calc_tolerance', String(newVal));
  }
);

// Local input values atom family to avoid global re-renders on every keystroke
export const variableValueAtomFamily = atomFamily((id: string) => atom(''));

// Write-only atom to initialize variables and populate the atom family with raw values.
// The atom family stores raw decimal values — display formatting happens in FormattedVariableInput.
export const setVariablesWithValuesAtom = atom(
  null,
  (get, set, newVars: Variable[]) => {
    set(variablesAtom, newVars);
    for (const v of newVars) {
      const id = v['ID - REF'];
      const rawVal = String(v['EQUAÇÕES E VALORES'] ?? '');
      set(variableValueAtomFamily(id), rawVal);
    }
  }
);

// Write-only atom to update a single variable's input value in the atom family
export const updateVariableValueAtom = atom(
  null,
  (get, set, { id, value }: { id: string; value: string }) => {
    set(variableValueAtomFamily(id), value);
    const vars = get(variablesAtom);
    if (vars.some(v => v['ID - REF'] === id)) {
      set(variablesAtom, vars.map(v => v['ID - REF'] === id ? { ...v, 'EQUAÇÕES E VALORES': value } : v));
    }
    set(hasUnsavedChangesAtom, true);
  }
);

// Read-only atom to retrieve variables merged with their latest committed values.
// The atom family stores clean (raw decimal) values, written only on input blur.
export const getMergedVariablesAtom = atom((get) => {
  const vars = get(variablesAtom);
  return vars.map(v => {
    const id = v['ID - REF'];
    const committedVal = get(variableValueAtomFamily(id));
    if (!committedVal && committedVal !== '0') return v;
    return { ...v, 'EQUAÇÕES E VALORES': committedVal };
  });
});
