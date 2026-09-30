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
import apiClient from '../api/client';
import { toast } from '../components/ui/Toast';
import { getMergedVariablesAtom, selectedFieldIdAtom } from '../state/atoms';
import { mapCustomEdges, createDefaultFlowElements } from './flowchartTopology';
import { useFlowchartScenarioSelector } from './useFlowchartScenarioSelector';

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

  const scenarioSelector = useFlowchartScenarioSelector();

  // Modal State for attaching variables / renaming
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);

  const loadFlowchart = useCallback(async (sectorKey: string) => {
    setIsViewingDefault(false);
    try {
      const res = await apiClient.get(`/api/flowcharts/${encodeURIComponent(sectorKey)}`);
      if (res.data?.nodes && res.data.nodes.length > 0) {
        setNodes(res.data.nodes);
        const mappedEdges = mapCustomEdges(res.data.edges || []);
        setEdges(mappedEdges);
        setSavedCustomLayout({ nodes: res.data.nodes, edges: mappedEdges });
        setHasCustomLayout(true);
        return;
      }
    } catch {
      // Fallback to auto topology
    }

    const { nodes: defaultNodes, edges: defaultEdges } = createDefaultFlowElements(mergedVariables, sectorKey);
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
      await apiClient.put(`/api/flowcharts/${encodeURIComponent(sector)}`, { nodes, edges });
      setSavedCustomLayout({ nodes, edges });
      setHasCustomLayout(true);
      setIsViewingDefault(false);
      toast.success(`Layout do fluxograma (${sector}) salvo com sucesso!`);
    } catch (err) {
      console.error('Erro ao salvar layout:', err);
      toast.error('Erro ao salvar layout do fluxograma.');
    } finally {
      setIsSaving(false);
    }
  }, [sector, nodes, edges]);

  const handleToggleDefaultView = useCallback(() => {
    if (!isViewingDefault) {
      setSavedCustomLayout({ nodes, edges });
      const { nodes: defaultNodes, edges: defaultEdges } = createDefaultFlowElements(mergedVariables, sector);
      setNodes(defaultNodes);
      setEdges(defaultEdges);
      setIsViewingDefault(true);
      toast.info('Visualizando layout padrão automático.');
    } else {
      if (savedCustomLayout) {
        setNodes(savedCustomLayout.nodes);
        setEdges(savedCustomLayout.edges);
      }
      setIsViewingDefault(false);
      toast.info('Restaurado layout customizado do usuário.');
    }
  }, [isViewingDefault, nodes, edges, mergedVariables, sector, savedCustomLayout]);

  const handleResetToDefault = useCallback(async () => {
    try {
      await apiClient.delete(`/api/flowcharts/${encodeURIComponent(sector)}`);
    } catch {
      // ignore
    }
    const { nodes: defaultNodes, edges: defaultEdges } = createDefaultFlowElements(mergedVariables, sector);
    setNodes(defaultNodes);
    setEdges(defaultEdges);
    setSavedCustomLayout(null);
    setHasCustomLayout(false);
    setIsViewingDefault(false);
    toast.success(`Fluxograma (${sector}) restaurado para o padrão do sistema!`);
  }, [sector, mergedVariables]);

  const toggleLock = useCallback(() => {
    setIsLayoutLocked((curr) => {
      const nextState = !curr;
      toast.info(nextState ? 'Edição de layout bloqueada.' : 'Edição de layout desbloqueada.');
      return nextState;
    });
  }, []);

  return {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onEdgesDelete,
    onConnect,
    handleNodeClick,
    handleNodeDoubleClick,
    handleDeleteSelected,
    selectedElementsCount,
    isSaving,
    handleSave,
    hasCustomLayout,
    handleResetToDefault,
    isLayoutLocked,
    toggleLock,
    isViewingDefault,
    handleToggleDefaultView,
    handleAddProcessNode,
    handleAddIoNode,
    isModalOpen,
    setIsModalOpen,
    editingNodeTitle,
    editingFieldIds,
    handleSaveNodeDetails,
    availableScenarios: scenarioSelector.availableScenarios,
    selectedScenarioId: scenarioSelector.selectedScenarioId,
    setSelectedScenarioId: scenarioSelector.setSelectedScenarioId,
    selectedYear: scenarioSelector.selectedYear,
    setSelectedYear: scenarioSelector.setSelectedYear,
    availableYears: scenarioSelector.availableYears,
  };
}
