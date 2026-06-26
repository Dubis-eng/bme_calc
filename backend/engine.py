import re
import ast
import networkx as nx
from decimal import Decimal, getcontext
from iapws import IAPWS97
from evaluator import FormulaEvaluator, ok_res, err_res, to_decimal

# Set precision to 28 digits (default)
getcontext().prec = 28

def parse_number(val):
    if isinstance(val, Decimal): return val
    if isinstance(val, (int, float)): return Decimal(str(val))
    if isinstance(val, str):
        try: return Decimal(val.replace(',', '.'))
        except: pass
    return Decimal('0')

def expand_ranges(eq_str):
    def replacer(match):
        prefix = match.group(1)
        start = int(match.group(2))
        end = int(match.group(3))
        if start <= end:
            expanded = [f"{prefix}{i}" for i in range(start, end + 1)]
            return ", ".join(expanded)
        return match.group(0)
    return re.sub(r'\b([A-Z])(\d+):\1(\d+)\b', replacer, eq_str)

def normalize_formula(eq_str):
    if not isinstance(eq_str, str) or not eq_str.startswith('='): return eq_str
    eq = eq_str[1:]
    eq = re.sub(r'Vapor!\$?[A-Z]+\$?\d+:\$?[A-Z]+\$?\d+', '"Vapor"', eq, flags=re.IGNORECASE)
    eq = re.sub(r'[a-zA-Z0-9_]+!', '', eq).replace('$', '')
    eq = re.sub(r'@([A-Z])(\d+):[A-Z]\d+', r'\1\2', eq).replace('@', '').replace('<>', '!=')
    
    # Handle '=' replacement to '==' safely (avoid changing >=, <=, !=)
    eq = eq.replace('<=', '__LTE__').replace('>=', '__GTE__').replace('!=', '__NE__')
    eq = eq.replace('==', '=').replace('=', '==')
    eq = eq.replace('__LTE__', '<=').replace('__GTE__', '>=').replace('__NE__', '!=')
    
    eq = re.sub(r'(\d),(\d)', r'\1.\2', eq)
    if 'J' in eq:
        eq = re.sub(r'\bD(\d+)\b', r'J\1', eq)
    else:
        eq = re.sub(r'\bD(\d+)\b', r'H\1', eq)
    eq = expand_ranges(eq)
    eq = re.sub(r'\bFALSO\b', 'False', eq, flags=re.IGNORECASE)
    eq = re.sub(r'\bVERDADEIRO\b', 'True', eq, flags=re.IGNORECASE).replace(';', ',').replace('^', '**')
    return eq

# FormulaEvaluator, ok_res, err_res, and to_decimal are imported from evaluator.py

def parse_equation(eq_str, state, ref=None):
    if ref in {'H273', 'J270'}:
        try:
            inpm_ref = 'H272' if ref == 'H273' else 'J269'
            inpm_res = state.get(inpm_ref, ok_res(Decimal('0')))
            if isinstance(inpm_res, dict) and "status" in inpm_res:
                if inpm_res["status"] != "OK": return inpm_res
                I = to_decimal(inpm_res["value"])
            else:
                I = to_decimal(inpm_res)
            if I > 100 or I < 0: return err_res("MATH_ERROR", "Teor alcoólico fora de 0-100")
            return ok_res(Decimal('0.99823') - Decimal('0.001625') * I - Decimal('0.0000045') * (I ** 2))
        except Exception as e:
            return err_res("MATH_ERROR", str(e))
        
    if not isinstance(eq_str, str) or not eq_str.startswith('='):
        try: return ok_res(parse_number(eq_str))
        except Exception as e: return err_res("INVALID_VALUE", str(e))
        
    normalized = normalize_formula(eq_str)
    try:
        parsed_ast = ast.parse(normalized, mode='eval')
        evaluator = FormulaEvaluator(state)
        return evaluator.evaluate(parsed_ast)
    except ZeroDivisionError:
        return err_res("DIV_BY_ZERO", "Divisão por zero.")
    except Exception as e:
        return err_res("SYNTAX_ERROR", f"Erro na fórmula: {str(e)}")

