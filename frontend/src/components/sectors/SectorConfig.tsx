import React, { useState } from 'react';
import axios from 'axios';
import { Sector } from '../../types';
import { BmeIcon } from '../../theme/design-system';

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
    <div className="glass-card p-4 space-y-4 text-xs">
      <div className="flex justify-between items-center border-b border-slate-800/40 pb-2">
        <h3 className="font-bold text-slate-300 text-sm uppercase tracking-wide">Cadastro de Setores</h3>
        {editingSector && (
          <button 
            onClick={resetForm}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { resetForm(); } }}
            className="text-[10px] text-slate-500 hover:text-slate-350 font-semibold"
          >
            Cancelar Edição
          </button>
        )}
      </div>

      {error && (
        <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg font-medium leading-4">
          ⚠️ {error}
        </div>
      )}

      {success && (
        <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 rounded-lg font-medium">
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
              className="input-field p-1.5 font-bold uppercase disabled:bg-slate-900 disabled:text-slate-600 disabled:border-slate-800 focus:outline-none"
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
              className="input-field p-1.5 focus:outline-none"
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
              className="input-field p-1.5 focus:outline-none"
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
            className="input-field p-1.5 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={submitting || isLocked}
          className="btn-primary w-full py-2 text-xs font-bold"
        >
          {submitting ? 'Salvando...' : editingSector ? 'Atualizar Setor' : 'Cadastrar Setor'}
        </button>
      </form>

      <div className="border-t border-slate-800/40 pt-3">
        <h4 className="font-bold text-slate-500 text-[10px] uppercase tracking-wider mb-2">Setores Cadastrados ({sectors.length})</h4>
        <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
          {sectors.map((sector) => (
            <div key={sector.id} className="flex items-center justify-between p-2 bg-slate-900/60 rounded border border-slate-800/40 hover:bg-slate-900/80 transition-colors">
              <div className="min-w-0 pr-2 flex-1">
                <div className="flex items-baseline space-x-1.5">
                  <span className="font-bold text-[10px] text-teal-400">{sector.id}</span>
                  <span className="font-semibold text-slate-200 truncate">{sector.nome}</span>
                  <span className="text-[9px] bg-slate-800 text-slate-400 px-1 rounded font-bold">#{sector.ordem}</span>
                </div>
                {sector.descricao && <p className="text-[10px] text-slate-500 truncate mt-0.5">{sector.descricao}</p>}
              </div>
              <div className="flex items-center space-x-1.5 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => handleEdit(sector)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { handleEdit(sector); } }}
                  disabled={isLocked}
                  className="text-slate-500 hover:text-slate-300 p-1.5 rounded hover:bg-slate-800/60 flex items-center justify-center"
                  title="Editar"
                >
                  <BmeIcon name="pencil" size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(sector.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { handleDelete(sector.id); } }}
                  disabled={isLocked}
                  className="text-slate-500 hover:text-rose-400 p-1.5 rounded hover:bg-rose-500/10 flex items-center justify-center"
                  title="Excluir"
                >
                  <BmeIcon name="close" size={12} className="text-rose-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
