import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Variable } from './types';

function App() {
  const [variables, setVariables] = useState<Variable[]>([]);
  const [results, setResults] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [activeTab, setActiveTab] = useState('MOAGEM');

  useEffect(() => {
    fetch('/epic1.json')
      .then(res => res.json())
      .then(data => {
        setVariables(data);
        setLoading(false);
      });
  }, []);

  const handleChange = (id: string, value: string) => {
    setVariables(prev => prev.map(v =>
      v["ID - REF"] === id ? { ...v, "EQUAÇÕES E VALORES": value } : v
    ));
  };

  const handleCalculate = async () => {
    setCalculating(true);
    try {
      const response = await axios.post('http://localhost:8000/api/calculate', { variables });
      setResults(response.data.results);
    } catch (err) {
      console.error(err);
      alert("Erro ao calcular.");
    } finally {
      setCalculating(false);
    }
  };

  const sectors = useMemo(() => Array.from(new Set(variables.map(v => v.SETOR))), [variables]);

  const groupedByDefinition = useMemo(() => {
    const activeVariables = variables.filter(v => v.SETOR === activeTab);
    return activeVariables.reduce((acc, curr) => {
      const def = curr["DEFINIÇÃO"] || "Outros";
      if (!acc[def]) acc[def] = [];
      acc[def].push(curr);
      return acc;
    }, {} as Record<string, Variable[]>);
  }, [variables, activeTab]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-xl text-gray-500 animate-pulse">Carregando dados...</div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white border-r border-gray-200 shadow-sm flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Cálculo Balanço</h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">Painel de Engenharia</p>
        </div>
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="px-4 mb-2">
            <h2 className="text-xs uppercase tracking-wider font-semibold text-gray-500">Setores</h2>
          </div>
          <ul className="space-y-1 px-2">
            {sectors.map(sector => (
              <li key={sector}>
                <button
                  onClick={() => setActiveTab(sector)}
                  className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === sector
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {sector}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Sticky Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center shadow-sm z-10">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">{activeTab}</h2>
            <p className="text-sm text-gray-500">Ajuste os parâmetros e clique em calcular.</p>
          </div>
          <button
            onClick={handleCalculate}
            disabled={calculating}
            className={`flex items-center justify-center px-6 py-2.5 border border-transparent text-sm font-medium rounded-lg text-white shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              calculating
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 hover:shadow'
            }`}
          >
            {calculating ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Calculando...
              </>
            ) : 'Calcular Cenário'}
          </button>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-6xl mx-auto space-y-8">
            {Object.entries(groupedByDefinition).map(([definition, vars]) => (
              <div key={definition} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800">{definition}</h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-white">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Unidade</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48 text-right">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {vars.map((v) => {
                        const isInput = v.TIPO === 'INPUT';
                        const resValue = results[v["ID - REF"]];

                        let displayVal = '-';
                        if (isInput) {
                          displayVal = String(v["EQUAÇÕES E VALORES"]);
                        } else if (resValue !== undefined) {
                          // Format with 4 decimal places strictly as requested in NFR1
                          displayVal = Number(resValue).toLocaleString('pt-BR', {
                            minimumFractionDigits: 4,
                            maximumFractionDigits: 4
                          });
                        }

                        return (
                          <tr key={v["ID - REF"]} className="hover:bg-gray-50 transition-colors group">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500">
                              {v["ID - REF"]}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-800 font-medium">
                              {v["DESCRIÇÃO"]}
                              {!isInput && (
                                <div className="text-xs text-gray-400 font-mono mt-1 opacity-0 group-hover:opacity-100 transition-opacity" title={String(v["EQUAÇÕES E VALORES"])}>
                                  {v["EQUAÇÕES E VALORES"]}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {v["UNIDADE DE MEDIDA"]}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              {isInput ? (
                                <div className="relative rounded-md shadow-sm">
                                  <input
                                    type="text"
                                    className="block w-full rounded-md border-gray-300 pl-3 pr-4 py-2 text-right text-sm border focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow outline-none text-gray-900 font-medium bg-white hover:border-gray-400"
                                    value={v["EQUAÇÕES E VALORES"]}
                                    onChange={(e) => handleChange(v["ID - REF"], e.target.value)}
                                  />
                                </div>
                              ) : (
                                <div className="inline-flex items-center justify-end w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-md text-sm font-semibold text-gray-700">
                                  {displayVal}
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
