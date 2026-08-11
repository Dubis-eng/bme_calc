import React from 'react';
import { Section, FieldLabel } from './VariableDrawerControls';

interface FormatSectionProps {
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

export const VariableDrawerFormatSection: React.FC<FormatSectionProps> = ({
  description,
  setDescription,
  unit,
  setUnit,
  casasDecimais,
  setCasasDecimais,
  tipoExibicao,
  setTipoExibicao,
  percentBase,
  setPercentBase,
}) => {
  return (
    <Section title="Descrição & Formatação">
      <div className="space-y-3">
        <div className="flex flex-col">
          <FieldLabel htmlFor="var-desc" tooltip="Descrição legível da variável">
            Descrição
          </FieldLabel>
          <input
            id="var-desc"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex: Rotação no primeiro terno de moenda"
            className="input-field px-3.5 py-2 text-sm"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex flex-col">
            <FieldLabel htmlFor="var-unit" tooltip="Unidade de medida">Unidade</FieldLabel>
            <input
              id="var-unit"
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="Ex: t/h, °C"
              className="input-field px-3 py-2 text-sm"
              required
            />
          </div>

          <div className="flex flex-col">
            <FieldLabel htmlFor="var-decimals" tooltip="Casas decimais exibidas">Casas Decimais</FieldLabel>
            <input
              id="var-decimals"
              type="number"
              min="0"
              max="6"
              value={casasDecimais}
              onChange={(e) => setCasasDecimais(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="Padrão (2)"
              className="input-field px-3 py-2 text-sm"
            />
          </div>

          <div className="flex flex-col">
            <FieldLabel htmlFor="var-display-type" tooltip="Formato numérico">Formato</FieldLabel>
            <select
              id="var-display-type"
              value={tipoExibicao}
              onChange={(e) => setTipoExibicao(e.target.value as 'NUMBER' | 'PERCENTAGE')}
              className="input-field px-3 py-2 text-sm"
            >
              <option value="NUMBER">Número</option>
              <option value="PERCENTAGE">Percentual (%)</option>
            </select>
          </div>

          <div className="flex flex-col">
            <FieldLabel htmlFor="var-percent-base" tooltip="Base percentual">Base Percentual</FieldLabel>
            <select
              id="var-percent-base"
              disabled={tipoExibicao !== 'PERCENTAGE'}
              value={percentBase}
              onChange={(e) => setPercentBase(e.target.value as 'DECIMAL' | 'INTEGER')}
              className="input-field px-3 py-2 text-sm disabled:opacity-50"
            >
              <option value="DECIMAL">0.10 = 10%</option>
              <option value="INTEGER">10 = 10%</option>
            </select>
          </div>
        </div>
      </div>
    </Section>
  );
};
