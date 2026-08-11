import React, { useState, useMemo } from 'react';
import { useAtom } from 'jotai';
import { Variable, Sector, FilterStatus } from './types';
import { ScenarioMetadata } from './components/scenario/ScenarioManager';
import { GoalSeekModal } from './components/goalseek/GoalSeekModal';
import { SectorModules } from './components/calculator/SectorModules';
import { VariableDrawer } from './components/variables/VariableDrawer';
import { NavSidebar, ActiveTab } from './components/layout/NavSidebar';
import { Sidebar } from './components/layout/Sidebar';
import { CalculatorTopBar } from './components/layout/CalculatorTopBar';
import { ConfigModal } from './components/settings/ConfigModal';
import { HarvestPlan } from './components/harvest-plan/HarvestPlan';
import { StatusDashboard } from './components/calculator/StatusDashboard';
import { ProcessFlowCanvas } from './components/calculator/ProcessFlowCanvas';
import { ManageSectorsModal } from './components/calculator/ManageSectorsModal';
import apiClient from './api/client';
import { ToastContainer, toast } from './components/ui/Toast';
import { useVariableSearch } from './hooks/useVariableSearch';
import { useSearch } from './hooks/useSearch';
import { useScenario } from './hooks/useScenario';
import { useFlowchartSectors } from './hooks/useFlowchartSectors';
import { activeSectorAtom, selectedFieldIdAtom } from './state/atoms';

