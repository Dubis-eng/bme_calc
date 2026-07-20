import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { useAtomValue } from 'jotai';
import { selectedFieldIdAtom } from '../../../state/atoms';
import { ValueTile } from './ValueTile';

export interface ProcessNodeData {
  title: string;
  subtitle?: string;
  fieldIds: string[];
  sourceDefinition?: string;
}

export const ProcessNode: React.FC<NodeProps> = ({ data }) => {
  const d = data as unknown as ProcessNodeData;
  const selectedFieldId = useAtomValue(selectedFieldIdAtom);
  const isSelected = !!selectedFieldId && d.fieldIds.includes(selectedFieldId);

  return (
    <div
      className={`flex min-w-[240px] max-w-[320px] flex-col gap-2 rounded-xl border bg-slate-900/90 p-3 backdrop-blur-md transition-all shadow-lg ${
        isSelected
          ? 'border-teal-500/80 ring-1 ring-teal-500/50 shadow-teal-950/50'
          : 'border-slate-800 hover:border-slate-700'
      }`}
    >
      <Handle type="target" position={Position.Left} className="!bg-teal-500/80 !w-3 !h-3 !border-2 !border-slate-900" />
      
      <div className="flex flex-col px-0.5">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
          {d.title}
        </span>
        {d.subtitle && (
          <span className="text-[10px] uppercase tracking-wide text-slate-500 font-medium">
            {d.subtitle}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        {d.fieldIds.length === 0 ? (
          <span className="rounded-md border border-dashed border-slate-800 bg-slate-950/40 px-2 py-1.5 text-[10px] uppercase tracking-wide text-slate-600 text-center">
            Sem variáveis vinculadas
          </span>
        ) : (
          <>
            {d.fieldIds.slice(0, 6).map((id) => <ValueTile key={id} id={id} />)}
            {d.fieldIds.length > 6 && (
              <span className="text-[10px] font-semibold text-slate-400 text-center py-0.5 italic bg-slate-950/50 rounded border border-slate-800">
                + {d.fieldIds.length - 6} outra(s) variável(is)...
              </span>
            )}
          </>
        )}
      </div>

      <Handle type="source" position={Position.Right} className="!bg-teal-500/80 !w-3 !h-3 !border-2 !border-slate-900" />
    </div>
  );
};
