import { Node, Edge, MarkerType } from '@xyflow/react';
import { getProcessFlowForSector } from '../lib/processFlow';
import { generateDynamicSectorFlow } from '../lib/generateDynamicSectorFlow';
import { Variable } from '../types';

export const NODE_KIND_TO_TYPE: Record<string, string> = {
  io: 'ioNode',
  hub: 'hubNode',
  process: 'processNode',
};

export function mapCustomEdges(rawEdges: Edge[]): Edge[] {
  return (rawEdges || []).map((e: Edge) => ({
    ...e,
    type: 'smoothstep',
    animated: true,
    style: { strokeWidth: 2, stroke: '#0d9488' },
    markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18, color: '#14b8a6' },
  }));
}

export function createDefaultFlowElements(
  mergedVariables: Variable[],
  sectorKey: string
): { nodes: Node[]; edges: Edge[] } {
  const generated = generateDynamicSectorFlow(mergedVariables, sectorKey);
  const flow = generated.nodes.length > 0 ? generated : getProcessFlowForSector(sectorKey);

  const defaultNodes: Node[] = flow.nodes.map((n) => ({
    id: n.id,
    type: NODE_KIND_TO_TYPE[n.kind] || 'processNode',
    position: n.position,
    data: { title: n.title, subtitle: n.subtitle, fieldIds: n.fieldIds },
    draggable: true,
  }));

  const defaultEdges: Edge[] = flow.edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    type: 'smoothstep',
    animated: true,
    style: { strokeWidth: 2, stroke: '#0d9488' },
    markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18, color: '#14b8a6' },
  }));

  return { nodes: defaultNodes, edges: defaultEdges };
}
