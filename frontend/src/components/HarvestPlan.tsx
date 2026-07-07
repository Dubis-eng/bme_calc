import React from 'react';
import { Sector } from '../types';
import { BmeIcon } from '../theme/design-system';
import { HarvestPlanTable } from './HarvestPlanTable';
import { HarvestPlanConfigTable } from './HarvestPlanConfigTable';
import { useHarvestPlanState } from '../hooks/useHarvestPlanState';

interface HarvestPlanProps { sectors: Sector[]; }
const ALL_MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

export function HarvestPlan({ sectors }: HarvestPlanProps) {
  const {
    activeSubTab, setActiveSubTab,
    years, selectedYear, setSelectedYear,
    startMonth, months, variablesConfig,
    consolidationData, loading, selections, availableScenarios,
    savingConfig, searchQuery, setSearchQuery,
    selectedSector, setSelectedSector,
    activeTypeFilter, setActiveTypeFilter,
    focusedVarId, setFocusedVarId,
    weightSearchQuery, setWeightSearchQuery,
    isEditing, newDividerLabel, setNewDividerLabel,
    handleSelectScenario, handleStartMonthChange,
    handleConfigChange, handleSaveConfigs,
    handleToggleEdit, handleDragStart,
    handleDragOver, handleDrop,
    handleMoveUp, handleMoveDown,
    handleDeleteDivider, handleRenameDivider,
    handleAddDivider
  } = useHarvestPlanState();

  const filteredConsolidated = consolidationData.filter(item => {
    if (item.tipo_item === 'divider') return true;
    const varId = item.variable_id || '';
    const nome = item.nome || '';
    const matchesSearch = varId.toLowerCase().includes(searchQuery.toLowerCase()) || nome.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSector = selectedSector === 'TODOS' || item.setor_id === selectedSector;
    const matchesType = activeTypeFilter === 'ALL' || item.tipo === activeTypeFilter;
    return matchesSearch && matchesSector && matchesType;
  });

  const filteredConfigs = variablesConfig.filter(item => {
    const matchesSearch = item.id.toLowerCase().includes(searchQuery.toLowerCase()) || item.nome.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSector = selectedSector === 'TODOS' || item.setor_id === selectedSector;
    const matchesType = activeTypeFilter === 'ALL' || item.tipo === activeTypeFilter;
    return matchesSearch && matchesSector && matchesType;
  });

  return (
    <div className="flex flex-col h-full glass-card overflow-hidden animate-fade-in">
      <div className="bg-slate-900/40 text-white px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-880 space-y-4 md:space-y-0">
        <div className="flex items-center space-x-4">
          <div className="h-9 w-9 bg-slate-800 border border-slate-700/60 rounded-lg flex items-center justify-center font-bold text-teal-400 shadow-sm text-sm">
            <BmeIcon name="default" size={14} />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-wider uppercase text-teal-400">Plano de Safra Consolidado</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">Consolidação e regras de acumulação dos cenários aprovados</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Ano-Safra:</span>
            {years.length > 0 ? (
              <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="bg-slate-900 border border-slate-755 text-slate-200 rounded px-2.5 py-1 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-500/50">
                {years.map(y => <option key={y} value={y}>{y.includes('/') ? y : `${y}/${parseInt(y, 10) + 1}`}</option>)}
              </select>
            ) : <span className="text-xs text-slate-550 font-semibold">Nenhum cenário cadastrado</span>}
          </div>

          <div className="flex items-center space-x-2 border-l border-slate-800/60 pl-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Início do Ciclo:</span>
            <select value={startMonth} onChange={(e) => handleStartMonthChange(e.target.value)} className="bg-slate-900 border border-slate-755 text-slate-200 rounded px-2.5 py-1 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-500/50">
              {ALL_MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-slate-950/60 px-6 py-3 border-b border-slate-800/60 flex flex-col md:flex-row justify-between items-center space-y-3 md:space-y-0">
        <div className="flex space-x-1.5 p-1 bg-slate-900 border border-slate-800/60 rounded-lg">
          <button onClick={() => setActiveSubTab('visualizacao')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeSubTab === 'visualizacao' ? 'bg-slate-800 text-teal-400 border border-slate-700/60' : 'text-slate-500 hover:text-slate-300'}`}>
            📊 Visualização Consolidada
          </button>
          <button onClick={() => setActiveSubTab('configuracao')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeSubTab === 'configuracao' ? 'bg-slate-800 text-teal-400 border border-slate-700/60' : 'text-slate-500 hover:text-slate-300'}`}>
            ⚙️ Configuração do Plano
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {activeSubTab === 'visualizacao' && (
            <button
              onClick={handleToggleEdit}
              className={`btn-primary py-1 px-4 text-xs font-bold flex items-center space-x-1.5 ${isEditing ? 'bg-amber-600 hover:bg-amber-500 text-white' : ''}`}
            >
              {isEditing ? <span>💾 Salvar Organização</span> : <span>🔓 Editar Estrutura</span>}
            </button>
          )}

          {activeSubTab === 'visualizacao' && !isEditing && selectedYear && (
            <div className="flex items-center gap-1.5">
              <a
                href={`http://localhost:8000/api/harvest-plan/export/pdf?year_harvest=${selectedYear}`}
                className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-teal-450 hover:text-teal-350 border border-slate-800/60 rounded text-xs font-bold transition-all flex items-center gap-1 animate-fade-in"
                title="Exportar PDF"
              >
                📄 PDF
              </a>
              <a
                href={`http://localhost:8000/api/harvest-plan/export/xlsx?year_harvest=${selectedYear}`}
                className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-teal-450 hover:text-teal-350 border border-slate-800/60 rounded text-xs font-bold transition-all flex items-center gap-1 animate-fade-in"
                title="Exportar Excel"
              >
                📊 Excel
              </a>
            </div>
          )}

          {isEditing && activeSubTab === 'visualizacao' && (
            <div className="flex items-center space-x-2 bg-slate-900/60 p-1 border border-slate-800/60 rounded-lg animate-fade-in">
              <input
                type="text"
                placeholder="Título do divisor..."
                value={newDividerLabel}
                onChange={(e) => setNewDividerLabel(e.target.value)}
                className="px-2 py-0.5 input-field text-[11px] w-36 focus:outline-none"
              />
              <button onClick={handleAddDivider} className="px-2 py-0.5 bg-teal-600 hover:bg-teal-500 text-[9px] font-bold rounded uppercase">
                ➕ Divisor
              </button>
            </div>
          )}

          <div className="flex items-center gap-1 bg-slate-900/60 p-1 border border-slate-800/60 rounded-lg">
            {[{ id: 'ALL', label: 'Todos' }, { id: 'INPUT', label: 'INPUT' }, { id: 'OUTPUT', label: 'OUTPUT' }].map(opt => (
              <button
                key={opt.id}
                onClick={() => setActiveTypeFilter(opt.id)}
                className={`px-2.5 py-0.5 rounded-md text-[9px] font-bold uppercase transition-all ${activeTypeFilter === opt.id ? 'bg-teal-500/20 text-teal-400 border border-teal-500/40 shadow-sm' : 'text-slate-500 hover:text-slate-350 bg-transparent border border-transparent'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="relative flex-1 md:flex-initial">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-[10px]">🔍</span>
            <input type="search" placeholder="Pesquisar..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-7 pr-3 py-1 input-field w-full md:w-48 focus:outline-none" />
          </div>

          <select value={selectedSector} onChange={(e) => setSelectedSector(e.target.value)} className="input-field px-2.5 py-1 focus:outline-none">
            <option value="TODOS">Todos os Setores</option>
            {sectors.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
          </select>

          {activeSubTab === 'configuracao' && (
            <button onClick={handleSaveConfigs} disabled={savingConfig} className="btn-primary py-1 px-4 text-xs font-bold flex items-center space-x-1.5">
              {savingConfig ? <span className="flex items-center gap-1.5"><div className="animate-spin rounded-full h-3.5 w-3.5 border-t-2 border-b-2 border-white"></div>Salvando...</span> : <span>💾 Salvar Configurações</span>}
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto min-h-0 bg-slate-950/10 p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-500 mb-4"></div>
            <p className="text-xs font-semibold">Carregando dados do plano...</p>
          </div>
        ) : activeSubTab === 'visualizacao' ? (
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
        ) : (
          <HarvestPlanConfigTable filteredConfigs={filteredConfigs} variablesConfig={variablesConfig} focusedVarId={focusedVarId} weightSearchQuery={weightSearchQuery} setFocusedVarId={setFocusedVarId} setWeightSearchQuery={setWeightSearchQuery} handleConfigChange={handleConfigChange} />
        )}
      </div>
    </div>
  );
}
