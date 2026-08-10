import React from 'react';
import { Tooltip } from '../ui/Tooltip';

interface IapwsFunction {
  code: string;
  name: string;
  syntax: string;
  unit: string;
  description: string;
  example: string;
  notes?: string;
}

const IAPWS_FUNCTIONS: IapwsFunction[] = [
  {
    code: 'VAPOR_H',
    name: 'Entalpia do Vapor (Superaquecido/Saturado)',
    syntax: '=VAPOR_H(P; T)',
    unit: 'kJ/kg',
    description: 'Calcula a entalpia específica da água ou vapor d’água dadas a pressão absoluta P (bar abs) e a temperatura T (°C).',
    example: '=VAPOR_H(21; 320)',
    notes: 'Ideal para vapor de alta e média pressão vindo das caldeiras ou turbinas.',
  },
  {
    code: 'VAPOR_S',
    name: 'Entropia Específica do Vapor',
    syntax: '=VAPOR_S(P; T)',
    unit: 'kJ/(kg·K)',
    description: 'Calcula a entropia específica do vapor d’água dadas a pressão absoluta P (bar abs) e a temperatura T (°C).',
    example: '=VAPOR_S(67; 480)',
    notes: 'Usado para determinar o estado de entrada de turbinas de contrapressão ou condensação.',
  },
  {
    code: 'VAPOR_H_SAT',
    name: 'Entalpia do Vapor Saturado (hg)',
    syntax: '=VAPOR_H_SAT(P)',
    unit: 'kJ/kg',
    description: 'Calcula a entalpia específica do vapor saturado seco na pressão absoluta P (bar abs).',
    example: '=VAPOR_H_SAT(2.5)',
    notes: 'Utilizado no balanço de trocadores de calor e vapor de escape (VETA).',
  },
  {
    code: 'VAPOR_H_LIQ',
    name: 'Entalpia da Água Líquida Saturada (hf)',
    syntax: '=VAPOR_H_LIQ(P)',
    unit: 'kJ/kg',
    description: 'Calcula a entalpia específica da água em estado de líquido saturado na pressão absoluta P (bar abs).',
    example: '=VAPOR_H_LIQ(21)',
    notes: 'Aplicado ao condensado retornado e água de alimentação de caldeira.',
  },
  {
    code: 'VAPOR_H_PS',
    name: 'Entalpia Isentrópica Teórica',
    syntax: '=VAPOR_H_PS(P; s)',
    unit: 'kJ/kg',
    description: 'Calcula a entalpia teórica ao final de uma expansão isentrópica perfeita dada a pressão final P (bar abs) e a entropia constante s.',
    example: '=VAPOR_H_PS(2.5; VAPOR_S(21; 320))',
    notes: 'Fundamental para calcular o rendimento isentrópico de turbogeradores.',
  },
  {
    code: 'VAPOR_T_SAT',
    name: 'Temperatura de Saturação (Tsat)',
    syntax: '=VAPOR_T_SAT(P)',
    unit: '°C',
    description: 'Calcula a temperatura exata de mudança de fase água/vapor na pressão absoluta P (bar abs).',
    example: '=VAPOR_T_SAT(2.5)',
    notes: 'Retorna a temperatura de vaporização (ex: ~127.4 °C para 2.5 bar abs).',
  },
  {
    code: 'VAPOR_LATENT',
    name: 'Calor Latente de Vaporização (hfg)',
    syntax: '=VAPOR_LATENT(P)',
    unit: 'kJ/kg',
    description: 'Calcula o calor latente de vaporização (hfg = hg - hf) na pressão absoluta P (bar abs).',
    example: '=VAPOR_LATENT(2.5)',
    notes: 'Determina a energia útil liberada em evaporadores e aquecedores de caldo.',
  },
];

export const ThermodynamicGuide: React.FC = () => {
  return (
    <div className="mt-3.5 p-4 bg-slate-50 border border-slate-300 rounded-2xl leading-relaxed shadow-sm">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-base">🌡️</span>
          <span className="text-xs font-extrabold text-black uppercase tracking-wide">
            Biblioteca Termodinâmica IAPWS-IF97
          </span>
        </div>
        <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-900 border border-teal-300">
          P = Bar Absoluto
        </span>
      </div>

      <p className="text-xs font-bold text-black mb-3">
        Passe o mouse sobre cada função para ver sua sintaxe, unidade e exemplo de uso no balanço de massa e energia:
      </p>

      {/* Grid de badges interativos com Tooltip */}
      <div className="flex flex-wrap gap-2">
        {IAPWS_FUNCTIONS.map((fn) => (
          <Tooltip
            key={fn.code}
            position="top"
            widthClass="w-80"
            content={
              <div className="space-y-2 text-left">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <span className="font-bold text-teal-800 text-xs font-mono">{fn.syntax}</span>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-950 font-mono border border-amber-300 font-bold">
                    {fn.unit}
                  </span>
                </div>
                <p className="text-xs font-extrabold text-black">{fn.name}</p>
                <p className="text-xs font-bold text-black leading-normal">{fn.description}</p>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-300 text-xs font-mono font-bold text-teal-800 shadow-sm">
                  <span className="text-slate-500 block text-[10px] font-bold">Exemplo de fórmula:</span>
                  {fn.example}
                </div>
                {fn.notes && (
                  <p className="text-xs text-amber-900 font-bold italic leading-snug">
                    💡 {fn.notes}
                  </p>
                )}
              </div>
            }
          >
            <button
              type="button"
              className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-white text-black border border-slate-300 hover:border-teal-600 hover:text-teal-900 hover:bg-teal-50 shadow-sm transition-all duration-150 cursor-pointer flex items-center gap-1.5"
            >
              <span className="text-teal-700 font-extrabold">=</span>
              <span>{fn.code}</span>
            </button>
          </Tooltip>
        ))}
      </div>

      <div className="mt-3 pt-2.5 border-t border-slate-300 flex items-center gap-1.5 text-xs text-amber-900 font-bold">
        <span>⚠️</span>
        <span>
          Aviso: Todas as pressões informadas nas funções IAPWS devem estar obrigatoriamente em <strong>bar absoluto</strong> (bar abs). Ex: 21 bar abs.
        </span>
      </div>
    </div>
  );
};
