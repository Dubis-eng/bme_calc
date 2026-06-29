import React from 'react';

interface VariableFormattingFieldsProps {
  casasDecimais: number | '';
  setCasasDecimais: (val: number | '') => void;
  tipoExibicao: 'NUMBER' | 'PERCENTAGE';
  setTipoExibicao: (val: 'NUMBER' | 'PERCENTAGE') => void;
  percentBase: 'DECIMAL' | 'INTEGER';
  setPercentBase: (val: 'DECIMAL' | 'INTEGER') => void;
}

export const VariableFormattingFields: React.FC<VariableFormattingFieldsProps> = ({
  casasDecimais,
  setCasasDecimais,
  tipoExibicao,
  setTipoExibicao,
  percentBase,
  setPercentBase,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
      <div className="flex flex-col">
        <label htmlFor="var-decimals" className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">
          Casas Decimais (Exibição)
        </label>
        <input
          id="var-decimals"
          type="number"
          min="0"
          max="6"
          value={casasDecimais}
          onChange={(e) => setCasasDecimais(e.target.value === '' ? '' : Number(e.target.value))}
          placeholder="Automático (2)"
          className="input-field p-2 text-xs font-semibold"
        />
      </div>
      <div className="flex flex-col">
        <label htmlFor="var-display-type" className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">
          Formato de Exibição
        </label>
        <select
          id="var-display-type"
          value={tipoExibicao}
          onChange={(e) => setTipoExibicao(e.target.value as 'NUMBER' | 'PERCENTAGE')}
          className="input-field p-2 text-xs font-semibold"
        >
          <option value="NUMBER">Número</option>
          <option value="PERCENTAGE">Percentual (%)</option>
        </select>
      </div>
      <div className="flex flex-col">
        <label htmlFor="var-percent-base" className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">
          Base de Cálculo {tipoExibicao !== 'PERCENTAGE' && <span className="text-slate-600">(Inativo)</span>}
        </label>
        <select
          id="var-percent-base"
          disabled={tipoExibicao !== 'PERCENTAGE'}
          value={percentBase}
          onChange={(e) => setPercentBase(e.target.value as 'DECIMAL' | 'INTEGER')}
          className="input-field p-2 text-xs font-semibold disabled:bg-slate-900 disabled:text-slate-600 disabled:border-slate-800"
        >
          <option value="DECIMAL">Decimal (ex: 0.10 = 10%)</option>
          <option value="INTEGER">Inteiro (ex: 10 = 10%)</option>
        </select>
      </div>
    </div>
  );
};
