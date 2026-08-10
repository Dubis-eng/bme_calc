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
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 animate-fade-in-up">
      <div className="bg-white border border-slate-300 rounded-2xl shadow-2xl w-full max-w-4xl relative overflow-hidden flex flex-col max-h-[90vh]" role="dialog" aria-modal="true" aria-labelledby="sub-title">

        {/* ── FASE 2: Pipeline de execução ── */}
        {loadingConfirm && <ConfirmPipelineOverlay activeStep={activeStep} progress={progress} />}

        <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center border-b border-slate-800">
          <h3 id="sub-title" className="text-sm font-bold text-amber-400 flex items-center gap-2">
            <span>🔄 Substituir Referências de {targetVarId}</span>
          </h3>
          <button onClick={onClose} disabled={loadingConfirm} className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors" aria-label="Fechar">
            <span>✕</span>
          </button>
        </div>

        <div className="p-6 text-xs text-black bg-white space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-300 text-red-900 rounded-xl font-bold">
              ⚠️ {error}
            </div>
          )}
          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-950 rounded-xl font-bold">
              ✅ {successMsg}
            </div>
          )}

          <div className="bg-slate-50 border border-slate-300 p-4 rounded-xl leading-relaxed shadow-sm">
            <span className="font-bold text-black block mb-1">Ação de Substituição:</span>
            Substituir a variável <strong className="text-teal-800 font-mono">{targetVarId}</strong> nas equações em que ela é usada por sua expressão correspondente:
            <code className="block mt-2 bg-slate-900 p-2.5 rounded-xl text-teal-300 font-mono text-xs border border-slate-800 shadow-sm">{targetExpression}</code>
          </div>

          <div className="flex flex-wrap items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-300 shadow-sm">
            <label className="flex items-center gap-2.5 font-bold text-black cursor-pointer">
              <input
                type="checkbox"
                checked={recursive}
                onChange={(e) => setRecursive(e.target.checked)}
                className="w-4 h-4 rounded border-slate-400 text-teal-700 focus:ring-teal-600"
              />
              Substituição em Cadeia (Recursiva)
            </label>
            <span className="text-[11px] text-black font-semibold leading-normal max-w-md">
              (Se ativado, substitui recursivamente em toda a árvore de dependências a jusante. Se desativado, altera apenas as equações que referenciam diretamente {targetVarId}).
            </span>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-extrabold text-black uppercase tracking-wider text-xs">
                Impacto nas Fórmulas ({loadingPreview ? '...' : affected.length} afetadas)
              </h4>
            </div>

            {/* ── FASE 1: Overlay de mapeamento de dependências ── */}
            <div className="border border-slate-300 rounded-xl overflow-hidden bg-white relative shadow-sm">
              {loadingPreview && <MappingOverlay recursive={recursive} />}
              <div className="max-h-52 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 text-black font-bold uppercase tracking-wider text-[10px]">
                      <th className="p-3">Variável</th>
                      <th className="p-3">Setor</th>
                      <th className="p-3">Fórmula Anterior</th>
                      <th className="p-3">Fórmula Nova</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {loadingPreview ? (
                      [1, 2, 3].map((i) => (
                        <tr key={i} className="animate-pulse">
                          <td className="p-3"><div className="h-3 w-16 bg-slate-200 rounded" /></td>
                          <td className="p-3"><div className="h-3 w-20 bg-slate-200 rounded" /></td>
                          <td className="p-3"><div className="h-3 w-40 bg-slate-200 rounded" /></td>
                          <td className="p-3"><div className="h-3 w-48 bg-slate-200 rounded" /></td>
                        </tr>
                      ))
                    ) : affected.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-5 text-center text-slate-600 font-bold italic">
                          Nenhuma equação ativa será afetada.
                        </td>
                      </tr>
                    ) : (
                      affected.map((item) => (
                        <tr key={item.variable_id} className="hover:bg-slate-50">
                          <td className="p-3 font-bold text-teal-800 font-mono">{item.variable_id}</td>
                          <td className="p-3 font-semibold text-black">{item.setor_id}</td>
                          <td className="p-3 font-mono font-bold text-red-700 line-through max-w-[200px] truncate" title={item.expression_before}>{item.expression_before}</td>
                          <td className="p-3 font-mono font-bold text-emerald-800 max-w-[250px] truncate" title={item.expression_after}>{item.expression_after}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {becomesUnused && (
            <div className="bg-amber-50 border border-amber-300 p-4 rounded-xl space-y-3 shadow-sm">
              <div className="text-amber-950 font-extrabold flex items-center gap-1.5 text-xs">
                <span>⚠️ Variável Órfã Detectada</span>
              </div>
              <p className="text-black text-xs font-semibold leading-relaxed">
                Após a substituição, a variável <strong className="text-amber-900 font-mono">{targetVarId}</strong> não será mais utilizada em nenhuma fórmula do sistema. O que deseja fazer com ela?
              </p>
              <div className="flex flex-col gap-2 pl-1 pt-1">
                {(['archive', 'delete', 'none'] as const).map((val) => (
                  <label key={val} className="flex items-center gap-2.5 cursor-pointer text-black font-bold text-xs">
                    <input type="radio" name="actionUnused" checked={actionUnused === val} onChange={() => setActionUnused(val)} className="w-4 h-4 text-teal-700 focus:ring-teal-600 border-slate-400" />
                    {val === 'archive' && "Arquivar Variável (Muda status para 'inativa' e desativa sua fórmula)"}
                    {val === 'delete' && 'Excluir permanentemente (Remove do banco de dados, histórico de resultados e tabelas associadas)'}
                    {val === 'none' && "Manter Ativa (Será mantida como variável de entrada 'INPUT')"}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-slate-50 border-t border-slate-300 px-6 py-3.5 flex justify-end gap-2.5">
          <button type="button" onClick={onClose} disabled={loadingConfirm} className="bg-white hover:bg-slate-100 border border-slate-300 text-black font-bold py-2 px-4 rounded-xl text-xs transition-colors shadow-sm">
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loadingConfirm || loadingPreview || (affected.length === 0 && !becomesUnused)}
            className="bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 text-white font-bold py-2 px-5 rounded-xl text-xs transition-colors shadow-sm"
          >
            {loadingConfirm ? 'Processando...' : 'Confirmar Substituição'}
          </button>
        </div>
      </div>
    </div>
  );
};
