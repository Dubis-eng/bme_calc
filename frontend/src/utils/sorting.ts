import { Variable } from '../types';

export interface GroupedCP {
  cpName: string;
  cpId: string;
  cpOrdem: number;
  variables: Variable[];
}

export interface GroupedStage {
  stageName: string;
  stageId: string;
  stageOrdem: number;
  controlPoints: GroupedCP[];
}

/**
 * Groups and sorts variables by Stage and Control Point while preserving the backend sorted order.
 */
export function groupAndSortVariables(variables: Variable[]): GroupedStage[] {
  const stagesList: GroupedStage[] = [];
  const stageIndexMap: Record<string, number> = {};

  variables.forEach((v) => {
    const stageName = v.ETAPA || 'GERAL';
    const stageId = v.stage_id || 'GERAL';
    const stageOrdem = v.ordem || 0;
    const cpName = v['PONTO DE CONTROLE'] || 'GERAL';
    const cpId = v.control_point_id || 'GERAL';

    let stageIdx = stageIndexMap[stageId];
    if (stageIdx === undefined) {
      stageIdx = stagesList.length;
      stageIndexMap[stageId] = stageIdx;
      stagesList.push({
        stageName,
        stageId,
        stageOrdem,
        controlPoints: []
      });
    }

    const stageObj = stagesList[stageIdx];
    let cpObj = stageObj.controlPoints.find((cp) => cp.cpId === cpId);
    if (!cpObj) {
      cpObj = {
        cpName,
        cpId,
        cpOrdem: v.ordem || 0,
        variables: []
      };
      stageObj.controlPoints.push(cpObj);
    }

    cpObj.variables.push(v);
  });

  return stagesList;
}
