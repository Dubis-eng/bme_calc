import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Variable } from './types';
import { ScenarioManager, ScenarioMetadata } from './components/ScenarioManager';
import { GoalSeekModal } from './components/GoalSeekModal';
import { SectorModules } from './components/SectorModules';
import { VariableModal } from './components/VariableModal';
import { SearchPanel } from './components/SearchPanel';
import { useVariableSearch } from './utils/useVariableSearch';
import { useSearch } from './utils/useSearch';
import { getFriendlySectorName } from './utils/helpers';

function App() {
  const [variables, setVariables] = useState<Variable[]>([]);
  const [results, setResults] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [convergenceError, setConvergenceError] = useState(false);
  const [iterations, setIterations] = useState(1);
  const [activeSector, setActiveSector] = useState<string>('');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [currentScenario, setCurrentScenario] = useState<ScenarioMetadata | null>(null);
  const [isGoalSeekOpen, setIsGoalSeekOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [anoSafra, setAnoSafra] = useState('2026/2027');
  const [mesReferencia, setMesReferencia] = useState('Abril');
  const [isVariableModalOpen, setIsVariableModalOpen] = useState(false);
  const [variableToEdit, setVariableToEdit] = useState<Variable | null>(null);
  const [prefilledSector, setPrefilledSector] = useState('');
  const [prefilledDefinition, setPrefilledDefinition] = useState('');

  const search = useSearch(variables);
  const searchResults = useVariableSearch(variables, search.debouncedQuery);

  useEffect(() => {
    fetch('/memorial_de_calculo_balanco.json')
      .then(res => res.json())
      .then(data => {
        setVariables(data);
        if (data.length > 0) {
          setActiveSector(data[0].SETOR);
        }
        setLoading(false);
      });
  }, []);

  const isLocked = currentScenario ? (currentScenario.status === 'Aprovado' || currentScenario.status === 'Final') : false;

  const handleChange = (id: string, value: string) => {
    if (isLocked) return;
    setVariables(prev => prev.map(v =>
      v["ID - REF"] === id ? { ...v, "EQUAÇÕES E VALORES": value } : v
    ));
  };

  const triggerCalculate = async (varsList: Variable[]) => {
    setCalculating(true);
    setConvergenceError(false);
    try {
      const response = await axios.post('http://localhost:8000/api/calculate', { variables: varsList });
      setResults(response.data.results);
      setConvergenceError(response.data.convergence_error);
      setIterations(response.data.iterations);
    } catch (err) {
      console.error(err);
      alert("Erro ao calcular.");
    } finally {
      setCalculating(false);
    }
  };

  const handleCalculate = () => triggerCalculate(variables);

  const onLoadScenario = (loadedVars: Variable[], meta: ScenarioMetadata) => {
    setVariables(loadedVars);
    setCurrentScenario(meta);
    setAnoSafra(meta.year_harvest);
    setMesReferencia(meta.reference_month);
    triggerCalculate(loadedVars);
  };

  const handleSaveNew = async () => {
    setSaving(true);
    try {
      const res = await axios.post('http://localhost:8000/api/scenarios', {
        year_harvest: anoSafra,
        reference_month: mesReferencia,
        variables,
        status: 'Em Edição'
      });
      const saved = res.data;
      const meta: ScenarioMetadata = {
        id: saved.id,
        year_harvest: saved.year_harvest,
        reference_month: saved.reference_month,
        version: saved.version,
        status: saved.status
      };
      setCurrentScenario(meta);
      alert(`Cenário salvo com sucesso! Versão: v${saved.version}`);
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar cenário.");
    } finally {
      setSaving(false);
    }
  };

  const onApplyOptimalValue = (inputId: string, optimalValue: number, newResults: Record<string, number>) => {
    setVariables(prev => prev.map(v => v["ID - REF"] === inputId ? { ...v, "EQUAÇÕES E VALORES": optimalValue } : v));
    setResults(newResults);
  };

  const handleEditVariable = (variable: Variable) => {
    setVariableToEdit(variable);
    setIsVariableModalOpen(true);
  };

  const onScrollTo = (varId: string) => {
    const targetVar = variables.find(v => v['ID - REF'] === varId);
    if (targetVar) setActiveSector(targetVar.SETOR);
    search.handleScrollTo(varId);
  };

  const onSearchEdit = (varId: string) => {
    search.handleSearchEdit(varId, handleEditVariable);
  };

  const handleAddVariable = (sector: string, definition: string) => {
    setVariableToEdit(null);
    setPrefilledSector(sector);
    setPrefilledDefinition(definition);
    setIsVariableModalOpen(true);
  };

  const handleSaveVariable = (newVar: Variable, isEdit: boolean, originalId?: string) => {
    if (isLocked) return;
    const updated = isEdit && originalId
      ? variables.map(v => v["ID - REF"] === originalId ? newVar : v)
      : [...variables, newVar];
    setVariables(updated);
    setIsVariableModalOpen(false);
    triggerCalculate(updated);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500 mb-4"></div>
        <p className="text-slate-400 font-medium">Carregando memorial de cálculo...</p>
      </div>
    );
  }

  const uniqueSectors = Array.from(new Set(variables.map(v => v.SETOR)));

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden">
      
      {/* HEADER */}
      <header className="flex justify-between items-center bg-slate-900 text-white px-6 py-4 shadow-md z-20 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 bg-gradient-to-tr from-teal-500 to-cyan-500 rounded-lg flex items-center justify-center font-bold text-white shadow-sm">
            𝚽
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">Calculadora de Balanço</h1>
            <p className="text-xs text-slate-400">Massa &amp; Energia</p>
          </div>
        </div>

        {/* Calculate actions */}
        <div className="flex items-center space-x-3">
          {/* Global search bar */}
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none">🔍</span>
            <input
              id="global-search"
              type="search"
              placeholder="Buscar variável..."
              value={search.searchQuery}
              onChange={(e) => search.handleSearchInput(e.target.value)}
              onFocus={() => { if (search.searchQuery.trim()) search.handleSearchInput(search.searchQuery); }}
              className="pl-8 pr-3 py-1.5 rounded text-xs bg-slate-800 text-slate-200 placeholder-slate-500 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500 w-52 transition-all"
              aria-label="Buscar variável por ID, Descrição ou Definição"
            />
          </div>
          {iterations > 1 && <span className="text-xs text-slate-400">Iterações: <span className="font-semibold text-teal-400">{iterations}</span></span>}
          <button 
            onClick={handleCalculate} 
            disabled={calculating || isLocked} 
            className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 disabled:from-slate-700 disabled:to-slate-800 text-white font-bold py-1.5 px-5 rounded text-sm shadow-md transition-all flex items-center space-x-2 border border-teal-500/20"
          >
            {calculating && <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>}
            <span>{calculating ? 'Calculando...' : 'Calcular'}</span>
          </button>
        </div>
      </header>

      {/* BODY */}
      <div className="flex flex-1 overflow-hidden">
        {/* COLLAPSIBLE SIDEBAR */}
        <aside className={`flex flex-col bg-slate-950 text-slate-300 border-r border-slate-800 transition-all duration-300 ${isSidebarExpanded ? 'w-64' : 'w-16'}`}>
          <div className="flex justify-between items-center p-4 border-b border-slate-900 bg-slate-950/50">
            {isSidebarExpanded && <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Setores</span>}
            <button onClick={() => setIsSidebarExpanded(!isSidebarExpanded)} className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors focus:outline-none ml-auto" aria-label={isSidebarExpanded ? "Recolher menu" : "Expandir menu"}>
              {isSidebarExpanded ? '◀' : '▶'}
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto py-2">
            {uniqueSectors.map((sector) => {
              const friendly = getFriendlySectorName(sector);
              const initials = friendly.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
              const count = variables.filter(v => v.SETOR === sector).length;
              const isActive = activeSector === sector;
              return (
                <button key={sector} onClick={() => setActiveSector(sector)} className={`w-full flex items-center p-3 text-left transition-all relative ${isActive ? 'bg-gradient-to-r from-teal-900/40 to-cyan-900/10 text-white font-semibold border-l-4 border-teal-500' : 'hover:bg-slate-900/50 text-slate-400 hover:text-slate-200'}`} title={friendly}>
                  <span className={`flex-shrink-0 h-6 w-6 rounded flex items-center justify-center text-[10px] font-bold ${isActive ? 'bg-teal-600 text-white' : 'bg-slate-800 text-slate-500'}`}>{initials}</span>
                  {isSidebarExpanded && (
                    <div className="ml-3 flex-1 flex justify-between items-center min-w-0">
                      <span className="truncate text-xs">{friendly}</span>
                      <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-500 ml-2">{count}</span>
                    </div>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* MAIN VIEW */}
        <main className="flex-1 flex flex-col overflow-hidden p-6 bg-slate-50">
          
          {/* Locked status banner */}
          {isLocked && (
            <div className="mb-4 p-3 bg-slate-200 border-l-4 border-slate-600 text-slate-700 text-xs font-semibold rounded-r-lg flex items-center space-x-2">
              <span>🔒</span>
              <span>Cenário Congelado (Status: {currentScenario?.status}). Edições e recalculações estão bloqueadas.</span>
            </div>
          )}

          {/* Convergence Error Banner */}
          {convergenceError && (
            <div className="mb-4 p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 flex items-start space-x-3 shadow-sm animate-pulse">
              <span className="text-base">⚠️</span>
              <div>
                <span className="font-semibold text-amber-900 block text-xs">O resultado não fechou.</span>
                <span className="text-xs">Por favor, revise as últimas alterações nos dados de entrada. (Limite de 100 ciclos atingido).</span>
              </div>
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

          {/* SECTOR MODULES */}
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

        {/* RIGHT PANEL FOR SCENARIOS */}
        <aside className="w-80 border-l border-slate-200 bg-slate-50 p-6 overflow-y-auto space-y-4 flex flex-col">
          <ScenarioManager
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
          />
          
          <button 
            onClick={() => setIsGoalSeekOpen(true)}
            disabled={isLocked}
            className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white font-bold py-2 px-4 rounded text-xs transition-colors shadow-sm flex items-center justify-center space-x-1.5"
          >
            <span>🔍 Busca de Metas Físicas</span>
          </button>
        </aside>
      </div>

      {/* Goal Seek Modal */}
      <GoalSeekModal
        isOpen={isGoalSeekOpen}
        onClose={() => setIsGoalSeekOpen(false)}
        variables={variables}
        onApplyOptimalValue={onApplyOptimalValue}
      />

      {/* Variable Modal */}
      <VariableModal
        isOpen={isVariableModalOpen}
        onClose={() => setIsVariableModalOpen(false)}
        onSave={handleSaveVariable}
        variableToEdit={variableToEdit}
        variables={variables}
        prefilledSector={prefilledSector}
        prefilledDefinition={prefilledDefinition}
      />

      {/* Search Panel */}
      <SearchPanel
        isOpen={search.isSearchPanelOpen}
        query={search.searchQuery}
        results={searchResults}
        onClose={search.closeSearchPanel}
        onScrollTo={onScrollTo}
        onEdit={onSearchEdit}
      />
    </div>
  );
}

export default App;
