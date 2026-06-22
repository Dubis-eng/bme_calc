export interface Variable {
    "ID - REF": string;
    "SETOR": string;
    "DEFINIÇÃO": string;  // Nome amigável
    "DESCRIÇÃO": string;
    "TIPO": "INPUT" | "OUTPUT" | "DERIVADA" | "CENARIO";
    "UNIDADE DE MEDIDA": string;
    "EQUAÇÕES E VALORES": string | number;
    "STATUS"?: "ativa" | "pendente" | "inválida" | "descontinuada";
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
