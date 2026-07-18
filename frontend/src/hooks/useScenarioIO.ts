import { useState, useCallback } from 'react';
import axios from 'axios';
import { Variable, Sector } from '../types';

export function useScenarioIO() {
  const [years, setYears] = useState<{ id: number; active: boolean }[]>([]);
  const [months, setMonths] = useState<{ id: number; name: string; order_index: number; enabled: boolean }[]>([]);

  const fetchYearsAndMonths = useCallback(async () => {
    try {
      const [yRes, mRes] = await Promise.all([
        axios.get('http://localhost:8000/api/settings/years'),
        axios.get('http://localhost:8000/api/settings/months')
      ]);
      setYears(yRes.data);
      setMonths(mRes.data);
    } catch (err) {
      console.error("Erro ao buscar anos e meses das configurações:", err);
    }
  }, []);

  const ensureSectorExists = async (sectorName: string, sectors: Sector[], fetchSectors: () => void) => {
    const sectorId = sectorName.toUpperCase();
    if (!sectors.some(s => s.id === sectorId)) {
      try {
        const maxO = sectors.reduce((m, s) => s.ordem > m ? s.ordem : m, 0);
        await axios.post('http://localhost:8000/api/sectors', {
          id: sectorId,
          nome: sectorId.charAt(0).toUpperCase() + sectorId.slice(1).toLowerCase(),
          descricao: 'Criado via variável',
          ordem: maxO > 0 ? maxO + 10 : 10
        });
        fetchSectors();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const createVariablePayload = (newVar: Variable) => {
    return {
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
  };

  return {
    years,
    months,
    fetchYearsAndMonths,
    ensureSectorExists,
    createVariablePayload
  };
}
