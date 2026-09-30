import React from 'react';

interface VariableModalIdentitySectionProps {
  idRef: string;
  setIdRef: (val: string) => void;
  isEdit: boolean;
  type: 'INPUT' | 'OUTPUT' | 'DERIVADA' | 'CENARIO';
  setType: (val: 'INPUT' | 'OUTPUT' | 'DERIVADA' | 'CENARIO') => void;
  status: 'ativa' | 'pendente' | 'inválida' | 'inativa';
  setStatus: (val: 'ativa' | 'pendente' | 'inválida' | 'inativa') => void;
  sector: string;
  setSector: (val: string) => void;
  etapa: string;
  setEtapa: (val: string) => void;
  pontoControle: string;
  setPontoControle: (val: string) => void;
  description: string;
  setDescription: (val: string) => void;
  uniqueSectors: string[];
  uniqueEtapas: string[];
  uniqueCps: string[];
}

export const VariableModalIdentitySection: React.FC<VariableModalIdentitySectionProps> = ({
  idRef,
  setIdRef,
  isEdit,
  type,
  setType,
  status,
  setStatus,
  sector,
  setSector,
  etapa,
  setEtapa,
  pontoControle,
  setPontoControle,
  description,
  setDescription,
  uniqueSectors,
  uniqueEtapas,
  uniqueCps
}) => {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex flex-col">
          <label htmlFor="var-id" className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">
            ID - Referência
          </label>
          <input
            id="var-id"
            type="text"
            disabled={isEdit}
            value={idRef}
            onChange={(e) => setIdRef(e.target.value)}
            placeholder="Ex: MOENDA_RPM"
            className="input-field p-2 text-xs font-semibold disabled:bg-slate-900 disabled:text-slate-600 disabled:border-slate-800"
            required
          />
        </div>
        <div className="flex flex-col">
          <label htmlFor="var-type" className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">
            Tipo
          </label>
          <select
            id="var-type"
            value={type}
            onChange={(e) => setType(e.target.value as 'INPUT' | 'OUTPUT' | 'DERIVADA' | 'CENARIO')}
            className="input-field p-2 text-xs font-semibold"
          >
            <option value="INPUT">INPUT (Valor Entrada)</option>
            <option value="OUTPUT">OUTPUT (Fórmula)</option>
            <option value="DERIVADA">DERIVADA (Valor Derivado)</option>
            <option value="CENARIO">CENÁRIO (Premissa Global)</option>
          </select>
        </div>
        <div className="flex flex-col">
          <label htmlFor="var-status" className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">
            Status
          </label>
          <select
            id="var-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as 'ativa' | 'pendente' | 'inválida' | 'inativa')}
            className="input-field p-2 text-xs font-semibold"
          >
            <option value="ativa">Ativa</option>
            <option value="pendente">Pendente</option>
            <option value="inválida">Inválida</option>
            <option value="inativa">Inativa</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex flex-col">
          <label htmlFor="var-sector" className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">
            Setor
          </label>
          <input
            id="var-sector"
            type="text"
            list="sectors-list"
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            placeholder="Ex: MOAGEM"
            className="input-field p-2 text-xs font-semibold"
            required
          />
          <datalist id="sectors-list">
            {uniqueSectors.map((s) => <option key={s} value={s} />)}
          </datalist>
        </div>
        <div className="flex flex-col">
          <label htmlFor="var-etapa" className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">
            Etapa (Módulo)
          </label>
          <input
            id="var-etapa"
            type="text"
            list="etapas-list"
            value={etapa}
            onChange={(e) => setEtapa(e.target.value)}
            placeholder="Ex: MOENDA 1"
            className="input-field p-2 text-xs font-semibold"
            required
          />
          <datalist id="etapas-list">
            {uniqueEtapas.map((e) => <option key={e} value={e} />)}
          </datalist>
        </div>
        <div className="flex flex-col">
          <label htmlFor="var-cp" className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">
            Ponto de Controle
          </label>
          <input
            id="var-cp"
            type="text"
            list="cps-list"
            value={pontoControle}
            onChange={(e) => setPontoControle(e.target.value)}
            placeholder="Ex: TURBINAS"
            className="input-field p-2 text-xs font-semibold"
            required
          />
          <datalist id="cps-list">
            {uniqueCps.map((c) => <option key={c} value={c} />)}
          </datalist>
        </div>
      </div>

      <div className="flex flex-col">
        <label htmlFor="var-desc" className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">
          Descrição
        </label>
        <input
          id="var-desc"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ex: Rotação no primeiro terno"
          className="input-field p-2 text-xs font-medium"
          required
        />
      </div>
    </>
  );
};
