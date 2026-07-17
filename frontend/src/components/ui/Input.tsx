import React, { useEffect, useRef } from 'react';
import { useAtom } from 'jotai';
import { Variable } from '../../types';
import { getInputValue } from '../../utils/helpers';
import { variableValueAtomFamily, hasUnsavedChangesAtom } from '../../state/atoms';

interface FormattedVariableInputProps {
  variable: Variable;
  isLocked: boolean;
  onVariableChange?: (id: string, value: string) => void;
  className?: string;
  id?: string;
}

export const FormattedVariableInput: React.FC<FormattedVariableInputProps> = ({
  variable,
  isLocked,
  className = '',
  id
}) => {
  const varId = variable['ID - REF'];
  const [localValue, setLocalValue] = useAtom(variableValueAtomFamily(varId));
  const [, setHasUnsavedChanges] = useAtom(hasUnsavedChangesAtom);
  const inputRef = useRef<HTMLInputElement>(null);

  const equationsAndValues = variable['EQUAÇÕES E VALORES'];
  const displayType = variable.tipo_exibicao;
  const percentBase = variable.percent_base;

  // Keep local value in sync with external updates (e.g., calculations or loading scenarios)
  useEffect(() => {
    // Only overwrite localValue if this input is not currently focused,
    // avoiding issues with intermediate typing states.
    if (document.activeElement !== inputRef.current) {
      setLocalValue(getInputValue(variable));
    }
  }, [variable, equationsAndValues, displayType, percentBase, setLocalValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalValue(val);
    setHasUnsavedChanges(true);
  };

  const handleBlur = () => {
    // Clean and format value on blur
    setLocalValue(getInputValue(variable));
  };

  return (
    <input
      ref={inputRef}
      id={id}
      type="text"
      aria-label={`Valor para ${varId}`}
      disabled={isLocked || variable.STATUS === 'inativa'}
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      className={className}
    />
  );
};

