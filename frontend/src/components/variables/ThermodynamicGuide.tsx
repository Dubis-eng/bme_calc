import React from 'react';

export const ThermodynamicGuide: React.FC = () => {
  return (
    <div className="mt-1.5 text-[10px] text-slate-500 bg-slate-900/60 p-2.5 rounded border border-slate-800/40 leading-relaxed">
      <span className="font-semibold text-teal-600 block mb-0.5">Guia de Funções e Termodinâmica (IAPWS-IF97):</span>
      <span>
        Fórmulas: <code>=VAPOR_H(P; T)</code> (entalpia), <code>=VAPOR_S(P; T)</code> (entropia),{' '}
        <code>=VAPOR_H_SAT(P)</code> (entalpia sat. vapor), <code>=VAPOR_H_LIQ(P)</code> (entalpia sat. líquido),{' '}
        <code>=VAPOR_H_PS(P; s)</code> (entalpia teórica por entropia <code>s</code>),{' '}
        <code>=VAPOR_T_SAT(P)</code> (temp. saturação), <code>=VAPOR_LATENT(P)</code> (calor latente).
      </span>
      <span className="block mt-1 font-semibold text-amber-600">
        ⚠️ Importante: Use PRESSÃO ABSOLUTA em bar nas funções VAPOR_*. Ex: J645 (21 bar abs).
      </span>
    </div>
  );
};
