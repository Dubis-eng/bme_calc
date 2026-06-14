import React, { useState, useEffect } from 'react';
import { Variable } from '../types';

interface VariableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (variable: Variable, isEdit: boolean, originalId?: string) => void;
  variableToEdit?: Variable | null;
  variables: Variable[];
  prefilledSector?: string;
  prefilledDefinition?: string;
}

export const VariableModal: React.FC<VariableModalProps> = ({
  isOpen,
  onClose,
  onSave,
  variableToEdit,
  variables,
  prefilledSector = '',
  prefilledDefinition = ''
}) => {
  const isEdit = !!variableToEdit;

  const [idRef, setIdRef] = useState('');
  const [sector, setSector] = useState('');
  const [definition, setDefinition] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'INPUT' | 'OUTPUT'>('INPUT');
  const [unit, setUnit] = useState('-');
  const [equationValue, setEquationValue] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setError('');
      if (variableToEdit) {
        setIdRef(variableToEdit['ID - REF']);
        setSector(variableToEdit['SETOR']);
        setDefinition(variableToEdit['DEFINIÇÃO']);
        setDescription(variableToEdit['DESCRIÇÃO']);
        setType(variableToEdit['TIPO']);
        setUnit(variableToEdit['UNIDADE DE MEDIDA']);
        setEquationValue(String(variableToEdit['EQUAÇÕES E VALORES']));
      } else {
        const hIds = variables
          .map(v => v['ID - REF'])
          .filter(id => /^H\d+$/.test(id))
          .map(id => parseInt(id.substring(1), 10));
        const maxId = hIds.length > 0 ? Math.max(...hIds) : 0;
        setIdRef(`H${maxId + 1}`);
        setSector(prefilledSector);
        setDefinition(prefilledDefinition);
        setDescription('');
        setType('INPUT');
        setUnit('-');
        setEquationValue('');
      }
    }
  }, [isOpen, variableToEdit, prefilledSector, prefilledDefinition, variables]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanId = idRef.trim();
    if (!cleanId) return setError('O ID é obrigatório.');
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(cleanId)) {
      return setError('ID inválido (apenas letras, números e sublinhados, começando com letra ou sublinhado).');
    }

    const idExists = variables.some(v => v['ID - REF'].toUpperCase() === cleanId.toUpperCase());
    if (idExists && (!isEdit || variableToEdit?.['ID - REF'].toUpperCase() !== cleanId.toUpperCase())) {
      return setError('Este ID já está em uso.');
    }

    if (!sector.trim()) return setError('O Setor é obrigatório.');
    if (!definition.trim()) return setError('A Definição é obrigatória.');
    if (!description.trim()) return setError('A Descrição é obrigatória.');

    const newVar: Variable = {
      'ID - REF': cleanId,
      'SETOR': sector.trim().toUpperCase(),
      'DEFINIÇÃO': definition.trim().toUpperCase(),
      'DESCRIÇÃO': description.trim(),
      'TIPO': type,
      'UNIDADE DE MEDIDA': unit.trim(),
      'EQUAÇÕES E VALORES': type === 'OUTPUT' && !equationValue.startsWith('=') ? `=${equationValue}` : equationValue.trim()
    };

    onSave(newVar, isEdit, variableToEdit?.['ID - REF']);
  };

  const uniqueSectors = Array.from(new Set(variables.map(v => v.SETOR)));
  const uniqueDefinitions = Array.from(new Set(variables.map(v => v.DEFINIÇÃO)));

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="bg-slate-950 text-white px-6 py-4 flex justify-between items-center border-b border-slate-800">
          <h3 id="modal-title" className="text-base font-bold tracking-tight">{isEdit ? `Editar Variável: ${variableToEdit?.['ID - REF']}` : 'Cadastrar Nova Variável'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-lg transition-colors p-1" aria-label="Fechar modal">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg font-medium" role="alert">⚠️ {error}</div>}

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label htmlFor="var-id" className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">ID - Referência</label>
              <input id="var-id" type="text" disabled={isEdit} value={idRef} onChange={(e) => setIdRef(e.target.value)} placeholder="Ex: MOENDA_RPM" className="border border-slate-200 rounded p-2 text-xs font-semibold text-slate-700 focus:ring-1 focus:ring-teal-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400" required />
            </div>
            <div className="flex flex-col">
              <label htmlFor="var-type" className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Tipo</label>
              <select id="var-type" value={type} onChange={(e) => setType(e.target.value as 'INPUT' | 'OUTPUT')} className="border border-slate-200 rounded p-2 text-xs font-semibold text-slate-700 focus:ring-1 focus:ring-teal-500 focus:outline-none">
                <option value="INPUT">INPUT (Valor Entrada)</option>
                <option value="OUTPUT">OUTPUT (Fórmula)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label htmlFor="var-sector" className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Setor</label>
              <input id="var-sector" type="text" list="sectors-list" value={sector} onChange={(e) => setSector(e.target.value)} placeholder="Ex: MOAGEM" className="border border-slate-200 rounded p-2 text-xs font-semibold text-slate-700 focus:ring-1 focus:ring-teal-500 focus:outline-none" required />
              <datalist id="sectors-list">{uniqueSectors.map(s => <option key={s} value={s} />)}</datalist>
            </div>
            <div className="flex flex-col">
              <label htmlFor="var-def" className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Definição (Subgrupo)</label>
              <input id="var-def" type="text" list="defs-list" value={definition} onChange={(e) => setDefinition(e.target.value)} placeholder="Ex: MOENDA 1" className="border border-slate-200 rounded p-2 text-xs font-semibold text-slate-700 focus:ring-1 focus:ring-teal-500 focus:outline-none" required />
              <datalist id="defs-list">{uniqueDefinitions.map(d => <option key={d} value={d} />)}</datalist>
            </div>
          </div>

          <div className="flex flex-col">
            <label htmlFor="var-desc" className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Descrição</label>
            <input id="var-desc" type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: Rotação no primeiro terno" className="border border-slate-200 rounded p-2 text-xs font-medium text-slate-700 focus:ring-1 focus:ring-teal-500 focus:outline-none" required />
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="flex flex-col col-span-1">
              <label htmlFor="var-unit" className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Unidade</label>
              <input id="var-unit" type="text" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Ex: rpm" className="border border-slate-200 rounded p-2 text-xs font-medium text-slate-700 focus:ring-1 focus:ring-teal-500 focus:outline-none" required />
            </div>
            <div className="flex flex-col col-span-3">
              <label htmlFor="var-eq" className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">{type === 'INPUT' ? 'Valor Estático / Equação Inicial' : 'Equação / Fórmula'}</label>
              <input id="var-eq" type="text" value={equationValue} onChange={(e) => setEquationValue(e.target.value)} placeholder={type === 'INPUT' ? 'Ex: 6' : 'Ex: =MOENDA_RPM * 1.5'} className="border border-slate-200 rounded p-2 text-xs font-mono text-slate-700 focus:ring-1 focus:ring-teal-500 focus:outline-none" required />
            </div>
          </div>

          <div className="pt-4 flex space-x-3 border-t border-slate-100">
            <button type="button" onClick={onClose} className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold py-2 px-4 rounded text-xs transition-colors">Cancelar</button>
            <button type="submit" className="flex-1 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-bold py-2 px-4 rounded text-xs transition-all shadow-sm">
              {isEdit ? 'Salvar Alterações' : 'Cadastrar Variável'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
