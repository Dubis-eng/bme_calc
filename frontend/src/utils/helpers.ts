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
  percent_base: v.percent_base
});
