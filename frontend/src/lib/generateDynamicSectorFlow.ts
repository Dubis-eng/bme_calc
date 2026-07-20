import { ProcessFlow, ProcessFlowNode, ProcessFlowEdge } from './processFlow';
import { Variable } from '../types';

export interface DynamicFlowOptions {
  viewMode?: 'full' | 'summary';
  summaryFieldIds?: string[];
}

function sanitizeId(str: string): string {
  return (str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .toLowerCase();
}

export function filterSectorVariables(variables: Variable[], sector: string): Variable[] {
  const normSector = (sector || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
  return variables.filter((v) => {
    const vSetor = (v['SETOR'] || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
    return vSetor === normSector || normSector.includes(vSetor) || vSetor.includes(normSector);
  });
}

function groupVariablesByEtapa(sectorVars: Variable[]): Record<string, Variable[]> {
  const grouped: Record<string, Variable[]> = {};
  for (const v of sectorVars) {
    const etapa = v['ETAPA'] && v['ETAPA'].trim() !== '' ? v['ETAPA'].trim() : 'Geral';
    if (!grouped[etapa]) {
      grouped[etapa] = [];
    }
    grouped[etapa].push(v);
  }
  return grouped;
}

interface EtapaFlowComponent {
  nodes: ProcessFlowNode[];
  edges: ProcessFlowEdge[];
  processNodeId: string;
}

function createEtapaComponent(etapaName: string, vars: Variable[], index: number): EtapaFlowComponent {
  const slug = sanitizeId(etapaName) || `etapa_${index}`;
  const baseX = index * 380 + 60;

  const inputVars = vars.filter((v) => v['TIPO'] === 'INPUT' || v['TIPO'] === 'CENARIO');
  const outputVars = vars.filter((v) => v['TIPO'] === 'OUTPUT' || v['TIPO'] === 'DERIVADA');
  const processVars = vars.length > 0 ? vars : [];

  const processNodeId = `node-proc-${slug}`;
  const nodes: ProcessFlowNode[] = [];
  const edges: ProcessFlowEdge[] = [];

  // Main Process Node
  nodes.push({
    id: processNodeId,
    kind: 'process',
    title: etapaName,
    subtitle: `${vars.length} Variável(is)`,
    position: { x: baseX, y: 180 },
    fieldIds: processVars.map((v) => v['ID - REF']),
  });

  // Inputs IO Node
  if (inputVars.length > 0) {
    const inId = `node-io-in-${slug}`;
    nodes.push({
      id: inId,
      kind: 'io',
      title: `Entradas (${etapaName})`,
      subtitle: `${inputVars.length} Variável(is)`,
      position: { x: baseX, y: 30 },
      fieldIds: inputVars.map((v) => v['ID - REF']),
    });
    edges.push({
      id: `edge-in-${slug}`,
      source: inId,
      target: processNodeId,
    });
  }

  // Outputs IO Node
  if (outputVars.length > 0) {
    const outId = `node-io-out-${slug}`;
    nodes.push({
      id: outId,
      kind: 'io',
      title: `Resultados (${etapaName})`,
      subtitle: `${outputVars.length} Variável(is)`,
      position: { x: baseX, y: 360 },
      fieldIds: outputVars.map((v) => v['ID - REF']),
    });
    edges.push({
      id: `edge-out-${slug}`,
      source: processNodeId,
      target: outId,
    });
  }

  return { nodes, edges, processNodeId };
}

export function generateDynamicSectorFlow(
  variables: Variable[],
  sector: string,
  options: DynamicFlowOptions = {}
): ProcessFlow {
  let sectorVars = filterSectorVariables(variables, sector);
  if (sectorVars.length === 0) {
    return { nodes: [], edges: [] };
  }

  if (options.viewMode === 'summary') {
    if (options.summaryFieldIds && options.summaryFieldIds.length > 0) {
      const allowed = new Set(options.summaryFieldIds);
      sectorVars = sectorVars.filter((v) => allowed.has(v['ID - REF']));
    } else {
      // Default KPI summary filtering: pick INPUT and OUTPUT variables, max 3 per stage
      const groupedTemp = groupVariablesByEtapa(sectorVars);
      const filtered: Variable[] = [];
      for (const key of Object.keys(groupedTemp)) {
        const stageVars = groupedTemp[key];
        const kpis = stageVars.filter((v) => v['TIPO'] === 'INPUT' || v['TIPO'] === 'OUTPUT').slice(0, 3);
        filtered.push(...(kpis.length > 0 ? kpis : stageVars.slice(0, 2)));
      }
      sectorVars = filtered;
    }
  }

  const grouped = groupVariablesByEtapa(sectorVars);
  const etapaNames = Object.keys(grouped);

  const allNodes: ProcessFlowNode[] = [];
  const allEdges: ProcessFlowEdge[] = [];
  let prevProcessNodeId: string | null = null;

  etapaNames.forEach((etapaName, idx) => {
    const comp = createEtapaComponent(etapaName, grouped[etapaName], idx);
    allNodes.push(...comp.nodes);
    allEdges.push(...comp.edges);

    if (prevProcessNodeId) {
      allEdges.push({
        id: `edge-seq-${idx - 1}-${idx}`,
        source: prevProcessNodeId,
        target: comp.processNodeId,
      });
    }
    prevProcessNodeId = comp.processNodeId;
  });

  return { nodes: allNodes, edges: allEdges };
}
