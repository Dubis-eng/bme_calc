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
 * Groups and sorts variables by Stage and Control Point.
 * Groups by normalized Stage Name & Control Point Name to guarantee variables with matching names stay together.
 */
export function groupAndSortVariables(variables: Variable[]): GroupedStage[] {
  const stagesList: GroupedStage[] = [];
  const stageIndexMap: Record<string, number> = {};

  variables.forEach((v) => {
    const rawStage = (v.ETAPA || 'GERAL').trim();
    const stageName = rawStage.toUpperCase();
    const stageId = v.stage_id || stageName;
    const stageOrdem = v.ordem || 0;

    const rawCp = (v['PONTO DE CONTROLE'] || 'GERAL').trim();
    const cpName = rawCp.toUpperCase();
    const cpId = v.control_point_id || cpName;

    let stageIdx = stageIndexMap[stageName];
    if (stageIdx === undefined) {
      stageIdx = stagesList.length;
      stageIndexMap[stageName] = stageIdx;
      stagesList.push({
        stageName: rawStage,
        stageId,
        stageOrdem,
        controlPoints: []
      });
    }

    const stageObj = stagesList[stageIdx];
    let cpObj = stageObj.controlPoints.find((cp) => cp.cpName.trim().toUpperCase() === cpName);
    if (!cpObj) {
      cpObj = {
        cpName: rawCp,
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
