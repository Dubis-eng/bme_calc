import React, { useState, useEffect, useMemo } from 'react';
import { Variable } from '../../types';

interface NodeVariableSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodeTitle: string;
  allVariables: Variable[];
  selectedFieldIds: string[];
  onSaveNodeDetails: (newTitle: string, newFieldIds: string[]) => void;
}

export const NodeVariableSelectorModal: React.FC<NodeVariableSelectorModalProps> = ({
  isOpen,
  onClose,
  nodeTitle,
  allVariables = [],
  selectedFieldIds = [],
  onSaveNodeDetails,
}) => {
  const [title, setTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Cascading Filter States
  const [selectedSectorFilter, setSelectedSectorFilter] = useState<string>('');
  const [selectedEtapaFilter, setSelectedEtapaFilter] = useState<string>('');
  const [selectedPontoControleFilter, setSelectedPontoControleFilter] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setTitle(nodeTitle || '');
      setSelectedIds(selectedFieldIds || []);
      setSearchQuery('');
      setSelectedSectorFilter('');
      setSelectedEtapaFilter('');
      setSelectedPontoControleFilter('');
    }
  }, [isOpen, nodeTitle, selectedFieldIds]);

  // Unique Sectors
  const sectorsList = useMemo(() => {
    const set = new Set<string>();
    allVariables.forEach((v) => {
      if (v.SETOR && v.SETOR.trim() !== '') set.add(v.SETOR.trim());
    });
    return Array.from(set).sort();
  }, [allVariables]);

  // Unique Etapas (filtered by Sector if chosen)
  const etapasList = useMemo(() => {
    const set = new Set<string>();
    allVariables.forEach((v) => {
      if (selectedSectorFilter && v.SETOR?.trim().toUpperCase() !== selectedSectorFilter.toUpperCase()) {
        return;
      }
      if (v.ETAPA && v.ETAPA.trim() !== '') set.add(v.ETAPA.trim());
    });
    return Array.from(set).sort();
  }, [allVariables, selectedSectorFilter]);

  // Unique Pontos de Controle (filtered by Etapa if chosen)
  const pontosControleList = useMemo(() => {
    const set = new Set<string>();
    allVariables.forEach((v) => {
      if (selectedEtapaFilter && v.ETAPA?.trim().toUpperCase() !== selectedEtapaFilter.toUpperCase()) {
        return;
      }
      if (v['PONTO DE CONTROLE'] && v['PONTO DE CONTROLE'].trim() !== '') {
        set.add(v['PONTO DE CONTROLE'].trim());
      }
    });
    return Array.from(set).sort();
  }, [allVariables, selectedEtapaFilter]);

  const filteredVars = useMemo(() => {
    return allVariables.filter((v) => {
      if (selectedSectorFilter && (v.SETOR || '').trim().toUpperCase() !== selectedSectorFilter.toUpperCase()) {
        return false;
      }
      if (selectedEtapaFilter && (v.ETAPA || '').trim().toUpperCase() !== selectedEtapaFilter.toUpperCase()) {
        return false;
      }
      if (
        selectedPontoControleFilter &&
        (v['PONTO DE CONTROLE'] || '').trim().toUpperCase() !== selectedPontoControleFilter.toUpperCase()
      ) {
        return false;
      }
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchesId = (v['ID - REF'] || '').toLowerCase().includes(q);
        const matchesDesc = (v['DESCRIÇÃO'] || '').toLowerCase().includes(q);
        const matchesEtapa = (v['ETAPA'] || '').toLowerCase().includes(q);
        return matchesId || matchesDesc || matchesEtapa;
      }
      return true;
    });
  }, [allVariables, selectedSectorFilter, selectedEtapaFilter, selectedPontoControleFilter, searchQuery]);

  if (!isOpen) return null;

  const toggleVariable = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSave = () => {
    onSaveNodeDetails(title, selectedIds);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in-up">
      <div className="flex flex-col w-full max-w-2xl max-h-[90vh] rounded-2xl border border-slate-300 bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-900 text-white">
          <div>
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <span>✏️</span> Edição e Anexo do Bloco de Processo
            </h3>
            <p className="text-xs text-slate-300 font-medium mt-0.5">Altere o nome e selecione as variáveis do cadastro relacional</p>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-white text-lg font-bold p-1">
            ✕
          </button>
        </div>

        {/* Title Input */}
        <div className="p-5 border-b border-slate-300 bg-slate-50 space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">
              Nome / Título do Bloco
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Moenda Principal, Caldeira 1, etc..."
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-black focus:border-teal-600 focus:outline-none shadow-sm"
            />
          </div>

          {/* Cascading Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold text-black uppercase mb-1">Setor</label>
              <select
                value={selectedSectorFilter}
                onChange={(e) => {
                  setSelectedSectorFilter(e.target.value);
                  setSelectedEtapaFilter('');
                  setSelectedPontoControleFilter('');
                }}
                className="w-full rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-black focus:border-teal-600 focus:outline-none shadow-sm"
              >
                <option value="">-- Todos Setores --</option>
                {sectorsList.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-black uppercase mb-1">Etapa / Processo</label>
              <select
                value={selectedEtapaFilter}
                onChange={(e) => {
                  setSelectedEtapaFilter(e.target.value);
                  setSelectedPontoControleFilter('');
                }}
                className="w-full rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-black focus:border-teal-600 focus:outline-none shadow-sm"
              >
                <option value="">-- Todas Etapas --</option>
                {etapasList.map((e) => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-black uppercase mb-1">Ponto de Controle</label>
              <select
                value={selectedPontoControleFilter}
                onChange={(e) => setSelectedPontoControleFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-black focus:border-teal-600 focus:outline-none shadow-sm"
              >
                <option value="">-- Todos Pontos --</option>
                {pontosControleList.map((pc) => (
                  <option key={pc} value={pc}>{pc}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Search Input */}
          <div>
            <input
              type="text"
              placeholder="🔍 Digite para buscar por código, ID ou descrição..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-black placeholder-slate-400 focus:border-teal-600 focus:outline-none shadow-sm"
            />
          </div>
        </div>

        {/* Variables List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-2 max-h-[320px] bg-white">
          {filteredVars.length === 0 ? (
            <p className="text-xs font-bold text-center text-slate-500 py-8">
              Nenhuma variável encontrada com os filtros selecionados.
            </p>
          ) : (
            filteredVars.map((v) => {
              const id = v['ID - REF'];
              const isChecked = selectedIds.includes(id);
              return (
                <label
                  key={id}
                  onClick={() => toggleVariable(id)}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${isChecked ? 'border-teal-600 bg-teal-50 text-teal-950 shadow-sm' : 'border-slate-200 bg-white text-black hover:border-slate-400'}`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="w-4 h-4 rounded border-slate-400 text-teal-700 focus:ring-0"
                    />
                    <div className="truncate">
                      <div className="text-xs font-mono font-bold text-black">{id}</div>
                      <div className="text-xs font-semibold text-black truncate">{v['DESCRIÇÃO'] || id}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-black font-mono font-bold">{v.ETAPA}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-300 bg-slate-100 text-black">
                      {v['UNIDADE DE MEDIDA'] || v['TIPO']}
                    </span>
                  </div>
                </label>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 border-t border-slate-300 px-6 py-3.5 bg-slate-50">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-black hover:bg-slate-100 transition-colors shadow-sm"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="rounded-xl bg-teal-700 px-5 py-2 text-xs font-bold text-white hover:bg-teal-800 transition-colors shadow-sm"
          >
            Salvar Bloco ({selectedIds.length} vars)
          </button>
        </div>
      </div>
    </div>
  );
};
