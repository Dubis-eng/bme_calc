import React, { useState } from 'react';
import axios from 'axios';
import { Sector } from '../types';

interface SectorConfigProps {
  sectors: Sector[];
  onRefreshSectors: () => void;
  isLocked: boolean;
}

export function SectorConfig({ sectors, onRefreshSectors, isLocked }: SectorConfigProps) {
  const [editingSector, setEditingSector] = useState<Sector | null>(null);
  const [id, setId] = useState('');
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [ordem, setOrdem] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setEditingSector(null);
    setId('');
    setNome('');
    setDescricao('');
    setOrdem('');
    setError('');
  };

  const handleEdit = (sector: Sector) => {
    setEditingSector(sector);
    setId(sector.id);
    setNome(sector.nome);
    setDescricao(sector.descricao || '');
    setOrdem(sector.ordem.toString());
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;
    setError('');
    setSuccess('');

    const cleanId = id.trim().toUpperCase();
    const cleanNome = nome.trim();
    const cleanDesc = descricao.trim();
    const parsedOrdem = parseInt(ordem.trim(), 10);

    if (!cleanId || !cleanNome) {
      setError('ID e Nome são obrigatórios.');
      return;
    }

    if (isNaN(parsedOrdem) || parsedOrdem < 1) {
      setError('Ordem deve ser um número inteiro maior ou igual a 1.');
      return;
    }

    const takenBy = sectors.find(s => s.ordem === parsedOrdem && s.id !== editingSector?.id);
    if (takenBy) {
      setError(`A ordem ${parsedOrdem} já está em uso pelo setor "${takenBy.nome}".`);
      return;
    }

    setSubmitting(true);
    try {
      if (editingSector) {
        // Update
        await axios.patch(`http://localhost:8000/api/sectors/${editingSector.id}`, {
          nome: cleanNome,
          descricao: cleanDesc,
          ordem: parsedOrdem
        });
        setSuccess('Setor atualizado com sucesso!');
      } else {
        // Create
        await axios.post('http://localhost:8000/api/sectors', {
          id: cleanId,
          nome: cleanNome,
          descricao: cleanDesc,
          ordem: parsedOrdem
        });
        setSuccess('Setor criado com sucesso!');
      }
      onRefreshSectors();
      resetForm();
    } catch (err: unknown) {
      console.error(err);
      const msg = axios.isAxiosError(err) && err.response?.data?.detail
        ? err.response.data.detail
        : 'Ocorreu um erro ao salvar o setor.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (sectorId: string) => {
    if (isLocked) return;
    if (!window.confirm(`Tem certeza que deseja excluir o setor "${sectorId}"?`)) return;

    setError('');
    setSuccess('');
    try {
      await axios.delete(`http://localhost:8000/api/sectors/${sectorId}`);
      setSuccess('Setor excluído com sucesso.');
      onRefreshSectors();
      if (editingSector?.id === sectorId) resetForm();
    } catch (err: unknown) {
      console.error(err);
      const msg = axios.isAxiosError(err) && err.response?.data?.detail
        ? err.response.data.detail
        : 'Não foi possível excluir o setor.';
      setError(msg);
    }
  };

  return (
    <div className="flex flex-col space-y-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-xs">
      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
        <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">Cadastro de Setores</h3>
        {editingSector && (
          <button 
            onClick={resetForm}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { resetForm(); } }}
            className="text-[10px] text-slate-500 hover:text-slate-800 font-semibold"
          >
            Cancelar Edição
          </button>
        )}
      </div>

      {error && (
        <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg font-medium leading-4 animate-shake">
          ⚠️ {error}
        </div>
      )}

      {success && (
        <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg font-medium">
          ✓ {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-4 gap-2">
          <div className="col-span-1 flex flex-col">
            <label htmlFor="sector-id-input" className="text-[9px] uppercase font-bold text-slate-500 mb-1">ID (Ref)</label>
            <input
              id="sector-id-input"
              aria-label="ID de Referência do Setor"
              type="text"
              disabled={!!editingSector || isLocked}
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="Ex: DESTILARIA"
              className="border border-slate-200 rounded p-1.5 font-bold uppercase text-slate-700 bg-slate-50/50 disabled:bg-slate-100 disabled:text-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500"
              required
            />
          </div>
          <div className="col-span-2 flex flex-col">
            <label htmlFor="sector-nome-input" className="text-[9px] uppercase font-bold text-slate-500 mb-1">Nome do Setor</label>
            <input
              id="sector-nome-input"
              aria-label="Nome do Setor"
              type="text"
              disabled={isLocked}
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Destilação & Retificação"
              className="border border-slate-200 rounded p-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
              required
            />
          </div>
          <div className="col-span-1 flex flex-col">
            <label htmlFor="sector-ordem-input" className="text-[9px] uppercase font-bold text-slate-500 mb-1">Ordem</label>
            <input
              id="sector-ordem-input"
              aria-label="Ordem do Setor"
              type="number"
              disabled={isLocked}
              value={ordem}
              onChange={(e) => setOrdem(e.target.value)}
              placeholder="Ex: 10"
              className="border border-slate-200 rounded p-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
              required
              min="1"
            />
          </div>
        </div>

        <div className="flex flex-col">
          <label htmlFor="sector-desc-input" className="text-[9px] uppercase font-bold text-slate-500 mb-1">Descrição</label>
          <input
            id="sector-desc-input"
            aria-label="Descrição do Setor"
            type="text"
            disabled={isLocked}
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Opcional. Ex: Produção de etanol hidratado/anidro."
            className="border border-slate-200 rounded p-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>

        <button
          type="submit"
          disabled={submitting || isLocked}
          className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 disabled:from-slate-300 disabled:to-slate-400 text-white font-bold py-2 px-4 rounded text-xs transition-all shadow-sm"
        >
          {submitting ? 'Salvando...' : editingSector ? 'Atualizar Setor' : 'Cadastrar Setor'}
        </button>
      </form>

      <div className="border-t border-slate-100 pt-3">
        <h4 className="font-bold text-slate-500 text-[10px] uppercase tracking-wider mb-2">Setores Cadastrados ({sectors.length})</h4>
        <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
          {sectors.map((sector) => (
            <div key={sector.id} className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-100/50 hover:bg-slate-100/30 transition-colors">
              <div className="min-w-0 pr-2">
                <div className="flex items-baseline space-x-1.5">
                  <span className="font-bold text-[10px] text-teal-700">{sector.id}</span>
                  <span className="font-semibold text-slate-700 truncate">{sector.nome}</span>
                  <span className="text-[9px] bg-slate-100 text-slate-500 px-1 rounded font-bold">#{sector.ordem}</span>
                </div>
                {sector.descricao && <p className="text-[10px] text-slate-400 truncate mt-0.5">{sector.descricao}</p>}
              </div>
              <div className="flex items-center space-x-1.5 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => handleEdit(sector)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { handleEdit(sector); } }}
                  disabled={isLocked}
                  className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-200/50"
                  title="Editar"
                >
                  ✏️
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(sector.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { handleDelete(sector.id); } }}
                  disabled={isLocked}
                  className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-red-50"
                  title="Excluir"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
