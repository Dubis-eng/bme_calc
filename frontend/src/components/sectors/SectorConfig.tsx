import React, { useState } from 'react';
import axios from 'axios';
import { Sector } from '../../types';
import { BmeIcon } from '../../styles/design-system';

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
        await axios.patch(`http://localhost:8000/api/sectors/${editingSector.id}`, {
          nome: cleanNome,
          descricao: cleanDesc,
          ordem: parsedOrdem
        });
        setSuccess('Setor atualizado com sucesso!');
      } else {
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
    <div className="bg-white border border-slate-300 rounded-2xl p-5 space-y-4 text-xs shadow-sm">
      <div className="flex justify-between items-center border-b border-slate-300 pb-3">
        <h3 className="font-extrabold text-black text-xs uppercase tracking-wider">Cadastro de Setores</h3>
        {editingSector && (
          <button 
            onClick={resetForm}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { resetForm(); } }}
            className="text-xs text-amber-800 hover:text-amber-950 font-bold"
          >
            Cancelar Edição
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-300 text-red-900 rounded-xl font-bold leading-5">
          ⚠️ {error}
        </div>
      )}

      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-950 rounded-xl font-bold">
          ✓ {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div className="grid grid-cols-4 gap-2.5">
          <div className="col-span-1 flex flex-col">
            <label htmlFor="sector-id-input" className="text-[11px] uppercase font-bold text-black mb-1">ID (Ref)</label>
            <input
              id="sector-id-input"
              aria-label="ID de Referência do Setor"
              type="text"
              disabled={!!editingSector || isLocked}
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="EX: DESTILARIA"
              className="bg-white border border-slate-300 rounded-xl p-2 text-xs font-bold uppercase text-black focus:outline-none focus:border-teal-600 disabled:bg-slate-100 disabled:opacity-60 shadow-sm"
              required
            />
          </div>
          <div className="col-span-2 flex flex-col">
            <label htmlFor="sector-nome-input" className="text-[11px] uppercase font-bold text-black mb-1">Nome do Setor</label>
            <input
              id="sector-nome-input"
              aria-label="Nome do Setor"
              type="text"
              disabled={isLocked}
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Destilação & Retificação"
              className="bg-white border border-slate-300 rounded-xl p-2 text-xs font-bold text-black focus:outline-none focus:border-teal-600 shadow-sm"
              required
            />
          </div>
          <div className="col-span-1 flex flex-col">
            <label htmlFor="sector-ordem-input" className="text-[11px] uppercase font-bold text-black mb-1">Ordem</label>
            <input
              id="sector-ordem-input"
              aria-label="Ordem do Setor"
              type="number"
              disabled={isLocked}
              value={ordem}
              onChange={(e) => setOrdem(e.target.value)}
              placeholder="Ex: 10"
              className="bg-white border border-slate-300 rounded-xl p-2 text-xs font-bold text-black focus:outline-none focus:border-teal-600 shadow-sm"
              required
              min="1"
            />
          </div>
        </div>

        <div className="flex flex-col">
          <label htmlFor="sector-desc-input" className="text-[11px] uppercase font-bold text-black mb-1">Descrição</label>
          <input
            id="sector-desc-input"
            aria-label="Descrição do Setor"
            type="text"
            disabled={isLocked}
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Opcional. Ex: Produção de etanol hidratado/anidro."
            className="bg-white border border-slate-300 rounded-xl p-2 text-xs font-bold text-black focus:outline-none focus:border-teal-600 shadow-sm"
          />
        </div>

        <button
          type="submit"
          disabled={submitting || isLocked}
          className="w-full bg-teal-700 hover:bg-teal-800 disabled:bg-slate-300 text-white font-bold py-2.5 text-xs rounded-xl shadow-sm transition-all"
        >
          {submitting ? 'Salvando...' : editingSector ? 'Atualizar Setor' : 'Cadastrar Setor'}
        </button>
      </form>

      <div className="border-t border-slate-300 pt-3.5">
        <h4 className="font-extrabold text-black text-xs uppercase tracking-wider mb-2.5">Setores Cadastrados ({sectors.length})</h4>
        <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
          {sectors.map((sector) => (
            <div key={sector.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-300 hover:bg-slate-100 transition-colors shadow-sm">
              <div className="min-w-0 pr-2 flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-xs text-teal-800 font-mono">{sector.id}</span>
                  <span className="font-bold text-xs text-black truncate">{sector.nome}</span>
                  <span className="text-[10px] bg-slate-200 text-black px-2 py-0.5 rounded-full font-bold">#{sector.ordem}</span>
                </div>
                {sector.descricao && <p className="text-xs text-black font-semibold truncate mt-0.5">{sector.descricao}</p>}
              </div>
              <div className="flex items-center space-x-1.5 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => handleEdit(sector)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { handleEdit(sector); } }}
                  disabled={isLocked}
                  className="text-black hover:text-teal-800 p-1.5 rounded-lg hover:bg-white border border-transparent hover:border-slate-300 flex items-center justify-center transition-all"
                  title="Editar"
                >
                  <BmeIcon name="pencil" size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(sector.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { handleDelete(sector.id); } }}
                  disabled={isLocked}
                  className="text-red-700 hover:text-red-900 p-1.5 rounded-lg hover:bg-white border border-transparent hover:border-red-300 flex items-center justify-center transition-all"
                  title="Excluir"
                >
                  <BmeIcon name="close" size={14} className="text-red-700" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
