import React, { useState, useEffect } from 'react';
import { useAtom } from 'jotai';
import axios from 'axios';
import { Variable, Sector, FilterStatus } from './types';
import { GoalSeekModal } from './components/goalseek/GoalSeekModal';
import { SectorModules } from './components/calculator/SectorModules';
import { VariableModal } from './components/variables/VariableModal';
import { SearchPanel } from './components/search/SearchPanel';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { RightPanel } from './components/layout/RightPanel';
import { HarvestPlan } from './components/harvest-plan/HarvestPlan';
import { SystemSettingsModal } from './components/settings/SystemSettingsModal';
import { StatusDashboard } from './components/calculator/StatusDashboard';
import { FlowchartPlaceholder } from './components/calculator/FlowchartPlaceholder';
import { useVariableSearch } from './hooks/useVariableSearch';
import { useSearch } from './hooks/useSearch';
import { useScenario } from './hooks/useScenario';
import { getFriendlySectorName } from './utils/helpers';
import { selectedFieldIdAtom } from './state/atoms';

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
  const [activeStatusFilter, setActiveStatusFilter] = useState<FilterStatus>('all');

  const [selectedFieldId, setSelectedFieldId] = useAtom(selectedFieldIdAtom);

  const fetchSectors = () => {
    axios.get('http://localhost:8000/api/sectors')
      .then(res => setSectors(res.data))
      .catch(console.error);
  };

  useEffect(() => { fetchSectors(); }, []);

  const {
    reloadCurrentScenario, variables, results, loading, calculating, convergenceError, iterations,
    activeSector, setActiveSector, currentScenario, setCurrentScenario,
    saving, anoSafra, setAnoSafra, mesReferencia, setMesReferencia,
    hasUnsavedChanges, setHasUnsavedChanges, savingActive, handleChange, handleCalculate, onLoadScenario, handleSaveNew,
    handleSaveActive, onApplyOptimalValue, handleSaveVariable, isLocked,
    years, months, fetchYearsAndMonths, residual, tolerance, updateTolerance, isOffline, checkConnection
  } = useScenario(sectors, fetchSectors);

  const search = useSearch(variables);
  const searchResults = useVariableSearch(variables, search.debouncedQuery);

  const handleEditVariable = (v: Variable) => { setVariableToEdit(v); setIsVariableModalOpen(true); };
  const onScrollTo = (id: string) => {
    const tv = variables.find(v => v['ID - REF'] === id);
    if (tv) setActiveSector(tv.SETOR);
    search.handleScrollTo(id);
  };
  const onSearchEdit = (id: string) => search.handleSearchEdit(id, handleEditVariable);
  const handleAddVariable = (sec: string, etapaName: string) => {
    setVariableToEdit(null); setPrefilledSector(sec); setPrefilledEtapa(etapaName); setIsVariableModalOpen(true);
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

  const uniqueSectors = Array.from(new Set([...sectors.map(s => s.id), ...variables.map(v => v.SETOR)]));
  const scenarioVars = variables.filter(v => v.TIPO === 'CENARIO');
  const resultsMap = results as Record<string, { value: number | null; status: string }>;

  return (
    <div className="flex flex-col h-screen bg-bme-bg text-slate-200 font-sans overflow-hidden">
      {isOffline && (
        <div className="bg-gradient-to-r from-rose-600 via-amber-600 to-red-700 text-white shadow-lg flex items-center justify-between p-3 border-b border-rose-500/20 backdrop-blur-sm sticky top-0 z-50 animate-pulse">
          <div className="flex items-center gap-2">
            <span className="font-bold">⚠️ Conexão Perdida:</span>
            <span>O servidor está offline. As alterações e os cálculos estão bloqueados para evitar perda de dados.</span>
          </div>
          <button 
            onClick={() => checkConnection()}
            className="bg-white text-rose-700 hover:text-rose-900 font-bold px-4 py-1.5 rounded-lg shadow hover:bg-slate-100 transition-all text-xs active:scale-95"
          >
            Tentar Reconectar
          </button>
        </div>
      )}
      <Header
        searchQuery={search.searchQuery} onSearchInput={search.handleSearchInput}
        iterations={iterations} handleCalculate={handleCalculate} calculating={calculating}
        isLocked={isLocked || isOffline} activeTab={activeTab} setActiveTab={setActiveTab}
        residual={residual} tolerance={tolerance} isOffline={isOffline}
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
                filter={activeStatusFilter}
                setFilter={setActiveStatusFilter}
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
                {(isLocked || isOffline) && (
                  <div className="mb-3 px-4 py-2.5 bg-slate-800/60 border border-slate-700/60 rounded-lg text-slate-400 text-xs font-semibold flex items-center gap-2">
                    <span>🔒</span>
                    <span>{isOffline ? 'Modo Offline. Todas as alterações e recálculos estão suspensos.' : `Cenário Congelado (Status: ${currentScenario?.status}). Edições e recalculações bloqueadas.`}</span>
                  </div>
                )}
                {convergenceError && (
                  <div className="mb-3 px-4 py-2.5 bg-amber-950/40 border border-amber-800/40 rounded-lg text-amber-400 text-xs flex items-center gap-2">
                    <span>⚠️</span>
                    <span>Resultado não convergiu. Limite de 100 ciclos atingido. Revise os dados de entrada.</span>
                  </div>
                )}
                {currentScenario && currentScenario.cycle_start_month && months.length > 0 &&
                 currentScenario.cycle_start_month !== (months.find(m => m.order_index === 0)?.name || 'Abril') && (
                  <div className="mb-3 px-4 py-2.5 bg-amber-950/40 border border-amber-800/40 rounded-lg text-amber-400 text-xs flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span>⚠️</span>
                      <span>
                        Ciclo desatualizado: Este cenário foi calculado usando o ciclo comercial iniciado em{' '}
                        <strong>{currentScenario.cycle_start_month}</strong>, mas o ciclo atual inicia em{' '}
                        <strong>{months.find(m => m.order_index === 0)?.name || 'Abril'}</strong>.
                      </span>
                    </div>
                    {!isLocked && !isOffline && (
                      <button
                        onClick={async () => {
                          handleCalculate();
                          const currentCycleMonth = months.find(m => m.order_index === 0)?.name || 'Abril';
                          setCurrentScenario((prev: any) => prev ? { ...prev, cycle_start_month: currentCycleMonth } : null);
                          setHasUnsavedChanges(true);
                        }}
                        className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-[10px] font-bold transition-all uppercase tracking-wider whitespace-nowrap"
                        aria-label="Recalcular cenário com o novo ciclo comercial"
                      >
                        Recalcular Cenário com o Novo Ciclo
                      </button>
                    )}
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
                    disabled={isLocked || isOffline}
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
                    isLocked={isLocked || isOffline}
                    onEditVariable={handleEditVariable}
                    onAddVariable={handleAddVariable}
                    onNavigateToVariable={onScrollTo}
                    activeStatusFilter={activeStatusFilter}
                    setActiveStatusFilter={setActiveStatusFilter}
                    onReorderSuccess={reloadCurrentScenario}
                  />
                </div>
              </div>
            )}
          </main>

          <RightPanel
            variables={variables}
            onLoadScenario={onLoadScenario}
            currentScenario={currentScenario}
            onStatusChange={newStatus => setCurrentScenario((prev: any) => prev ? { ...prev, status: newStatus } : null)}
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
            isLocked={isLocked || isOffline}
            onGoalSeekOpen={() => setIsGoalSeekOpen(true)}
            sectors={sectors}
            onRefreshSectors={fetchSectors}
            years={years}
            months={months}
          />
        </div>
      )}

      <GoalSeekModal isOpen={isGoalSeekOpen} onClose={() => setIsGoalSeekOpen(false)} variables={variables} onApplyOptimalValue={onApplyOptimalValue} />
      <VariableModal isOpen={isVariableModalOpen} onClose={() => setIsVariableModalOpen(false)} onSave={handleSaveVariableWrapped} variableToEdit={variableToEdit} variables={variables} prefilledSector={prefilledSector} prefilledEtapa={prefilledEtapa} onSubstitutionSuccess={reloadCurrentScenario} />
      <SearchPanel isOpen={search.isSearchPanelOpen} query={search.searchQuery} results={searchResults} onClose={search.closeSearchPanel} onScrollTo={onScrollTo} onEdit={onSearchEdit} />
      <SystemSettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} years={years} months={months} fetchYearsAndMonths={fetchYearsAndMonths} tolerance={tolerance} onUpdateTolerance={updateTolerance} />
    </div>
  );
}

export default App;