function App() {
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>('calculator');
  const [activeFlowSector, setActiveFlowSector] = useState<string>('EXTRAÇÃO');
  const [isNavExpanded, setIsNavExpanded] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [isGoalSeekOpen, setIsGoalSeekOpen] = useState(false);
  const [isVariableModalOpen, setIsVariableModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [variableToEdit, setVariableToEdit] = useState<Variable | null>(null);
  const [prefilledSector, setPrefilledSector] = useState('');
  const [prefilledEtapa, setPrefilledEtapa] = useState('');
  const [showDashboard, setShowDashboard] = useState(true);
  const [activeStatusFilter, setActiveStatusFilter] = useState<FilterStatus>('all');

  const [activeSector, setActiveSector] = useAtom(activeSectorAtom);
  const [selectedFieldId, setSelectedFieldId] = useAtom(selectedFieldIdAtom);

  const {
    allFlowSectors,
    visibleFlowSectors,
    hiddenFlowSectors,
    isManageSectorsOpen,
    setIsManageSectorsOpen,
    toggleHideSector,
    handleDeleteCustomFlowchartSector,
    fetchSectors
  } = useFlowchartSectors(sectors, setSectors, activeFlowSector, setActiveFlowSector);

  const {
    variables, results, calculating, currentScenario, isOffline, isLocked,
    anoSafra, setAnoSafra, mesReferencia, setMesReferencia, hasUnsavedChanges, setHasUnsavedChanges,
    iterations, residual, tolerance, years, months, convergenceError,
    handleCalculate, handleSaveActive, handleSaveNew, handleSaveVariable,
    reloadCurrentScenario, onApplyOptimalValue, updateTolerance,
    fetchYearsAndMonths, setCurrentScenario, saving, savingActive, onLoadScenario
  } = useScenario(sectors, fetchSectors);

  const search = useSearch(variables);

  const uniqueSectors = useMemo(() => {
    return Array.from(new Set([...sectors.map(s => s.id), ...variables.map(v => v.SETOR)]));
  }, [sectors, variables]);

  const onScrollTo = (varId: string) => {
    const v = variables.find(x => x['ID - REF'] === varId);
    if (v) {
      setActiveSector(v.SETOR);
      setShowDashboard(false);
    }
    search.handleScrollTo(varId);
  };

  const handleEditVariable = (varToEdit: Variable) => {
    setVariableToEdit(varToEdit);
    setPrefilledSector(varToEdit.SETOR);
    setPrefilledEtapa(varToEdit.ETAPA || '');
    setIsVariableModalOpen(true);
  };

  const handleAddVariable = (sectorId: string, etapaName: string) => {
    setVariableToEdit(null);
    setPrefilledSector(sectorId);
    setPrefilledEtapa(etapaName);
    setIsVariableModalOpen(true);
  };

  const handleSubgroupClick = (sectorId: string, subgroupName: string) => {
    setShowDashboard(false);
    setActiveSector(sectorId);
    setTimeout(() => {
      const el = document.querySelector(`[data-group-name="${subgroupName}"]`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleSectorNavClick = (sectorId: string) => {
    setShowDashboard(false);
    setActiveSector(sectorId);
  };

  const handleSaveVariableWrapped = async (varData: Variable) => {
    await handleSaveVariable(varData, variableToEdit !== null, variableToEdit?.['ID - REF']);
    setIsVariableModalOpen(false);
    setVariableToEdit(null);
  };

  const handleStatusChange = (status: 'Em Edição' | 'Aprovado' | 'Final') => {
    if (!currentScenario) return;
    setCurrentScenario(prev => prev ? { ...prev, status } : null);
    setHasUnsavedChanges(true);
    apiClient.patch(`/api/scenarios/${currentScenario.id}/status`, { status })
      .then(() => toast.success(`Status alterado para "${status}".`))
      .catch(err => { console.error(err); toast.error('Erro ao salvar status.'); });
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white" aria-label="Calculadora de Balanço de Massa e Energia">
      {/* ── 1. Sidebar Principal de Navegação (Calculadora, Plano Safra, Fluxograma, Config) ── */}
      <NavSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onTabChange={setActiveTab}
        isNavExpanded={isNavExpanded}
        isExpanded={isNavExpanded}
        setIsNavExpanded={setIsNavExpanded}
        onToggleExpand={() => setIsNavExpanded(!isNavExpanded)}
      />

      {/* ── 2. Conteúdo Principal Dependendo da Aba Ativa ── */}
      {activeTab === 'calculator' ? (
        <>
          {/* Sidebar Secundária (Filtro por Setor da Calculadora) */}
          <Sidebar
            sectors={sectors}
            activeSector={activeSector}
            onSelectSector={handleSectorNavClick}
            isExpanded={isSidebarExpanded}
            onToggleExpand={() => setIsSidebarExpanded(!isSidebarExpanded)}
            variables={variables}
            onSelectSubgroup={handleSubgroupClick}
            onShowAll={() => {
              setShowDashboard(true);
              setActiveStatusFilter('all');
            }}
          />

          {/* Área Central Principal */}
          <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white">
            <CalculatorTopBar
              currentScenario={currentScenario}
              hasUnsavedChanges={hasUnsavedChanges}
              isLocked={isLocked}
              isOffline={isOffline}
              saving={saving}
              savingActive={savingActive}
              calculating={calculating}
              onSaveActive={handleSaveActive}
              onSaveNew={handleSaveNew}
              onLoadScenario={onLoadScenario}
              onCalculate={handleCalculate}
              onOpenGoalSeek={() => setIsGoalSeekOpen(true)}
              onOpenConfig={() => setIsConfigModalOpen(true)}
              anoSafra={anoSafra}
              setAnoSafra={setAnoSafra}
              mesReferencia={mesReferencia}
              setMesReferencia={setMesReferencia}
              years={years}
              months={months}
              onStatusChange={handleStatusChange}
              variables={variables}
              onSelectVariable={onScrollTo}

              /* ── Props da Busca Inteligente ── */
              searchQuery={search.searchQuery}
              onSearchChange={search.setSearchQuery}
              searchResults={search.searchResults}
              searchIndex={search.searchIndex}
              searchTotal={search.searchTotal}
              onSearchPrev={search.prevMatch}
              onSearchNext={search.nextMatch}
              onScrollTo={onScrollTo}
            />

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {/* Dashboard Resumo de Status (Cards Interativos) */}
              {showDashboard && (
                <StatusDashboard
                  sectors={sectors}
                  variables={variables}
                  results={results}
                  activeFilter={activeStatusFilter}
                  onFilterChange={setActiveStatusFilter}
                  onSectorClick={handleSectorNavClick}
                  onScrollToVariable={onScrollTo}
                />
              )}

              {/* Módulo dos Setores e Tabelas de Variáveis */}
              <SectorModules
                sectors={sectors}
                activeSector={activeSector}
                variables={variables}
                results={results}
                isLocked={isLocked}
                activeStatusFilter={showDashboard ? activeStatusFilter : 'all'}
                setActiveStatusFilter={setActiveStatusFilter}
                searchMatchIds={search.matchIds}
                currentMatchId={search.currentMatchId}
                onEditVariable={handleEditVariable}
                onAddVariable={handleAddVariable}
              />
            </div>
          </main>
        </>
      ) : (activeTab === 'harvest' || activeTab === 'harvest_plan') ? (
        /* Módulo de Plano de Safra */
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white">
          <HarvestPlan
            sectors={sectors}
            variables={variables}
            results={results}
            anoSafra={anoSafra}
            mesReferencia={mesReferencia}
            isLocked={isLocked}
          />
        </main>
      ) : (
        /* Módulo de Fluxograma Interativo */
        <div className="flex flex-1 flex-col overflow-hidden bg-white">
          <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-slate-200">
            <div className="flex items-center gap-2 overflow-x-auto">
              <span className="text-xs font-bold text-slate-700 mr-2 uppercase tracking-wider">Setor:</span>
              {visibleFlowSectors.map((sector) => (
                <div key={sector.id} className="relative group/tab flex items-center shrink-0">
                  <button onClick={() => setActiveFlowSector(sector.id)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeFlowSector === sector.id ? 'bg-bme-teal text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
                    {sector.label}
                  </button>
                  {sector.isCustom && (
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteCustomFlowchartSector(sector.id); }} className="absolute -top-1 -right-1 hidden group-hover/tab:flex w-4 h-4 bg-rose-500 hover:bg-rose-600 text-white rounded-full items-center justify-center text-[9px] font-bold shadow-md" title="Excluir fluxograma customizado">×</button>
                  )}
                </div>
              ))}
            </div>
            <button onClick={() => setIsManageSectorsOpen(true)} className="btn-outline px-3 py-1.5 text-xs font-semibold">
              <span>👁️‍🗨️ Gerenciar Setores</span>
            </button>
          </div>
          <div className="flex-1 min-h-0 relative">
            <ProcessFlowCanvas sector={activeFlowSector} onCalculate={handleCalculate} isCalculating={calculating} />
          </div>
        </div>
      )}

      {/* ── 3. Modais Globais ── */}
      {isGoalSeekOpen && (
        <GoalSeekModal
          isOpen={isGoalSeekOpen}
          onClose={() => setIsGoalSeekOpen(false)}
          variables={variables}
          results={results}
          onApplyValue={onApplyOptimalValue}
        />
      )}      {isVariableModalOpen && (
        <VariableDrawer
          isOpen={isVariableModalOpen}
          onClose={() => { setIsVariableModalOpen(false); setVariableToEdit(null); }}
          onSave={handleSaveVariableWrapped}
          variableToEdit={variableToEdit}
          variables={variables}
          prefilledSector={prefilledSector}
          prefilledEtapa={prefilledEtapa}
          onSubstitutionSuccess={reloadCurrentScenario}
        />
      )}
      {isConfigModalOpen && (
        <ConfigModal
          isOpen={isConfigModalOpen}
          onClose={() => setIsConfigModalOpen(false)}
          tolerance={tolerance}
          onUpdateTolerance={updateTolerance}
          onRefreshData={fetchYearsAndMonths}
        />
      )}
      {isManageSectorsOpen && (
        <ManageSectorsModal
          isOpen={isManageSectorsOpen} onClose={() => setIsManageSectorsOpen(false)}
          allSectors={allFlowSectors} hiddenSectors={hiddenFlowSectors} onToggleHide={toggleHideSector}
        />
      )}
      <ToastContainer />
    </div>
  );
}

export default App;
