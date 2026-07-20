import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  Connection,
  MarkerType,
} from '@xyflow/react';
import { useAtomValue, useSetAtom } from 'jotai';
import axios from 'axios';

import '@xyflow/react/dist/style.css';
import './ProcessFlowCanvas.css';

import { getProcessFlowForSector } from '../../lib/processFlow';
import { generateDynamicSectorFlow } from '../../lib/generateDynamicSectorFlow';
import { currentScenarioAtom, getMergedVariablesAtom, selectedFieldIdAtom } from '../../state/atoms';
import { ScenarioMetadata } from '../../types';
import { HubNode } from './nodes/HubNode';
import { IoNode } from './nodes/IoNode';
import { ProcessNode } from './nodes/ProcessNode';
import { ProcessFlowToolbar } from './ProcessFlowToolbar';
import { NodeVariableSelectorModal } from './NodeVariableSelectorModal';

const nodeTypes = { ioNode: IoNode, processNode: ProcessNode, hubNode: HubNode };
const NODE_KIND_TO_TYPE: Record<string, keyof typeof nodeTypes> = { io: 'ioNode', hub: 'hubNode', process: 'processNode' };

interface ProcessFlowCanvasProps {
  sector: string;
  onCalculate?: () => void;
  isCalculating?: boolean;
}

