import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Variable } from './types';

function App() {
  const [variables, setVariables] = useState<Variable[]>([]);
  const [results, setResults] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);

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

  if (loading) return <div className="p-4 flex justify-center mt-10">Carregando dados...</div>;

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Calculadora de Balanço</h1>
          <p className="text-gray-500 mt-1">Épico 1: Moagem</p>
        </div>
        <button
          onClick={handleCalculate}
          disabled={calculating}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-2 px-6 rounded shadow-sm transition-colors"
        >
          {calculating ? 'Calculando...' : 'Calcular'}
        </button>
      </div>

      <div className="overflow-x-auto shadow-sm rounded-lg border border-gray-200">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-50">
            <tr>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unidade</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fórmula</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Calculado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {variables.map((v) => {
              const resValue = results[v["ID - REF"]];
              const displayVal = resValue !== undefined ? resValue : (v.TIPO === 'INPUT' ? v["EQUAÇÕES E VALORES"] : '-');

              return (
                <tr key={v["ID - REF"]} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">{v["ID - REF"]}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{v["DESCRIÇÃO"]}</td>
                  <td className="py-3 px-4 text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${v.TIPO === 'INPUT' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {v.TIPO}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500">{v["UNIDADE DE MEDIDA"]}</td>
                  <td className="py-3 px-4 text-sm text-gray-500 font-mono w-48 truncate max-w-xs" title={v["EQUAÇÕES E VALORES"] as string}>
                    {v.TIPO === 'INPUT' ? '-' : v["EQUAÇÕES E VALORES"]}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {v.TIPO === 'INPUT' ? (
                      <input
                        type="text"
                        className="border border-gray-300 rounded-md px-3 py-1 w-24 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={v["EQUAÇÕES E VALORES"]}
                        onChange={(e) => handleChange(v["ID - REF"], e.target.value)}
                      />
                    ) : (
                      <span className="font-semibold text-gray-900">
                        {resValue !== undefined ? resValue.toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 }) : '-'}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;
