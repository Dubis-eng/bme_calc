import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAtom, useAtomValue } from 'jotai';
import { Variable, Sector, BackendVariable } from '../types';
import { ScenarioMetadata } from '../components/scenario/ScenarioManager';
import { parseHarvestYear, mapBackendVariableToFrontend } from '../utils/helpers';
import {
  variablesAtom,
  resultsAtom,
  loadingAtom,
  calculatingAtom,
  convergenceErrorAtom,
  iterationsAtom,
  activeSectorAtom,
  currentScenarioAtom,
  savingAtom,
  savingActiveAtom,
  anoSafraAtom,
  mesReferenciaAtom,
  hasUnsavedChangesAtom,
  isOfflineAtom,
  residualAtom,
  setVariablesWithValuesAtom,
  getMergedVariablesAtom,
  toleranceAtom,
  updateVariableValueAtom
} from '../state/atoms';

export function useScenario(sectors: Sector[], fetchSectors: () => void) {
  const [variables, setVariables] = useAtom(variablesAtom);
  const [, setVariablesWithValues] = useAtom(setVariablesWithValuesAtom);
  const mergedVariables = useAtomValue(getMergedVariablesAtom);
  const [, updateVariableValue] = useAtom(updateVariableValueAtom);
  
  const [results, setResults] = useAtom(resultsAtom);
  const [loading, setLoading] = useAtom(loadingAtom);
  const [calculating, setCalculating] = useAtom(calculatingAtom);
  const [convergenceError, setConvergenceError] = useAtom(convergenceErrorAtom);
  const [iterations, setIterations] = useAtom(iterationsAtom);
  const [activeSector, setActiveSector] = useAtom(activeSectorAtom);
  const [currentScenario, setCurrentScenario] = useAtom(currentScenarioAtom);
  const [saving, setSaving] = useAtom(savingAtom);
  const [anoSafra, setAnoSafra] = useAtom(anoSafraAtom);
  const [mesReferencia, setMesReferencia] = useAtom(mesReferenciaAtom);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useAtom(hasUnsavedChangesAtom);
  const [savingActive, setSavingActive] = useAtom(savingActiveAtom);
  const [isOffline, setIsOffline] = useAtom(isOfflineAtom);
  const [residual, setResidual] = useAtom(residualAtom);
  const [years, setYears] = useState<{ id: number; active: boolean }[]>([]);
  const [months, setMonths] = useState<{ id: number; name: string; order_index: number; enabled: boolean }[]>([]);
  const [tolerance, setTolerance] = useAtom(toleranceAtom);

  const checkConnection = useCallback(async () => {
    try {
      await axios.get('http://localhost:8000/api/scenarios', { timeout: 2000 });
      setIsOffline(false);
      return true;
    } catch {
      setIsOffline(true);
      return false;
    }
  }, []);

  const handleApiError = useCallback((err: unknown) => {
    const error = err as { response?: { status: number }; code?: string; message?: string };
    if (!error.response || error.code === 'ERR_NETWORK' || error.message === 'Network Error' || (error.response && error.response.status >= 500)) {
      setIsOffline(true);
    }
  }, []);

  const loadLocalFallback = useCallback(() => {
    fetch('/memorial_de_calculo_balanco.json')
      .then(res => res.json())
      .then(data => {
        setVariablesWithValues(data);
        if (data.length > 0) setActiveSector(data[0].SETOR);
      })
      .finally(() => setLoading(false));
  }, []);

  const fetchYearsAndMonths = useCallback(async () => {
    try {
      const yrRes = await axios.get('http://localhost:8000/api/settings/years');
      setYears(yrRes.data);
      const moRes = await axios.get('http://localhost:8000/api/settings/months');
      setMonths(moRes.data);
    } catch (err) {
      handleApiError(err);
    }
  }, [handleApiError]);

  const triggerCalculate = useCallback(async (varsList: Variable[], tolVal?: number) => {
    if (isOffline) return;
    setCalculating(true);
    setConvergenceError(false);
    try {
      const response = await axios.post('http://localhost:8000/api/calculate', {
        variables: varsList,
        tolerance: tolVal ?? tolerance
      });
      setResults(response.data.results);
      setConvergenceError(response.data.convergence_error);
      setIterations(response.data.iterations);
      setResidual(response.data.residual || 0);
    } catch (err) {
      console.error(err);
      handleApiError(err);
      alert("Erro ao calcular.");
    } finally {
      setCalculating(false);
    }
  }, [isOffline, tolerance, handleApiError]);

  const onLoadScenario = useCallback((loadedVars: Variable[], meta: ScenarioMetadata) => {
    setVariablesWithValues(loadedVars); setCurrentScenario(meta);
    const parsedYear = typeof meta.year_harvest === 'string' ? parseHarvestYear(meta.year_harvest) : meta.year_harvest;
    setAnoSafra(parsedYear); setMesReferencia(meta.reference_month); setHasUnsavedChanges(false);
    if (loadedVars.length > 0) setActiveSector(loadedVars[0].SETOR);
    triggerCalculate(loadedVars);
  }, [triggerCalculate]);

  useEffect(() => {
    if (!isOffline) return;
    const interval = setInterval(checkConnection, 5000);
    return () => clearInterval(interval);
  }, [isOffline, checkConnection]);

  useEffect(() => {
    fetchYearsAndMonths();
    axios.get('http://localhost:8000/api/scenarios')
      .then(res => {
        setIsOffline(false);
        if (res.data?.length > 0) {
          const latest = res.data[0];
          axios.get(`http://localhost:8000/api/scenarios/${latest.id}`)
            .then(detailRes => {
              onLoadScenario(detailRes.data.variables, latest);
              setLoading(false);
            })
            .catch(err => { handleApiError(err); setLoading(false); });
        } else {
          loadLocalFallback();
        }
      })
      .catch(err => { handleApiError(err); setLoading(false); });
  }, [fetchYearsAndMonths, onLoadScenario, handleApiError, loadLocalFallback]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const isLocked = currentScenario ? (currentScenario.status === 'Aprovado' || currentScenario.status === 'Final') : false;

  const handleChange = (id: string, value: string) => {
    if (isLocked || isOffline) return;
    updateVariableValue({ id, value });
  };

  const updateTolerance = (val: number) => {
    setTolerance(val);
    triggerCalculate(mergedVariables, val);
  };

  const handleCalculate = () => triggerCalculate(mergedVariables);

  const handleSaveNew = async () => {
    if (isOffline) return;
    setSaving(true);
    try {
      const res = await axios.post('http://localhost:8000/api/scenarios', {
        year_harvest: anoSafra, reference_month: mesReferencia, variables: mergedVariables, status: 'Em Edição'
      });
      setCurrentScenario({
        id: res.data.id, year_harvest: res.data.year_harvest, reference_month: res.data.reference_month,
        version: res.data.version, status: res.data.status, cycle_start_month: res.data.cycle_start_month
      });
      setHasUnsavedChanges(false);
      alert(`Cenário salvo com sucesso! Versão: v${res.data.version}`);
      fetchSectors();
    } catch (err) {
      handleApiError(err);
      alert("Erro ao salvar cenário.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveActive = async () => {
    if (!currentScenario || isOffline) return;
    setSavingActive(true);
    try {
      const res = await axios.put(`http://localhost:8000/api/scenarios/${currentScenario.id}`, {
        year_harvest: anoSafra, reference_month: mesReferencia, variables: mergedVariables, status: currentScenario.status
      });
      setHasUnsavedChanges(false);
      if (res.data) {
        setCurrentScenario({
          id: res.data.id,
          year_harvest: res.data.year_harvest,
          reference_month: res.data.reference_month,
          version: res.data.version,
          status: res.data.status,
          cycle_start_month: res.data.cycle_start_month
        });
      }
      alert('Alterações salvas com sucesso!');
    } catch (err) {
      handleApiError(err);
      alert('Erro ao salvar alterações do cenário.');
      console.error(err);
    } finally {
      setSavingActive(false);
    }
  };

  const onApplyOptimalValue = (inputId: string, val: number, newRes: Record<string, number>) => {
    setVariablesWithValues(variables.map(v => v["ID - REF"] === inputId ? { ...v, "EQUAÇÕES E VALORES": val } : v));
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

    const payload = {
      id: newVar["ID - REF"],
      nome: newVar["DESCRIÇÃO"] || newVar["ID - REF"],
      descricao: newVar["DESCRIÇÃO"] || "",
      setor_id: newVar["SETOR"],
      tipo: newVar["TIPO"],
      unidade: newVar["UNIDADE DE MEDIDA"] || "",
      status: newVar["STATUS"] || "ativa",
      etapa: newVar["ETAPA"] || "",
      ponto_controle: newVar["PONTO DE CONTROLE"] || "",
      equation_value: String(newVar["EQUAÇÕES E VALORES"] || ""),
      casas_decimais: (newVar.casas_decimais === undefined || newVar.casas_decimais === null || (newVar.casas_decimais as unknown) === '') ? null : Number(newVar.casas_decimais),
      tipo_exibicao: newVar.tipo_exibicao || "NUMBER",
      percent_base: newVar.percent_base || "DECIMAL"
    };

    try {
      if (isEdit && origId) {
        await axios.put(`http://localhost:8000/api/variables/${origId}`, payload);
      } else {
        await axios.post('http://localhost:8000/api/variables', payload);
      }
      
      const updated = isEdit && origId ? variables.map(v => v["ID - REF"] === origId ? newVar : v) : [...variables, newVar];
      setVariablesWithValues(updated);
      triggerCalculate(updated);
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string } }; message?: string };
      console.error(error);
      alert(`Erro ao salvar variável globalmente: ${error.response?.data?.detail || error.message}`);
    }
  };

  const reloadCurrentScenario = async () => {
    if (currentScenario) {
      setLoading(true);
      try {
        const detailRes = await axios.get(`http://localhost:8000/api/scenarios/${currentScenario.id}`);
        onLoadScenario(detailRes.data.variables, currentScenario);
      } catch (err) {
        console.error("Erro ao recarregar cenário:", err);
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          try {
            const listRes = await axios.get('http://localhost:8000/api/scenarios');
            if (listRes.data?.length > 0) {
              const latest = listRes.data[0];
              const fallbackRes = await axios.get(`http://localhost:8000/api/scenarios/${latest.id}`);
              onLoadScenario(fallbackRes.data.variables, latest);
            } else {
              loadLocalFallback();
            }
          } catch (fallbackErr) { loadLocalFallback(); }
        }
      } finally { setLoading(false); }
    } else {
      try {
        const res = await axios.get('http://localhost:8000/api/variables');
        const mapped: Variable[] = res.data.map((v: BackendVariable) => mapBackendVariableToFrontend(v));
        setVariablesWithValues(mapped);
        triggerCalculate(mapped);
      } catch (err) { console.error(err); handleApiError(err); }
    }
  };

  return {
    reloadCurrentScenario, variables, setVariables, results, setResults, loading, setLoading,
    calculating, convergenceError, iterations, activeSector, setActiveSector, currentScenario,
    setCurrentScenario, saving, anoSafra, setAnoSafra, mesReferencia, setMesReferencia,
    hasUnsavedChanges, setHasUnsavedChanges, savingActive, handleChange, handleCalculate,
    onLoadScenario, handleSaveNew, handleSaveActive, onApplyOptimalValue, handleSaveVariable,
    isLocked, years, months, fetchYearsAndMonths, residual, tolerance, updateTolerance,
    isOffline, checkConnection
  };
}
