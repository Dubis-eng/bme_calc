import re
import ast
import networkx as nx
from decimal import Decimal, getcontext
from iapws import IAPWS97

# Set precision to 28 digits (default)
getcontext().prec = 28

def parse_number(val):
    if isinstance(val, Decimal): return val
    if isinstance(val, (int, float)): return Decimal(str(val))
    if isinstance(val, str):
        try: return Decimal(val.replace(',', '.'))
        except: pass
    return Decimal('0')

def to_decimal(val):
    if isinstance(val, Decimal): return val
    if isinstance(val, (int, float)): return Decimal(str(val))
    if isinstance(val, str) and val.strip():
        try: return Decimal(val.strip().replace(',', '.'))
        except: raise ValueError(f"Erro ao converter '{val}' para Decimal")
    raise ValueError(f"Valor numérico inválido: {val}")

def expand_ranges(eq_str):
    def replacer(match):
        start = int(match.group(1))
        end = int(match.group(2))
        if start <= end:
            expanded = [f"H{i}" for i in range(start, end + 1)]
            return ", ".join(expanded)
        return match.group(0)
    return re.sub(r'H(\d+):H(\d+)', replacer, eq_str)

def normalize_formula(eq_str):
    if not isinstance(eq_str, str) or not eq_str.startswith('='): return eq_str
    eq = eq_str[1:]
    eq = re.sub(r'Vapor!\$?[A-Z]+\$?\d+:\$?[A-Z]+\$?\d+', '"Vapor"', eq, flags=re.IGNORECASE)
    eq = re.sub(r'[a-zA-Z0-9_]+!', '', eq).replace('$', '')
    eq = re.sub(r'@H(\d+):[A-Z]\d+', r'H\1', eq).replace('@', '').replace('<>', '!=')
    
    # Handle '=' replacement to '==' safely (avoid changing >=, <=, !=)
    eq = eq.replace('<=', '__LTE__').replace('>=', '__GTE__').replace('!=', '__NE__')
    eq = eq.replace('==', '=').replace('=', '==')
    eq = eq.replace('__LTE__', '<=').replace('__GTE__', '>=').replace('__NE__', '!=')
    
    eq = re.sub(r'(\d),(\d)', r'\1.\2', eq)
    eq = re.sub(r'\bD(\d+)\b', r'H\1', eq)
    eq = expand_ranges(eq)
    eq = re.sub(r'\bFALSO\b', 'False', eq, flags=re.IGNORECASE)
    eq = re.sub(r'\bVERDADEIRO\b', 'True', eq, flags=re.IGNORECASE).replace(';', ',').replace('^', '**')
    return eq

class FormulaEvaluator:
    def __init__(self, state):
        self.state = state

    def evaluate(self, node):
        if isinstance(node, ast.Expression):
            return self.evaluate(node.body)
        
        elif isinstance(node, ast.Constant):
            val = node.value
            if isinstance(val, (int, float)):
                return Decimal(str(val))
            return val
            
        elif isinstance(node, ast.Name):
            if node.id == 'True': return True
            if node.id == 'False': return False
            return self.state.get(node.id, Decimal('0'))
                
        elif isinstance(node, ast.UnaryOp):
            operand = self.evaluate(node.operand)
            if isinstance(node.op, ast.USub): return -to_decimal(operand)
            if isinstance(node.op, ast.UAdd): return +to_decimal(operand)
            raise NotImplementedError(f"Operador unário não suportado: {type(node.op)}")
            
        elif isinstance(node, ast.BinOp):
            left_dec, right_dec = to_decimal(self.evaluate(node.left)), to_decimal(self.evaluate(node.right))
            if isinstance(node.op, ast.Add): return left_dec + right_dec
            if isinstance(node.op, ast.Sub): return left_dec - right_dec
            if isinstance(node.op, ast.Mult): return left_dec * right_dec
            if isinstance(node.op, ast.Div):
                if right_dec == 0: raise ZeroDivisionError("Divisão por zero")
                return left_dec / right_dec
            if isinstance(node.op, ast.Pow): return left_dec ** right_dec
            raise NotImplementedError(f"Operador binário: {type(node.op)}")
            
        elif isinstance(node, ast.Compare):
            left, op, right = self.evaluate(node.left), node.ops[0], self.evaluate(node.comparators[0])
            try: l, r = to_decimal(left), to_decimal(right)
            except: l, r = left, right
            if isinstance(op, ast.Eq): return l == r
            if isinstance(op, ast.NotEq): return l != r
            if isinstance(op, ast.Lt): return l < r
            if isinstance(op, ast.LtE): return l <= r
            if isinstance(op, ast.Gt): return l > r
            if isinstance(op, ast.GtE): return l >= r
            raise NotImplementedError(f"Comparador não suportado: {type(op)}")
            
        elif isinstance(node, ast.Call):
            func_name = node.func.id
            
            if func_name == 'SE':
                if len(node.args) != 3: raise ValueError("SE requer 3 argumentos")
                return self.evaluate(node.args[1]) if self.evaluate(node.args[0]) else self.evaluate(node.args[2])
                    
            elif func_name == 'SEERRO':
                if len(node.args) != 2: raise ValueError("SEERRO requer 2 argumentos")
                try:
                    return self.evaluate(node.args[0])
                except Exception:
                    return self.evaluate(node.args[1])
                    
            elif func_name == 'SOMA':
                total = Decimal('0')
                for arg_node in node.args:
                    val = self.evaluate(arg_node)
                    if val != "" and val is not None: total += to_decimal(val)
                return total
                
            elif func_name == 'PROCV':
                if len(node.args) < 3 or len(node.args) > 4: raise ValueError("PROCV requer 3 ou 4 argumentos")
                lookup_value = self.evaluate(node.args[0])
                table_name = self.evaluate(node.args[1])
                col_index = self.evaluate(node.args[2])
                if table_name != "Vapor": raise ValueError(f"Tabela desconhecida no PROCV: {table_name}")
                P_gauge = to_decimal(lookup_value)
                P_abs_MPa = (P_gauge + Decimal('1.01325')) * Decimal('0.1')
                state_vapor = IAPWS97(P=float(P_abs_MPa), x=1)
                state_liquid = IAPWS97(P=float(P_abs_MPa), x=0)
                if int(col_index) == 2:
                    return Decimal(str(state_vapor.T)) - Decimal('273.15')
                elif int(col_index) == 6:
                    return (Decimal(str(state_vapor.h)) - Decimal(str(state_liquid.h))) / Decimal('4.18')
                raise ValueError(f"Coluna {col_index} não suportada na tabela Vapor")
                
            elif func_name == 'LN':
                if len(node.args) != 1: raise ValueError("LN requer 1 argumento")
                return to_decimal(self.evaluate(node.args[0])).ln()
                
            elif func_name == 'SUBTOTAL':
                if len(node.args) < 2: raise ValueError("SUBTOTAL requer pelo menos 2 argumentos")
                func_num = self.evaluate(node.args[0])
                if int(func_num) == 9:
                    total = Decimal('0')
                    for arg_node in node.args[1:]:
                        val = self.evaluate(arg_node)
                        if val != "" and val is not None: total += to_decimal(val)
                    return total
                raise NotImplementedError(f"SUBTOTAL code {func_num} não suportado")
                
            elif func_name == 'SOMASES':
                num_args = len(node.args)
                if num_args < 3 or (num_args - 1) % 2 != 0: raise ValueError("Assinatura inválida para SOMASES")
                range_size = (num_args - 1) // 2
                sum_nodes = node.args[:range_size]
                criteria_nodes = node.args[range_size : 2*range_size]
                criterion = self.evaluate(node.args[-1])
                total = Decimal('0')
                for s_node, c_node in zip(sum_nodes, criteria_nodes):
                    if str(self.evaluate(c_node)) == str(criterion):
                        val = self.evaluate(s_node)
                        if val != "" and val is not None: total += to_decimal(val)
                return total
                
            raise NotImplementedError(f"Função não suportada: {func_name}")
            
        raise NotImplementedError(f"Tipo de nó AST não suportado: {type(node)}")

