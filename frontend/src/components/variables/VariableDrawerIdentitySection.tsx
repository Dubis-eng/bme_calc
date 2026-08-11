import React from 'react';
import { Section, FieldLabel } from './VariableDrawerControls';
import { SegmentedControl } from '../ui/SegmentedControl';
import { SuggestionChips } from '../ui/SuggestionChips';

interface IdentitySectionProps {
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
}

export const VariableDrawerIdentitySection: React.FC<IdentitySectionProps> = ({
  isEdit,
  idRef,
  setIdRef,
  status,
  setStatus,
  type,
  setType,
  sector,
  setSector,
  uniqueSectors,
  etapa,
  setEtapa,
  uniqueEtapas,
  pontoControle,
  setPontoControle,
  uniqueCps,
}) => {
  return (
    <>
      <Section title="Identificação & Classificação">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col md:col-span-2">
            <FieldLabel htmlFor="var-id" tooltipPosition="bottom" tooltip="Identificador único da variável. Ex: EXTRACAO_ART">
              ID — Referência
            </FieldLabel>
            <input
              id="var-id"
              type="text"
              disabled={isEdit}
              value={idRef}
              onChange={(e) => setIdRef(e.target.value)}
              placeholder="Ex: EXTRACAO_ART"
              className="input-field px-3.5 py-2 font-mono font-semibold text-sm disabled:opacity-60"
              required
              autoCapitalize="characters"
              autoComplete="off"
            />
          </div>
          <div className="flex flex-col col-span-1">
            <FieldLabel htmlFor="var-status" tooltipPosition="bottom" tooltip="Status atual da variável">
              Status
            </FieldLabel>
            <select
              id="var-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as 'ativa' | 'pendente' | 'inválida' | 'inativa')}
              className="input-field px-3 py-2 text-sm"
            >
              <option value="ativa">✅ Ativa</option>
              <option value="pendente">🕐 Pendente</option>
              <option value="inválida">❌ Inválida</option>
              <option value="inativa">⏸ Inativa</option>
            </select>
          </div>
        </div>
        <div className="flex flex-col pt-1">
          <FieldLabel tooltipPosition="bottom" tooltip="Forma de obtenção da variável">
            Tipo de Variável
          </FieldLabel>
          <SegmentedControl value={type} onChange={setType} />
        </div>
      </Section>

      <Section title="Localização no Processo Industrial">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col">
            <FieldLabel htmlFor="var-sector" tooltip="Setor industrial">Setor</FieldLabel>
            <input
              id="var-sector"
              type="text"
              list="sectors-list"
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              placeholder="Ex: EXTRAÇÃO"
              className="input-field px-3.5 py-2 text-sm font-medium"
              required
            />
            <datalist id="sectors-list">
              {uniqueSectors.map((s) => <option key={s} value={s} />)}
            </datalist>
            <SuggestionChips suggestions={uniqueSectors} onSelect={setSector} current={sector} />
          </div>
          <div className="flex flex-col">
            <FieldLabel htmlFor="var-etapa" tooltip="Módulo ou etapa específica">Etapa / Módulo</FieldLabel>
            <input
              id="var-etapa"
              type="text"
              list="etapas-list"
              value={etapa}
              onChange={(e) => setEtapa(e.target.value)}
              placeholder="Ex: MOENDA 1"
              className="input-field px-3.5 py-2 text-sm font-medium"
              required
            />
            <datalist id="etapas-list">
              {uniqueEtapas.map((e) => <option key={e} value={e} />)}
            </datalist>
            <SuggestionChips suggestions={uniqueEtapas.slice(0, 5)} onSelect={setEtapa} current={etapa} />
          </div>
          <div className="flex flex-col">
            <FieldLabel htmlFor="var-cp" tooltip="Ponto de controle operacional">Ponto de Controle</FieldLabel>
            <input
              id="var-cp"
              type="text"
              list="cps-list"
              value={pontoControle}
              onChange={(e) => setPontoControle(e.target.value)}
              placeholder="Ex: TURBINAS"
              className="input-field px-3.5 py-2 text-sm font-medium"
              required
            />
            <datalist id="cps-list">
              {uniqueCps.map((c) => <option key={c} value={c} />)}
            </datalist>
            <SuggestionChips suggestions={uniqueCps.slice(0, 5)} onSelect={setPontoControle} current={pontoControle} />
          </div>
        </div>
      </Section>
    </>
  );
};
