import React from 'react';

type VariableType = 'INPUT' | 'OUTPUT' | 'DERIVADA' | 'CENARIO';

interface SegmentedControlProps {
  value: VariableType;
  onChange: (value: VariableType) => void;
}

const OPTIONS: {
  value: VariableType;
  label: string;
  description: string;
  activeClasses: string;
  dotColor: string;
}[] = [
  {
    value: 'INPUT',
    label: 'Entrada',
    description: 'Valor inserido manualmente pelo operador',
    activeClasses: 'bg-amber-50 text-amber-700 border-amber-300 shadow-sm',
    dotColor: 'bg-amber-400',
  },
  {
    value: 'OUTPUT',
    label: 'Fórmula',
    description: 'Calculado automaticamente por uma equação',
    activeClasses: 'bg-teal-50 text-teal-700 border-teal-300 shadow-sm',
    dotColor: 'bg-teal-400',
  },
  {
    value: 'DERIVADA',
    label: 'Derivada',
    description: 'Resultado derivado de outras variáveis',
    activeClasses: 'bg-cyan-50 text-cyan-700 border-cyan-300 shadow-sm',
    dotColor: 'bg-cyan-400',
  },
  {
    value: 'CENARIO',
    label: 'Cenário',
    description: 'Premissa global usada em simulações',
    activeClasses: 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-sm',
    dotColor: 'bg-emerald-400',
  },
];

/**
 * Seletor visual de tipo de variável.
 * Cada opção tem cor semântica e tooltip explicativo.
 */
export const SegmentedControl: React.FC<SegmentedControlProps> = ({ value, onChange }) => (
  <div className="grid grid-cols-4 gap-1.5 p-1 bg-gray-100 rounded-xl" role="group" aria-label="Tipo de variável">
    {OPTIONS.map((opt) => {
      const isActive = value === opt.value;
      return (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          title={opt.description}
          aria-pressed={isActive}
          className={`
            relative flex flex-col items-center gap-1 py-2 px-1
            rounded-lg border text-[11px] font-semibold
            transition-all duration-150 cursor-pointer select-none
            ${isActive
              ? opt.activeClasses
              : 'bg-transparent text-gray-500 border-transparent hover:bg-white hover:text-gray-700 hover:border-gray-200'
            }
          `}
        >
          {/* Ponto de cor semântico */}
          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? opt.dotColor : 'bg-gray-300'} transition-colors`} />
          <span className="leading-none">{opt.label}</span>
        </button>
      );
    })}
  </div>
);
