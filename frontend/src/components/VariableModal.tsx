import React, { useState, useEffect, useRef } from 'react';
import { Variable } from '../types';
import { useEquationAutocomplete } from '../utils/useEquationAutocomplete';

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
  const [type, setType] = useState<'INPUT' | 'OUTPUT' | 'DERIVADA' | 'CENARIO'>('INPUT');
  const [status, setStatus] = useState<'ativa' | 'pendente' | 'inválida' | 'descontinuada'>('ativa');
  const [unit, setUnit] = useState('-');
  const [equationValue, setEquationValue] = useState('');
  const [error, setError] = useState('');
  const equationInputRef = useRef<HTMLInputElement>(null);
  const ac = useEquationAutocomplete(variables);

  useEffect(() => {
    if (isOpen) {
      setError('');
      if (variableToEdit) {
        setIdRef(variableToEdit['ID - REF']);
        setSector(variableToEdit['SETOR']);
        setDefinition(variableToEdit['DEFINIÇÃO']);
        setDescription(variableToEdit['DESCRIÇÃO']);
        setType(variableToEdit['TIPO']);
        setStatus(variableToEdit['STATUS'] || 'ativa');
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
        setStatus('ativa');
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
      'EQUAÇÕES E VALORES': (type === 'OUTPUT' || type === 'DERIVADA') && !equationValue.startsWith('=') ? `=${equationValue}` : equationValue.trim(),
      'STATUS': status
    };

    onSave(newVar, isEdit, variableToEdit?.['ID - REF']);
  };

  const uniqueSectors = Array.from(new Set(variables.map(v => v.SETOR)));
  const uniqueDefinitions = Array.from(new Set(variables.map(v => v.DEFINIÇÃO)));

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full md:max-w-3xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="bg-slate-950 text-white px-6 py-4 flex justify-between items-center border-b border-slate-800">
          <h3 id="modal-title" className="text-base font-bold tracking-tight">{isEdit ? `Editar Variável: ${variableToEdit?.['ID - REF']}` : 'Cadastrar Nova Variável'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-lg transition-colors p-1" aria-label="Fechar modal">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg font-medium" role="alert">⚠️ {error}</div>}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col">
              <label htmlFor="var-id" className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">ID - Referência</label>
              <input id="var-id" type="text" disabled={isEdit} value={idRef} onChange={(e) => setIdRef(e.target.value)} placeholder="Ex: MOENDA_RPM" className="border border-slate-200 rounded p-2 text-xs font-semibold text-slate-700 focus:ring-1 focus:ring-teal-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400" required />
            </div>
            <div className="flex flex-col">
              <label htmlFor="var-type" className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Tipo</label>
              <select id="var-type" value={type} onChange={(e) => setType(e.target.value as any)} className="border border-slate-200 rounded p-2 text-xs font-semibold text-slate-700 focus:ring-1 focus:ring-teal-500 focus:outline-none">
                <option value="INPUT">INPUT (Valor Entrada)</option>
                <option value="OUTPUT">OUTPUT (Fórmula)</option>
                <option value="DERIVADA">DERIVADA (Valor Derivado)</option>
                <option value="CENARIO">CENÁRIO (Premissa Global)</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label htmlFor="var-status" className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Status</label>
              <select id="var-status" value={status} onChange={(e) => setStatus(e.target.value as any)} className="border border-slate-200 rounded p-2 text-xs font-semibold text-slate-700 focus:ring-1 focus:ring-teal-500 focus:outline-none">
                <option value="ativa">Ativa</option>
                <option value="pendente">Pendente</option>
                <option value="inválida">Inválida</option>
                <option value="descontinuada">Descontinuada</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex flex-col col-span-1">
              <label htmlFor="var-unit" className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Unidade</label>
              <input id="var-unit" type="text" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Ex: rpm" className="border border-slate-200 rounded p-2 text-xs font-medium text-slate-700 focus:ring-1 focus:ring-teal-500 focus:outline-none" required />
            </div>
            <div className="flex flex-col col-span-1 md:col-span-3 relative">
              <label htmlFor="var-eq" className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">{(type === 'INPUT' || type === 'CENARIO') ? 'Valor Estático / Equação Inicial' : 'Equação / Fórmula'}</label>
              <input
                id="var-eq"
                ref={equationInputRef}
                type="text"
                value={equationValue}
                placeholder={(type === 'INPUT' || type === 'CENARIO') ? 'Ex: 6' : 'Ex: =MOENDA_RPM * 1.5'}
                className="border border-slate-200 rounded p-2 text-xs font-mono text-slate-700 focus:ring-1 focus:ring-teal-500 focus:outline-none"
                required
                onChange={(e) => {
                  const cursor = e.target.selectionStart ?? e.target.value.length;
                  setEquationValue(e.target.value);
                  ac.handleInputChange(e.target.value, cursor);
                }}
                onKeyDown={(e) => {
                  const cursor = equationInputRef.current?.selectionStart ?? equationValue.length;
                  const injection = ac.handleKeyDown(e, equationValue, cursor);
                  if (injection) {
                    setEquationValue(injection.newFormula);
                    requestAnimationFrame(() => {
                      equationInputRef.current?.setSelectionRange(injection.newCursorPos, injection.newCursorPos);
                    });
                  }
                }}
                onBlur={() => setTimeout(ac.dismiss, 150)}
                autoComplete="off"
              />
              <EquationDropdown
                isOpen={ac.isOpen}
                results={ac.results}
                selectedIndex={ac.selectedIndex}
                token={ac.token}
                onSelect={(variable) => {
                  const cursor = equationInputRef.current?.selectionStart ?? equationValue.length;
                  const injection = ac.selectResult(variable, equationValue, cursor);
                  setEquationValue(injection.newFormula);
                  equationInputRef.current?.focus();
                  requestAnimationFrame(() => {
                    equationInputRef.current?.setSelectionRange(injection.newCursorPos, injection.newCursorPos);
                  });
                }}
              />
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

// ── Dropdown sub-component ─────────────────────────────────────────────────

interface DropdownProps {
  isOpen: boolean;
  results: import('../utils/useEquationAutocomplete').AutocompleteResult[];
  selectedIndex: number;
  token: string;
  onSelect: (variable: Variable) => void;
}

function HighlightMatch({ text, token }: { text: string; token: string }) {
  const idx = text.toLowerCase().indexOf(token.toLowerCase());
  if (idx === -1) return <span>{text}</span>;
  return (
    <span>
      {text.slice(0, idx)}
      <mark className="bg-yellow-200 text-yellow-900 font-semibold rounded-sm px-0.5 not-italic">
        {text.slice(idx, idx + token.length)}
      </mark>
      {text.slice(idx + token.length)}
    </span>
  );
}

function EquationDropdown({ isOpen, results, selectedIndex, token, onSelect }: DropdownProps) {
  if (!isOpen || results.length === 0) return null;

  return (
    <ul
      role="listbox"
      aria-label="Sugestões de variáveis"
      className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-50 max-h-52 overflow-y-auto"
    >
      {results.map(({ variable, matchedField }, index) => {
        const varId = variable['ID - REF'];
        const varDesc = variable['DESCRIÇÃO'];
        const isSelected = index === selectedIndex;

        return (
          <li
            key={varId}
            role="option"
            aria-selected={isSelected}
            onMouseDown={(e) => { e.preventDefault(); onSelect(variable); }}
            className={`flex items-center gap-2 px-3 py-2 cursor-pointer text-xs transition-colors ${isSelected ? 'bg-teal-50 border-l-2 border-teal-500' : 'hover:bg-slate-50'
              }`}
          >
            <span className="font-mono font-bold text-teal-600 flex-shrink-0">
              {matchedField === 'id' ? <HighlightMatch text={varId} token={token} /> : varId}
            </span>
            <span className="text-slate-400">—</span>
            <span className="text-slate-600 truncate">
              {matchedField === 'description' ? <HighlightMatch text={varDesc} token={token} /> : varDesc}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
