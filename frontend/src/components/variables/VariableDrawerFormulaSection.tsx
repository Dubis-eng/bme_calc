import React from 'react';
import { Section, FieldLabel } from './VariableDrawerControls';
import { FormulaEditor } from './FormulaEditor';
import { EquationDropdown } from './EquationDropdown';
import { ThermodynamicGuide } from './ThermodynamicGuide';
import { Variable } from '../../types';
import { AutocompleteResult, InjectionResult } from '../../hooks/useEquationAutocomplete';

export interface EquationAutocompleteState {
  isOpen: boolean;
  results: AutocompleteResult[];
  selectedIndex: number;
  token: string;
  handleInputChange: (val: string, cursor: number) => void;
  handleKeyDown: (e: React.KeyboardEvent, formula: string, cursor: number) => InjectionResult | null;
  selectResult: (varObj: Variable, formula: string, cursor: number) => InjectionResult;
  dismiss: () => void;
}

interface FormulaSectionProps {
  type: 'INPUT' | 'OUTPUT' | 'DERIVADA' | 'CENARIO';
  equationValue: string;
  setEquationValue: (val: string) => void;
  variables: Variable[];
  equationInputRef: React.RefObject<HTMLTextAreaElement | null>;
  ac: EquationAutocompleteState;
  setIsFormulaValid: (v: boolean) => void;
  setFormulaError: (msg: string | null) => void;
}

export const VariableDrawerFormulaSection: React.FC<FormulaSectionProps> = ({
  type,
  equationValue,
  setEquationValue,
  variables,
  equationInputRef,
  ac,
  setIsFormulaValid,
  setFormulaError,
}) => {
  return (
    <Section title="Fórmula & Equações">
      <div className="space-y-3">
        <div className="flex flex-col">
          <FieldLabel tooltip={type === 'INPUT' || type === 'CENARIO' ? 'Valor estático padrão. Pode ser substituído por uma fórmula iniciando com =.' : 'Fórmula de cálculo. Inicie com = e use IDs de variáveis em maiúsculas. Ex: =EXTRACAO_ART * MOAGEM_HORA'}>
            {type === 'INPUT' || type === 'CENARIO' ? 'Valor Padrão / Equação Inicial' : 'Equação de Cálculo'}
          </FieldLabel>
          <div className="relative">
            <FormulaEditor
              value={equationValue}
              onChange={(val) => {
                setEquationValue(val);
                const cursor = equationInputRef.current?.selectionStart ?? val.length;
                ac.handleInputChange(val, cursor);
              }}
              placeholder={type === 'INPUT' || type === 'CENARIO' ? 'Ex: 6 ou =CANA_HORA * 0.85' : 'Ex: =EXTRACAO_ART * MOAGEM_HORA'}
              variables={variables}
              isLocked={false}
              onValidationChange={(isValid, errorMsg) => {
                setIsFormulaValid(isValid);
                setFormulaError(errorMsg);
              }}
              onKeyDown={(e) => {
                const cursor = equationInputRef.current?.selectionStart ?? equationValue.length;
                const injection = ac.handleKeyDown(e, equationValue, cursor);
                if (injection) {
                  setEquationValue(injection.newFormula);
                  requestAnimationFrame(() => {
                    equationInputRef.current?.setSelectionRange(injection.newCursorPos, injection.newCursorPos);
                  });
                }
              }}
              onBlur={() => setTimeout(ac.dismiss, 150)}
              inputRef={equationInputRef}
            />
            <EquationDropdown
              isOpen={ac.isOpen}
              results={ac.results}
              selectedIndex={ac.selectedIndex}
              token={ac.token}
              onSelect={(variable) => {
                const cursor = equationInputRef.current?.selectionStart ?? equationValue.length;
                const injection = ac.selectResult(variable, equationValue, cursor);
                setEquationValue(injection.newFormula);
                equationInputRef.current?.focus();
                requestAnimationFrame(() => {
                  equationInputRef.current?.setSelectionRange(injection.newCursorPos, injection.newCursorPos);
                });
              }}
            />
          </div>
        </div>
        <ThermodynamicGuide />
      </div>
    </Section>
  );
};
