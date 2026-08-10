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
    "control_point_id"?: string;
    "stage_id"?: string;
    "ordem"?: number;
    "in_harvest_plan"?: boolean;
    "harvest_plan_op"?: 'SUM' | 'AVERAGE' | 'WEIGHTED_AVERAGE' | 'CALCULATE' | null;
    "harvest_plan_weight_var_id"?: string | null;
    "agrupamento"?: string | null;
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
  control_point_id?: string;
  stage_id?: string;
  ordem?: number;
  descricao: string;
  unidade: string;
  equation_value: string;
  casas_decimais?: number | null;
  tipo_exibicao?: "NUMBER" | "PERCENTAGE";
  percent_base?: "DECIMAL" | "INTEGER";
  in_harvest_plan?: boolean;
  harvest_plan_op?: 'SUM' | 'AVERAGE' | 'WEIGHTED_AVERAGE' | 'CALCULATE' | null;
  harvest_plan_weight_var_id?: string | null;
  agrupamento?: string | null;
}

export interface ScenarioMetadata {
    id: string;
    year_harvest: string | number;
    reference_month: string;
    version: number;
    status: 'Em Edição' | 'Aprovado' | 'Final' | string;
    cycle_start_month?: string;
    created_at?: string;
    updated_at?: string;
}