def parse_equation(eq_str, state, ref=None):
    if ref == 'H273':
        # Densidade do vinho (OIML water-ethanol density at 20C) based on INPM (H272)
        I = to_decimal(state.get('H272', 0))
        if I > 100 or I < 0: return Decimal('0')
        return Decimal('0.99823') - Decimal('0.001625') * I - Decimal('0.0000045') * (I ** 2)
        
    if not isinstance(eq_str, str) or not eq_str.startswith('='):
        return parse_number(eq_str)
        
    normalized = normalize_formula(eq_str)
    try:
        parsed_ast = ast.parse(normalized, mode='eval')
        evaluator = FormulaEvaluator(state)
        res = evaluator.evaluate(parsed_ast)
        return res
    except Exception:
        return Decimal('0')

def extract_dependencies(eq_str: str) -> set:
    try:
        parsed_ast = ast.parse(eq_str, mode='eval')
        deps = set()
        for node in ast.walk(parsed_ast):
            if isinstance(node, ast.Name):
                name = node.id
                if name not in {'True', 'False', 'SE', 'SEERRO', 'SOMA', 'PROCV', 'LN', 'SUBTOTAL', 'SOMASES', 'Vapor'}:
                    deps.add(name)
        return deps
    except Exception:
        return set(re.findall(r'H\d+', eq_str))

def calculate_state(variables_list):
    state = {}
    graph = nx.DiGraph()
    formulas = {}
    
    for item in variables_list:
        ref = item['ID - REF']
        val = item['EQUAÇÕES E VALORES']
        state[ref] = parse_number(val) if item['TIPO'] == 'INPUT' else Decimal('0')
        graph.add_node(ref)
        if item['TIPO'] != 'INPUT' and isinstance(val, str) and val.startswith('='):
            formulas[ref] = val
            normalized_val = normalize_formula(val)
            deps = extract_dependencies(normalized_val)
            for dep in deps:
                graph.add_edge(dep, ref)
                
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
                try:
                    old_val = to_decimal(old_state[k])
                    new_val = to_decimal(state[k])
                    delta = abs(new_val - old_val)
                    if delta > max_delta:
                        max_delta = delta
                except:
                    pass
            if max_delta < Decimal('0.0001'):
                break
        else:
            convergence_error = True
    else:
        for ref in order:
            if ref in formulas:
                state[ref] = parse_equation(formulas[ref], state, ref=ref)
        iterations = 1
        
    rounded_results = {}
    for k, v in state.items():
        try:
            if isinstance(v, bool):
                rounded_results[k] = v
            elif isinstance(v, str):
                if v == "": rounded_results[k] = ""
                else: rounded_results[k] = float(round(to_decimal(v), 4))
            else:
                rounded_results[k] = float(round(to_decimal(v), 4))
        except:
            rounded_results[k] = 0.0
            
    return {
        "results": rounded_results,
        "convergence_error": convergence_error,
        "iterations": iterations
    }
