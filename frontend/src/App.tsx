import React, { useState, useEffect, useMemo } from 'react';
import { useAtom } from 'jotai';
import axios from 'axios';
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
import { ToastContainer } from './components/ui/Toast';

import { useVariableSearch } from './hooks/useVariableSearch';
import { useSearch } from './hooks/useSearch';
import { useScenario } from './hooks/useScenario';
import { getFriendlySectorName } from './utils/helpers';
import { activeSectorAtom, selectedFieldIdAtom } from './state/atoms';

const DEFAULT_FLOW_SECTORS = [
  { id: 'EXTRAÇÃO', label: 'Extração / Moagem' },
  { id: 'DESTILAÇÃO', label: 'Destilação' },
  { id: 'AÇÚCAR', label: 'Fábrica de Açúcar' },
  { id: 'FERMENTAÇÃO', label: 'Fermentação' },
  { id: 'TRATAMENTO DO CALDO', label: 'Tratamento do Caldo' },
  { id: 'UTILIDADES', label: 'Utilidades' },
  { id: 'PLANEJAMENTO', label: 'Planejamento' },
  { id: 'INFO GERAIS', label: 'Informações Gerais' },
  { id: 'INFORMAÇÕES TURBINAS', label: 'Turbinas' },
  { id: 'LEVEDURA', label: 'Levedura' },
];

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

  const [customFlowSectors, setCustomFlowSectors] = useState<Array<{ id: string; label: string }>>(() => {
    try {
      return JSON.parse(localStorage.getItem('bme_custom_flow_sectors') || '[]');
    } catch {
      return [];
    }
  });
  const [hiddenFlowSectors, setHiddenFlowSectors] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('bme_hidden_flow_sectors') || '[]');
    } catch {
      return [];
    }
  });
  const [isManageSectorsOpen, setIsManageSectorsOpen] = useState(false);

  const toggleHideSector = (sectorId: string) => {
    setHiddenFlowSectors((prev) => {
      const updated = prev.includes(sectorId) ? prev.filter((s) => s !== sectorId) : [...prev, sectorId];
      localStorage.setItem('bme_hidden_flow_sectors', JSON.stringify(updated));
      return updated;
    });
  };

  const handleDeleteCustomFlowchartSector = async (sectorId: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir permanentemente o fluxograma '${sectorId}'?`)) return;
    try { await axios.delete(`http://localhost:8000/api/flowcharts/${encodeURIComponent(sectorId)}`); } catch (err) { console.error(err); }
    setCustomFlowSectors((prev) => { const updated = prev.filter((s) => s.id !== sectorId); localStorage.setItem('bme_custom_flow_sectors', JSON.stringify(updated)); return updated; });
    setHiddenFlowSectors((prev) => { const updated = prev.filter((s) => s !== sectorId); localStorage.setItem('bme_hidden_flow_sectors', JSON.stringify(updated)); return updated; });
    if (activeFlowSector === sectorId) { const remaining = visibleFlowSectors.filter((s) => s.id !== sectorId); if (remaining.length > 0) setActiveFlowSector(remaining[0].id); }
  };

  const officialFlowSectors = (sectors.length > 0 ? sectors.map(s => ({ id: s.id, label: s.nome || getFriendlySectorName(s.id) })) : DEFAULT_FLOW_SECTORS).map(s => ({ ...s, isCustom: false }));

  const allFlowSectors = [
    ...officialFlowSectors,
    ...customFlowSectors.filter(c => !officialFlowSectors.some(o => o.id === c.id)).map(c => ({ ...c, isCustom: true }))
  ];

  const visibleFlowSectors = allFlowSectors.filter(s => !hiddenFlowSectors.includes(s.id));

  const fetchSectors = () => {
    axios.get('http://localhost:8000/api/sectors').then(res => setSectors(res.data)).catch(console.error);
    axios.get('http://localhost:8000/api/flowcharts').then(res => {
      if (Array.isArray(res.data)) {
        const backendCustoms = res.data
          .filter((f: any) => !officialFlowSectors.some(o => o.id === f.sector_id))
          .map((f: any) => ({ id: f.sector_id, label: f.sector_name || f.sector_id }));
        if (backendCustoms.length > 0) {
          setCustomFlowSectors(prev => {
            const merged = [...prev];
            backendCustoms.forEach((b: any) => { if (!merged.some(m => m.id === b.id)) merged.push(b); });
            localStorage.setItem('bme_custom_flow_sectors', JSON.stringify(merged));
            return merged;
          });
        }
      }
    }).catch(console.error);
  };

  useEffect(() => { fetchSectors(); }, []);

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

  const handleSaveVariableWrapped = async (varData: any) => {
    await handleSaveVariable(varData, variableToEdit !== null, variableToEdit?.['ID - REF']);
    setIsVariableModalOpen(false);
    setVariableToEdit(null);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white">
      {/* ── 1. Sidebar Principal de Navegação (Calculadora, Plano Safra, Fluxograma, Config) ── */}
      <NavSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isNavExpanded={isNavExpanded}
        setIsNavExpanded={setIsNavExpanded}
        onOpenConfig={() => setIsConfigModalOpen(true)}
        isOffline={isOffline}
      />

      {/* ── 2. Conteúdo da View Calculadora ── */}
      {activeTab === 'calculator' && (
        <div className="flex flex-1 overflow-hidden min-w-0">
          {/* Sidebar de Setores (secundária aninhada) */}
          <Sidebar
            isSidebarExpanded={isSidebarExpanded}
            setIsSidebarExpanded={setIsSidebarExpanded}
            uniqueSectors={uniqueSectors}
            activeSector={activeSector}
            setActiveSector={handleSectorNavClick}
            variables={variables}
            sectors={sectors}
            results={results}
            onSubgroupClick={handleSubgroupClick}
            onVariableClick={onScrollTo}
            onSettingsClick={() => setIsConfigModalOpen(true)}
          />

          {/* Área de Trabalho Principal */}
          <main className="flex-1 flex flex-col overflow-hidden min-w-0 bg-white">
            {/* TopBar Interna com Cenário, Busca, Ações e Botão Calcular */}
            <CalculatorTopBar
              currentScenario={currentScenario}
              onLoadScenario={onLoadScenario}
              anoSafra={anoSafra}
              setAnoSafra={setAnoSafra}
              mesReferencia={mesReferencia}
              setMesReferencia={setMesReferencia}
              hasUnsavedChanges={hasUnsavedChanges}
              onSaveActive={handleSaveActive}
              onSaveNew={handleSaveNew}
              savingActive={savingActive}
              saving={saving}
              isLocked={isLocked || isOffline}
              isOffline={isOffline}
              variables={variables}
              onSelectVariable={(varId) => onScrollTo(varId)}
              iterations={iterations}
              residual={residual}
              tolerance={tolerance}
              calculating={calculating}
              handleCalculate={handleCalculate}
              onGoalSeekOpen={() => setIsGoalSeekOpen(true)}
              years={years}
              months={months}
              onStatusChange={(newStatus) => setCurrentScenario((prev: ScenarioMetadata | null) => prev ? { ...prev, status: newStatus } : null)}
            />

            {showDashboard ? (
              <StatusDashboard
                sectors={sectors}
                variables={variables}
                results={results}
                filter={activeStatusFilter}
                setFilter={setActiveStatusFilter}
                onSectorClick={handleSectorNavClick}
              />
            ) : (
              <div className="flex flex-col flex-1 overflow-hidden p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setShowDashboard(true)} className="btn-outline px-3 py-1 text-xs font-bold flex items-center gap-1.5">
                      <span>‹ Visão Geral</span>
                    </button>
                    <div>
                      <h2 className="text-lg font-extrabold text-black tracking-tight">{getFriendlySectorName(activeSector)}</h2>
                      <p className="text-xs text-slate-700 font-semibold">{variables.filter(v => v.SETOR === activeSector).length} variáveis cadastradas</p>
                    </div>
                  </div>
                  <button id="btn-add-variable" onClick={() => handleAddVariable(activeSector, '')} disabled={isLocked || isOffline} className="btn-primary flex items-center gap-1.5 px-4 py-2 text-xs font-semibold shadow-sm">
                    <span>+ Cadastrar Variável</span>
                  </button>
                </div>

                {(isLocked || isOffline) && (
                  <div className="mb-3 px-4 py-2.5 bg-slate-100 border border-slate-300 rounded-xl text-slate-700 text-xs font-semibold flex items-center gap-2">
                    <span>🔒</span>
                    <span>{isOffline ? 'Modo Offline. Alterações suspensas.' : `Cenário Congelado (Status: ${currentScenario?.status}). Edições bloqueadas.`}</span>
                  </div>
                )}
                {convergenceError && (
                  <div className="mb-3 px-4 py-2.5 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs font-semibold flex items-center gap-2">
                    <span>⚠️</span>
                    <span>Resultado não convergiu. Limite de 100 ciclos atingido. Revise os dados de entrada.</span>
                  </div>
                )}

                <div className="flex-1 overflow-y-auto min-h-0">
                  <SectorModules
                    activeSector={activeSector} variables={variables} results={results} isLocked={isLocked || isOffline}
                    onEditVariable={handleEditVariable} onAddVariable={handleAddVariable} onNavigateToVariable={onScrollTo}
                    activeStatusFilter={activeStatusFilter} setActiveStatusFilter={setActiveStatusFilter} onReorderSuccess={reloadCurrentScenario}
                  />
                </div>
              </div>
            )}
          </main>
        </div>
      )}

      {/* ── 3. Conteúdo da View Fluxograma ── */}
      {activeTab === 'flowchart' && (
        <div className="flex flex-1 flex-col overflow-hidden bg-white">
          <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-slate-200">
            <div className="flex items-center gap-2 overflow-x-auto">
              <span className="text-xs font-bold text-slate-700 mr-2 uppercase tracking-wider">Setor:</span>
              {visibleFlowSectors.map((sector) => (
                <div key={sector.id} className="relative group/tab flex items-center shrink-0">
                  <button onClick={() => setActiveFlowSector(sector.id)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeFlowSector === sector.id ? 'bg-bme-teal text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
                    {sector.label}
                  </button>
                  {(sector as any).isCustom && (
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

      {/* ── 4. Conteúdo da View Plano de Safra ── */}
      {activeTab === 'harvest_plan' && (
        <div className="flex flex-1 overflow-hidden bg-white">
          <main className="flex-1 flex flex-col overflow-hidden p-6">
            <HarvestPlan sectors={sectors} />
          </main>
        </div>
      )}

      {/* ── Modais Globais ── */}
      <GoalSeekModal isOpen={isGoalSeekOpen} onClose={() => setIsGoalSeekOpen(false)} variables={variables} onApplyOptimalValue={onApplyOptimalValue} />
      <VariableDrawer isOpen={isVariableModalOpen} onClose={() => setIsVariableModalOpen(false)} onSave={handleSaveVariableWrapped} variableToEdit={variableToEdit} variables={variables} prefilledSector={prefilledSector} prefilledEtapa={prefilledEtapa} onSubstitutionSuccess={reloadCurrentScenario} />
      <ConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        sectors={sectors}
        onRefreshSectors={fetchSectors}
        isLocked={isLocked || isOffline}
        years={years}
        months={months}
        fetchYearsAndMonths={fetchYearsAndMonths}
        tolerance={tolerance}
        onUpdateTolerance={updateTolerance}
      />
      <ManageSectorsModal
        isOpen={isManageSectorsOpen}
        onClose={() => setIsManageSectorsOpen(false)}
        allFlowSectors={allFlowSectors}
        hiddenFlowSectors={hiddenFlowSectors}
        onToggleHideSector={toggleHideSector}
        onRestoreAll={() => { setHiddenFlowSectors([]); localStorage.removeItem('bme_hidden_flow_sectors'); }}
        onDeleteSector={handleDeleteCustomFlowchartSector}
      />
      <ToastContainer />
    </div>
  );
}

export default App;
