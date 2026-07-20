import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { useAtomValue, useSetAtom } from 'jotai';
import { selectedFieldIdAtom } from '../../../state/atoms';
import { ProcessNodeData } from './ProcessNode';

export const HubNode: React.FC<NodeProps> = ({ data }) => {
  const d = data as unknown as ProcessNodeData;
  const selectedFieldId = useAtomValue(selectedFieldIdAtom);
  const setSelectedFieldId = useSetAtom(selectedFieldIdAtom);
  const firstId = d.fieldIds[0];
  const isSelected = !!firstId && firstId === selectedFieldId;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (firstId) {
      setSelectedFieldId(firstId);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`flex min-w-[160px] max-w-[260px] flex-col items-center gap-1 rounded-2xl p-3.5 text-slate-100 backdrop-blur-md transition-all shadow-lg text-center cursor-pointer ${
        isSelected
          ? 'bg-gradient-to-br from-teal-600/40 to-cyan-700/30 border border-teal-400 ring-2 ring-teal-500/40'
          : 'bg-gradient-to-br from-teal-950/40 to-slate-900/80 border border-teal-500/30 hover:border-teal-500/60 hover:shadow-teal-950/30'
      }`}
    >
      <Handle type="target" position={Position.Left} className="!bg-teal-400 !w-3 !h-3 !border-2 !border-slate-900" />
      
      <span className="text-[10px] font-bold uppercase tracking-widest text-teal-400">
        Equipamento
      </span>
      
      <span className="whitespace-normal text-center text-xs font-bold leading-snug tracking-tight text-white">
        {d.title}
      </span>
      
      {d.subtitle && (
        <span className="whitespace-normal text-center text-[10px] leading-snug text-slate-400">
          {d.subtitle}
        </span>
      )}
      
      <Handle type="source" position={Position.Right} className="!bg-teal-400 !w-3 !h-3 !border-2 !border-slate-900" />
    </button>
  );
};
