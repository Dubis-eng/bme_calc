import { BAGACO_DASHBOARD_FLOW } from "./processFlowBagaco";
import { MOAGEM_PHYSICAL_FLOW } from "./processFlowMoagem";
import { PREMISSAS_DASHBOARD_FLOW } from "./processFlowPremissas";

export type ProcessFlowNodeKind = "io" | "hub" | "process";

export type ProcessFlowNode = {
  id: string;
  kind: ProcessFlowNodeKind;
  title: string;
  subtitle?: string;
  position: { x: number; y: number };
  fieldIds: string[];
  sourceDefinition?: string;
};

export type ProcessFlowEdge = {
  id: string;
  source: string;
  target: string;
  label?: string;
};

export type ProcessFlow = {
  nodes: ProcessFlowNode[];
  edges: ProcessFlowEdge[];
};

const EMPTY_FLOW: ProcessFlow = { nodes: [], edges: [] };

export function getProcessFlowForSector(sector: string): ProcessFlow {
  const normalized = (sector || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
  if (normalized.includes("MOAGEM")) return MOAGEM_PHYSICAL_FLOW;
  if (normalized.includes("PREMISSA")) return PREMISSAS_DASHBOARD_FLOW;
  if (normalized.includes("BAGACO") || normalized.includes("UTILIDADES")) return BAGACO_DASHBOARD_FLOW;
  return EMPTY_FLOW;
}

export function hasProcessFlow(sector: string): boolean {
  return getProcessFlowForSector(sector).nodes.length > 0;
}
