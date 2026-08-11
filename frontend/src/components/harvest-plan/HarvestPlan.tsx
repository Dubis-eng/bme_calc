import React from 'react';
import { Sector, Variable } from '../../types';
import { BmeIcon } from '../../styles/design-system';
import { HarvestPlanTable } from './HarvestPlanTable';
import { useHarvestPlanState } from '../../hooks/useHarvestPlanState';
import apiClient from '../../api/client';

interface HarvestPlanProps {
  sectors?: Sector[];
  variables?: Variable[];
  results?: Record<string, any>;
  anoSafra?: number;
  mesReferencia?: string;
  isLocked?: boolean;
}
const ALL_MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

export function HarvestPlan({ sectors = [] }: HarvestPlanProps) {
  const {
    years, selectedYear, setSelectedYear,
    startMonth, months,
    consolidationData, loading, selections, availableScenarios,
    searchQuery, setSearchQuery,
    selectedSector, setSelectedSector,
    activeTypeFilter, setActiveTypeFilter,
    isEditing, newDividerLabel, setNewDividerLabel,
    handleSelectScenario, handleStartMonthChange,
    handleToggleEdit, handleDragStart,
    handleDragOver, handleDrop,
    handleMoveUp, handleMoveDown,
    handleDeleteDivider, handleRenameDivider,
    handleAddDivider
  } = useHarvestPlanState();

  const baseURL = apiClient.defaults.baseURL || 'http://localhost:8000';

  const filteredConsolidated = consolidationData.filter(item => {
    if (item.tipo_item === 'divider') return true;
    const varId = item.variable_id || '';
    const nome = item.nome || '';
    const matchesSearch = varId.toLowerCase().includes(searchQuery.toLowerCase()) || nome.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSector = selectedSector === 'TODOS' || item.setor_id === selectedSector;
    const matchesType = activeTypeFilter === 'ALL' || item.tipo === activeTypeFilter;
    return matchesSearch && matchesSector && matchesType;
  });

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-300 shadow-xl overflow-hidden animate-fade-in">
      {/* Topbar do Plano Safra */}
      <div className="bg-slate-900 text-white px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 space-y-4 md:space-y-0">
        <div className="flex items-center space-x-4">
          <div className="h-9 w-9 bg-teal-600/20 border border-teal-500/40 rounded-xl flex items-center justify-center font-bold text-teal-400 shadow-sm text-sm">
            <BmeIcon name="calendar" size={18} />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-wider uppercase text-teal-400">Plano de Safra Consolidado</h2>
            <p className="text-[11px] text-slate-300 font-medium mt-0.5">Consolidação e regras de acumulação dos cenários aprovados</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold text-slate-300 uppercase">Ano-Safra:</span>
            {years.length > 0 ? (
              <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="bg-slate-800 border border-slate-700 text-white rounded-lg px-2.5 py-1 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-teal-500">
                {years.map(y => <option key={y} value={y}>{y.includes('/') ? y : `${y}/${parseInt(y, 10) + 1}`}</option>)}
              </select>
            ) : <span className="text-xs text-slate-400 font-semibold">Nenhum cenário cadastrado</span>}
          </div>

          <div className="flex items-center space-x-2 border-l border-slate-700 pl-3">
            <span className="text-[11px] font-bold text-slate-300 uppercase">Início do Ciclo:</span>
            <select value={startMonth} onChange={(e) => handleStartMonthChange(e.target.value)} className="bg-slate-800 border border-slate-700 text-white rounded-lg px-2.5 py-1 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-teal-500">
              {ALL_MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Toolbar secundária de Ações e Filtros */}
      <div className="bg-slate-50 px-6 py-3 border-b border-slate-300 flex flex-col md:flex-row justify-between items-center space-y-3 md:space-y-0">
        <div className="flex items-center space-x-2">
          <button
            onClick={handleToggleEdit}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 shadow-sm ${isEditing ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-teal-700 hover:bg-teal-800 text-white'}`}
          >
            <BmeIcon name="pencil" size={14} />
            <span>{isEditing ? 'Salvar Organização' : 'Editar Estrutura'}</span>
          </button>

          {!isEditing && selectedYear && (
            <div className="flex items-center gap-1.5">
              <a
                href={`${baseURL}/api/harvest-plan/export/pdf?year_harvest=${selectedYear}`}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
                title="Exportar PDF"
              >
                <span>📄 PDF</span>
              </a>
              <a
                href={`${baseURL}/api/harvest-plan/export/xlsx?year_harvest=${selectedYear}`}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
                title="Exportar Excel"
              >
                <span>📊 Excel</span>
              </a>
            </div>
          )}

          {isEditing && (
            <div className="flex items-center space-x-2 bg-white p-1 border border-slate-300 rounded-xl shadow-sm animate-fade-in">
              <input
                type="text"
                placeholder="Título do divisor..."
                value={newDividerLabel}
                onChange={(e) => setNewDividerLabel(e.target.value)}
                className="px-2.5 py-1 text-xs font-bold text-black border border-slate-300 rounded-lg w-40 focus:outline-none focus:border-teal-600"
              />
              <button onClick={handleAddDivider} className="px-3 py-1 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-lg uppercase flex items-center gap-1">
                <BmeIcon name="plus" size={12} />
                <span>Divisor</span>
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1 bg-white p-1 border border-slate-300 rounded-xl shadow-sm">
            {[{ id: 'ALL', label: 'Todos' }, { id: 'INPUT', label: 'INPUT' }, { id: 'OUTPUT', label: 'OUTPUT' }].map(opt => (
              <button
                key={opt.id}
                onClick={() => setActiveTypeFilter(opt.id)}
                className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition-all ${activeTypeFilter === opt.id ? 'bg-teal-700 text-white shadow-sm' : 'text-slate-700 hover:text-black hover:bg-slate-100 bg-transparent'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="relative flex-1 md:flex-initial">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <BmeIcon name="search" size={14} />
            </span>
            <input type="search" placeholder="Pesquisar..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-black placeholder-slate-400 w-full md:w-48 focus:outline-none focus:border-teal-600 shadow-sm" />
          </div>

          <select value={selectedSector} onChange={(e) => setSelectedSector(e.target.value)} className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-black focus:outline-none focus:border-teal-600 shadow-sm">
            <option value="TODOS">Todos os Setores</option>
            {(sectors || []).map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-auto min-h-0 bg-slate-50 p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-600">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-teal-600 border-t-transparent mb-4"></div>
            <p className="text-xs font-bold">Carregando dados do plano...</p>
          </div>
        ) : (
          <HarvestPlanTable
            months={months}
            filteredConsolidated={filteredConsolidated}
            selections={selections}
            availableScenarios={availableScenarios}
            handleSelectScenario={handleSelectScenario}
            isEditing={isEditing}
            onMoveUp={handleMoveUp}
            onMoveDown={handleMoveDown}
            onDeleteDivider={handleDeleteDivider}
            onRenameDivider={handleRenameDivider}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          />
        )}
      </div>
    </div>
  );
}
