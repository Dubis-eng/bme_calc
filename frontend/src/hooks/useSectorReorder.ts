import React from 'react';
import axios from 'axios';
import { GroupedStage } from '../utils/sorting';

interface UseSectorReorderParams {
  activeSector: string;
  groupedStages: GroupedStage[];
  isLocked: boolean;
  onReorderSuccess?: () => void;
}

export function useSectorReorder({
  activeSector,
  groupedStages,
  isLocked,
  onReorderSuccess,
}: UseSectorReorderParams) {
  const handleDragStart = (e: React.DragEvent, type: 'stage' | 'cp' | 'var', id: string) => {
    e.stopPropagation();
    e.dataTransfer.setData('text/plain', JSON.stringify({ type, id }));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent, targetType: 'stage' | 'cp' | 'var', targetId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const dataStr = e.dataTransfer.getData('text/plain');
    if (!dataStr) return;
    try {
      const { type, id } = JSON.parse(dataStr);
      if (id === targetId) return;

      if (type === 'stage' && targetType === 'stage') {
        const stageIds = groupedStages.map(s => s.stageId);
        const fromIdx = stageIds.indexOf(id);
        const toIdx = stageIds.indexOf(targetId);
        if (fromIdx !== -1 && toIdx !== -1) {
          const newStageIds = [...stageIds];
          newStageIds.splice(fromIdx, 1);
          newStageIds.splice(toIdx, 0, id);
          await axios.patch(`http://localhost:8000/api/sectors/${activeSector}/stages/reorder`, newStageIds);
        }
      } else if (type === 'cp') {
        if (targetType === 'cp') {
          const stage = groupedStages.find(s => s.controlPoints.some(cp => cp.cpId === targetId));
          if (stage) {
            const cpIds = stage.controlPoints.map(cp => cp.cpId);
            const toIdx = cpIds.indexOf(targetId);
            const newCpIds = cpIds.filter(cid => cid !== id);
            newCpIds.splice(toIdx, 0, id);
            await axios.patch(`http://localhost:8000/api/stages/${stage.stageId}/control-points/reorder`, newCpIds);
          }
        } else if (targetType === 'stage') {
          const stage = groupedStages.find(s => s.stageId === targetId);
          if (stage) {
            const cpIds = stage.controlPoints.map(cp => cp.cpId);
            const newCpIds = cpIds.filter(cid => cid !== id);
            newCpIds.push(id);
            await axios.patch(`http://localhost:8000/api/stages/${targetId}/control-points/reorder`, newCpIds);
          }
        }
      } else if (type === 'var') {
        if (targetType === 'var') {
          const cp = groupedStages.flatMap(s => s.controlPoints).find(cp => cp.variables.some(v => v['ID - REF'] === targetId));
          if (cp) {
            const varIds = cp.variables.map(v => v['ID - REF']);
            const toIdx = varIds.indexOf(targetId);
            const newVarIds = varIds.filter(vid => vid !== id);
            newVarIds.splice(toIdx, 0, id);
            await axios.patch(`http://localhost:8000/api/control-points/${cp.cpId}/variables/reorder`, newVarIds);
          }
        } else if (targetType === 'cp') {
          const cp = groupedStages.flatMap(s => s.controlPoints).find(cp => cp.cpId === targetId);
          if (cp) {
            const varIds = cp.variables.map(v => v['ID - REF']);
            const newVarIds = varIds.filter(vid => vid !== id);
            newVarIds.push(id);
            await axios.patch(`http://localhost:8000/api/control-points/${targetId}/variables/reorder`, newVarIds);
          }
        }
      }
      onReorderSuccess?.();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMove = async (type: 'stage' | 'cp' | 'var', id: string, direction: 'up' | 'down') => {
    if (isLocked) return;
    try {
      if (type === 'stage') {
        const stageIds = groupedStages.map(s => s.stageId);
        const idx = stageIds.indexOf(id);
        const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (idx !== -1 && targetIdx >= 0 && targetIdx < stageIds.length) {
          const newStageIds = [...stageIds];
          newStageIds[idx] = stageIds[targetIdx];
          newStageIds[targetIdx] = id;
          await axios.patch(`http://localhost:8000/api/sectors/${activeSector}/stages/reorder`, newStageIds);
        }
      } else if (type === 'cp') {
        const stage = groupedStages.find(s => s.controlPoints.some(cp => cp.cpId === id));
        if (stage) {
          const cpIds = stage.controlPoints.map(cp => cp.cpId);
          const idx = cpIds.indexOf(id);
          const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
          if (idx !== -1 && targetIdx >= 0 && targetIdx < cpIds.length) {
            const newCpIds = [...cpIds];
            newCpIds[idx] = cpIds[targetIdx];
            newCpIds[targetIdx] = id;
            await axios.patch(`http://localhost:8000/api/stages/${stage.stageId}/control-points/reorder`, newCpIds);
          }
        }
      } else if (type === 'var') {
        const cp = groupedStages.flatMap(s => s.controlPoints).find(cp => cp.variables.some(v => v['ID - REF'] === id));
        if (cp) {
          const varIds = cp.variables.map(v => v['ID - REF']);
          const idx = varIds.indexOf(id);
          const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
          if (idx !== -1 && targetIdx >= 0 && targetIdx < varIds.length) {
            const newVarIds = [...varIds];
            newVarIds[idx] = varIds[targetIdx];
            newVarIds[targetIdx] = id;
            await axios.patch(`http://localhost:8000/api/control-points/${cp.cpId}/variables/reorder`, newVarIds);
          }
        }
      }
      onReorderSuccess?.();
    } catch (err) {
      console.error(err);
    }
  };

  return {
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleMove,
  };
}
