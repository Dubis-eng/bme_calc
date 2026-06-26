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
import { useVariableSearch } from './utils/useVariableSearch';
import { useSearch } from './utils/useSearch';
import { useScenario } from './utils/useScenario';
import { getFriendlySectorName } from './utils/helpers';

function App() {
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [isGoalSeekOpen, setIsGoalSeekOpen] = useState(false);
  const [isVariableModalOpen, setIsVariableModalOpen] = useState(false);
  const [variableToEdit, setVariableToEdit] = useState<Variable | null>(null);
  const [prefilledSector, setPrefilledSector] = useState('');
  const [prefilledEtapa, setPrefilledEtapa] = useState('');

  const fetchSectors = () => {
    axios.get('http://localhost:8000/api/sectors')
      .then(res => setSectors(res.data))
      .catch(console.error);
  };

  useEffect(() => {
    fetchSectors();
  }, []);

  const {
    variables,
    results,
    loading,
    calculating,
    convergenceError,
    iterations,
    activeSector,
    setActiveSector,
    currentScenario,
    setCurrentScenario,
    saving,
    anoSafra,
    setAnoSafra,
    mesReferencia,
    setMesReferencia,
    hasUnsavedChanges,
    savingActive,
    handleChange,
    handleCalculate,
    onLoadScenario,
    handleSaveNew,
    handleSaveActive,
    onApplyOptimalValue,
    handleSaveVariable,
    isLocked
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
    setTimeout(() => document.querySelector(`[data-group-name="${subName}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500 mb-4"></div>
        <p className="text-slate-400 font-medium">Carregando memorial de cálculo...</p>
      </div>
    );
  }

  const uniqueSectors = Array.from(new Set([
    ...sectors.map(s => s.id),
    ...variables.map(v => v.SETOR)
  ]));
  const scenarioVars = variables.filter(v => v.TIPO === 'CENARIO');

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden">
      <Header
        searchQuery={search.searchQuery}
        onSearchInput={search.handleSearchInput}
        iterations={iterations}
        handleCalculate={handleCalculate}
        calculating={calculating}
        isLocked={isLocked}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          isSidebarExpanded={isSidebarExpanded}
          setIsSidebarExpanded={setIsSidebarExpanded}
          uniqueSectors={uniqueSectors}
          activeSector={activeSector}
          setActiveSector={setActiveSector}
          variables={variables}
          sectors={sectors}
          onSubgroupClick={handleSubgroupClick}
          onVariableClick={onScrollTo}
        />

        <main className="flex-1 flex flex-col overflow-hidden p-6 bg-slate-50">
          {isLocked && (
            <div className="mb-4 p-3 bg-slate-200 border-l-4 border-slate-600 text-slate-700 text-xs font-semibold rounded-r-lg flex items-center space-x-2">
              <span>🔒 Cênario Congelado (Status: {currentScenario?.status}). Edições e recalculações estão bloqueadas.</span>
            </div>
          )}

          {convergenceError && (
            <div className="mb-4 p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 flex items-start space-x-3 shadow-sm animate-pulse">
              <span>⚠️ O resultado não fechou. Limite de 100 ciclos atingido. Revise os dados de entrada.</span>
            </div>
          )}

          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-800">{getFriendlySectorName(activeSector)}</h2>
              <p className="text-xs text-slate-400 mt-0.5">Mostrando {variables.filter(v => v.SETOR === activeSector).length} variáveis</p>
            </div>
            <button
              onClick={() => handleAddVariable(activeSector, '')}
              disabled={isLocked}
              className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 disabled:from-slate-300 disabled:to-slate-400 text-white font-bold py-1.5 px-4 rounded text-xs transition-all shadow-sm flex items-center space-x-1"
            >
              <span>➕ Cadastrar Variável</span>
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
            />
          </div>
        </main>

        <RightPanel
          variables={variables}
          onLoadScenario={onLoadScenario}
          currentScenario={currentScenario}
          onStatusChange={(newStatus) => setCurrentScenario(prev => prev ? { ...prev, status: newStatus } : null)}
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
        />
      </div>

      <GoalSeekModal isOpen={isGoalSeekOpen} onClose={() => setIsGoalSeekOpen(false)} variables={variables} onApplyOptimalValue={onApplyOptimalValue} />
      <VariableModal isOpen={isVariableModalOpen} onClose={() => setIsVariableModalOpen(false)} onSave={handleSaveVariableWrapped} variableToEdit={variableToEdit} variables={variables} prefilledSector={prefilledSector} prefilledEtapa={prefilledEtapa} />
      <SearchPanel isOpen={search.isSearchPanelOpen} query={search.searchQuery} results={searchResults} onClose={search.closeSearchPanel} onScrollTo={onScrollTo} onEdit={onSearchEdit} />
    </div>
  );
}

export default App;
