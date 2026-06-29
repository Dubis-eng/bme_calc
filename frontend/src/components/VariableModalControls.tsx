import React from 'react';
import { BmeIcon } from '../theme/design-system';

interface VariableModalHeaderProps {
  isEdit: boolean;
  variableId?: string;
  onClose: () => void;
}

export const VariableModalHeader: React.FC<VariableModalHeaderProps> = ({
  isEdit,
  variableId,
  onClose
}) => {
  return (
    <div className="bme-modal-header">
      <h3 id="modal-title" className="text-base font-bold tracking-tight">
        {isEdit ? `Editar Variável: ${variableId}` : 'Cadastrar Nova Variável'}
      </h3>
      <button onClick={onClose} className="btn-ghost p-1.5 flex items-center justify-center" aria-label="Fechar modal">
        <BmeIcon name="close" size={14} />
      </button>
    </div>
  );
};

interface VariableModalFooterProps {
  isEdit: boolean;
  equationValue: string;
  onClose: () => void;
  onOpenSubstitution: () => void;
}

export const VariableModalFooter: React.FC<VariableModalFooterProps> = ({
  isEdit,
  equationValue,
  onClose,
  onOpenSubstitution
}) => {
  return (
    <div className="bme-modal-footer">
      {isEdit && equationValue.trim().startsWith('=') && (
        <button
          type="button"
          onClick={onOpenSubstitution}
          className="mr-auto bg-amber-600/20 hover:bg-amber-600/35 border border-amber-600/30 text-amber-300 font-bold py-1.5 px-4 rounded text-xs transition-colors"
        >
          Substituir esta Variável
        </button>
      )}
      <button type="button" onClick={onClose} className="bg-slate-800 hover:bg-slate-700 border border-slate-700/60 text-slate-300 font-bold py-1.5 px-4 rounded text-xs transition-colors">
        Cancelar
      </button>
      <button type="submit" className="btn-primary py-1.5 px-4 text-xs font-bold">
        {isEdit ? 'Salvar Alterações' : 'Cadastrar Variável'}
      </button>
    </div>
  );
};
