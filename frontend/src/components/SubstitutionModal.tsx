import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { PIPELINE_STEPS, MappingOverlay, ConfirmPipelineOverlay } from './SubstitutionOverlays';

interface SubstitutionAffectedItem {
  variable_id: string;
  nome: string;
  setor_id: string;
  expression_before: string;
  expression_after: string;
}

interface SubstitutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetVarId: string;
  targetExpression: string;
  onSuccess: () => void;
}

interface AxiosErrorLike {
  response?: { data?: { detail?: string } };
  message?: string;
}

const STEP_INTERVAL_MS = 400;

export const SubstitutionModal: React.FC<SubstitutionModalProps> = ({
  isOpen, onClose, targetVarId, targetExpression, onSuccess
}) => {
  const [recursive, setRecursive] = useState(false);
  const [affected, setAffected] = useState<SubstitutionAffectedItem[]>([]);
  const [becomesUnused, setBecomesUnused] = useState(false);
  const [actionUnused, setActionUnused] = useState<'archive' | 'delete' | 'none'>('archive');
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingConfirm, setLoadingConfirm] = useState(false);
  const [activeStep, setActiveStep] = useState(-1);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const stepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearStepTimer = () => {
    if (stepTimerRef.current) {
      clearInterval(stepTimerRef.current);
      stepTimerRef.current = null;
    }
  };

  const startPipelineAnimation = () => {
    setActiveStep(0);
    setProgress(5);
    let step = 0;
    stepTimerRef.current = setInterval(() => {
      step += 1;
      if (step < PIPELINE_STEPS.length - 1) {
        setActiveStep(step);
        setProgress(Math.round((step / PIPELINE_STEPS.length) * 75));
      } else {
        clearStepTimer();
      }
    }, STEP_INTERVAL_MS);
  };

  const finishPipelineAnimation = (success: boolean, callback: () => void) => {
    clearStepTimer();
    if (success) {
      setActiveStep(PIPELINE_STEPS.length - 1);
      setProgress(100);
      setTimeout(callback, 900);
    } else {
      setActiveStep(-1);
      setProgress(0);
      callback();
    }
  };

  const fetchPreview = async () => {
    setLoadingPreview(true);
    setError('');
    try {
      const res = await axios.post(
        `http://localhost:8000/api/variables/${targetVarId}/replace-preview`,
        { recursive, replacement_expr: targetExpression }
      );
      setAffected(res.data.affected);
      setBecomesUnused(res.data.becomes_unused);
    } catch (err) {
      const axiosErr = err as AxiosErrorLike;
      setError(axiosErr.response?.data?.detail || 'Erro ao carregar pré-visualização.');
    } finally {
      setLoadingPreview(false);
    }
  };

  useEffect(() => {
    if (isOpen && targetVarId) {
      setAffected([]);
      setBecomesUnused(false);
      setError('');
      setSuccessMsg('');
      fetchPreview();
    }
  }, [isOpen, targetVarId, recursive]);

  useEffect(() => () => clearStepTimer(), []);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setLoadingConfirm(true);
    setError('');
    startPipelineAnimation();
    try {
      const action = becomesUnused && actionUnused !== 'none' ? actionUnused : null;
      const res = await axios.post(
        `http://localhost:8000/api/variables/${targetVarId}/replace-confirm`,
        { recursive, action_unused: action, replacement_expr: targetExpression }
      );
      const count = res.data.affected_count;
      finishPipelineAnimation(true, () => {
        setSuccessMsg(`Substituição concluída! ${count} equações atualizadas.`);
        setLoadingConfirm(false);
        setTimeout(() => { onSuccess(); onClose(); }, 1200);
      });
    } catch (err) {
      const axiosErr = err as AxiosErrorLike;
      const msg = axiosErr.response?.data?.detail || 'Erro ao confirmar substituição.';
      finishPipelineAnimation(false, () => {
        setError(msg);
        setLoadingConfirm(false);
      });
    }
  };

  return (
    <div className="bme-modal-overlay">
      <div className="bme-modal-container max-w-4xl relative" role="dialog" aria-modal="true" aria-labelledby="sub-title">

        {/* ── FASE 2: Pipeline de execução ── */}
        {loadingConfirm && <ConfirmPipelineOverlay activeStep={activeStep} progress={progress} />}

        <div className="bme-modal-header bg-slate-900/40">
          <h3 id="sub-title" className="text-sm font-bold text-amber-500 flex items-center gap-1.5">
            <span>🔄 Substituir Referências de {targetVarId}</span>
          </h3>
          <button onClick={onClose} disabled={loadingConfirm} className="btn-ghost p-1 flex items-center justify-center" aria-label="Fechar">
            <span>✕</span>
          </button>
        </div>

        <div className="bme-modal-body text-xs space-y-4">
          {error && (
            <div className="p-3 bg-rose-500/15 border border-rose-500/20 text-rose-400 rounded font-medium">
              ⚠️ {error}
            </div>
          )}
          {successMsg && (
            <div className="p-3 bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 rounded font-medium">
              ✅ {successMsg}
            </div>
          )}

          <div className="bg-slate-900/60 border border-slate-800/40 p-3 rounded leading-relaxed">
            <span className="font-semibold block text-slate-400 mb-1">Ação de Substituição:</span>
            Substituir a variável <strong className="text-teal-400">{targetVarId}</strong> nas equações em que ela é usada por sua expressão correspondente:
            <code className="block mt-1.5 bg-slate-950 p-2 rounded text-teal-300 font-mono text-[11px] border border-slate-800/60">{targetExpression}</code>
          </div>

          <div className="flex flex-wrap items-center gap-4 bg-slate-900/40 p-3 rounded border border-slate-800/40">
            <label className="flex items-center gap-2 font-semibold text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={recursive}
                onChange={(e) => setRecursive(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-teal-600 focus:ring-teal-600"
              />
              Substituição em Cadeia (Recursiva)
            </label>
            <span className="text-[10px] text-slate-500 leading-normal max-w-md">
              (Se ativado, substitui recursivamente em toda a árvore de dependências a jusante. Se desativado, altera apenas as equações que referenciam diretamente {targetVarId}).
            </span>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                Impacto nas Fórmulas ({loadingPreview ? '...' : affected.length} afetadas)
              </h4>
            </div>

            {/* ── FASE 1: Overlay de mapeamento de dependências ── */}
            <div className="border border-slate-800/60 rounded overflow-hidden bg-slate-950 relative">
              {loadingPreview && <MappingOverlay recursive={recursive} />}
              <div className="max-h-48 overflow-y-auto">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                      <th className="p-2">Variável</th>
                      <th className="p-2">Setor</th>
                      <th className="p-2">Fórmula Anterior</th>
                      <th className="p-2">Fórmula Nova</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingPreview ? (
                      [1, 2, 3].map((i) => (
                        <tr key={i} className="border-b border-slate-900 animate-pulse">
                          <td className="p-2.5"><div className="h-3 w-16 bg-slate-800 rounded" /></td>
                          <td className="p-2.5"><div className="h-3 w-20 bg-slate-800 rounded" /></td>
                          <td className="p-2.5"><div className="h-3 w-40 bg-slate-800 rounded" /></td>
                          <td className="p-2.5"><div className="h-3 w-48 bg-slate-800 rounded" /></td>
                        </tr>
                      ))
                    ) : affected.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-slate-600 italic">
                          Nenhuma equação ativa será afetada.
                        </td>
                      </tr>
                    ) : (
                      affected.map((item) => (
                        <tr key={item.variable_id} className="border-b border-slate-900 hover:bg-slate-900/40">
                          <td className="p-2 font-bold text-teal-400">{item.variable_id}</td>
                          <td className="p-2 text-slate-500">{item.setor_id}</td>
                          <td className="p-2 font-mono text-rose-400 line-through max-w-[200px] truncate" title={item.expression_before}>{item.expression_before}</td>
                          <td className="p-2 font-mono text-emerald-400 max-w-[250px] truncate" title={item.expression_after}>{item.expression_after}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {becomesUnused && (
            <div className="bg-amber-600/10 border border-amber-600/25 p-3 rounded space-y-2">
              <div className="text-amber-400 font-semibold flex items-center gap-1.5">
                <span>⚠️ Variável Órfã Detectada</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Após a substituição, a variável <strong className="text-amber-500">{targetVarId}</strong> não será mais utilizada em nenhuma fórmula do sistema. O que deseja fazer com ela?
              </p>
              <div className="flex flex-col gap-1.5 pl-1 pt-1">
                {(['archive', 'delete', 'none'] as const).map((val) => (
                  <label key={val} className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input type="radio" name="actionUnused" checked={actionUnused === val} onChange={() => setActionUnused(val)} className="text-teal-600 focus:ring-teal-600 bg-slate-950 border-slate-800" />
                    {val === 'archive' && "Arquivar Variável (Muda status para 'descontinuada' e desativa sua fórmula)"}
                    {val === 'delete' && 'Excluir permanentemente (Remove do banco de dados, histórico de resultados e tabelas associadas)'}
                    {val === 'none' && "Manter Ativa (Será mantida como variável de entrada 'INPUT')"}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bme-modal-footer bg-slate-900/20">
          <button type="button" onClick={onClose} disabled={loadingConfirm} className="bg-slate-800 hover:bg-slate-700 border border-slate-700/60 text-slate-300 font-bold py-1.5 px-4 rounded text-xs transition-colors">
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loadingConfirm || loadingPreview || (affected.length === 0 && !becomesUnused)}
            className="btn-primary py-1.5 px-4 text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white"
          >
            {loadingConfirm ? 'Processando...' : 'Confirmar Substituição'}
          </button>
        </div>
      </div>
    </div>
  );
};


