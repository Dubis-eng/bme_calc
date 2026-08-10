import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Variable } from '../../types';
import { useEquationAutocomplete } from '../../hooks/useEquationAutocomplete';
import { EquationDropdown } from './EquationDropdown';
import { FormulaEditor } from './FormulaEditor';
import { SubstitutionModal } from './SubstitutionModal';
import { SegmentedControl } from '../ui/SegmentedControl';
import { SuggestionChips } from '../ui/SuggestionChips';
import { FieldTooltip, TooltipPosition } from '../ui/Tooltip';
import { ThermodynamicGuide } from './ThermodynamicGuide';
import { BmeIcon } from '../../styles/design-system';

interface VariableDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (variable: Variable, isEdit: boolean, originalId?: string) => Promise<void>;
  variableToEdit: Variable | null;
  variables: Variable[];
  prefilledSector?: string;
  prefilledEtapa?: string;
  onSubstitutionSuccess: () => void;
}

/* ── Toggle visual ──────────────────────────────────────────── */
function Toggle({
  checked,
  onChange,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  id: string;
}) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`toggle-track ${checked ? 'on' : 'off'}`}
    >
      <span className="toggle-thumb" />
    </button>
  );
}

/* ── Section divider com título ─────────────────────────────── */
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-slate-50/60 p-4 rounded-2xl border border-slate-200/80 space-y-3">
      {title && <p className="section-heading mb-2">{title}</p>}
      {children}
    </div>
  );
}

/* ── Label com tooltip opcional ─────────────────────────────── */
function FieldLabel({
  htmlFor,
  children,
  tooltip,
  tooltipPosition = 'top',
}: {
  htmlFor?: string;
  children: React.ReactNode;
  tooltip?: string;
  tooltipPosition?: TooltipPosition;
}) {
  return (
    <label htmlFor={htmlFor} className="field-label">
      {children}
      {tooltip && <FieldTooltip content={tooltip} position={tooltipPosition} />}
    </label>
  );
}

