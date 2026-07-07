import { useState, useEffect } from 'react';
import axios from 'axios';
import { ConsolidatedItem } from '../components/HarvestPlanTable';
import { VariableConfig } from '../components/HarvestPlanConfigTable';

export function useHarvestPlanState() {
  const [activeSubTab, setActiveSubTab] = useState<'visualizacao' | 'configuracao'>('visualizacao');
  const [years, setYears] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [startMonth, setStartMonth] = useState<string>('Abril');
  const [months, setMonths] = useState<string[]>([]);
  const [variablesConfig, setVariablesConfig] = useState<VariableConfig[]>([]);
  const [consolidationData, setConsolidationData] = useState<ConsolidatedItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selections, setSelections] = useState<Array<{ month: string; scenario_id: string | null; exclude: boolean }>>([]);
  const [availableScenarios, setAvailableScenarios] = useState<Record<string, Array<{ id: string; nome: string; version: number; status: string }>>>({});
  const [savingConfig, setSavingConfig] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSector, setSelectedSector] = useState<string>('TODOS');
  const [activeTypeFilter, setActiveTypeFilter] = useState<string>('ALL');
  const [focusedVarId, setFocusedVarId] = useState<string | null>(null);
  const [weightSearchQuery, setWeightSearchQuery] = useState<string>('');

  const [isEditing, setIsEditing] = useState(false);
  const [newDividerLabel, setNewDividerLabel] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const fetchSelections = () => {
    if (!selectedYear) return;
    const yearNum = parseInt(selectedYear.split('/')[0], 10);
    axios.get(`http://localhost:8000/api/harvest-plan/selections?year_harvest=${yearNum}`)
      .then(res => {
        setSelections(res.data.selections || []);
        setAvailableScenarios(res.data.available_scenarios || {});
      }).catch(err => console.error('Erro ao carregar seleções de cenários:', err));
  };

  const handleSelectScenario = (month: string, scenarioId: string | null, exclude: boolean) => {
    if (!selectedYear) return;
    setLoading(true);
    const yearNum = parseInt(selectedYear.split('/')[0], 10);
    axios.post(`http://localhost:8000/api/harvest-plan/selections?year_harvest=${yearNum}`, { month, scenario_id: scenarioId, exclude })
      .then(async () => {
        await fetchConsolidation();
        fetchSelections();
      }).catch(err => {
        console.error('Erro ao salvar seleção de cenário:', err);
        alert('Erro ao atualizar seleção de cenário do mês.');
      }).finally(() => setLoading(false));
  };

  const fetchSettingsAndYears = () => {
    setLoading(true);
    axios.get('http://localhost:8000/api/settings/cycle')
      .then(settingsRes => {
        setStartMonth(settingsRes.data.start_month);
        return axios.get('http://localhost:8000/api/harvest-plan/years');
      })
      .then(yearsRes => {
        const yearStrings = yearsRes.data.map((y: string | number) => String(y));
        setYears(yearStrings);
        if (yearStrings.length > 0) setSelectedYear(yearStrings[0]);
      }).catch(err => console.error('Erro ao carregar anos/configurações:', err)).finally(() => setLoading(false));
  };

  const fetchConfigs = () => {
    axios.get('http://localhost:8000/api/harvest-plan/config')
      .then(res => setVariablesConfig(res.data))
      .catch(err => console.error('Erro ao carregar configurações de variáveis:', err));
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
      fetchSelections();
    }
  }, [selectedYear]);

  const handleStartMonthChange = (val: string) => {
    setLoading(true);
    axios.post('http://localhost:8000/api/settings/cycle', { start_month: val })
      .then(async () => {
        setStartMonth(val);
        await fetchConsolidation();
      }).catch(err => {
        console.error('Erro ao salvar início do ciclo:', err);
        alert('Erro ao atualizar mês de início.');
      }).finally(() => setLoading(false));
  };

  const handleConfigChange = (id: string, key: keyof VariableConfig, val: string | boolean | null) => {
    setVariablesConfig(prev => prev.map(item => item.id === id ? ({ ...item, [key]: val } as VariableConfig) : item));
  };

  const handleSaveConfigs = () => {
    setSavingConfig(true);
    axios.post('http://localhost:8000/api/harvest-plan/config', variablesConfig)
      .then(async () => {
        alert('Configurações salvas com sucesso!');
        fetchConfigs();
        await fetchConsolidation();
      }).catch(err => {
        console.error('Erro ao salvar configurações:', err);
        alert('Erro ao salvar as configurações.');
      }).finally(() => setSavingConfig(false));
  };

  const handleToggleEdit = () => {
    if (isEditing) {
      setLoading(true);
      const items = consolidationData.map(item => ({
        tipo: item.tipo_item || 'variable',
        variable_id: item.tipo_item === 'divider' ? null : item.variable_id,
        label: item.tipo_item === 'divider' ? item.label : null
      }));
      axios.post('http://localhost:8000/api/harvest-plan/structure', { items })
        .then(() => fetchConsolidation())
        .catch(err => console.error('Erro ao salvar estrutura:', err))
        .finally(() => {
          setIsEditing(false);
          setLoading(false);
        });
    } else {
      setIsEditing(true);
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', String(index));
    setDraggedIndex(index);
  };
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (e: React.DragEvent, index: number) => {
    if (draggedIndex === null || draggedIndex === index) return;
    const items = [...consolidationData];
    const [draggedItem] = items.splice(draggedIndex, 1);
    items.splice(index, 0, draggedItem);
    setConsolidationData(items);
    setDraggedIndex(null);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const items = [...consolidationData];
    [items[index], items[index - 1]] = [items[index - 1], items[index]];
    setConsolidationData(items);
  };

  const handleMoveDown = (index: number) => {
    if (index === consolidationData.length - 1) return;
    const items = [...consolidationData];
    [items[index], items[index + 1]] = [items[index + 1], items[index]];
    setConsolidationData(items);
  };

  const handleDeleteDivider = (dividerId: string) => {
    setConsolidationData(prev => prev.filter(item => item.variable_id !== dividerId));
  };

  const handleRenameDivider = (dividerId: string, newLabel: string) => {
    setConsolidationData(prev => prev.map(item => item.variable_id === dividerId ? { ...item, label: newLabel } : item));
  };

  const handleAddDivider = () => {
    if (!newDividerLabel.trim()) return;
    const newDiv: ConsolidatedItem = {
      tipo_item: 'divider',
      label: newDividerLabel.trim(),
      variable_id: `DIVIDER_NEW_${Date.now()}`,
      nome: '', descricao: '', setor_id: '', unidade: '', tipo: 'INPUT',
      harvest_plan_op: null, harvest_plan_weight_var_id: null,
      monthly_values: {}, monthly_statuses: {},
      accumulated: { value: null, status: 'OK', error_message: '' }
    };
    setConsolidationData(prev => [...prev, newDiv]);
    setNewDividerLabel('');
  };

  return {
    activeSubTab, setActiveSubTab,
    years, selectedYear, setSelectedYear,
    startMonth, months, variablesConfig,
    consolidationData, setConsolidationData,
    loading, selections, availableScenarios,
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
  };
}
