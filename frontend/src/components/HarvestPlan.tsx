import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Sector } from '../types';


interface HarvestPlanProps {
  sectors: Sector[];
}

interface VariableConfig {
  id: string;
  nome: string;
  descricao: string;
  setor_id: string;
  unidade: string;
  tipo: string;
  in_harvest_plan: boolean;
  harvest_plan_op: 'SUM' | 'AVERAGE' | 'WEIGHTED_AVERAGE' | 'CALCULATE' | null;
  harvest_plan_weight_var_id: string | null;
}

interface ConsolidatedItem {
  variable_id: string;
  nome: string;
  descricao: string;
  setor_id: string;
  unidade: string;
  tipo: string;
  harvest_plan_op: 'SUM' | 'AVERAGE' | 'WEIGHTED_AVERAGE' | 'CALCULATE' | null;
  harvest_plan_weight_var_id: string | null;
  monthly_values: Record<string, number | null>;
  monthly_statuses: Record<string, string>;
  accumulated: {
    value: number | null;
    status: string;
    error_message: string;
  };
}

const ALL_MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

export function HarvestPlan({ sectors }: HarvestPlanProps) {
  const [activeSubTab, setActiveSubTab] = useState<'visualizacao' | 'configuracao'>('visualizacao');
  const [years, setYears] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [startMonth, setStartMonth] = useState<string>('Abril');
  const [months, setMonths] = useState<string[]>([]);
  const [variablesConfig, setVariablesConfig] = useState<VariableConfig[]>([]);
  const [consolidationData, setConsolidationData] = useState<ConsolidatedItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [savingConfig, setSavingConfig] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSector, setSelectedSector] = useState<string>('TODOS');

  // Autocomplete weight state per variable
  const [focusedVarId, setFocusedVarId] = useState<string | null>(null);
  const [weightSearchQuery, setWeightSearchQuery] = useState<string>('');

  const fetchSettingsAndYears = async () => {
    try {
      setLoading(true);
      const settingsRes = await axios.get('http://localhost:8000/api/harvest-plan/settings');
      setStartMonth(settingsRes.data.start_month);

      const yearsRes = await axios.get('http://localhost:8000/api/harvest-plan/years');
      const yearStrings = yearsRes.data.map((y: string | number) => String(y));
      setYears(yearStrings);
      if (yearStrings.length > 0) {
        setSelectedYear(yearStrings[0]);
      }
    } catch (err) {
      console.error('Erro ao carregar anos/configurações:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchConfigs = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/harvest-plan/config');
      setVariablesConfig(res.data);
    } catch (err) {
      console.error('Erro ao carregar configurações de variáveis:', err);
    }
  };

  const fetchConsolidation = async () => {
    if (!selectedYear) return;
    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:8000/api/harvest-plan/consolidation?year_harvest=${selectedYear}`);
      setMonths(res.data.months);
      setConsolidationData(res.data.data);
    } catch (err) {
      console.error('Erro ao calcular consolidação:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettingsAndYears();
    fetchConfigs();
  }, []);

  useEffect(() => {
    if (selectedYear) {
      fetchConsolidation();
    }
  }, [selectedYear]);

  const handleStartMonthChange = async (month: string) => {
    try {
      setLoading(true);
      await axios.put('http://localhost:8000/api/harvest-plan/settings', { start_month: month });
      setStartMonth(month);
      // Reload consolidation to apply new month order
      await fetchConsolidation();
    } catch (err) {
      console.error('Erro ao atualizar mês de início:', err);
      alert('Erro ao alterar mês de início do ciclo.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (varId: string, field: keyof VariableConfig, value: string | boolean | null) => {
    setVariablesConfig(prev => prev.map(vc => {
      if (vc.id === varId) {
        const updated = { ...vc, [field]: value };
        // Reset weight if op is not WEIGHTED_AVERAGE
        if (field === 'harvest_plan_op' && value !== 'WEIGHTED_AVERAGE') {
          updated.harvest_plan_weight_var_id = null;
        }
        return updated;
      }
      return vc;
    }));
  };

  const handleSaveConfigs = async () => {
    setSavingConfig(true);
    try {
      // Validate that all WEIGHTED_AVERAGE configurations have a valid weight variable
      const invalid = variablesConfig.filter(vc => vc.in_harvest_plan && vc.harvest_plan_op === 'WEIGHTED_AVERAGE' && !vc.harvest_plan_weight_var_id);
      if (invalid.length > 0) {
        alert(`Por favor, indique a variável de peso para as seguintes variáveis com Média Ponderada: ${invalid.map(i => i.id).join(', ')}`);
        setSavingConfig(false);
        return;
      }

      await axios.post('http://localhost:8000/api/harvest-plan/config/bulk', {
        configs: variablesConfig.map(vc => ({
          id: vc.id,
          in_harvest_plan: vc.in_harvest_plan,
          harvest_plan_op: vc.harvest_plan_op,
          harvest_plan_weight_var_id: vc.harvest_plan_weight_var_id
        }))
      });
      alert('Configurações salvas com sucesso!');
      await fetchConsolidation();
      setActiveSubTab('visualizacao');
    } catch (err) {
      console.error('Erro ao salvar configurações do plano:', err);
      alert('Erro ao salvar as configurações de variáveis.');
    } finally {
      setSavingConfig(false);
    }
  };

  const filteredConfigs = variablesConfig.filter(vc => {
    const matchesSearch = vc.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          vc.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          vc.descricao.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSector = selectedSector === 'TODOS' || vc.setor_id === selectedSector;
    return matchesSearch && matchesSector;
  });

  const filteredConsolidated = consolidationData.filter(item => {
    const matchesSearch = item.variable_id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.descricao.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSector = selectedSector === 'TODOS' || item.setor_id === selectedSector;
    return matchesSearch && matchesSector;
  });

  const formatNumber = (val: number | null) => {
    if (val === null || isNaN(val)) return '-';
    return val.toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
  };

  const renderStatusBadge = (status: string) => {
    if (status === 'OK') return null;
    let color = 'bg-slate-100 text-slate-700 border-slate-200';
    if (status === 'DIV_BY_ZERO') color = 'bg-red-50 text-red-700 border-red-100';
    if (status === 'MISSING_VAR') color = 'bg-amber-50 text-amber-700 border-amber-100';
    if (status === 'MISSING_SCENARIO') color = 'bg-slate-200 text-slate-500 border-slate-300';
    return (
      <span className={`px-1.5 py-0.2 rounded-full border text-[9px] font-bold block ${color}`} title={status}>
        ⚠️ {status}
      </span>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
      {/* Upper Control Bar */}
      <div className="bg-slate-900 text-white px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 space-y-4 md:space-y-0">
        <div className="flex items-center space-x-4">
          <div className="h-9 w-9 bg-gradient-to-tr from-teal-500 to-cyan-500 rounded-lg flex items-center justify-center font-bold text-white shadow-sm text-sm">
            📆
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-wider uppercase text-teal-400">Plano de Safra Consolidado</h2>
            <p className="text-[11px] text-slate-400">Consolidação e regras de acumulação dos cenários aprovados</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Harvest Year Selection */}
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Ano-Safra:</span>
            {years.length > 0 ? (
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-slate-800 text-white border border-slate-700 rounded px-2.5 py-1 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                {years.map(y => (
                  <option key={y} value={y}>
                    {y.includes('/') ? y : `${y}/${parseInt(y, 10) + 1}`}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-xs text-slate-500 font-semibold">Nenhum cenário cadastrado</span>
            )}
          </div>

          {/* Planning Start Month Configuration */}
          <div className="flex items-center space-x-2 border-l border-slate-800 pl-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase" title="Mês de início do ciclo de planejamento de 12 meses">Início do Ciclo:</span>
            <select
              value={startMonth}
              onChange={(e) => handleStartMonthChange(e.target.value)}
              className="bg-slate-800 text-white border border-slate-700 rounded px-2.5 py-1 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              {ALL_MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Tab Switcher & Search Bar */}
      <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex flex-col md:flex-row justify-between items-center space-y-3 md:space-y-0">
        {/* Navigation Tabs */}
        <div className="flex space-x-1.5 p-1 bg-slate-200/60 rounded-lg">
          <button
            onClick={() => setActiveSubTab('visualizacao')}
            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
              activeSubTab === 'visualizacao' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            📊 Visualização Consolidada
          </button>
          <button
            onClick={() => setActiveSubTab('configuracao')}
            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
              activeSubTab === 'configuracao' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            ⚙️ Configuração do Plano
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-3 w-full md:w-auto">
          {/* Query Search */}
          <div className="relative flex-1 md:flex-initial">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">🔍</span>
            <input
              type="search"
              placeholder="Pesquisar variável..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-7 pr-3 py-1 border border-slate-300 rounded text-xs bg-white text-slate-700 w-full md:w-48 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          {/* Sector filter */}
          <select
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
            className="border border-slate-300 rounded px-2 py-1 text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="TODOS">Todos os Setores</option>
            {sectors.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
          </select>

          {activeSubTab === 'configuracao' && (
            <button
              onClick={handleSaveConfigs}
              disabled={savingConfig}
              className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-bold py-1 px-4 rounded text-xs transition-all shadow-sm flex items-center space-x-1"
            >
              {savingConfig ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-white"></div>
                  <span>Salvando...</span>
                </>
              ) : (
                <span>💾 Salvar Configurações</span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto min-h-0 bg-slate-50/30 p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-500 mb-4"></div>
            <p className="text-xs font-semibold">Processando cálculos e consolidação...</p>
          </div>
        ) : activeSubTab === 'visualizacao' ? (
          /* Consolidated Month-to-Month Matrix View */
          filteredConsolidated.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 bg-white border border-slate-200 rounded-xl text-slate-400">
              <span className="text-3xl mb-3">📅</span>
              <p className="text-xs font-bold">Nenhuma variável selecionada para o plano ou nenhum cenário aprovado para o ano {selectedYear}.</p>
              <p className="text-[10px] text-slate-400 mt-1">Acesse a aba "Configuração do Plano" para selecionar variáveis e regras de cálculo.</p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto max-w-full">
                <table className="min-w-full divide-y divide-slate-100 text-left border-collapse">
                  <thead className="bg-slate-900 text-slate-200">
                    <tr className="divide-x divide-slate-800">
                      <th className="py-2.5 px-3 text-[10px] font-bold uppercase tracking-wider min-w-[90px] sticky left-0 bg-slate-900 z-10">ID</th>
                      <th className="py-2.5 px-3 text-[10px] font-bold uppercase tracking-wider min-w-[150px] sticky left-[90px] bg-slate-900 z-10">Descrição</th>
                      <th className="py-2.5 px-3 text-[10px] font-bold uppercase tracking-wider min-w-[70px]">Setor</th>
                      <th className="py-2.5 px-3 text-[10px] font-bold uppercase tracking-wider min-w-[50px] text-center">Un.</th>
                      <th className="py-2.5 px-3 text-[10px] font-bold uppercase tracking-wider min-w-[70px] text-center">Regra</th>
                      {months.map(m => (
                        <th key={m} className="py-2.5 px-3 text-[10px] font-bold uppercase tracking-wider min-w-[100px] text-right">{m}</th>
                      ))}
                      <th className="py-2.5 px-3 text-[10px] font-bold uppercase tracking-wider min-w-[120px] text-right bg-teal-950 text-teal-300">Acumulado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredConsolidated.map(item => {
                      const opLabel = item.harvest_plan_op === 'SUM' ? 'Soma' : 
                                      item.harvest_plan_op === 'AVERAGE' ? 'Média' :
                                      item.harvest_plan_op === 'WEIGHTED_AVERAGE' ? `M.Pond.` : 
                                      item.harvest_plan_op === 'CALCULATE' ? 'Cálculo' : 'Padrão';
                      
                      return (
                        <tr key={item.variable_id} className="hover:bg-slate-50/50 transition-colors divide-x divide-slate-100 text-xs">
                          {/* Variable ID (Sticky) */}
                          <td className="py-2 px-3 font-mono font-bold text-teal-600 bg-white sticky left-0 z-10 border-r border-slate-100 truncate max-w-[90px]" title={item.variable_id}>
                            {item.variable_id}
                          </td>
                          {/* Description (Sticky) */}
                          <td className="py-2 px-3 font-medium text-slate-700 bg-white sticky left-[90px] z-10 border-r border-slate-100 truncate max-w-[150px]" title={item.descricao}>
                            {item.nome}
                          </td>
                          {/* Sector */}
                          <td className="py-2 px-3 text-slate-500 font-semibold truncate max-w-[80px]" title={item.setor_id}>
                            {item.setor_id}
                          </td>
                          {/* Unit */}
                          <td className="py-2 px-3 text-slate-400 font-semibold text-center">
                            {item.unidade}
                          </td>
                          {/* Op Rule */}
                          <td className="py-2 px-3 text-center" title={item.harvest_plan_op === 'WEIGHTED_AVERAGE' ? `Média ponderada por ${item.harvest_plan_weight_var_id}` : opLabel}>
                            <span className="px-1.5 py-0.5 inline-flex leading-4 font-bold rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[9px]">
                              {opLabel}
                            </span>
                          </td>
                          {/* Months columns */}
                          {months.map(m => {
                            const val = item.monthly_values[m];
                            const status = item.monthly_statuses[m];
                            return (
                              <td key={m} className="py-2 px-3 text-right font-mono font-semibold text-slate-600">
                                {status === 'OK' && val !== null ? (
                                  formatNumber(val)
                                ) : (
                                  renderStatusBadge(status)
                                )}
                              </td>
                            );
                          })}
                          {/* Accumulated column */}
                          <td className="py-2 px-3 text-right font-mono font-bold bg-teal-50 text-slate-900 border-l border-slate-100">
                            {item.accumulated.status === 'OK' && item.accumulated.value !== null ? (
                              formatNumber(item.accumulated.value)
                            ) : (
                              <div className="flex justify-end">
                                {renderStatusBadge(item.accumulated.status)}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )
        ) : (
          /* Configuration Rules List View */
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-slate-100 text-left border-collapse">
              <thead className="bg-slate-900 text-slate-200">
                <tr className="divide-x divide-slate-800">
                  <th className="py-2 px-3 text-[10px] font-bold uppercase tracking-wider w-16 text-center">No Plano</th>
                  <th className="py-2 px-3 text-[10px] font-bold uppercase tracking-wider w-28">ID</th>
                  <th className="py-2 px-3 text-[10px] font-bold uppercase tracking-wider">Descrição</th>
                  <th className="py-2 px-3 text-[10px] font-bold uppercase tracking-wider w-28">Setor</th>
                  <th className="py-2 px-3 text-[10px] font-bold uppercase tracking-wider w-36 text-center">Operação</th>
                  <th className="py-2 px-3 text-[10px] font-bold uppercase tracking-wider w-56">Variável Peso (M.Pond.)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredConfigs.map(item => {
                  const isChecked = item.in_harvest_plan;
                  const isWeighted = item.harvest_plan_op === 'WEIGHTED_AVERAGE';
                  
                  return (
                    <tr key={item.id} className={`hover:bg-slate-50/30 transition-colors divide-x divide-slate-100 text-xs ${isChecked ? 'bg-teal-50/10' : ''}`}>
                      {/* Checkbox */}
                      <td className="py-1 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => handleConfigChange(item.id, 'in_harvest_plan', e.target.checked)}
                          className="h-3.5 w-3.5 rounded text-teal-600 focus:ring-teal-500 border-slate-300 cursor-pointer"
                        />
                      </td>
                      {/* ID */}
                      <td className="py-1.5 px-3 font-mono font-bold text-slate-700">
                        {item.id}
                      </td>
                      {/* Description */}
                      <td className="py-1.5 px-3 font-medium text-slate-600">
                        {item.nome}
                      </td>
                      {/* Sector */}
                      <td className="py-1.5 px-3 text-slate-500 font-semibold">
                        {item.setor_id}
                      </td>
                      {/* Op Selector */}
                      <td className="py-1 px-3 text-center">
                        <select
                          value={item.harvest_plan_op || ''}
                          onChange={(e) => handleConfigChange(item.id, 'harvest_plan_op', e.target.value || null)}
                          className="border border-slate-300 rounded px-2 py-0.5 text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500 w-32"
                        >
                          <option value="">Regra Padrão</option>
                          <option value="SUM">Soma</option>
                          <option value="AVERAGE">Média</option>
                          <option value="WEIGHTED_AVERAGE">Média Ponderada</option>
                          <option value="CALCULATE">Cálculo</option>
                        </select>
                      </td>
                      {/* Weight Selector */}
                      <td className="py-1 px-3 relative">
                        {isWeighted ? (
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="Pesquise o ID de Peso..."
                              value={focusedVarId === item.id ? weightSearchQuery : (item.harvest_plan_weight_var_id || '')}
                              onFocus={() => {
                                setFocusedVarId(item.id);
                                setWeightSearchQuery(item.harvest_plan_weight_var_id || '');
                              }}
                              onChange={(e) => setWeightSearchQuery(e.target.value)}
                              className="border border-slate-300 rounded px-2 py-0.5 text-xs bg-white text-slate-700 w-full focus:outline-none focus:ring-1 focus:ring-teal-500"
                            />
                            {/* Autocomplete Dropdown list */}
                            {focusedVarId === item.id && (
                              <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded shadow-lg max-h-32 overflow-y-auto z-20">
                                {variablesConfig
                                  .filter(v => v.id !== item.id && (v.id.toLowerCase().includes(weightSearchQuery.toLowerCase()) || v.nome.toLowerCase().includes(weightSearchQuery.toLowerCase())))
                                  .slice(0, 10)
                                  .map(v => (
                                    <button
                                      key={v.id}
                                      type="button"
                                      onClick={() => {
                                        handleConfigChange(item.id, 'harvest_plan_weight_var_id', v.id);
                                        setFocusedVarId(null);
                                      }}
                                      className="w-full text-left py-1 px-2 hover:bg-slate-50 font-mono text-[10px] text-slate-700 border-b border-slate-100 last:border-0"
                                    >
                                      <span className="font-bold text-teal-600 mr-2">{v.id}</span>
                                      <span className="text-slate-400 font-sans">— {v.nome}</span>
                                    </button>
                                  ))}
                                {weightSearchQuery && (
                                  <button
                                    type="button"
                                    onClick={() => setFocusedVarId(null)}
                                    className="w-full text-center py-1 text-[9px] bg-slate-50 text-slate-400 hover:text-slate-600 block border-t border-slate-100 font-bold"
                                  >
                                    Fechar Lista ✕
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[10px] italic font-medium">— Não aplicável</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
