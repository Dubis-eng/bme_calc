import { describe, it, expect } from 'vitest';
import { generateDynamicSectorFlow, filterSectorVariables } from './generateDynamicSectorFlow';
import { Variable } from '../types';

const mockVariables: Variable[] = [
  {
    'ID - REF': 'MOENDA_RPM',
    SETOR: 'EXTRAÇÃO',
    ETAPA: 'Moagem',
    'PONTO DE CONTROLE': 'Terno 1',
    DESCRIÇÃO: 'Rotação da Moenda',
    TIPO: 'INPUT',
    'UNIDADE DE MEDIDA': 'RPM',
    'EQUAÇÕES E VALORES': '1200',
  },
  {
    'ID - REF': 'MOENDA_MOAGEM_TOTAL',
    SETOR: 'EXTRAÇÃO',
    ETAPA: 'Moagem',
    'PONTO DE CONTROLE': 'Terno 1',
    DESCRIÇÃO: 'Moagem Total de Cana',
    TIPO: 'OUTPUT',
    'UNIDADE DE MEDIDA': 't/h',
    'EQUAÇÕES E VALORES': '500.5',
  },
  {
    'ID - REF': 'DESTILACAO_ALCOOL_GL',
    SETOR: 'DESTILAÇÃO',
    ETAPA: 'Destilação A',
    'PONTO DE CONTROLE': 'Coluna A',
    DESCRIÇÃO: 'Teor Alcoólico',
    TIPO: 'INPUT',
    'UNIDADE DE MEDIDA': 'ºGL',
    'EQUAÇÕES E VALORES': '96.2',
  },
];

describe('generateDynamicSectorFlow', () => {
  it('filtra corretamente variáveis por setor', () => {
    const extracaoVars = filterSectorVariables(mockVariables, 'EXTRAÇÃO');
    expect(extracaoVars).toHaveLength(2);
    expect(extracaoVars[0]['ID - REF']).toBe('MOENDA_RPM');

    const destilacaoVars = filterSectorVariables(mockVariables, 'DESTILAÇÃO');
    expect(destilacaoVars).toHaveLength(1);
    expect(destilacaoVars[0]['ID - REF']).toBe('DESTILACAO_ALCOOL_GL');
  });

  it('gera nós e arestas dinâmicos para um setor com variáveis', () => {
    const flow = generateDynamicSectorFlow(mockVariables, 'EXTRAÇÃO');
    expect(flow.nodes).toBeDefined();
    expect(flow.nodes.length).toBeGreaterThan(0);

    const processNode = flow.nodes.find((n) => n.kind === 'process');
    expect(processNode).toBeDefined();
    expect(processNode?.title).toBe('Moagem');
    expect(processNode?.fieldIds).toContain('MOENDA_RPM');
    expect(processNode?.fieldIds).toContain('MOENDA_MOAGEM_TOTAL');

    expect(flow.edges.length).toBeGreaterThan(0);
  });

  it('retorna fluxo vazio quando o setor não possui variáveis', () => {
    const flow = generateDynamicSectorFlow(mockVariables, 'SETOR_INEXISTENTE');
    expect(flow.nodes).toHaveLength(0);
    expect(flow.edges).toHaveLength(0);
  });

  it('suporta modo de visão resumida (summary)', () => {
    const flow = generateDynamicSectorFlow(mockVariables, 'EXTRAÇÃO', {
      viewMode: 'summary',
      summaryFieldIds: ['MOENDA_RPM'],
    });
    expect(flow.nodes.length).toBeGreaterThan(0);
    const procNode = flow.nodes.find((n) => n.kind === 'process');
    expect(procNode?.fieldIds).toContain('MOENDA_RPM');
    expect(procNode?.fieldIds).not.toContain('MOENDA_MOAGEM_TOTAL');
  });
});
