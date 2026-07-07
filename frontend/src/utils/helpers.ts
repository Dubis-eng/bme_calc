import { Variable, BackendVariable } from '../types';

export const getFriendlySectorName = (sector: string): string => {
  if (!sector) return '';
  const s = sector.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
  const sectorMap: Record<string, string> = {
    "INFO GERAIS": "Informações Gerais",
    "PREMISSA": "Premissas",
    "MOAGEM": "Moagem",
    "EXTRAC": "Extração de Caldo",
    "DISTRIBUIC": "Distribuição de Caldo",
    "TRATAMENTO": "Tratamento do Caldo",
    "PRODUC": "Produção de Açúcar",
    "CALCULOS": "Parâmetros de Processo",
    "INFORMAO CALCULOS": "Parâmetros de Processo",
    "DESTILARIA": "Destilação de Álcool",
    "LEVEDURA": "Secagem de Levedura",
    "UTILIDADES": "Utilidades e Vapor",
    "COMPLEMENTAR": "Informações Complementares"
  };
  const key = Object.keys(sectorMap).find(k => s.includes(k));
  return key ? sectorMap[key] : sector;
};

export const formatHarvestYear = (year: number | string): string => {
  const y = typeof year === 'string' ? parseInt(year, 10) : year;
  return isNaN(y) ? String(year) : `${y}/${y + 1}`;
};

export const parseHarvestYear = (yearStr: string): number => parseInt(yearStr.match(/\d{4}/)?.[0] || '2026', 10);

export const mapBackendVariableToFrontend = (v: BackendVariable): Variable => ({
  'ID - REF': v.id,
  TIPO: v.tipo,
  STATUS: v.status as 'ativa' | 'pendente' | 'inválida' | 'inativa',
  SETOR: v.setor_id,
  ETAPA: v.etapa,
  'PONTO DE CONTROLE': v.ponto_controle,
  'DESCRIÇÃO': v.descricao,
  'UNIDADE DE MEDIDA': v.unidade,
  'EQUAÇÕES E VALORES': v.equation_value,
  casas_decimais: v.casas_decimais,
  tipo_exibicao: v.tipo_exibicao,
  percent_base: v.percent_base,
  control_point_id: v.control_point_id,
  stage_id: v.stage_id,
  ordem: v.ordem
});

export const FUNCTIONS = new Set([
  'SE', 'SEERRO', 'SOMA', 'PROCV', 'LN', 'SUBTOTAL', 'SOMASES',
  'VAPOR_H', 'VAPOR_S', 'VAPOR_H_SAT', 'VAPOR_H_LIQ', 'VAPOR_H_PS', 'VAPOR_T_SAT', 'VAPOR_LATENT',
  'TRUE', 'FALSE', 'VERDADEIRO', 'FALSO'
]);

export const formatVariableValue = (val: number, variable: Variable) => {
  const isPercent = variable.tipo_exibicao === 'PERCENTAGE';
  const base = variable.percent_base || 'DECIMAL';
  const decimals = variable.casas_decimais !== undefined && variable.casas_decimais !== null 
    ? variable.casas_decimais 
    : (isPercent ? 2 : 4);
  
  let displayVal = val;
  if (isPercent && base === 'DECIMAL') {
    displayVal = val * 100;
  }
  
  const numStr = displayVal.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
  
  return isPercent ? `${numStr}%` : numStr;
};

export const getInputValue = (v: Variable) => {
  const rawVal = v['EQUAÇÕES E VALORES'];
  if (typeof rawVal === 'string' && rawVal.startsWith('=')) {
    return rawVal;
  }
  const isPercent = v.tipo_exibicao === 'PERCENTAGE';
  const num = Number(typeof rawVal === 'string' ? rawVal.replace(',', '.') : rawVal);
  if (!isNaN(num) && rawVal !== '' && rawVal !== null && rawVal !== undefined) {
    if (isPercent) {
      const multiplier = v.percent_base === 'DECIMAL' ? 100 : 1;
      const displayVal = Number((num * multiplier).toFixed(12));
      return String(displayVal).replace('.', ',');
    } else {
      return String(num).replace('.', ',');
    }
  }
  return rawVal !== null && rawVal !== undefined ? String(rawVal) : '';
};

export const cleanInputValue = (value: string, variable: Variable) => {
  let finalValue = value;
  const isPercent = variable.tipo_exibicao === 'PERCENTAGE';
  let cleaned = value.trim();
  if (!cleaned.startsWith('=')) {
    if (cleaned.startsWith('.') || cleaned.startsWith(',')) {
      cleaned = '0' + cleaned;
    }
    const dotValue = cleaned.replace(',', '.');
    const num = Number(dotValue);
    if (!isNaN(num) && cleaned !== '') {
      if (isPercent) {
        const divisor = variable.percent_base === 'DECIMAL' ? 100 : 1;
        finalValue = String(Number((num / divisor).toFixed(14)));
      } else {
        finalValue = String(num);
      }
    } else {
      finalValue = dotValue;
    }
  }
  return finalValue;
};




export const getDependencies = (formula: string, variables: Variable[]): string[] => {
  if (!formula || !formula.startsWith('=')) return [];
  const knownIds = new Set(variables.map(v => v['ID - REF'].toUpperCase()));
  const tokens = formula.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g) || [];
  return Array.from(new Set(tokens.map(t => t.toUpperCase()).filter(t => knownIds.has(t) && !FUNCTIONS.has(t))));
};
