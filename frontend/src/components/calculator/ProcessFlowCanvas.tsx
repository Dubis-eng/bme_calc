import React, { useMemo } from 'react';
import { ReactFlow, Background, BackgroundVariant, Controls, MiniMap } from '@xyflow/react';
import { useAtomValue } from 'jotai';

import '@xyflow/react/dist/style.css';
import './ProcessFlowCanvas.css';

import { useFlowchartState } from '../../hooks/useFlowchartState';
import { HubNode } from './nodes/HubNode';
import { IoNode } from './nodes/IoNode';
import { ProcessNode } from './nodes/ProcessNode';
import { ProcessFlowToolbar } from './ProcessFlowToolbar';
import { NodeVariableSelectorModal } from './NodeVariableSelectorModal';
import { getMergedVariablesAtom } from '../../state/atoms';

const nodeTypes = { ioNode: IoNode, processNode: ProcessNode, hubNode: HubNode };

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
  const flowState = useFlowchartState(sector);

  const defaultEdgeOptions = useMemo(() => ({
    type: 'smoothstep',
    animated: true,
    style: { strokeWidth: 2, stroke: '#0d9488' },
    markerEnd: {
      type: 'arrowclosed',
      width: 18,
      height: 18,
      color: '#14b8a6',
    },
  }), []);

  return (
    <div className="process-flow-canvas-host relative flex h-[720px] w-full flex-col overflow-hidden rounded-xl border border-slate-800 shadow-2xl">
      <ProcessFlowToolbar
        onAddProcessNode={flowState.handleAddProcessNode}
        onAddIoNode={flowState.handleAddIoNode}
        onSave={flowState.handleSave}
        onReset={flowState.handleToggleDefaultView}
        onDeleteSelected={flowState.handleDeleteSelected}
        selectedElementsCount={flowState.selectedElementsCount}
        isSaving={flowState.isSaving}
        hasCustomLayout={flowState.hasCustomLayout}
        isViewingDefault={flowState.isViewingDefault}
        onCalculate={onCalculate}
        isCalculating={isCalculating}
        isLayoutLocked={flowState.isLayoutLocked}
        onToggleLayoutLock={() => flowState.setIsLayoutLocked((prev) => !prev)}
        selectedYear={flowState.selectedYear}
        onYearChange={flowState.setSelectedYear}
        availableYears={flowState.availableYears}
        selectedScenarioId={flowState.selectedScenarioId}
        onScenarioChange={flowState.setSelectedScenarioId}
        availableScenarios={flowState.availableScenarios}
      />
      <div className="relative flex-1 w-full bg-slate-950">
        <ReactFlow
          nodes={flowState.nodes}
          edges={flowState.edges}
          nodeTypes={nodeTypes}
          onNodesChange={flowState.onNodesChange}
          onEdgesChange={flowState.onEdgesChange}
          onEdgesDelete={flowState.onEdgesDelete}
          onConnect={flowState.onConnect}
          onNodeClick={flowState.handleNodeClick}
          onNodeDoubleClick={flowState.handleNodeDoubleClick}
          defaultEdgeOptions={defaultEdgeOptions}
          nodesDraggable={!flowState.isLayoutLocked}
          nodesConnectable={!flowState.isLayoutLocked}
          elementsSelectable={!flowState.isLayoutLocked}
          deleteKeyCode={flowState.isLayoutLocked ? null : ['Backspace', 'Delete']}
          edgesReconnectable={!flowState.isLayoutLocked}
          edgesFocusable={!flowState.isLayoutLocked}
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
        isOpen={flowState.isModalOpen}
        onClose={() => flowState.setIsModalOpen(false)}
        nodeTitle={flowState.editingNodeTitle}
        allVariables={mergedVariables}
        selectedFieldIds={flowState.editingFieldIds}
        onSaveNodeDetails={flowState.handleSaveNodeDetails}
      />
    </div>
  );
};
