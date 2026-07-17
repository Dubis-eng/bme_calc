import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Variable } from '../../types';
import { useEquationAutocomplete } from '../../hooks/useEquationAutocomplete';
import { EquationDropdown } from './EquationDropdown';
import { FormulaEditor } from './FormulaEditor';
import { SubstitutionModal } from './SubstitutionModal';
import { VariableFormattingFields } from './VariableFormattingFields';
import { ThermodynamicGuide } from './ThermodynamicGuide';
import { VariableModalHeader, VariableModalFooter } from './VariableModalControls';

interface VariableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (variable: Variable, isEdit: boolean, originalId?: string) => Promise<void>;
  variableToEdit: Variable | null;
  variables: Variable[];
  prefilledSector?: string;
  prefilledEtapa?: string;
  onSubstitutionSuccess: () => void;
}

export const VariableModal: React.FC<VariableModalProps> = ({
  isOpen,
  onClose,
  onSave,
  variableToEdit,
  variables,
  prefilledSector = '',
  prefilledEtapa = '',
  onSubstitutionSuccess
}) => {
  const isEdit = !!variableToEdit;
  const [isSubstitutionOpen, setIsSubstitutionOpen] = useState(false);

  const [idRef, setIdRef] = useState('');
  const [type, setType] = useState<'INPUT' | 'OUTPUT' | 'DERIVADA' | 'CENARIO'>('INPUT');
  const [status, setStatus] = useState<'ativa' | 'pendente' | 'inválida' | 'inativa'>('ativa');
  const [sector, setSector] = useState('');
  const [etapa, setEtapa] = useState('');
  const [pontoControle, setPontoControle] = useState('');
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState('');
  const [equationValue, setEquationValue] = useState('');
  const [error, setError] = useState('');
  const [isFormulaValid, setIsFormulaValid] = useState(true);
  const [formulaError, setFormulaError] = useState<string | null>(null);

  const [casasDecimais, setCasasDecimais] = useState<number | ''>('');
  const [tipoExibicao, setTipoExibicao] = useState<'NUMBER' | 'PERCENTAGE'>('NUMBER');
  const [percentBase, setPercentBase] = useState<'DECIMAL' | 'INTEGER'>('DECIMAL');

  const equationInputRef = useRef<HTMLTextAreaElement>(null);
  const ac = useEquationAutocomplete(variables);

  // Initialize fields on open or change of variableToEdit
  useEffect(() => {
    if (isOpen) {
      setError('');
      const edit = variableToEdit;
      setIdRef(edit ? edit['ID - REF'] : '');
      setType(edit ? edit.TIPO : 'INPUT');
      setStatus(edit ? (edit.STATUS || 'ativa') : 'ativa');
      setSector(edit ? edit.SETOR : prefilledSector);
      setEtapa(edit ? (edit.ETAPA || '') : prefilledEtapa);
      setPontoControle(edit ? (edit['PONTO DE CONTROLE'] || '') : '');
      setDescription(edit ? edit['DESCRIÇÃO'] : '');
      setUnit(edit ? (edit['UNIDADE DE MEDIDA'] || '') : '');
      setEquationValue(edit ? String(edit['EQUAÇÕES E VALORES']) : '');
      setCasasDecimais(edit && edit.casas_decimais !== undefined && edit.casas_decimais !== null ? edit.casas_decimais : '');
      setTipoExibicao(edit ? (edit.tipo_exibicao || 'NUMBER') : 'NUMBER');
      setPercentBase(edit ? (edit.percent_base || 'DECIMAL') : 'DECIMAL');
    }
  }, [isOpen, variableToEdit, prefilledSector, prefilledEtapa]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const formattedId = idRef.trim().toUpperCase();
    if (!formattedId) {
      setError('ID de referência é obrigatório.');
      return;
    }

    if (!isFormulaValid) {
      setError(formulaError || 'A fórmula possui erros críticos de validação.');
      return;
    }

    if (!isEdit && variables.some((v) => v['ID - REF'] === formattedId)) {
      setError(`Uma variável com o ID "${formattedId}" já existe no sistema.`);
      return;
    }

    const payload: Variable = {
      'ID - REF': formattedId,
      TIPO: type,
      STATUS: status,
      SETOR: sector.trim(),
      ETAPA: etapa.trim(),
      'PONTO DE CONTROLE': pontoControle.trim(),
      'DESCRIÇÃO': description.trim(),
      'UNIDADE DE MEDIDA': unit.trim(),
      'EQUAÇÕES E VALORES': equationValue.trim(),
      casas_decimais: casasDecimais === '' ? null : Number(casasDecimais),
      tipo_exibicao: tipoExibicao,
      percent_base: percentBase
    };

    try {
      await onSave(payload, isEdit, variableToEdit?.['ID - REF']);
      onClose();
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err) && err.response?.data?.detail
        ? err.response.data.detail
        : 'Erro ao salvar variável.';
      setError(msg);
    }
  };

  const uniqueSectors = Array.from(new Set(variables.map((v) => v.SETOR)));
  const uniqueEtapas  = Array.from(new Set(variables.map((v) => v.ETAPA).filter(Boolean))) as string[];
  const uniqueCps     = Array.from(new Set(variables.map((v) => v['PONTO DE CONTROLE']).filter(Boolean))) as string[];

  return (
    <div className="bme-modal-overlay">
      <div className="bme-modal-container max-w-3xl" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <VariableModalHeader
          isEdit={isEdit}
          variableId={variableToEdit?.['ID - REF']}
          onClose={onClose}
        />

        {/* Form Wrap */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="bme-modal-body text-xs">
            {error && (
              <div className="p-3 bg-rose-500/15 border border-rose-500/20 text-rose-400 text-xs rounded-lg font-medium" role="alert">
                ⚠️ {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col">
                <label htmlFor="var-id" className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">ID - Referência</label>
                <input
                  id="var-id"
                  type="text"
                  disabled={isEdit}
                  value={idRef}
                  onChange={(e) => setIdRef(e.target.value)}
                  placeholder="Ex: MOENDA_RPM"
                  className="input-field p-2 text-xs font-semibold disabled:bg-slate-900 disabled:text-slate-600 disabled:border-slate-800"
                  required
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="var-type" className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Tipo</label>
                <select id="var-type" value={type} onChange={(e) => setType(e.target.value as 'INPUT' | 'OUTPUT' | 'DERIVADA' | 'CENARIO')} className="input-field p-2 text-xs font-semibold">
                  <option value="INPUT">INPUT (Valor Entrada)</option>
                  <option value="OUTPUT">OUTPUT (Fórmula)</option>
                  <option value="DERIVADA">DERIVADA (Valor Derivado)</option>
                  <option value="CENARIO">CENÁRIO (Premissa Global)</option>
                </select>
              </div>
              <div className="flex flex-col">
                <label htmlFor="var-status" className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Status</label>
                <select id="var-status" value={status} onChange={(e) => setStatus(e.target.value as 'ativa' | 'pendente' | 'inválida' | 'inativa')} className="input-field p-2 text-xs font-semibold">
                  <option value="ativa">Ativa</option>
                  <option value="pendente">Pendente</option>
                  <option value="inválida">Inválida</option>
                  <option value="inativa">Inativa</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col">
                <label htmlFor="var-sector" className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Setor</label>
                <input id="var-sector" type="text" list="sectors-list" value={sector} onChange={(e) => setSector(e.target.value)} placeholder="Ex: MOAGEM" className="input-field p-2 text-xs font-semibold" required />
                <datalist id="sectors-list">{uniqueSectors.map(s => <option key={s} value={s} />)}</datalist>
              </div>
              <div className="flex flex-col">
                <label htmlFor="var-etapa" className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Etapa (Módulo)</label>
                <input id="var-etapa" type="text" list="etapas-list" value={etapa} onChange={(e) => setEtapa(e.target.value)} placeholder="Ex: MOENDA 1" className="input-field p-2 text-xs font-semibold" required />
                <datalist id="etapas-list">{uniqueEtapas.map(e => <option key={e} value={e} />)}</datalist>
              </div>
              <div className="flex flex-col">
                <label htmlFor="var-cp" className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Ponto de Controle</label>
                <input id="var-cp" type="text" list="cps-list" value={pontoControle} onChange={(e) => setPontoControle(e.target.value)} placeholder="Ex: TURBINAS" className="input-field p-2 text-xs font-semibold" required />
                <datalist id="cps-list">{uniqueCps.map(c => <option key={c} value={c} />)}</datalist>
              </div>
            </div>

            <div className="flex flex-col">
              <label htmlFor="var-desc" className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Descrição</label>
              <input id="var-desc" type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: Rotação no primeiro terno" className="input-field p-2 text-xs font-medium" required />
            </div>

            <VariableFormattingFields
              casasDecimais={casasDecimais}
              setCasasDecimais={setCasasDecimais}
              tipoExibicao={tipoExibicao}
              setTipoExibicao={setTipoExibicao}
              percentBase={percentBase}
              setPercentBase={setPercentBase}
            />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex flex-col col-span-1">
                <label htmlFor="var-unit" className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Unidade</label>
                <input id="var-unit" type="text" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Ex: rpm" className="input-field p-2 text-xs font-medium" required />
              </div>
              <div className="flex flex-col col-span-1 md:col-span-3 relative">
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">
                  {(type === 'INPUT' || type === 'CENARIO') ? 'Valor Estático / Equação Inicial' : 'Equação / Fórmula'}
                </label>
                <FormulaEditor
                  value={equationValue}
                  onChange={(val) => {
                    setEquationValue(val);
                    const cursor = equationInputRef.current?.selectionStart ?? val.length;
                    ac.handleInputChange(val, cursor);
                  }}
                  placeholder={(type === 'INPUT' || type === 'CENARIO') ? 'Ex: 6' : 'Ex: =MOENDA_RPM * 1.5'}
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
                <ThermodynamicGuide />
              </div>
            </div>
          </div>

          <VariableModalFooter
            isEdit={isEdit}
            equationValue={equationValue}
            onClose={onClose}
            onOpenSubstitution={() => setIsSubstitutionOpen(true)}
          />
        </form>
      </div>

      <SubstitutionModal
        isOpen={isSubstitutionOpen}
        onClose={() => setIsSubstitutionOpen(false)}
        targetVarId={idRef}
        targetExpression={equationValue}
        onSuccess={() => {
          onSubstitutionSuccess();
          onClose();
        }}
      />
    </div>
  );
};
