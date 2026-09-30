import { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { ScenarioMetadata } from '../types';

export function useFlowchartScenarioSelector() {
  const [availableScenarios, setAvailableScenarios] = useState<ScenarioMetadata[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [availableYears, setAvailableYears] = useState<number[]>([2025, 2026, 2027]);

  useEffect(() => {
    apiClient.get('/api/scenarios').then((res) => {
      if (Array.isArray(res.data)) {
        setAvailableScenarios(res.data);
        if (res.data.length > 0 && !selectedScenarioId) {
          setSelectedScenarioId(res.data[0].id);
        }
      }
    }).catch(() => {});

    apiClient.get('/api/harvest-plan/years').then((res) => {
      if (Array.isArray(res.data) && res.data.length > 0) {
        setAvailableYears(res.data);
      }
    }).catch(() => {});
  }, [selectedScenarioId]);

  return {
    availableScenarios,
    selectedScenarioId,
    setSelectedScenarioId,
    selectedYear,
    setSelectedYear,
    availableYears,
  };
}
