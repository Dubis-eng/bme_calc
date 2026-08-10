import React from 'react';
import { Variable } from '../../types';
import { BmeIcon } from '../../styles/design-system';

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
    <div className="p-4 border border-teal-600 bg-white shadow-2xl space-y-3 max-w-md w-full sticky top-0 z-40 animate-fade-in-up rounded-2xl">
      <div className="flex justify-between items-center border-b border-slate-300 pb-2.5">
        <span className="text-xs font-bold text-black">
          Auditoria de Fluxo: <span className="font-mono font-bold text-teal-800">{auditVarId}</span>
        </span>
        <button
          onClick={() => setAuditVarId(null)}
          className="text-black hover:text-red-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Fechar"
        >
          <BmeIcon name="close" size={14} />
        </button>
      </div>
      <div className="text-xs space-y-2 text-black">
        <p className="font-semibold text-black">
          {internalAuditDeps.length > 0
            ? `Destacando ${internalAuditDeps.length} células dependentes neste setor.`
            : 'Nenhuma célula dependente no setor ativo.'}
        </p>
        {externalAuditDeps.length > 0 && (
          <>
            <p className="font-extrabold text-teal-900 mt-2">Dependências Externas:</p>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {externalAuditDeps.map((depId) => {
                const depVar = variables.find((v) => v['ID - REF'] === depId);
                const depRes = results[depId];
                if (!depVar) return null;
                return (
                  <div
                    key={depId}
                    className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-300 shadow-sm"
                  >
                    <div className="min-w-0">
                      <p className="font-mono text-black font-bold truncate">
                        {depId}{' '}
                        <span className="text-[10px] text-black font-extrabold uppercase">
                          ({depVar.SETOR})
                        </span>
                      </p>
                      <p className="text-[11px] text-black font-semibold truncate">{depVar['DESCRIÇÃO']}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-4 shrink-0">
                      <span className="font-mono font-bold text-black text-xs">
                        {depRes?.status === 'OK' && depRes.value !== null
                          ? depRes.value.toLocaleString('pt-BR', {
                              minimumFractionDigits: 4,
                              maximumFractionDigits: 4,
                            })
                          : '—'}
                      </span>
                      <button
                        onClick={() => onNavigateToVariable && onNavigateToVariable(depId)}
                        className="text-[10px] font-bold text-teal-800 hover:text-teal-950 bg-teal-50 border border-teal-300 hover:bg-teal-100 px-2 py-0.5 rounded-lg transition-all shadow-sm"
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
