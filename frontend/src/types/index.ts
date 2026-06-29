export interface Variable {
    "ID - REF": string;
    "SETOR": string;
    "ETAPA": string;
    "PONTO DE CONTROLE": string;
    "DESCRIÇÃO": string;
    "TIPO": "INPUT" | "OUTPUT" | "DERIVADA" | "CENARIO";
    "UNIDADE DE MEDIDA": string;
    "EQUAÇÕES E VALORES": string | number;
    "STATUS"?: "ativa" | "pendente" | "inválida" | "inativa";
    "casas_decimais"?: number | null;
    "tipo_exibicao"?: "NUMBER" | "PERCENTAGE";
    "percent_base"?: "DECIMAL" | "INTEGER";
}

export interface Result {
    value: number | null;
    status: "OK" | "DIV_BY_ZERO" | "MISSING_VAR" | "PENDING";
    error_message: string;
}

export interface Sector {
    id: string;
    nome: string;
    descricao?: string;
    ordem: number;
}

export type FilterStatus = 'all' | 'ok' | 'error' | 'idle';

export interface BackendVariable {
  id: string;
  tipo: 'INPUT' | 'OUTPUT' | 'DERIVADA' | 'CENARIO';
  status: string;
  setor_id: string;
  etapa: string;
  ponto_controle: string;
  descricao: string;
  unidade: string;
  equation_value: string;
  casas_decimais?: number | null;
  tipo_exibicao?: "NUMBER" | "PERCENTAGE";
  percent_base?: "DECIMAL" | "INTEGER";
}