/* ═══════════════════════════════════════════════════════════════
   VariableDrawer (Modal Amplo Centralizado estilo Página)
════════════════════════════════════════════════════════════════ */
export const VariableDrawer: React.FC<VariableDrawerProps> = ({
  isOpen,
  onClose,
  onSave,
  variableToEdit,
  variables,
  prefilledSector = '',
  prefilledEtapa = '',
  onSubstitutionSuccess,
}) => {
  const isEdit = !!variableToEdit;
  const [isSubstitutionOpen, setIsSubstitutionOpen] = useState(false);

  /* ── Estado dos campos ── */
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

  const [inHarvestPlan, setInHarvestPlan] = useState(false);
  const [harvestPlanOp, setHarvestPlanOp] = useState<'SUM' | 'AVERAGE' | 'WEIGHTED_AVERAGE' | 'CALCULATE' | ''>('');
  const [harvestPlanWeightVarId, setHarvestPlanWeightVarId] = useState('');
  const [agrupamento, setAgrupamento] = useState('');
  const [weightSearchFocus, setWeightSearchFocus] = useState(false);

  const equationInputRef = useRef<HTMLTextAreaElement>(null);
  const ac = useEquationAutocomplete(variables);

  /* ── Listas únicas para sugestões ── */
  const uniqueSectors      = Array.from(new Set(variables.map((v) => v.SETOR)));
  const uniqueEtapas       = Array.from(new Set(variables.map((v) => v.ETAPA).filter(Boolean))) as string[];
  const uniqueCps          = Array.from(new Set(variables.map((v) => v['PONTO DE CONTROLE']).filter(Boolean))) as string[];
  const uniqueAgrupamentos = Array.from(new Set(variables.map((v) => v.agrupamento).filter(Boolean))) as string[];

  /* ── Inicialização dos campos ── */
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
      setInHarvestPlan(edit ? !!edit.in_harvest_plan : false);
      setHarvestPlanOp(edit ? (edit.harvest_plan_op || '') : '');
      setHarvestPlanWeightVarId(edit ? (edit.harvest_plan_weight_var_id || '') : '');
      setAgrupamento(edit ? (edit.agrupamento || '') : '');
    }
  }, [isOpen, variableToEdit, prefilledSector, prefilledEtapa]);

  /* ── Submit ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const formattedId = idRef.trim().toUpperCase();
    if (!formattedId) {
      setError('O campo ID - Referência é obrigatório.');
      return;
    }
    if (!isEdit && variables.some((v) => v['ID - REF'] === formattedId)) {
      setError(`Já existe uma variável com o ID "${formattedId}". Escolha outro identificador.`);
      return;
    }
    if (!isFormulaValid) {
      setError(formulaError || 'A fórmula possui erros. Corrija antes de salvar.');
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
      percent_base: percentBase,
      in_harvest_plan: inHarvestPlan,
      harvest_plan_op: inHarvestPlan ? (harvestPlanOp || null) : null,
      harvest_plan_weight_var_id:
        inHarvestPlan && harvestPlanOp === 'WEIGHTED_AVERAGE' ? harvestPlanWeightVarId : null,
      agrupamento: inHarvestPlan ? agrupamento.trim() : null,
    };

    try {
      await onSave(payload, isEdit, variableToEdit?.['ID - REF']);
      onClose();
    } catch (err: unknown) {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.detail
          ? err.response.data.detail
          : 'Erro ao salvar variável. Tente novamente.';
      setError(msg);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* ── Overlay Modal Amplo ── */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-6 overflow-y-auto"
        onClick={onClose}
        aria-hidden="true"
      >
        {/* ── Container do Modal Centralizado ── */}
        <div
          className="bg-white rounded-2xl border border-bme-border shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh] overflow-hidden my-auto animate-fade-in-up"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          {/* ═══ Header ═══════════════════════════════════════════ */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-bme-border bg-slate-50/80 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-teal-50 rounded-xl border border-teal-200 flex items-center justify-center shrink-0">
                <BmeIcon name="variable" size={16} className="text-bme-teal" />
              </div>
              <div>
                <h2
                  id="modal-title"
                  className="text-base font-bold text-bme-text tracking-tight flex items-center gap-2"
                >
                  {isEdit ? 'Editar Variável' : 'Cadastrar Nova Variável'}
                  {isEdit && variableToEdit && (
                    <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                      {variableToEdit['ID - REF']}
                    </span>
                  )}
                </h2>
                <p className="text-xs text-bme-text-sec">
                  {isEdit
                    ? 'Altere a definição, parâmetros ou equações desta variável'
                    : 'Preencha os campos abaixo para registrar uma nova variável no balanço industrial'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="btn-ghost p-2 text-slate-400 hover:text-slate-700 rounded-xl"
              aria-label="Fechar modal"
            >
              <BmeIcon name="close" size={18} />
            </button>
          </div>

          {/* ═══ Body (Formulário Amplo) ═════════════════════════ */}
          <form
            onSubmit={handleSubmit}
            className="flex flex-col flex-1 overflow-hidden"
            noValidate
          >
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {/* ── Erro global ── */}
              {error && (
                <div
                  className="flex items-start gap-2.5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl animate-fade-in-up"
                  role="alert"
                >
                  <span className="text-base shrink-0">⚠️</span>
                  <span className="font-medium">{error}</span>
                </div>
              )}

              {/* ══ SEÇÃO 1: Identificação ════════════════════════ */}
              <Section title="Identificação & Classificação">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* ID - Referência */}
                  <div className="flex flex-col md:col-span-2">
                    <FieldLabel
                      htmlFor="var-id"
                      tooltipPosition="bottom"
                      tooltip="Identificador único e imutável da variável. Use letras maiúsculas, números e underscores. Ex: EXTRACAO_ART, VAPOR_TOTAL_GH"
                    >
                      ID — Referência
                    </FieldLabel>
                    <input
                      id="var-id"
                      type="text"
                      disabled={isEdit}
                      value={idRef}
                      onChange={(e) => setIdRef(e.target.value)}
                      placeholder="Ex: EXTRACAO_ART, MOENDA_RPM, VAPOR_TOTAL_GH"
                      className="input-field px-3.5 py-2 font-mono font-semibold text-sm disabled:opacity-60"
                      required
                      autoCapitalize="characters"
                      autoComplete="off"
                    />
                  </div>

                  {/* Status */}
                  <div className="flex flex-col col-span-1">
                    <FieldLabel
                      htmlFor="var-status"
                      tooltipPosition="bottom"
                      tooltip="Status atual da variável no sistema de cálculo"
                    >
                      Status
                    </FieldLabel>
                    <select
                      id="var-status"
                      value={status}
                      onChange={(e) =>
                        setStatus(e.target.value as 'ativa' | 'pendente' | 'inválida' | 'inativa')
                      }
                      className="input-field px-3 py-2 text-sm"
                    >
                      <option value="ativa">✅ Ativa</option>
                      <option value="pendente">🕐 Pendente</option>
                      <option value="inválida">❌ Inválida</option>
                      <option value="inativa">⏸ Inativa</option>
                    </select>
                  </div>
                </div>

                {/* Tipo de Variável (Segmented Control) */}
                <div className="flex flex-col pt-1">
                  <FieldLabel
                    tooltipPosition="bottom"
                    tooltip="Define como o valor desta variável é obtido: inserido manualmente, calculado por fórmula, derivado ou usado como premissa de cenário"
                  >
                    Tipo de Variável
                  </FieldLabel>
                  <SegmentedControl value={type} onChange={setType} />
                </div>
              </Section>

              {/* ══ SEÇÃO 2: Localização no Processo ══════════════ */}
              <Section title="Localização no Processo Industrial">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Setor */}
                  <div className="flex flex-col">
                    <FieldLabel
                      htmlFor="var-sector"
                      tooltip="Setor industrial ao qual esta variável pertence. Ex: EXTRAÇÃO, DESTILAÇÃO, FERMENTAÇÃO"
                    >
                      Setor
                    </FieldLabel>
                    <input
                      id="var-sector"
                      type="text"
                      list="sectors-list"
                      value={sector}
                      onChange={(e) => setSector(e.target.value)}
                      placeholder="Ex: EXTRAÇÃO, DESTILAÇÃO"
                      className="input-field px-3.5 py-2 text-sm font-medium"
                      required
                    />
                    <datalist id="sectors-list">
                      {uniqueSectors.map((s) => <option key={s} value={s} />)}
                    </datalist>
                    <SuggestionChips
                      suggestions={uniqueSectors}
                      onSelect={setSector}
                      current={sector}
                    />
                  </div>

                  {/* Etapa / Módulo */}
                  <div className="flex flex-col">
                    <FieldLabel
                      htmlFor="var-etapa"
                      tooltip="Módulo ou etapa específica dentro do setor. Ex: MOENDA 1, COLUNA A, FERMENTADOR 3"
                    >
                      Etapa / Módulo
                    </FieldLabel>
                    <input
                      id="var-etapa"
                      type="text"
                      list="etapas-list"
                      value={etapa}
                      onChange={(e) => setEtapa(e.target.value)}
                      placeholder="Ex: MOENDA 1"
                      className="input-field px-3.5 py-2 text-sm font-medium"
                      required
                    />
                    <datalist id="etapas-list">
                      {uniqueEtapas.map((e) => <option key={e} value={e} />)}
                    </datalist>
                    <SuggestionChips
                      suggestions={uniqueEtapas.slice(0, 5)}
                      onSelect={setEtapa}
                      current={etapa}
                    />
                  </div>

                  {/* Ponto de Controle */}
                  <div className="flex flex-col">
                    <FieldLabel
                      htmlFor="var-cp"
                      tooltip="Ponto de controle operacional onde esta variável é monitorada. Ex: TURBINAS, EVAPORAÇÃO"
                    >
                      Ponto de Controle
                    </FieldLabel>
                    <input
                      id="var-cp"
                      type="text"
                      list="cps-list"
                      value={pontoControle}
                      onChange={(e) => setPontoControle(e.target.value)}
                      placeholder="Ex: TURBINAS"
                      className="input-field px-3.5 py-2 text-sm font-medium"
                      required
                    />
                    <datalist id="cps-list">
                      {uniqueCps.map((c) => <option key={c} value={c} />)}
                    </datalist>
                    <SuggestionChips
                      suggestions={uniqueCps.slice(0, 5)}
                      onSelect={setPontoControle}
                      current={pontoControle}
                    />
                  </div>
                </div>
              </Section>

              {/* ══ SEÇÃO 3: Descrição e Formatação ══════════════ */}
              <Section title="Descrição & Formatação">
                <div className="space-y-3">
                  <div className="flex flex-col">
                    <FieldLabel
                      htmlFor="var-desc"
                      tooltip="Descrição legível da variável, usada em relatórios e na interface. Seja claro e objetivo."
                    >
                      Descrição
                    </FieldLabel>
                    <input
                      id="var-desc"
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Ex: Rotação no primeiro terno de moenda"
                      className="input-field px-3.5 py-2 text-sm"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="flex flex-col">
                      <FieldLabel
                        htmlFor="var-unit"
                        tooltip="Unidade de medida da variável. Ex: rpm, °C, t/h, %, kWh"
                      >
                        Unidade
                      </FieldLabel>
                      <input
                        id="var-unit"
                        type="text"
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                        placeholder="Ex: t/h, °C, rpm"
                        className="input-field px-3 py-2 text-sm"
                        required
                      />
                    </div>

                    <div className="flex flex-col">
                      <FieldLabel
                        htmlFor="var-decimals"
                        tooltip="Número de casas decimais exibidas. Deixe vazio para usar o padrão do sistema (2 casas)."
                      >
                        Casas Decimais
                      </FieldLabel>
                      <input
                        id="var-decimals"
                        type="number"
                        min="0"
                        max="6"
                        value={casasDecimais}
                        onChange={(e) =>
                          setCasasDecimais(e.target.value === '' ? '' : Number(e.target.value))
                        }
                        placeholder="Padrão (2)"
                        className="input-field px-3 py-2 text-sm"
                      />
                    </div>

                    <div className="flex flex-col">
                      <FieldLabel
                        htmlFor="var-display-type"
                        tooltip="Define se o valor é exibido como número ou percentual"
                      >
                        Formato
                      </FieldLabel>
                      <select
                        id="var-display-type"
                        value={tipoExibicao}
                        onChange={(e) => setTipoExibicao(e.target.value as 'NUMBER' | 'PERCENTAGE')}
                        className="input-field px-3 py-2 text-sm"
                      >
                        <option value="NUMBER">Número</option>
                        <option value="PERCENTAGE">Percentual (%)</option>
                      </select>
                    </div>

                    <div className="flex flex-col">
                      <FieldLabel
                        htmlFor="var-percent-base"
                        tooltip="Decimal: 0.10 equivale a 10%. Inteiro: 10 equivale a 10%."
                      >
                        Base Percentual
                      </FieldLabel>
                      <select
                        id="var-percent-base"
                        disabled={tipoExibicao !== 'PERCENTAGE'}
                        value={percentBase}
                        onChange={(e) => setPercentBase(e.target.value as 'DECIMAL' | 'INTEGER')}
                        className="input-field px-3 py-2 text-sm disabled:opacity-50"
                      >
                        <option value="DECIMAL">0.10 = 10%</option>
                        <option value="INTEGER">10 = 10%</option>
                      </select>
                    </div>
                  </div>
                </div>
              </Section>

              {/* ══ SEÇÃO 4: Fórmula / Equação ═══════════════════ */}
              <Section title="Fórmula & Equações">
                <div className="space-y-3">
                  <div className="flex flex-col">
                    <FieldLabel
                      tooltip={
                        type === 'INPUT' || type === 'CENARIO'
                          ? 'Valor estático padrão. Pode ser substituído por uma fórmula iniciando com =.'
                          : 'Fórmula de cálculo. Inicie com = e use IDs de variáveis em maiúsculas. Ex: =EXTRACAO_ART * MOAGEM_HORA'
                      }
                    >
                      {type === 'INPUT' || type === 'CENARIO'
                        ? 'Valor Padrão / Equação Inicial'
                        : 'Equação de Cálculo'}
                    </FieldLabel>

                    <div className="relative">
                      <FormulaEditor
                        value={equationValue}
                        onChange={(val) => {
                          setEquationValue(val);
                          const cursor = equationInputRef.current?.selectionStart ?? val.length;
                          ac.handleInputChange(val, cursor);
                        }}
                        placeholder={
                          type === 'INPUT' || type === 'CENARIO'
                            ? 'Ex: 6  ou  =CANA_HORA * 0.85'
                            : 'Ex: =EXTRACAO_ART * MOAGEM_HORA'
                        }
                        variables={variables}
                        isLocked={false}
                        onValidationChange={(isValid, errorMsg) => {
                          setIsFormulaValid(isValid);
                          setFormulaError(errorMsg);
                        }}
                        onKeyDown={(e) => {
                          const cursor =
                            equationInputRef.current?.selectionStart ?? equationValue.length;
                          const injection = ac.handleKeyDown(e, equationValue, cursor);
                          if (injection) {
                            setEquationValue(injection.newFormula);
                            requestAnimationFrame(() => {
                              equationInputRef.current?.setSelectionRange(
                                injection.newCursorPos,
                                injection.newCursorPos
                              );
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
                          const cursor =
                            equationInputRef.current?.selectionStart ?? equationValue.length;
                          const injection = ac.selectResult(variable, equationValue, cursor);
                          setEquationValue(injection.newFormula);
                          equationInputRef.current?.focus();
                          requestAnimationFrame(() => {
                            equationInputRef.current?.setSelectionRange(
                              injection.newCursorPos,
                              injection.newCursorPos
                            );
                          });
                        }}
                      />
                    </div>
                  </div>

                  {/* Guia de equações termodinâmicas IAPWS-IF97 */}
                  <ThermodynamicGuide />
                </div>
              </Section>

              {/* ══ SEÇÃO 5: Plano de Safra ═══════════════════════ */}
              <Section title="">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">🌾</span>
                    <div>
                      <p className="text-sm font-semibold text-bme-text">Plano de Safra</p>
                      <p className="text-xs text-bme-text-sec">
                        Incluir esta variável no relatório acumulado do plano de safra da usina
                      </p>
                    </div>
                  </div>
                  <Toggle
                    id="toggle-harvest-plan"
                    checked={inHarvestPlan}
                    onChange={setInHarvestPlan}
                  />
                </div>

                {inHarvestPlan && (
                  <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in-up">
                    {/* Método de acúmulo */}
                    <div className="flex flex-col">
                      <FieldLabel
                        htmlFor="harvest-op"
                        tooltip="Define como o valor diário desta variável é acumulado no relatório de safra"
                      >
                        Método de Acúmulo
                      </FieldLabel>
                      <select
                        id="harvest-op"
                        value={harvestPlanOp}
                        onChange={(e) => setHarvestPlanOp(e.target.value as any)}
                        className="input-field px-3 py-2 text-sm"
                      >
                        <option value="">Regra Padrão do Sistema</option>
                        <option value="SUM">Soma (Total Acumulado)</option>
                        <option value="AVERAGE">Média Simples</option>
                        <option value="WEIGHTED_AVERAGE">Média Ponderada</option>
                        <option value="CALCULATE">Recalcular pela Fórmula</option>
                      </select>
                    </div>

                    {/* Variável de peso */}
                    {harvestPlanOp === 'WEIGHTED_AVERAGE' ? (
                      <div className="flex flex-col relative animate-fade-in-up">
                        <FieldLabel
                          htmlFor="harvest-weight"
                          tooltip="ID da variável que servirá como peso na média ponderada. Ex: MOAGEM_HORA, TON_CANA_DIA"
                        >
                          Variável de Peso
                        </FieldLabel>
                        <input
                          id="harvest-weight"
                          type="text"
                          value={harvestPlanWeightVarId}
                          onFocus={() => setWeightSearchFocus(true)}
                          onBlur={() => setTimeout(() => setWeightSearchFocus(false), 200)}
                          onChange={(e) => setHarvestPlanWeightVarId(e.target.value)}
                          placeholder="Ex: MOAGEM_HORA"
                          className="input-field px-3 py-2 text-sm font-mono"
                        />
                        {weightSearchFocus && (
                          <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-bme-border rounded-xl shadow-md max-h-40 overflow-y-auto z-50">
                            {variables
                              .filter(
                                (v) =>
                                  v['ID - REF'] !== idRef &&
                                  (v['ID - REF'].toLowerCase().includes(harvestPlanWeightVarId.toLowerCase()) ||
                                    v['DESCRIÇÃO'].toLowerCase().includes(harvestPlanWeightVarId.toLowerCase()))
                              )
                              .slice(0, 8)
                              .map((v) => (
                                <button
                                  key={v['ID - REF']}
                                  type="button"
                                  onClick={() => {
                                    setHarvestPlanWeightVarId(v['ID - REF']);
                                    setWeightSearchFocus(false);
                                  }}
                                  className="w-full text-left px-3 py-2 hover:bg-bme-muted text-sm border-b border-bme-border last:border-0 transition-colors"
                                >
                                  <span className="font-mono font-semibold text-bme-teal mr-2">
                                    {v['ID - REF']}
                                  </span>
                                  <span className="text-bme-text-sec">{v['DESCRIÇÃO']}</span>
                                </button>
                              ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="hidden md:block" />
                    )}

                    {/* Agrupamento */}
                    <div className="flex flex-col">
                      <FieldLabel
                        htmlFor="harvest-group"
                        tooltip="Grupo ou categoria no relatório de safra. Ex: Entradas de Cana, Produção de Açúcar"
                      >
                        Agrupamento no Relatório
                      </FieldLabel>
                      <input
                        id="harvest-group"
                        type="text"
                        list="agrupamentos-list"
                        value={agrupamento}
                        onChange={(e) => setAgrupamento(e.target.value)}
                        placeholder="Ex: Entradas de Cana"
                        className="input-field px-3 py-2 text-sm"
                      />
                      <datalist id="agrupamentos-list">
                        {uniqueAgrupamentos.map((g) => <option key={g} value={g} />)}
                      </datalist>
                    </div>
                  </div>
                )}
              </Section>
            </div>

            {/* ═══ Footer Fixed ═════════════════════════════════════ */}
            <div className="shrink-0 flex items-center justify-between px-6 py-4 border-t border-bme-border bg-slate-50/80">
              <div>
                {isEdit && equationValue.trim().startsWith('=') && (
                  <button
                    type="button"
                    onClick={() => setIsSubstitutionOpen(true)}
                    className="btn-outline px-3.5 py-2 text-xs text-amber-700 border-amber-200 hover:bg-amber-50 hover:border-amber-300"
                  >
                    <span>🔄</span>
                    <span>Substituir Variável em Todo o Sistema</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-ghost px-5 py-2 text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary px-6 py-2 text-sm font-semibold shadow-md"
                >
                  {isEdit ? 'Salvar Alterações' : 'Cadastrar Variável'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* SubstitutionModal */}
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
    </>
  );
};
