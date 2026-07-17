import React, { useState, useEffect, useRef } from 'react';
import { Variable } from '../../types';
import { getInputValue, cleanInputValue } from '../../utils/helpers';

interface FormattedVariableInputProps {
  variable: Variable;
  isLocked: boolean;
  onVariableChange: (id: string, value: string) => void;
  className?: string;
  id?: string;
}

export const FormattedVariableInput: React.FC<FormattedVariableInputProps> = ({
  variable,
  isLocked,
  onVariableChange,
  className = '',
  id
}) => {
  const varId = variable['ID - REF'];
  const [localValue, setLocalValue] = useState(() => getInputValue(variable));
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
  }, [variable, equationsAndValues, displayType, percentBase]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalValue(val);
    onVariableChange(varId, cleanInputValue(val, variable));
  };

  const handleBlur = () => {
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

