import React from 'react';
import { Variable } from '../types';
import { BmeIcon } from '../theme/design-system';

interface SectorAuditCardProps {
  auditVarId: string | null;
  setAuditVarId: (val: string | null) => void;
  internalAuditDeps: string[];
  externalAuditDeps: string[];
  variables: Variable[];
  results: Record<string, any>;
  onNavigateToVariable?: (id: string) => void;
}

export const SectorAuditCard: React.FC<SectorAuditCardProps> = ({
  auditVarId,
  setAuditVarId,
  internalAuditDeps,
  externalAuditDeps,
  variables,
  results,
  onNavigateToVariable,
}) => {
  if (!auditVarId) return null;

  return (
    <div className="glass-card p-4 border border-teal-500/40 bg-slate-950 shadow-2xl space-y-3 max-w-md w-full sticky top-0 z-40 animate-fade-in-up">
      <div className="flex justify-between items-center border-b border-slate-800 pb-2">
        <span className="text-xs font-bold text-slate-300">
          Auditoria de Fluxo: <span className="font-mono text-teal-400">{auditVarId}</span>
        </span>
        <button
          onClick={() => setAuditVarId(null)}
          className="btn-ghost p-1 text-slate-500 hover:text-white"
          aria-label="Fechar"
        >
          <BmeIcon name="close" size={10} />
        </button>
      </div>
      <div className="text-xs space-y-2">
        <p className="text-slate-400">
          {internalAuditDeps.length > 0
            ? `Destacando ${internalAuditDeps.length} células dependentes neste setor.`
            : 'Nenhuma célula dependente no setor ativo.'}
        </p>
        {externalAuditDeps.length > 0 && (
          <>
            <p className="font-bold text-teal-500 mt-2">Dependências Externas:</p>
            <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
              {externalAuditDeps.map((depId) => {
                const depVar = variables.find((v) => v['ID - REF'] === depId);
                const depRes = results[depId];
                if (!depVar) return null;
                return (
                  <div
                    key={depId}
                    className="flex justify-between items-center bg-slate-900/60 p-2 rounded border border-slate-800/40"
                  >
                    <div className="min-w-0">
                      <p className="font-mono text-slate-200 font-semibold truncate">
                        {depId}{' '}
                        <span className="text-[9px] text-slate-500 uppercase">
                          ({depVar.SETOR})
                        </span>
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">{depVar['DESCRIÇÃO']}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-4 shrink-0">
                      <span className="font-mono text-slate-300">
                        {depRes?.status === 'OK' && depRes.value !== null
                          ? depRes.value.toLocaleString('pt-BR', {
                              minimumFractionDigits: 4,
                              maximumFractionDigits: 4,
                            })
                          : '—'}
                      </span>
                      <button
                        onClick={() => onNavigateToVariable && onNavigateToVariable(depId)}
                        className="text-[10px] text-teal-400 hover:text-teal-300 border border-teal-500/20 hover:border-teal-500/50 px-1.5 py-0.5 rounded transition-all"
                      >
                        Ir para
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
