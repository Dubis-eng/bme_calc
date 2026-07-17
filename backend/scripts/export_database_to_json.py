import os
import sys
import json
import uuid
from typing import List, Dict, Any, Optional
from sqlmodel import Session, select

# Adjust path to find src packages
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.db.database import engine, Scenario, Variable, Equation, Result

def get_target_scenario(session: Session) -> Optional[Scenario]:
    # Tenta obter o cenário base de seeding
    scenario = session.exec(select(Scenario).where(Scenario.nome == "Cenário Base (Inicial)")).first()
    if not scenario:
        # Se não houver, pega o mais antigo
        scenario = session.exec(select(Scenario).order_by(Scenario.created_at)).first()
    return scenario

def get_results_map(session: Session, scenario_id: Optional[uuid.UUID]) -> Dict[str, float]:
    if not scenario_id:
        return {}
    results = session.exec(select(Result).where(Result.scenario_id == scenario_id)).all()
    return {res.variable_id: res.value for res in results if res.value is not None}

def format_value(value: Optional[float]) -> str:
    if value is None:
        return ""
    if value.is_integer():
        return str(int(value))
    return str(value)

def get_equations_map(session: Session) -> Dict[str, str]:
    equations = session.exec(select(Equation).where(Equation.status == "ativa")).all()
    return {eq.variable_id: eq.expression_original for eq in equations}

def map_variable_to_dict(var: Variable, eq_map: Dict[str, str], res_map: Dict[str, float]) -> Dict[str, Any]:
    var_id = var.id
    eq_val = eq_map.get(var_id, "")
    if not eq_val:
        eq_val = format_value(res_map.get(var_id))
    
    tipo_str = var.tipo.value if hasattr(var.tipo, 'value') else str(var.tipo)
    
    return {
        "ID - REF": var_id,
        "SETOR": var.setor_id,
        "ETAPA": var.etapa,
        "PONTO DE CONTROLE": var.ponto_controle,
        "DESCRIÇÃO": var.nome,
        "TIPO": tipo_str,
        "UNIDADE DE MEDIDA": var.unidade,
        "EQUAÇÕES E VALORES": eq_val,
        "STATUS": var.status.value if hasattr(var.status, 'value') else str(var.status),
        "IN_HARVEST_PLAN": var.in_harvest_plan,
        "HARVEST_PLAN_OP": var.harvest_plan_op,
        "HARVEST_PLAN_WEIGHT_VAR_ID": var.harvest_plan_weight_var_id
    }

def save_json_to_targets(json_data: list):
    scripts_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(os.path.dirname(scripts_dir))
    targets = [
        os.path.join(project_root, "backend", "memorial_de_calculo_balanco.json"),
        os.path.join(project_root, "docs", "memorial_de_calculo_balanco.json"),
        os.path.join(project_root, "frontend", "public", "memorial_de_calculo_balanco.json")
    ]
    
    for target in targets:
        try:
            os.makedirs(os.path.dirname(target), exist_ok=True)
            with open(target, "w", encoding="utf-8") as f:
                json.dump(json_data, f, ensure_ascii=False, indent=4)
            print(f"Exportado com sucesso para: {target}")
        except Exception as e:
            print(f"Erro ao salvar arquivo em {target}: {e}")

def export_data():
    with Session(engine) as session:
        scenario = get_target_scenario(session)
        scenario_id = scenario.id if scenario else None
        if scenario:
            print(f"Usando o cenário '{scenario.nome}' ({scenario_id}) como referência de valores de input.")
        else:
            print("Nenhum cenário encontrado no banco. Valores de input exportados como vazio.")
            
        res_map = get_results_map(session, scenario_id)
        eq_map = get_equations_map(session)
        
        variables = session.exec(select(Variable).order_by(Variable.id)).all()
        json_data = [map_variable_to_dict(var, eq_map, res_map) for var in variables]
        
    save_json_to_targets(json_data)

if __name__ == "__main__":
    export_data()
