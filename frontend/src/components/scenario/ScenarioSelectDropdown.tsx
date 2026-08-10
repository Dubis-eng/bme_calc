import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { ScenarioMetadata, Variable } from '../../types';
import apiClient from '../../api/client';
import { SCENARIO_STATUS_BADGE } from '../../styles/design-system';
import { toast } from '../ui/Toast';

interface ScenarioSelectDropdownProps {
  currentScenario: ScenarioMetadata | null;
  onLoadScenario: (variables: Variable[], metadata: ScenarioMetadata) => void;
  isOffline?: boolean;
}

export const ScenarioSelectDropdown: React.FC<ScenarioSelectDropdownProps> = ({
  currentScenario,
  onLoadScenario,
  isOffline = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scenarios, setScenarios] = useState<ScenarioMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterText, setFilterText] = useState('');
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);

  const fetchScenarios = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/api/scenarios');
      setScenarios(res.data);
    } catch (err) {
      console.error('Erro ao listar cenários:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateCoords = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY + 6,
        left: Math.max(16, rect.left + window.scrollX),
      });
    }
  };

  const toggleDropdown = () => {
    if (!isOpen) {
      fetchScenarios();
      updateCoords();
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    if (isOpen) {
      updateCoords();
      window.addEventListener('resize', updateCoords);
      window.addEventListener('scroll', updateCoords, true);
    }
    return () => {
      window.removeEventListener('resize', updateCoords);
      window.removeEventListener('scroll', updateCoords, true);
    };
  }, [isOpen]);

  // Click away listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        const portalEl = document.getElementById('scenario-dropdown-portal');
        if (portalEl && !portalEl.contains(e.target as Node)) {
          setIsOpen(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectScenario = async (id: string) => {
    try {
      const res = await apiClient.get(`/api/scenarios/${id}`);
      const sc = res.data;
      const meta: ScenarioMetadata = {
        id: sc.id,
        year_harvest: sc.year_harvest,
        reference_month: sc.reference_month,
        version: sc.version,
        status: sc.status,
        cycle_start_month: sc.cycle_start_month,
      };
      onLoadScenario(sc.variables, meta);
      toast.success(`Cenário v${sc.version} carregado!`);
      setIsOpen(false);
    } catch (err) {
      toast.error('Erro ao carregar o cenário.');
      console.error(err);
    }
  };

  const filteredScenarios = scenarios.filter((s) => {
    const term = filterText.toLowerCase();
    const str = `${s.year_harvest} ${s.reference_month} v${s.version} ${s.status}`.toLowerCase();
    return str.includes(term);
  });

  return (
    <div className="relative inline-block">
      {/* Botão Pílula do Cenário Ativo */}
      <button
        ref={triggerRef}
        type="button"
        onClick={toggleDropdown}
        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border transition-all shadow-sm cursor-pointer ${
          isOpen
            ? 'bg-teal-50 border-teal-500 ring-2 ring-teal-500/20'
            : 'bg-slate-100 hover:bg-slate-200/80 border-slate-300'
        }`}
        title="Clique para alternar entre cenários salvos"
      >
        <span className="text-xs font-bold text-slate-700">Cenário Ativo:</span>
        <span className="text-xs font-extrabold text-black font-mono">
          {currentScenario ? `${currentScenario.year_harvest} v${currentScenario.version}` : 'Padrão'}
        </span>
        {currentScenario && (
          <span className={SCENARIO_STATUS_BADGE[currentScenario.status] ?? 'badge-idle'}>
            {currentScenario.status}
          </span>
        )}
        <span className="text-slate-500 text-xs font-bold ml-1">▾</span>
      </button>

      {/* Menu Dropdown via Portal */}
      {isOpen && coords && ReactDOM.createPortal(
        <div
          id="scenario-dropdown-portal"
          style={{
            position: 'absolute',
            top: `${coords.top}px`,
            left: `${coords.left}px`,
          }}
          className="w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[99999] overflow-hidden animate-fade-in-up flex flex-col max-h-[420px]"
        >
          {/* Header do Dropdown */}
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-extrabold text-black uppercase tracking-wider">
              Cenários Salvos
            </span>
            <span className="text-[10px] text-slate-500 font-mono font-bold">
              {scenarios.length} histórico(s)
            </span>
          </div>

          {/* Filtro de Busca Interno do Dropdown */}
          {scenarios.length > 5 && (
            <div className="p-2 border-b border-slate-100 bg-white">
              <input
                type="text"
                placeholder="Filtrar por safra, mês ou versão..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="w-full px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-black placeholder-slate-400 focus:outline-none focus:border-teal-500"
              />
            </div>
          )}

          {/* Lista de Cenários */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-1">
            {loading ? (
              <div className="p-6 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                <span>Carregando cenários...</span>
              </div>
            ) : filteredScenarios.length > 0 ? (
              filteredScenarios.map((sc) => {
                const isActive = currentScenario?.id === sc.id;
                return (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={() => handleSelectScenario(sc.id)}
                    className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between gap-3 group ${
                      isActive
                        ? 'bg-teal-50/80 border border-teal-200'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${isActive ? 'bg-teal-600' : 'bg-slate-300'}`} />
                      <div className="truncate">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-extrabold text-black font-mono">
                            Safra {sc.year_harvest}/{Number(sc.year_harvest) + 1}
                          </span>
                          <span className="text-xs font-semibold text-slate-600">
                            • {sc.reference_month}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-mono font-bold">
                          Versão v{sc.version}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={SCENARIO_STATUS_BADGE[sc.status] ?? 'badge-idle'}>
                        {sc.status}
                      </span>
                      {isActive && (
                        <span className="text-xs font-extrabold text-teal-700">✓</span>
                      )}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-6 text-center text-xs text-slate-500">
                Nenhum cenário encontrado.
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