def extract_dependencies(eq_str: str) -> set:
    try:
        parsed_ast = ast.parse(eq_str, mode='eval')
        deps = set()
        for node in ast.walk(parsed_ast):
            if isinstance(node, ast.Name):
                name = node.id
                if name not in {
                    'True', 'False', 'SE', 'SEERRO', 'SOMA', 'PROCV', 'LN', 'SUBTOTAL', 'SOMASES', 'Vapor',
                    'VAPOR_H', 'VAPOR_S', 'VAPOR_H_SAT', 'VAPOR_H_LIQ', 'VAPOR_H_PS', 'VAPOR_T_SAT', 'VAPOR_LATENT'
                }:
                    deps.add(name)
        return deps
    except Exception:
        return set(re.findall(r'[a-zA-Z_][a-zA-Z0-9_]*', eq_str))

def calculate_state(variables_list):
    state = {}
    graph = nx.DiGraph()
    formulas = {}
    
    for item in variables_list:
        ref = item['ID - REF']
        val = item['EQUAÇÕES E VALORES']
        tipo = item.get('TIPO', 'INPUT')
        
        if tipo in {'INPUT', 'CENARIO'} and not (isinstance(val, str) and val.startswith('=')):
            try: state[ref] = ok_res(parse_number(val))
            except Exception as e: state[ref] = err_res("INVALID_VALUE", str(e))
        else:
            state[ref] = err_res("PENDING", "Aguardando cálculo.")
            
        graph.add_node(ref)
        if isinstance(val, str) and val.startswith('='):
            formulas[ref] = val
            normalized_val = normalize_formula(val)
            deps = extract_dependencies(normalized_val)
            for dep in deps:
                graph.add_edge(dep, ref)
        elif ref in {'H273', 'J270'}:
            inpm_ref = 'H272' if ref == 'H273' else 'J269'
            formulas[ref] = f'={inpm_ref}'
            graph.add_edge(inpm_ref, ref)
                
    try:
        order = list(nx.topological_sort(graph))
        has_cycle = False
    except nx.NetworkXUnfeasible:
        order = list(graph.nodes)
        has_cycle = True
        
    convergence_error = False
    iterations = 0
    
    if has_cycle:
        for i in range(100):
            iterations = i + 1
            old_state = state.copy()
            for ref in order:
                if ref in formulas:
                    state[ref] = parse_equation(formulas[ref], state, ref=ref)
                    
            max_delta = Decimal('0')
            for k in state:
                if state[k]["status"] == "OK" and old_state[k]["status"] == "OK":
                    try:
                        old_val = to_decimal(old_state[k]["value"])
                        new_val = to_decimal(state[k]["value"])
                        delta = abs(new_val - old_val)
                        if delta > max_delta: max_delta = delta
                    except: pass
            if max_delta < Decimal('0.0001'): break
        else:
            convergence_error = True
    else:
        for ref in order:
            if ref in formulas:
                state[ref] = parse_equation(formulas[ref], state, ref=ref)
        iterations = 1
        
    rounded_results = {}
    for k, v in state.items():
        if v["status"] == "OK":
            val = v["value"]
            if isinstance(val, bool):
                rounded_results[k] = {"value": val, "status": "OK", "error_message": ""}
            else:
                try: rounded_results[k] = {"value": float(round(to_decimal(val), 4)), "status": "OK", "error_message": ""}
                except Exception as e: rounded_results[k] = {"value": None, "status": "INVALID_VALUE", "error_message": str(e)}
        else:
            rounded_results[k] = {"value": None, "status": v["status"], "error_message": v.get("error_message", "")}
            
    return {
        "results": rounded_results,
        "convergence_error": convergence_error,
        "iterations": iterations
    }

