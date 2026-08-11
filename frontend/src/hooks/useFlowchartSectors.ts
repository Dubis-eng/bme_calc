import { useState, useEffect } from 'react';
import axios from 'axios';
import { Sector } from '../types';
import { getFriendlySectorName } from '../utils/helpers';

export interface FlowSectorItem {
  id: string;
  label: string;
  isCustom?: boolean;
}

export const DEFAULT_FLOW_SECTORS: FlowSectorItem[] = [
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

export function useFlowchartSectors(sectors: Sector[], setSectors: (s: Sector[]) => void, activeFlowSector: string, setActiveFlowSector: (s: string) => void) {
  const [customFlowSectors, setCustomFlowSectors] = useState<Array<{ id: string; label: string }>>(() => {
    try { return JSON.parse(localStorage.getItem('bme_custom_flow_sectors') || '[]'); } catch { return []; }
  });
  const [hiddenFlowSectors, setHiddenFlowSectors] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('bme_hidden_flow_sectors') || '[]'); } catch { return []; }
  });
  const [isManageSectorsOpen, setIsManageSectorsOpen] = useState(false);

  const toggleHideSector = (sectorId: string) => {
    setHiddenFlowSectors((prev) => {
      const updated = prev.includes(sectorId) ? prev.filter((s) => s !== sectorId) : [...prev, sectorId];
      localStorage.setItem('bme_hidden_flow_sectors', JSON.stringify(updated));
      return updated;
    });
  };

  const officialFlowSectors = (sectors.length > 0 ? sectors.map(s => ({ id: s.id, label: s.nome || getFriendlySectorName(s.id) })) : DEFAULT_FLOW_SECTORS).map(s => ({ ...s, isCustom: false }));

  const allFlowSectors = [
    ...officialFlowSectors,
    ...customFlowSectors.filter(c => !officialFlowSectors.some(o => o.id === c.id)).map(c => ({ ...c, isCustom: true }))
  ];

  const visibleFlowSectors = allFlowSectors.filter(s => !hiddenFlowSectors.includes(s.id));

  const handleDeleteCustomFlowchartSector = async (sectorId: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir permanentemente o fluxograma '${sectorId}'?`)) return;
    try { await axios.delete(`http://localhost:8000/api/flowcharts/${encodeURIComponent(sectorId)}`); } catch (err) { console.error(err); }
    setCustomFlowSectors((prev) => { const updated = prev.filter((s) => s.id !== sectorId); localStorage.setItem('bme_custom_flow_sectors', JSON.stringify(updated)); return updated; });
    setHiddenFlowSectors((prev) => { const updated = prev.filter((s) => s !== sectorId); localStorage.setItem('bme_hidden_flow_sectors', JSON.stringify(updated)); return updated; });
    if (activeFlowSector === sectorId) { const remaining = visibleFlowSectors.filter((s) => s.id !== sectorId); if (remaining.length > 0) setActiveFlowSector(remaining[0].id); }
  };

  const fetchSectors = () => {
    axios.get('http://localhost:8000/api/sectors').then(res => setSectors(res.data)).catch(console.error);
    axios.get('http://localhost:8000/api/flowcharts').then(res => {
      if (Array.isArray(res.data)) {
        const backendCustoms: FlowSectorItem[] = res.data
          .filter((f: { sector_id: string; sector_name?: string }) => !officialFlowSectors.some(o => o.id === f.sector_id))
          .map((f: { sector_id: string; sector_name?: string }) => ({ id: f.sector_id, label: f.sector_name || f.sector_id, isCustom: true }));
        if (backendCustoms.length > 0) {
          setCustomFlowSectors(prev => {
            const merged = [...prev];
            backendCustoms.forEach((b: FlowSectorItem) => { if (!merged.some(m => m.id === b.id)) merged.push(b); });
            localStorage.setItem('bme_custom_flow_sectors', JSON.stringify(merged));
            return merged;
          });
        }
      }
    }).catch(console.error);
  };

  useEffect(() => { fetchSectors(); }, []);

  return {
    allFlowSectors,
    visibleFlowSectors,
    hiddenFlowSectors,
    isManageSectorsOpen,
    setIsManageSectorsOpen,
    toggleHideSector,
    handleDeleteCustomFlowchartSector,
    fetchSectors
  };
}
