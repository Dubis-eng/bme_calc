import { useCallback, useEffect, useMemo, useState } from 'react';
import {
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

import { getProcessFlowForSector } from '../lib/processFlow';
import { generateDynamicSectorFlow } from '../lib/generateDynamicSectorFlow';
import { getMergedVariablesAtom, selectedFieldIdAtom } from '../state/atoms';
import { ScenarioMetadata } from '../types';

const NODE_KIND_TO_TYPE: Record<string, string> = { io: 'ioNode', hub: 'hubNode', process: 'processNode' };

export function useFlowchartState(sector: string) {
  const mergedVariables = useAtomValue(getMergedVariablesAtom);
  const setSelectedFieldId = useSetAtom(selectedFieldIdAtom);

  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [hasCustomLayout, setHasCustomLayout] = useState<boolean>(false);
  const [isLayoutLocked, setIsLayoutLocked] = useState<boolean>(true);
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

  return {
    nodes,
    edges,
    isSaving,
    hasCustomLayout,
    isViewingDefault,
    isLayoutLocked,
    setIsLayoutLocked,
    selectedScenarioId,
    setSelectedScenarioId,
    selectedYear,
    setSelectedYear,
    availableScenarios,
    availableYears,
    isModalOpen,
    setIsModalOpen,
    editingNodeTitle,
    editingFieldIds,
    selectedElementsCount,
    onNodesChange,
    onEdgesChange,
    onEdgesDelete,
    onConnect,
    handleNodeClick,
    handleNodeDoubleClick,
    handleDeleteSelected,
    handleSaveNodeDetails,
    handleAddProcessNode,
    handleAddIoNode,
    handleSave,
    handleToggleDefaultView,
  };
}
