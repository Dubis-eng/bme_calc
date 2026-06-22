import { useState, useEffect } from 'react';
import axios from 'axios';
import { Variable, Sector } from '../types';
import { ScenarioMetadata } from '../components/ScenarioManager';

export function useScenario(sectors: Sector[], fetchSectors: () => void) {
  const [variables, setVariables] = useState<Variable[]>([]);
  const [results, setResults] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [convergenceError, setConvergenceError] = useState(false);
  const [iterations, setIterations] = useState(1);
  const [activeSector, setActiveSector] = useState<string>('');
  const [currentScenario, setCurrentScenario] = useState<ScenarioMetadata | null>(null);
  const [saving, setSaving] = useState(false);
  const [anoSafra, setAnoSafra] = useState('2026/2027');
  const [mesReferencia, setMesReferencia] = useState('Abril');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [savingActive, setSavingActive] = useState(false);

  const loadLocalFallback = () => {
    fetch('/memorial_de_calculo_balanco.json')
      .then(res => res.json())
      .then(data => {
        setVariables(data);
        if (data.length > 0) setActiveSector(data[0].SETOR);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    axios.get('http://localhost:8000/api/scenarios')
      .then(res => {
        if (res.data?.length > 0) {
          const latest = res.data[0];
          axios.get(`http://localhost:8000/api/scenarios/${latest.id}`)
            .then(detailRes => {
              onLoadScenario(detailRes.data.variables, latest);
              setLoading(false);
            })
            .catch(() => loadLocalFallback());
        } else loadLocalFallback();
      })
      .catch(() => loadLocalFallback());
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const isLocked = currentScenario ? (currentScenario.status === 'Aprovado' || currentScenario.status === 'Final') : false;

  const handleChange = (id: string, value: string) => {
    if (!isLocked) {
      setVariables(prev => prev.map(v => v["ID - REF"] === id ? { ...v, "EQUAÇÕES E VALORES": value } : v));
      setHasUnsavedChanges(true);
    }
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
    setHasUnsavedChanges(false);
    if (loadedVars.length > 0) setActiveSector(loadedVars[0].SETOR);
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
      setHasUnsavedChanges(false);
      alert(`Cenário salvo com sucesso! Versão: v${res.data.version}`);
      fetchSectors();
    } catch (err) {
      alert("Erro ao salvar cenário.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveActive = async () => {
    if (!currentScenario) return;
    setSavingActive(true);
    try {
      await axios.put(`http://localhost:8000/api/scenarios/${currentScenario.id}`, {
        year_harvest: anoSafra, reference_month: mesReferencia, variables, status: currentScenario.status
      });
      setHasUnsavedChanges(false);
      alert('Alterações salvas com sucesso!');
    } catch (err) {
      alert('Erro ao salvar alterações do cenário.');
      console.error(err);
    } finally {
      setSavingActive(false);
    }
  };

  const onApplyOptimalValue = (inputId: string, val: number, newRes: Record<string, number>) => {
    setVariables(prev => prev.map(v => v["ID - REF"] === inputId ? { ...v, "EQUAÇÕES E VALORES": val } : v));
    setResults(newRes);
    setHasUnsavedChanges(true);
  };

  const handleSaveVariable = async (newVar: Variable, isEdit: boolean, origId?: string) => {
    if (isLocked) return;
    const sectorId = newVar.SETOR.toUpperCase();
    if (!sectors.some(s => s.id === sectorId)) {
      try {
        const maxO = sectors.reduce((m, s) => s.ordem > m ? s.ordem : m, 0);
        await axios.post('http://localhost:8000/api/sectors', {
          id: sectorId, nome: sectorId.charAt(0).toUpperCase() + sectorId.slice(1).toLowerCase(), descricao: 'Criado via variável', ordem: maxO > 0 ? maxO + 10 : 10
        });
        fetchSectors();
      } catch (err) {
        console.error(err);
      }
    }
    const updated = isEdit && origId ? variables.map(v => v["ID - REF"] === origId ? newVar : v) : [...variables, newVar];
    setVariables(updated);
    setHasUnsavedChanges(true);
    triggerCalculate(updated);
  };

  return {
    variables,
    setVariables,
    results,
    setResults,
    loading,
    setLoading,
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
    setHasUnsavedChanges,
    savingActive,
    handleChange,
    handleCalculate,
    onLoadScenario,
    handleSaveNew,
    handleSaveActive,
    onApplyOptimalValue,
    handleSaveVariable,
    isLocked
  };
}
