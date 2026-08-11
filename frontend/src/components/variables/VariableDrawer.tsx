import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Variable } from '../../types';
import { useEquationAutocomplete } from '../../hooks/useEquationAutocomplete';
import { SubstitutionModal } from './SubstitutionModal';
import { VariableDrawerMetadataSection } from './VariableDrawerMetadataSection';
import { VariableDrawerFormulaSection } from './VariableDrawerFormulaSection';
import { VariableDrawerHarvestPlanSection, HarvestPlanOpType } from './VariableDrawerHarvestPlanSection';
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
  const [harvestPlanOp, setHarvestPlanOp] = useState<HarvestPlanOpType>('');
  const [harvestPlanWeightVarId, setHarvestPlanWeightVarId] = useState('');
  const [agrupamento, setAgrupamento] = useState('');

  const equationInputRef = useRef<HTMLTextAreaElement>(null);
  const ac = useEquationAutocomplete(variables);

  const uniqueSectors      = Array.from(new Set(variables.map((v) => v.SETOR)));
  const uniqueEtapas       = Array.from(new Set(variables.map((v) => v.ETAPA).filter(Boolean))) as string[];
  const uniqueCps          = Array.from(new Set(variables.map((v) => v['PONTO DE CONTROLE']).filter(Boolean))) as string[];
  const uniqueAgrupamentos = Array.from(new Set(variables.map((v) => v.agrupamento).filter(Boolean))) as string[];

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
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-6 overflow-y-auto"
        onClick={onClose}
        aria-hidden="true"
      >
        <div
          className="bg-white rounded-2xl border border-bme-border shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh] overflow-hidden my-auto animate-fade-in-up"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-bme-border bg-slate-50/80 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-teal-50 rounded-xl border border-teal-200 flex items-center justify-center shrink-0">
                <BmeIcon name="variable" size={16} className="text-bme-teal" />
              </div>
              <div>
                <h2 id="modal-title" className="text-base font-bold text-bme-text tracking-tight flex items-center gap-2">
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
            <button onClick={onClose} className="btn-ghost p-2 text-slate-400 hover:text-slate-700 rounded-xl" aria-label="Fechar modal">
              <BmeIcon name="close" size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden" noValidate>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {error && (
                <div className="flex items-start gap-2.5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl animate-fade-in-up" role="alert">
                  <span className="text-base shrink-0">⚠️</span>
                  <span className="font-medium">{error}</span>
                </div>
              )}

              <VariableDrawerMetadataSection
                isEdit={isEdit}
                idRef={idRef}
                setIdRef={setIdRef}
                status={status}
                setStatus={setStatus}
                type={type}
                setType={setType}
                sector={sector}
                setSector={setSector}
                uniqueSectors={uniqueSectors}
                etapa={etapa}
                setEtapa={setEtapa}
                uniqueEtapas={uniqueEtapas}
                pontoControle={pontoControle}
                setPontoControle={setPontoControle}
                uniqueCps={uniqueCps}
                description={description}
                setDescription={setDescription}
                unit={unit}
                setUnit={setUnit}
                casasDecimais={casasDecimais}
                setCasasDecimais={setCasasDecimais}
                tipoExibicao={tipoExibicao}
                setTipoExibicao={setTipoExibicao}
                percentBase={percentBase}
                setPercentBase={setPercentBase}
              />

              <VariableDrawerFormulaSection
                type={type}
                equationValue={equationValue}
                setEquationValue={setEquationValue}
                variables={variables}
                equationInputRef={equationInputRef}
                ac={ac}
                setIsFormulaValid={setIsFormulaValid}
                setFormulaError={setFormulaError}
              />

              <VariableDrawerHarvestPlanSection
                idRef={idRef}
                inHarvestPlan={inHarvestPlan}
                setInHarvestPlan={setInHarvestPlan}
                harvestPlanOp={harvestPlanOp}
                setHarvestPlanOp={setHarvestPlanOp}
                harvestPlanWeightVarId={harvestPlanWeightVarId}
                setHarvestPlanWeightVarId={setHarvestPlanWeightVarId}
                agrupamento={agrupamento}
                setAgrupamento={setAgrupamento}
                variables={variables}
                uniqueAgrupamentos={uniqueAgrupamentos}
              />
            </div>

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
                <button type="button" onClick={onClose} className="btn-ghost px-5 py-2 text-sm font-medium">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary px-6 py-2 text-sm font-semibold shadow-md">
                  {isEdit ? 'Salvar Alterações' : 'Cadastrar Variável'}
                </button>
              </div>
            </div>
          </form>
        </div>
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
    </>
  );
};
