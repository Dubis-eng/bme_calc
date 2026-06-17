import React from 'react';

interface HeaderProps {
  searchQuery: string;
  onSearchInput: (val: string) => void;
  iterations: number;
  handleCalculate: () => void;
  calculating: boolean;
  isLocked: boolean;
}

export function Header({
  searchQuery,
  onSearchInput,
  iterations,
  handleCalculate,
  calculating,
  isLocked
}: HeaderProps) {
  return (
    <header className="flex justify-between items-center bg-slate-900 text-white px-6 py-4 shadow-md z-20 border-b border-slate-800">
      <div className="flex items-center space-x-3">
        <div className="h-8 w-8 bg-gradient-to-tr from-teal-500 to-cyan-500 rounded-lg flex items-center justify-center font-bold text-white shadow-sm">
          𝚽
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            Calculadora de Balanço
          </h1>
          <p className="text-xs text-slate-400">Massa &amp; Energia</p>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <div className="relative">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none">🔍</span>
          <input
            id="global-search"
            type="search"
            placeholder="Buscar variável..."
            value={searchQuery}
            onChange={(e) => onSearchInput(e.target.value)}
            onFocus={() => { if (searchQuery.trim()) onSearchInput(searchQuery); }}
            className="pl-8 pr-3 py-1.5 rounded text-xs bg-slate-800 text-slate-200 placeholder-slate-500 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500 w-52 transition-all"
            aria-label="Buscar variável por ID, Descrição ou Definição"
          />
        </div>
        {iterations > 1 && (
          <span className="text-xs text-slate-400">
            Iterações: <span className="font-semibold text-teal-400">{iterations}</span>
          </span>
        )}
        <button
          onClick={handleCalculate}
          disabled={calculating || isLocked}
          className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 disabled:from-slate-700 disabled:to-slate-800 text-white font-bold py-1.5 px-5 rounded text-sm shadow-md transition-all flex items-center space-x-2 border border-teal-500/20"
        >
          {calculating && <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>}
          <span>{calculating ? 'Calculando...' : 'Calcular'}</span>
        </button>
      </div>
    </header>
  );
}
