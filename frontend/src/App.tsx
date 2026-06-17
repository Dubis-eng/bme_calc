import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Variable, Sector } from './types';
import { ScenarioManager, ScenarioMetadata } from './components/ScenarioManager';
import { GoalSeekModal } from './components/GoalSeekModal';
import { SectorModules } from './components/SectorModules';
import { VariableModal } from './components/VariableModal';
import { SearchPanel } from './components/SearchPanel';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ScenarioPremises } from './components/ScenarioPremises';
import { SectorConfig } from './components/SectorConfig';
import { useVariableSearch } from './utils/useVariableSearch';
import { useSearch } from './utils/useSearch';
import { getFriendlySectorName } from './utils/helpers';

function App() {
  const [variables, setVariables] = useState<Variable[]>([]);
  const [results, setResults] = useState<Record<string, any>>({});
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
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [rightTab, setRightTab] = useState<'scenarios' | 'config'>('scenarios');

  const search = useSearch(variables);
  const searchResults = useVariableSearch(variables, search.debouncedQuery);

  const fetchSectors = () => {
    axios.get('http://localhost:8000/api/sectors')
      .then(res => setSectors(res.data))
      .catch(console.error);
  };

  useEffect(() => {
    fetchSectors();
    fetch('/memorial_de_calculo_balanco.json')
      .then(res => res.json())
      .then(data => {
        setVariables(data);
        if (data.length > 0) setActiveSector(data[0].SETOR);
        setLoading(false);
      });
  }, []);

  const isLocked = currentScenario ? (currentScenario.status === 'Aprovado' || currentScenario.status === 'Final') : false;

  const handleChange = (id: string, value: string) => {
    if (isLocked) return;
    setVariables(prev => prev.map(v => v["ID - REF"] === id ? { ...v, "EQUAÇÕES E VALORES": value } : v));
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
        year_harvest: anoSafra, reference_month: mesReferencia, variables, status: 'Em Edição'
      });
      setCurrentScenario({
        id: res.data.id, year_harvest: res.data.year_harvest, reference_month: res.data.reference_month,
        version: res.data.version, status: res.data.status
      });
      alert(`Cenário salvo com sucesso! Versão: v${res.data.version}`);
    } catch (err) {
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

  const handleSubgroupClick = (sectorId: string, subgroupName: string) => {
    setActiveSector(sectorId);
    setTimeout(() => {
      const el = document.querySelector(`[data-group-name="${subgroupName}"]`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500 mb-4"></div>
        <p className="text-slate-400 font-medium">Carregando memorial de cálculo...</p>
      </div>
    );
  }

  const uniqueSectors = sectors.length > 0 ? sectors.map(s => s.id) : Array.from(new Set(variables.map(v => v.SETOR)));
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

        <aside className="w-80 border-l border-slate-200 bg-slate-50 p-6 overflow-y-auto space-y-4 flex flex-col">
          <div className="flex border-b border-slate-250 mb-2">
            <button
              onClick={() => setRightTab('scenarios')}
              className={`flex-1 pb-2 font-bold text-xs uppercase tracking-wider transition-colors ${rightTab === 'scenarios' ? 'border-b-2 border-teal-500 text-teal-600' : 'text-slate-400 hover:text-slate-650'}`}
            >
              Cenários
            </button>
            <button
              onClick={() => setRightTab('config')}
              className={`flex-1 pb-2 font-bold text-xs uppercase tracking-wider transition-colors ${rightTab === 'config' ? 'border-b-2 border-teal-500 text-teal-600' : 'text-slate-400 hover:text-slate-650'}`}
            >
              Configurações
            </button>
          </div>

          {rightTab === 'scenarios' ? (
            <div className="space-y-4 flex flex-col">
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
              <ScenarioPremises scenarioVars={scenarioVars} isLocked={isLocked} onVariableChange={handleChange} />
              <button 
                onClick={() => setIsGoalSeekOpen(true)}
                disabled={isLocked}
                className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white font-bold py-2 px-4 rounded text-xs transition-colors shadow-sm flex items-center justify-center space-x-1.5"
              >
                <span>🔍 Busca de Metas Físicas</span>
              </button>
            </div>
          ) : (
            <SectorConfig sectors={sectors} onRefreshSectors={fetchSectors} isLocked={isLocked} />
          )}
        </aside>
      </div>

      <GoalSeekModal isOpen={isGoalSeekOpen} onClose={() => setIsGoalSeekOpen(false)} variables={variables} onApplyOptimalValue={onApplyOptimalValue} />
      <VariableModal isOpen={isVariableModalOpen} onClose={() => setIsVariableModalOpen(false)} onSave={handleSaveVariable} variableToEdit={variableToEdit} variables={variables} prefilledSector={prefilledSector} prefilledDefinition={prefilledDefinition} />
      <SearchPanel isOpen={search.isSearchPanelOpen} query={search.searchQuery} results={searchResults} onClose={search.closeSearchPanel} onScrollTo={onScrollTo} onEdit={onSearchEdit} />
    </div>
  );
}

export default App;
