import React, { useState, useEffect, useRef } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { Variable } from '../../types';
import { getInputValue, cleanInputValue } from '../../utils/helpers';
import { variableValueAtomFamily, updateVariableValueAtom } from '../../state/atoms';

interface FormattedVariableInputProps {
  variable: Variable;
  isLocked: boolean;
  onVariableChange?: (id: string, value: string) => void;
  className?: string;
  id?: string;
}

export const FormattedVariableInput = React.memo<FormattedVariableInputProps>(({
  variable,
  isLocked,
  className = '',
  id
}) => {
  const varId = variable['ID - REF'];

  // Read-only subscription to the committed (clean) value stored in the atom family.
  // This changes only after a blur or a calculation — never during typing.
  const committedRawVal = useAtomValue(variableValueAtomFamily(varId));

  // Local display state — typing only updates this; zero Jotai propagation during input.
  const [localDisplayValue, setLocalDisplayValue] = useState(() => {
    const rawVal = committedRawVal !== '' ? committedRawVal : String(variable['EQUAÇÕES E VALORES'] ?? '');
    return getInputValue({ ...variable, 'EQUAÇÕES E VALORES': rawVal });
  });

  // Write-only dispatcher — no re-render subscription on this component.
  const updateGlobalValue = useSetAtom(updateVariableValueAtom);

  const inputRef = useRef<HTMLInputElement>(null);
  const variableRef = useRef<Variable>(variable);
  variableRef.current = variable;

  // Track previous committed value to detect external changes (post-calculation or scenario load).
  const prevCommittedRef = useRef<string>(committedRawVal);

  useEffect(() => {
    if (prevCommittedRef.current === committedRawVal) return;
    prevCommittedRef.current = committedRawVal;
    // Only sync display if the user is not currently typing in this field.
    if (document.activeElement !== inputRef.current) {
      // Build a temp variable with the committed raw value to get the correct display.
      const varForDisplay = { ...variableRef.current, 'EQUAÇÕES E VALORES': committedRawVal };
      setLocalDisplayValue(getInputValue(varForDisplay));
    }
  }, [committedRawVal]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only local state changes — zero writes to Jotai, zero external re-renders.
    setLocalDisplayValue(e.target.value);
  };

  const handleBlur = () => {
    const currentVar = variableRef.current;
    const cleaned = cleanInputValue(localDisplayValue, currentVar);
    const updatedVar = { ...currentVar, 'EQUAÇÕES E VALORES': cleaned };
    const formatted = getInputValue(updatedVar);
    // Update display to formatted value.
    setLocalDisplayValue(formatted);
    // Write the clean raw value to the global atom — the ONLY write to Jotai.
    updateGlobalValue({ id: varId, value: cleaned });
  };

  return (
    <input
      ref={inputRef}
      id={id}
      type="text"
      aria-label={`Valor para ${varId}`}
      disabled={isLocked || variable.STATUS === 'inativa'}
      value={localDisplayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      className={className}
    />
  );
});
