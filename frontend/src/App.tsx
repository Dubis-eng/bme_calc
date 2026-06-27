import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Variable, Sector } from './types';
import { GoalSeekModal } from './components/GoalSeekModal';
import { SectorModules } from './components/SectorModules';
import { VariableModal } from './components/VariableModal';
import { SearchPanel } from './components/SearchPanel';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { RightPanel } from './components/RightPanel';
import { HarvestPlan } from './components/HarvestPlan';
import { SystemSettingsModal } from './components/SystemSettingsModal';
import { StatusDashboard } from './components/StatusDashboard';
import { FlowchartPlaceholder } from './components/FlowchartPlaceholder';
import { useVariableSearch } from './utils/useVariableSearch';
import { useSearch } from './utils/useSearch';
import { useScenario } from './utils/useScenario';
import { getFriendlySectorName } from './utils/helpers';

type ActiveTab = 'calculator' | 'harvest_plan' | 'flowchart';

function App() {
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>('calculator');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [isGoalSeekOpen, setIsGoalSeekOpen] = useState(false);
  const [isVariableModalOpen, setIsVariableModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [variableToEdit, setVariableToEdit] = useState<Variable | null>(null);
  const [prefilledSector, setPrefilledSector] = useState('');
  const [prefilledEtapa, setPrefilledEtapa] = useState('');
  const [showDashboard, setShowDashboard] = useState(true);

  const fetchSectors = () => {
    axios.get('http://localhost:8000/api/sectors')
      .then(res => setSectors(res.data))
      .catch(console.error);
  };

  useEffect(() => { fetchSectors(); }, []);

  const {
    variables, results, loading, calculating, convergenceError, iterations,
    activeSector, setActiveSector,
    currentScenario, setCurrentScenario,
    saving, anoSafra, setAnoSafra, mesReferencia, setMesReferencia,
    hasUnsavedChanges, savingActive,
    handleChange, handleCalculate, onLoadScenario, handleSaveNew,
    handleSaveActive, onApplyOptimalValue, handleSaveVariable, isLocked,
    years, months, fetchYearsAndMonths,
    residual, tolerance, updateTolerance
  } = useScenario(sectors, fetchSectors);

  const search = useSearch(variables);
  const searchResults = useVariableSearch(variables, search.debouncedQuery);

  const handleEditVariable = (v: Variable) => {
    setVariableToEdit(v);
    setIsVariableModalOpen(true);
  };

  const onScrollTo = (id: string) => {
    const tv = variables.find(v => v['ID - REF'] === id);
    if (tv) setActiveSector(tv.SETOR);
    search.handleScrollTo(id);
  };

  const onSearchEdit = (id: string) => search.handleSearchEdit(id, handleEditVariable);

  const handleAddVariable = (sec: string, etapaName: string) => {
    setVariableToEdit(null);
    setPrefilledSector(sec);
    setPrefilledEtapa(etapaName);
    setIsVariableModalOpen(true);
  };

  const handleSaveVariableWrapped = async (newVar: Variable, isEdit: boolean, origId?: string) => {
    await handleSaveVariable(newVar, isEdit, origId);
    setIsVariableModalOpen(false);
  };

  const handleSubgroupClick = (secId: string, subName: string) => {
    setActiveSector(secId);
    setShowDashboard(false);
    setTimeout(() => document.querySelector(`[data-group-name="${subName}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  };

  const handleSectorFromDashboard = (sectorId: string) => {
    setActiveSector(sectorId);
    setShowDashboard(false);
  };

  const handleSectorNavClick = (sectorId: string) => {
    setActiveSector(sectorId);
    setShowDashboard(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-bme-bg text-white gap-4">
        <div className="w-10 h-10 border-2 border-slate-700 border-t-teal-500 rounded-full animate-spin" />
        <p className="text-slate-500 text-sm">Carregando memorial de cálculo...</p>
      </div>
    );
  }

  const uniqueSectors = Array.from(new Set([
    ...sectors.map(s => s.id),
    ...variables.map(v => v.SETOR),
  ]));
  const scenarioVars = variables.filter(v => v.TIPO === 'CENARIO');
  const resultsMap = results as Record<string, { value: number | null; status: string }>;

  return (
    <div className="flex flex-col h-screen bg-bme-bg text-slate-200 font-sans overflow-hidden">
      <Header
        searchQuery={search.searchQuery}
        onSearchInput={search.handleSearchInput}
        iterations={iterations}
        handleCalculate={handleCalculate}
        calculating={calculating}
        isLocked={isLocked}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        residual={residual}
        tolerance={tolerance}
      />

      {activeTab === 'flowchart' && (
        <div className="flex-1 relative overflow-hidden">
          <FlowchartPlaceholder />
        </div>
      )}

      {activeTab === 'harvest_plan' && (
        <div className="flex flex-1 overflow-hidden">
          <main className="flex-1 flex flex-col overflow-hidden p-6">
            <HarvestPlan sectors={sectors} />
          </main>
        </div>
      )}

      {activeTab === 'calculator' && (
        <div className="flex flex-1 overflow-hidden">
          <Sidebar
            isSidebarExpanded={isSidebarExpanded}
            setIsSidebarExpanded={setIsSidebarExpanded}
            uniqueSectors={uniqueSectors}
            activeSector={activeSector}
            setActiveSector={handleSectorNavClick}
            variables={variables}
            sectors={sectors}
            results={resultsMap}
            onSubgroupClick={handleSubgroupClick}
            onVariableClick={onScrollTo}
            onSettingsClick={() => setIsSettingsOpen(true)}
          />

          <main className="flex-1 flex flex-col overflow-hidden bg-slate-900/20">
            {showDashboard ? (
              <StatusDashboard
                sectors={sectors}
                variables={variables}
                results={resultsMap}
                onSectorClick={handleSectorFromDashboard}
              />
            ) : (
              <div className="flex flex-col flex-1 overflow-hidden p-5">
                {/* ── Breadcrumb ── */}
                <div className="flex items-center gap-2 text-[11px] text-slate-600 mb-3">
                  <button onClick={() => setShowDashboard(true)} className="hover:text-teal-400 transition-colors">
                    Dashboard
                  </button>
                  <span>/</span>
                  <span className="text-slate-400 font-medium">{getFriendlySectorName(activeSector)}</span>
                </div>

                {/* ── Status banners ── */}
                {isLocked && (
                  <div className="mb-3 px-4 py-2.5 bg-slate-800/60 border border-slate-700/60 rounded-lg text-slate-400 text-xs font-semibold flex items-center gap-2">
                    <span>🔒</span>
                    <span>Cenário Congelado (Status: {currentScenario?.status}). Edições e recalculações bloqueadas.</span>
                  </div>
                )}
                {convergenceError && (
                  <div className="mb-3 px-4 py-2.5 bg-amber-950/40 border border-amber-800/40 rounded-lg text-amber-400 text-xs flex items-center gap-2">
                    <span>⚠️</span>
                    <span>Resultado não convergiu. Limite de 100 ciclos atingido. Revise os dados de entrada.</span>
                  </div>
                )}

                {/* ── Sector header ── */}
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="text-base font-bold text-white">{getFriendlySectorName(activeSector)}</h2>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {variables.filter(v => v.SETOR === activeSector).length} variáveis cadastradas
                    </p>
                  </div>
                  <button
                    id="btn-add-variable"
                    onClick={() => handleAddVariable(activeSector, '')}
                    disabled={isLocked}
                    className="btn-primary flex items-center gap-1.5 px-3 py-1.5 text-xs"
                  >
                    <span>+</span>
                    <span>Cadastrar Variável</span>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto min-h-0">
                  <SectorModules
                    activeSector={activeSector}
                    variables={variables}
                    results={results}
                    isLocked={isLocked}
                    highlightedVarId={search.highlightedVarId}
                    onEditVariable={handleEditVariable}
                    onAddVariable={handleAddVariable}
                    onVariableChange={handleChange}
                    onNavigateToVariable={onScrollTo}
                  />
                </div>
              </div>
            )}
          </main>

          <RightPanel
            variables={variables}
            onLoadScenario={onLoadScenario}
            currentScenario={currentScenario}
            onStatusChange={newStatus => setCurrentScenario(prev => prev ? { ...prev, status: newStatus } : null)}
            anoSafra={anoSafra}
            setAnoSafra={setAnoSafra}
            mesReferencia={mesReferencia}
            setMesReferencia={setMesReferencia}
            onSaveNew={handleSaveNew}
            saving={saving}
            onSaveActive={handleSaveActive}
            savingActive={savingActive}
            hasUnsavedChanges={hasUnsavedChanges}
            scenarioVars={scenarioVars}
            isLocked={isLocked}
            onVariableChange={handleChange}
            onGoalSeekOpen={() => setIsGoalSeekOpen(true)}
            sectors={sectors}
            onRefreshSectors={fetchSectors}
            years={years}
            months={months}
          />
        </div>
      )}

      <GoalSeekModal isOpen={isGoalSeekOpen} onClose={() => setIsGoalSeekOpen(false)} variables={variables} onApplyOptimalValue={onApplyOptimalValue} />
      <VariableModal isOpen={isVariableModalOpen} onClose={() => setIsVariableModalOpen(false)} onSave={handleSaveVariableWrapped} variableToEdit={variableToEdit} variables={variables} prefilledSector={prefilledSector} prefilledEtapa={prefilledEtapa} />
      <SearchPanel isOpen={search.isSearchPanelOpen} query={search.searchQuery} results={searchResults} onClose={search.closeSearchPanel} onScrollTo={onScrollTo} onEdit={onSearchEdit} />
      <SystemSettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} years={years} months={months} fetchYearsAndMonths={fetchYearsAndMonths} tolerance={tolerance} onUpdateTolerance={updateTolerance} />
    </div>
  );
}

export default App;
