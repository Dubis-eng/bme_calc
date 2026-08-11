import React from 'react';
import { VariableDrawerIdentitySection } from './VariableDrawerIdentitySection';
import { VariableDrawerFormatSection } from './VariableDrawerFormatSection';

interface MetadataSectionProps {
  isEdit: boolean;
  idRef: string;
  setIdRef: (v: string) => void;
  status: 'ativa' | 'pendente' | 'inválida' | 'inativa';
  setStatus: (v: 'ativa' | 'pendente' | 'inválida' | 'inativa') => void;
  type: 'INPUT' | 'OUTPUT' | 'DERIVADA' | 'CENARIO';
  setType: (v: 'INPUT' | 'OUTPUT' | 'DERIVADA' | 'CENARIO') => void;
  sector: string;
  setSector: (v: string) => void;
  uniqueSectors: string[];
  etapa: string;
  setEtapa: (v: string) => void;
  uniqueEtapas: string[];
  pontoControle: string;
  setPontoControle: (v: string) => void;
  uniqueCps: string[];
  description: string;
  setDescription: (v: string) => void;
  unit: string;
  setUnit: (v: string) => void;
  casasDecimais: number | '';
  setCasasDecimais: (v: number | '') => void;
  tipoExibicao: 'NUMBER' | 'PERCENTAGE';
  setTipoExibicao: (v: 'NUMBER' | 'PERCENTAGE') => void;
  percentBase: 'DECIMAL' | 'INTEGER';
  setPercentBase: (v: 'DECIMAL' | 'INTEGER') => void;
}

export const VariableDrawerMetadataSection: React.FC<MetadataSectionProps> = (props) => {
  return (
    <>
      <VariableDrawerIdentitySection
        isEdit={props.isEdit}
        idRef={props.idRef}
        setIdRef={props.setIdRef}
        status={props.status}
        setStatus={props.setStatus}
        type={props.type}
        setType={props.setType}
        sector={props.sector}
        setSector={props.setSector}
        uniqueSectors={props.uniqueSectors}
        etapa={props.etapa}
        setEtapa={props.setEtapa}
        uniqueEtapas={props.uniqueEtapas}
        pontoControle={props.pontoControle}
        setPontoControle={props.setPontoControle}
        uniqueCps={props.uniqueCps}
      />
      <VariableDrawerFormatSection
        description={props.description}
        setDescription={props.setDescription}
        unit={props.unit}
        setUnit={props.setUnit}
        casasDecimais={props.casasDecimais}
        setCasasDecimais={props.setCasasDecimais}
        tipoExibicao={props.tipoExibicao}
        setTipoExibicao={props.setTipoExibicao}
        percentBase={props.percentBase}
        setPercentBase={props.setPercentBase}
      />
    </>
  );
};
