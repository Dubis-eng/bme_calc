import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { useAtomValue } from 'jotai';
import { selectedFieldIdAtom } from '../../../state/atoms';
import { ProcessNodeData } from './ProcessNode';
import { ValueTile } from './ValueTile';

export const IoNode: React.FC<NodeProps> = ({ data }) => {
  const d = data as unknown as ProcessNodeData;
  const selectedFieldId = useAtomValue(selectedFieldIdAtom);
  const isSelected = !!selectedFieldId && d.fieldIds.includes(selectedFieldId);

  return (
    <div
      className={`flex min-w-[220px] max-w-[300px] flex-col gap-2 rounded-2xl border bg-white p-3.5 transition-all shadow-xl ${
        isSelected
          ? 'border-amber-600 ring-2 ring-amber-500/40'
          : 'border-slate-300 hover:border-slate-400'
      }`}
    >
      <Handle type="target" position={Position.Left} className="!bg-amber-600 !w-3.5 !h-3.5 !border-2 !border-white" />
      
      <div className="flex flex-col border-l-3 border-l-amber-600 pl-2">
        <span className="text-xs font-extrabold leading-tight text-black">
          {d.title}
        </span>
        {d.subtitle && (
          <span className="text-[10px] uppercase tracking-wide text-black font-bold">
            {d.subtitle}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        {d.fieldIds.length === 0 ? (
          <span className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-2 py-2 text-[10px] uppercase tracking-wide font-bold text-black text-center">
            Sem variáveis vinculadas
          </span>
        ) : (
          <>
            {d.fieldIds.slice(0, 5).map((id) => <ValueTile key={id} id={id} />)}
            {d.fieldIds.length > 5 && (
              <span className="text-[10px] font-bold text-black text-center py-1 italic bg-slate-100 rounded-lg border border-slate-300">
                + {d.fieldIds.length - 5} outra(s) variável(is)...
              </span>
            )}
          </>
        )}
      </div>

      <Handle type="source" position={Position.Right} className="!bg-amber-600 !w-3.5 !h-3.5 !border-2 !border-white" />
    </div>
  );
};