export const ProcessFlowCanvas: React.FC<ProcessFlowCanvasProps> = ({
  sector,
  onCalculate,
  isCalculating = false,
}) => {
  const mergedVariables = useAtomValue(getMergedVariablesAtom);
  const currentScenario = useAtomValue(currentScenarioAtom);
  const setSelectedFieldId = useSetAtom(selectedFieldIdAtom);

  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [hasCustomLayout, setHasCustomLayout] = useState<boolean>(false);

  // Layout Lock / Unlock state (Default: Locked)
  const [isLayoutLocked, setIsLayoutLocked] = useState<boolean>(true);

  // Layout Toggle state (Default vs Custom)
  const [isViewingDefault, setIsViewingDefault] = useState<boolean>(false);
  const [savedCustomLayout, setSavedCustomLayout] = useState<{ nodes: Node[]; edges: Edge[] } | null>(null);

  // Independent Scenario Selector state
  const [availableScenarios, setAvailableScenarios] = useState<ScenarioMetadata[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [availableYears, setAvailableYears] = useState<number[]>([2025, 2026, 2027]);

  // Modal State for attaching variables / renaming
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);

  const defaultEdgeOptions = useMemo(() => ({
    type: 'smoothstep',
    animated: true,
    style: { strokeWidth: 2, stroke: '#0d9488' },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 18,
      height: 18,
      color: '#14b8a6',
    },
  }), []);

  useEffect(() => {
    axios.get('http://localhost:8000/api/scenarios').then((res) => {
      if (Array.isArray(res.data)) {
        setAvailableScenarios(res.data);
        if (res.data.length > 0 && !selectedScenarioId) {
          setSelectedScenarioId(res.data[0].id);
        }
      }
    }).catch(() => {});

    axios.get('http://localhost:8000/api/harvest-plan/years').then((res) => {
      if (Array.isArray(res.data) && res.data.length > 0) {
        setAvailableYears(res.data);
      }
    }).catch(() => {});
  }, []);

  const loadFlowchart = useCallback(async (sectorKey: string) => {
    setIsViewingDefault(false);
    try {
      const res = await axios.get(`http://localhost:8000/api/flowcharts/${encodeURIComponent(sectorKey)}`);
      if (res.data && res.data.nodes && res.data.nodes.length > 0) {
        setNodes(res.data.nodes);
        const mappedEdges = (res.data.edges || []).map((e: Edge) => ({
          ...e,
          type: 'smoothstep',
          animated: true,
          style: { strokeWidth: 2, stroke: '#0d9488' },
          markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18, color: '#14b8a6' },
        }));
        setEdges(mappedEdges);
        setSavedCustomLayout({ nodes: res.data.nodes, edges: mappedEdges });
        setHasCustomLayout(true);
        return;
      }
    } catch {
      // Fallback to auto topology
    }

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

    setNodes(defaultNodes);
    setEdges(defaultEdges);
    setSavedCustomLayout(null);
    setHasCustomLayout(false);
  }, [mergedVariables]);

  useEffect(() => {
    loadFlowchart(sector);
  }, [sector, loadFlowchart]);

  const onNodesChange = useCallback((c: NodeChange[]) => {
    if (isLayoutLocked) return;
    setNodes((curr) => applyNodeChanges(c, curr));
  }, [isLayoutLocked]);

  const onEdgesChange = useCallback((c: EdgeChange[]) => {
    if (isLayoutLocked) return;
    setEdges((curr) => applyEdgeChanges(c, curr));
  }, [isLayoutLocked]);

  const onEdgesDelete = useCallback((deletedEdges: Edge[]) => {
    if (isLayoutLocked) return;
    setEdges((curr) => curr.filter((e) => !deletedEdges.some((d) => d.id === e.id)));
  }, [isLayoutLocked]);

  const onConnect = useCallback((conn: Connection) => {
    if (isLayoutLocked) return;
    setEdges((curr) => addEdge({
      ...conn,
      type: 'smoothstep',
      animated: true,
      style: { strokeWidth: 2, stroke: '#0d9488' },
      markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18, color: '#14b8a6' },
    }, curr));
  }, [isLayoutLocked]);

  const handleNodeClick = useCallback((_e: React.MouseEvent, node: Node) => {
    const data = node.data as { fieldIds?: string[] };
    if (data?.fieldIds?.[0]) setSelectedFieldId(data.fieldIds[0]);
  }, [setSelectedFieldId]);

  const handleNodeDoubleClick = useCallback((_e: React.MouseEvent, node: Node) => {
    if (isLayoutLocked) return;
    setEditingNodeId(node.id);
    setIsModalOpen(true);
  }, [isLayoutLocked]);

  const selectedElementsCount = useMemo(() => {
    return nodes.filter((n) => n.selected).length + edges.filter((e) => e.selected).length;
  }, [nodes, edges]);

  const handleDeleteSelected = useCallback(() => {
    if (isLayoutLocked) return;
    setNodes((curr) => curr.filter((n) => !n.selected));
    setEdges((curr) => curr.filter((e) => !e.selected));
  }, [isLayoutLocked]);

  const handleSaveNodeDetails = useCallback((newTitle: string, newFieldIds: string[]) => {
    if (!editingNodeId) return;
    setNodes((curr) =>
      curr.map((n) => {
        if (n.id === editingNodeId) {
          return {
            ...n,
            data: { ...n.data, title: newTitle || n.data.title, fieldIds: newFieldIds, subtitle: `${newFieldIds.length} Variável(is)` },
          };
        }
        return n;
      })
    );
  }, [editingNodeId]);

  const editingNodeObj = useMemo(() => nodes.find((n) => n.id === editingNodeId), [nodes, editingNodeId]);
  const editingNodeTitle = (editingNodeObj?.data?.title as string) || 'Bloco Customizado';
  const editingFieldIds = (editingNodeObj?.data?.fieldIds as string[]) || [];

  const handleAddProcessNode = useCallback(() => {
    if (isLayoutLocked) return;
    setNodes((curr) => [
      ...curr,
      {
        id: `node-proc-${Date.now()}`,
        type: 'processNode',
        position: { x: 250, y: 200 },
        data: { title: 'Novo Processo', subtitle: 'Clique 2x para editar', fieldIds: [] },
        draggable: true,
      },
    ]);
  }, [isLayoutLocked]);

  const handleAddIoNode = useCallback(() => {
    if (isLayoutLocked) return;
    setNodes((curr) => [
      ...curr,
      {
        id: `node-io-${Date.now()}`,
        type: 'ioNode',
        position: { x: 100, y: 100 },
        data: { title: 'Ponto E/S', subtitle: 'Clique 2x para editar', fieldIds: [] },
        draggable: true,
      },
    ]);
  }, [isLayoutLocked]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await axios.put(`http://localhost:8000/api/flowcharts/${encodeURIComponent(sector)}`, { nodes, edges });
      setSavedCustomLayout({ nodes, edges });
      setHasCustomLayout(true);
      setIsViewingDefault(false);
    } catch (err) {
      console.error('Erro ao salvar layout:', err);
    } finally {
      setIsSaving(false);
    }
  }, [sector, nodes, edges]);

  const handleToggleDefaultView = useCallback(() => {
    if (!isViewingDefault) {
      setSavedCustomLayout({ nodes, edges });
      const generated = generateDynamicSectorFlow(mergedVariables, sector);
      const flow = generated.nodes.length > 0 ? generated : getProcessFlowForSector(sector);

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

      setNodes(defaultNodes);
      setEdges(defaultEdges);
      setIsViewingDefault(true);
    } else {
      if (savedCustomLayout) {
        setNodes(savedCustomLayout.nodes);
        setEdges(savedCustomLayout.edges);
      }
      setIsViewingDefault(false);
    }
  }, [isViewingDefault, nodes, edges, mergedVariables, sector, savedCustomLayout]);

  return (
    <div className="process-flow-canvas-host relative flex h-[720px] w-full flex-col overflow-hidden rounded-xl border border-slate-800 shadow-2xl">
      <ProcessFlowToolbar
        onAddProcessNode={handleAddProcessNode}
        onAddIoNode={handleAddIoNode}
        onSave={handleSave}
        onReset={handleToggleDefaultView}
        onDeleteSelected={handleDeleteSelected}
        selectedElementsCount={selectedElementsCount}
        isSaving={isSaving}
        hasCustomLayout={hasCustomLayout}
        isViewingDefault={isViewingDefault}
        onCalculate={onCalculate}
        isCalculating={isCalculating}
        isLayoutLocked={isLayoutLocked}
        onToggleLayoutLock={() => setIsLayoutLocked((prev) => !prev)}
        selectedYear={selectedYear}
        onYearChange={setSelectedYear}
        availableYears={availableYears}
        selectedScenarioId={selectedScenarioId}
        onScenarioChange={setSelectedScenarioId}
        availableScenarios={availableScenarios}
      />
      <div className="relative flex-1 w-full bg-slate-950">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onEdgesDelete={onEdgesDelete}
          onConnect={onConnect}
          onNodeClick={handleNodeClick}
          onNodeDoubleClick={handleNodeDoubleClick}
          defaultEdgeOptions={defaultEdgeOptions}
          nodesDraggable={!isLayoutLocked}
          nodesConnectable={!isLayoutLocked}
          elementsSelectable={!isLayoutLocked}
          deleteKeyCode={isLayoutLocked ? null : ['Backspace', 'Delete']}
          edgesReconnectable={!isLayoutLocked}
          edgesFocusable={!isLayoutLocked}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          proOptions={{ hideAttribution: true }}
          minZoom={0.2}
          maxZoom={1.6}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
          <Controls position="bottom-right" showInteractive={false} />
          <MiniMap pannable zoomable position="top-right" />
        </ReactFlow>
      </div>

      <NodeVariableSelectorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        nodeTitle={editingNodeTitle}
        allVariables={mergedVariables}
        selectedFieldIds={editingFieldIds}
        onSaveNodeDetails={handleSaveNodeDetails}
      />
    </div>
  );
};
