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
