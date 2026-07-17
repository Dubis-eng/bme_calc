import json
import pytest
from decimal import Decimal
import ast
import re
import networkx as nx
from iapws import IAPWS97

# Import current Decimal-based engine functions
from src.core.engine import calculate_state, normalize_formula, parse_number
from src.core.evaluator import FormulaEvaluator, ok_res, err_res, to_decimal

# ──────────────────────────────────────────────────────────────────────────────
# FLOAT-BASED IMPLEMENTATION FOR PARITY TESTING
# ──────────────────────────────────────────────────────────────────────────────

def to_float(val):
    if isinstance(val, (int, float)): return float(val)
    if isinstance(val, Decimal): return float(val)
    if isinstance(val, str) and val.strip():
        try: return float(val.strip().replace(',', '.'))
        except: raise ValueError(f"Erro ao converter '{val}' para float")
    raise ValueError(f"Valor numérico inválido: {val}")

class FloatFormulaEvaluator:
    def __init__(self, state):
        self.state = state

    def evaluate(self, node):
        if isinstance(node, ast.Expression):
            return self.evaluate(node.body)
        
        if isinstance(node, ast.Constant):
            val = node.value
            if isinstance(val, (int, float)):
                return ok_res(float(val))
            return ok_res(val)
            
        if isinstance(node, ast.Name):
            if node.id == 'True': return ok_res(True)
            if node.id == 'False': return ok_res(False)
            if node.id not in self.state:
                return err_res("MISSING_VAR", f"Variável '{node.id}' não cadastrada.")
            var_val = self.state[node.id]
            if isinstance(var_val, dict) and "status" in var_val:
                return var_val
            if isinstance(var_val, str):
                try: return ok_res(float(var_val.replace(',', '.')))
                except: return ok_res(var_val)
            return ok_res(to_float(var_val))
                
        if isinstance(node, ast.UnaryOp):
            operand_res = self.evaluate(node.operand)
            if operand_res["status"] != "OK": return operand_res
            try:
                operand_flt = to_float(operand_res["value"])
                if isinstance(node.op, ast.USub): return ok_res(-operand_flt)
                if isinstance(node.op, ast.UAdd): return ok_res(+operand_flt)
                return err_res("INVALID_OP", f"Operador unário não suportado: {type(node.op)}")
            except Exception as e:
                return err_res("INVALID_VALUE", str(e))
            
        if isinstance(node, ast.BinOp):
            left_res = self.evaluate(node.left)
            if left_res["status"] != "OK": return left_res
            right_res = self.evaluate(node.right)
            if right_res["status"] != "OK": return right_res
            
            try:
                left_flt = to_float(left_res["value"])
                right_flt = to_float(right_res["value"])
                if isinstance(node.op, ast.Add): return ok_res(left_flt + right_flt)
                if isinstance(node.op, ast.Sub): return ok_res(left_flt - right_flt)
                if isinstance(node.op, ast.Mult): return ok_res(left_flt * right_flt)
                if isinstance(node.op, ast.Div):
                    if right_flt == 0.0: return err_res("DIV_BY_ZERO", "Divisão por zero.")
                    return ok_res(left_flt / right_flt)
                if isinstance(node.op, ast.Pow): return ok_res(left_flt ** right_flt)
                return err_res("INVALID_OP", f"Operador binário: {type(node.op)}")
            except Exception as e:
                return err_res("INVALID_VALUE", str(e))
            
        if isinstance(node, ast.Compare):
            left_res = self.evaluate(node.left)
            if left_res["status"] != "OK": return left_res
            right_res = self.evaluate(node.comparators[0])
            if right_res["status"] != "OK": return right_res
            
            left_val, right_val = left_res["value"], right_res["value"]
            op = node.ops[0]
            try: l, r = to_float(left_val), to_float(right_val)
            except: l, r = left_val, right_val
            
            if isinstance(op, ast.Eq): return ok_res(l == r)
            if isinstance(op, ast.NotEq): return ok_res(l != r)
            if isinstance(op, ast.Lt): return ok_res(l < r)
            if isinstance(op, ast.LtE): return ok_res(l <= r)
            if isinstance(op, ast.Gt): return ok_res(l > r)
            if isinstance(op, ast.GtE): return ok_res(l >= r)
            return err_res("INVALID_OP", f"Comparador não suportado: {type(op)}")
            
        if isinstance(node, ast.Call):
            func_name = node.func.id
            
            if func_name == 'SE':
                if len(node.args) != 3: return err_res("INVALID_ARGS", "SE requer 3 argumentos")
                cond_res = self.evaluate(node.args[0])
                if cond_res["status"] != "OK": return cond_res
                return self.evaluate(node.args[1]) if cond_res["value"] else self.evaluate(node.args[2])
                    
            if func_name == 'SEERRO':
                if len(node.args) != 2: return err_res("INVALID_ARGS", "SEERRO requer 2 argumentos")
                first_res = self.evaluate(node.args[0])
                if first_res["status"] == "OK": return first_res
                return self.evaluate(node.args[1])
                    
            if func_name == 'SOMA':
                total = 0.0
                for arg_node in node.args:
                    arg_res = self.evaluate(arg_node)
                    if arg_res["status"] != "OK": return arg_res
                    val = arg_res["value"]
                    if val != "" and val is not None: total += to_float(val)
                return ok_res(total)
                
            if func_name == 'PROCV':
                if len(node.args) < 3 or len(node.args) > 4: return err_res("INVALID_ARGS", "PROCV requer 3 ou 4 argumentos")
                lookup_res = self.evaluate(node.args[0])
                if lookup_res["status"] != "OK": return lookup_res
                table_res = self.evaluate(node.args[1])
                if table_res["status"] != "OK": return table_res
                col_res = self.evaluate(node.args[2])
                if col_res["status"] != "OK": return col_res
                
                table_name = table_res["value"]
                if table_name != "Vapor": return err_res("INVALID_VALUE", f"Tabela desconhecida: {table_name}")
                try:
                    P_gauge = to_float(lookup_res["value"])
                    col_index = int(col_res["value"])
                    P_abs_MPa = (P_gauge + 1.01325) * 0.1
                    state_vapor = IAPWS97(P=P_abs_MPa, x=1)
                    state_liquid = IAPWS97(P=P_abs_MPa, x=0)
                    if col_index == 2:
                        return ok_res(float(state_vapor.T) - 273.15)
                    if col_index == 6:
                        return ok_res((float(state_vapor.h) - float(state_liquid.h)) / 4.18)
                    return err_res("INVALID_VALUE", f"Coluna {col_index} não suportada na tabela Vapor")
                except Exception as e:
                    return err_res("MATH_ERROR", f"Erro no PROCV: {str(e)}")
                
            if func_name in {'VAPOR_H', 'VAPOR_S', 'VAPOR_H_SAT', 'VAPOR_H_LIQ', 'VAPOR_H_PS', 'VAPOR_T_SAT', 'VAPOR_LATENT'}:
                try:
                    if func_name in {'VAPOR_H_SAT', 'VAPOR_H_LIQ', 'VAPOR_T_SAT', 'VAPOR_LATENT'}:
                        if len(node.args) != 1: return err_res("INVALID_ARGS", f"{func_name} requer 1 argumento")
                        P_res = self.evaluate(node.args[0])
                        if P_res["status"] != "OK": return P_res
                        P_abs = to_float(P_res["value"])
                        P_abs_MPa = P_abs * 0.1
                        
                        if func_name == 'VAPOR_H_SAT':
                            return ok_res(float(IAPWS97(P=P_abs_MPa, x=1).h))
                        elif func_name == 'VAPOR_H_LIQ':
                            return ok_res(float(IAPWS97(P=P_abs_MPa, x=0).h))
                        elif func_name == 'VAPOR_T_SAT':
                            return ok_res(float(IAPWS97(P=P_abs_MPa, x=1).T) - 273.15)
                        elif func_name == 'VAPOR_LATENT':
                            state_v = IAPWS97(P=P_abs_MPa, x=1)
                            state_l = IAPWS97(P=P_abs_MPa, x=0)
                            return ok_res(float(state_v.h) - float(state_l.h))
                            
                    elif func_name in {'VAPOR_H', 'VAPOR_S', 'VAPOR_H_PS'}:
                        if len(node.args) != 2: return err_res("INVALID_ARGS", f"{func_name} requer 2 argumentos")
                        P_res = self.evaluate(node.args[0])
                        if P_res["status"] != "OK": return P_res
                        param_res = self.evaluate(node.args[1])
                        if param_res["status"] != "OK": return param_res
                        
                        P_abs = to_float(P_res["value"])
                        P_abs_MPa = P_abs * 0.1
                        val_param = to_float(param_res["value"])
                        
                        if func_name == 'VAPOR_H':
                            T_K = val_param + 273.15
                            return ok_res(float(IAPWS97(P=P_abs_MPa, T=T_K).h))
                        elif func_name == 'VAPOR_S':
                            T_K = val_param + 273.15
                            return ok_res(float(IAPWS97(P=P_abs_MPa, T=T_K).s))
                        elif func_name == 'VAPOR_H_PS':
                            s_val = val_param
                            return ok_res(float(IAPWS97(P=P_abs_MPa, s=s_val).h))
                            
                except Exception as e:
                    return err_res("MATH_ERROR", f"Erro no {func_name}: {str(e)}")
                
            if func_name == 'LN':
                if len(node.args) != 1: return err_res("INVALID_ARGS", "LN requer 1 argumento")
                arg_res = self.evaluate(node.args[0])
                if arg_res["status"] != "OK": return arg_res
                try:
                    import math
                    val_flt = to_float(arg_res["value"])
                    if val_flt <= 0: return err_res("MATH_ERROR", "LN requer valor positivo")
                    return ok_res(math.log(val_flt))
                except Exception as e:
                    return err_res("MATH_ERROR", str(e))
                
            if func_name == 'SUBTOTAL':
                if len(node.args) < 2: return err_res("INVALID_ARGS", "SUBTOTAL requer pelo menos 2 argumentos")
                code_res = self.evaluate(node.args[0])
                if code_res["status"] != "OK": return code_res
                func_num = int(code_res["value"])
                if func_num == 9:
                    total = 0.0
                    for arg_node in node.args[1:]:
                        arg_res = self.evaluate(arg_node)
                        if arg_res["status"] != "OK": return arg_res
                        val = arg_res["value"]
                        if val != "" and val is not None: total += to_float(val)
                    return ok_res(total)
                return err_res("NOT_IMPLEMENTED", f"SUBTOTAL código {func_num} não suportado")
                
            if func_name == 'SOMASES':
                num_args = len(node.args)
                if num_args < 3 or (num_args - 1) % 2 != 0: return err_res("INVALID_ARGS", "Assinatura inválida")
                range_size = (num_args - 1) // 2
                criterion_res = self.evaluate(node.args[-1])
                if criterion_res["status"] != "OK": return criterion_res
                criterion = str(criterion_res["value"])
                total = 0.0
                for i in range(range_size):
                    c_res = self.evaluate(node.args[range_size + i])
                    if c_res["status"] != "OK": return c_res
                    if str(c_res["value"]) == criterion:
                        s_res = self.evaluate(node.args[i])
                        if s_res["status"] != "OK": return s_res
                        val = s_res["value"]
                        if val != "" and val is not None: total += to_float(val)
                return ok_res(total)
                
            return err_res("INVALID_FUNC", f"Função não suportada: {func_name}")
            
        return err_res("INVALID_AST", f"Tipo de nó AST não suportado: {type(node)}")

def parse_equation_float(eq_str, state, ref=None):
    if ref in {'H273', 'J270'}:
        try:
            inpm_ref = 'H272' if ref == 'H273' else 'J269'
            inpm_res = state.get(inpm_ref, ok_res(0.0))
            if isinstance(inpm_res, dict) and "status" in inpm_res:
                if inpm_res["status"] != "OK": return inpm_res
                I = to_float(inpm_res["value"])
            else:
                I = to_float(inpm_res)
            if I > 100 or I < 0: return err_res("MATH_ERROR", "Teor alcoólico fora de 0-100")
            return ok_res(0.99823 - 0.001625 * I - 0.0000045 * (I ** 2))
        except Exception as e:
            return err_res("MATH_ERROR", str(e))
        
    if not isinstance(eq_str, str) or not eq_str.startswith('='):
        try: return ok_res(float(str(eq_str).replace(',', '.')))
        except Exception as e: return err_res("INVALID_VALUE", str(e))
        
    normalized = normalize_formula(eq_str)
    try:
        parsed_ast = ast.parse(normalized, mode='eval')
        evaluator = FloatFormulaEvaluator(state)
        return evaluator.evaluate(parsed_ast)
    except ZeroDivisionError:
        return err_res("DIV_BY_ZERO", "Divisão por zero.")
    except Exception as e:
        return err_res("SYNTAX_ERROR", f"Erro na fórmula: {str(e)}")

def calculate_state_float(variables_list, tolerance=0.0001):
    state = {}
    graph = nx.DiGraph()
    formulas = {}
    
    for item in variables_list:
        ref = item['ID - REF']
        val = item['EQUAÇÕES E VALORES']
        tipo = item.get('TIPO', 'INPUT')
        
        if tipo in {'INPUT', 'CENARIO'} and not (isinstance(val, str) and val.startswith('=')):
            try: state[ref] = ok_res(float(str(val).replace(',', '.')))
            except Exception as e: state[ref] = err_res("INVALID_VALUE", str(e))
        else:
            state[ref] = err_res("PENDING", "Aguardando cálculo.")
            
        graph.add_node(ref)
        if isinstance(val, str) and val.startswith('='):
            formulas[ref] = val
            normalized_val = normalize_formula(val)
            # Find dependencies
            try:
                parsed_ast = ast.parse(normalized_val, mode='eval')
                for node in ast.walk(parsed_ast):
                    if isinstance(node, ast.Name) and node.id not in {
                        'True', 'False', 'SE', 'SEERRO', 'SOMA', 'PROCV', 'LN', 'SUBTOTAL', 'SOMASES', 'Vapor',
                        'VAPOR_H', 'VAPOR_S', 'VAPOR_H_SAT', 'VAPOR_H_LIQ', 'VAPOR_H_PS', 'VAPOR_T_SAT', 'VAPOR_LATENT'
                    }:
                        graph.add_edge(node.id, ref)
            except:
                for dep in re.findall(r'[a-zA-Z_][a-zA-Z0-9_]*', normalized_val):
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
    max_delta = 0.0
    
    if has_cycle:
        for ref in formulas:
            state[ref] = ok_res(0.0)
            
        for i in range(100):
            iterations = i + 1
            old_state = state.copy()
            for ref in order:
                if ref in formulas:
                    state[ref] = parse_equation_float(formulas[ref], state, ref=ref)
                    
            max_delta = 0.0
            for k in state:
                if state[k]["status"] == "OK" and old_state[k]["status"] == "OK":
                    try:
                        old_val = to_float(old_state[k]["value"])
                        new_val = to_float(state[k]["value"])
                        delta = abs(new_val - old_val)
                        if delta > max_delta: max_delta = delta
                    except: pass
            if max_delta < float(tolerance): break
        else:
            convergence_error = True
    else:
        for ref in order:
            if ref in formulas:
                state[ref] = parse_equation_float(formulas[ref], state, ref=ref)
        iterations = 1
        
    rounded_results = {}
    for k, v in state.items():
        if v["status"] == "OK":
            val = v["value"]
            if isinstance(val, bool):
                rounded_results[k] = {"value": val, "status": "OK", "error_message": ""}
            else:
                try: rounded_results[k] = {"value": float(val), "status": "OK", "error_message": ""}
                except Exception as e: rounded_results[k] = {"value": None, "status": "INVALID_VALUE", "error_message": str(e)}
        else:
            rounded_results[k] = {"value": None, "status": v["status"], "error_message": v.get("error_message", "")}
            
    return {
        "results": rounded_results,
        "convergence_error": convergence_error,
        "iterations": iterations,
        "residual": float(max_delta)
    }

# ──────────────────────────────────────────────────────────────────────────────
# PARITY TESTS
# ──────────────────────────────────────────────────────────────────────────────

def test_engine_decimal_parity():
    # 20+ representative variables, formulas and calculation scenarios to verify
    # parity between the Decimal-based engine and the float-based engine.
    variables = [
        {"ID - REF": "INPUT_A", "TIPO": "INPUT", "EQUAÇÕES E VALORES": "100.5"},
        {"ID - REF": "INPUT_B", "TIPO": "INPUT", "EQUAÇÕES E VALORES": "3"},
        {"ID - REF": "INPUT_C", "TIPO": "INPUT", "EQUAÇÕES E VALORES": "0.1"},
        {"ID - REF": "INPUT_D", "TIPO": "INPUT", "EQUAÇÕES E VALORES": "0.2"},
        {"ID - REF": "VAR_ADD", "TIPO": "OUTPUT", "EQUAÇÕES E VALORES": "=INPUT_A + INPUT_B"},
        {"ID - REF": "VAR_SUB", "TIPO": "OUTPUT", "EQUAÇÕES E VALORES": "=INPUT_A - INPUT_B"},
        {"ID - REF": "VAR_MULT", "TIPO": "OUTPUT", "EQUAÇÕES E VALORES": "=INPUT_A * INPUT_B"},
        {"ID - REF": "VAR_DIV", "TIPO": "OUTPUT", "EQUAÇÕES E VALORES": "=INPUT_A / INPUT_B"},
        {"ID - REF": "VAR_POW", "TIPO": "OUTPUT", "EQUAÇÕES E VALORES": "=INPUT_B ^ 3"},
        {"ID - REF": "VAR_PREC", "TIPO": "OUTPUT", "EQUAÇÕES E VALORES": "=INPUT_C + INPUT_D"}, # 0.1 + 0.2
        {"ID - REF": "VAR_SE_TRUE", "TIPO": "OUTPUT", "EQUAÇÕES E VALORES": "=SE(INPUT_A > 100; 10; 20)"},
        {"ID - REF": "VAR_SE_FALSE", "TIPO": "OUTPUT", "EQUAÇÕES E VALORES": "=SE(INPUT_A < 100; 10; 20)"},
        {"ID - REF": "VAR_SOMA", "TIPO": "OUTPUT", "EQUAÇÕES E VALORES": "=SOMA(INPUT_A; INPUT_B; INPUT_C)"},
        {"ID - REF": "VAR_LN", "TIPO": "OUTPUT", "EQUAÇÕES E VALORES": "=LN(INPUT_A)"},
        {"ID - REF": "VAR_SEERRO_OK", "TIPO": "OUTPUT", "EQUAÇÕES E VALORES": "=SEERRO(INPUT_A / INPUT_B; 999)"},
        {"ID - REF": "VAR_SEERRO_ERR", "TIPO": "OUTPUT", "EQUAÇÕES E VALORES": "=SEERRO(INPUT_A / 0; 999)"},
        {"ID - REF": "VAR_NESTED", "TIPO": "OUTPUT", "EQUAÇÕES E VALORES": "=SE(VAR_ADD > 100; VAR_MULT * 2; 0)"},
        {"ID - REF": "H272", "TIPO": "INPUT", "EQUAÇÕES E VALORES": "7.27"},
        {"ID - REF": "H273", "TIPO": "OUTPUT", "EQUAÇÕES E VALORES": "=H272"}, # Custom density rule
        {"ID - REF": "J269", "TIPO": "INPUT", "EQUAÇÕES E VALORES": "45.0"},
        {"ID - REF": "J270", "TIPO": "OUTPUT", "EQUAÇÕES E VALORES": "=J269"}, # Custom density rule
    ]
    
    decimal_res = calculate_state(variables)
    float_res = calculate_state_float(variables)
    
    # Assert convergence/iterations are same
    assert decimal_res["convergence_error"] == float_res["convergence_error"]
    
    # Compare all 20+ variables results
    for key in decimal_res["results"]:
        dec_item = decimal_res["results"][key]
        flt_item = float_res["results"][key]
        
        assert dec_item["status"] == flt_item["status"], f"Status mismatch for {key}: dec={dec_item}, flt={flt_item}"
        
        if dec_item["status"] == "OK":
            val_dec = dec_item["value"]
            val_flt = flt_item["value"]
            if isinstance(val_dec, bool):
                assert val_dec == val_flt
            else:
                diff = abs(val_dec - val_flt)
                # Divergence must be <= 1e-4
                assert diff <= 1e-4, f"Divergence mismatch too high for {key}: dec={val_dec}, flt={val_flt}, diff={diff}"
                
                # Check for decimal precision benefits: 0.1 + 0.2
                if key == "VAR_PREC":
                    # Decimal evaluator returns exactly 0.3
                    assert val_dec == 0.3
                    # Float evaluation has IEEE 754 precision error (0.30000000000000004)
                    assert abs(val_flt - 0.3) < 1e-15
                    assert val_flt != 0.3

def test_engine_decimal_parity_on_cycles():
    # Test circular dependency convergence behavior on both float and Decimal
    variables = [
        {"ID - REF": "X", "TIPO": "INPUT", "EQUAÇÕES E VALORES": "10"},
        {"ID - REF": "Y", "TIPO": "OUTPUT", "EQUAÇÕES E VALORES": "=X + 0.5 * Z"},
        {"ID - REF": "Z", "TIPO": "OUTPUT", "EQUAÇÕES E VALORES": "=0.1 * Y"},
    ]
    
    # Analytical solution:
    # Y = 10 + 0.05 * Y => 0.95 * Y = 10 => Y = 10.5263157...
    # Z = 1.05263157...
    
    decimal_res = calculate_state(variables)
    float_res = calculate_state_float(variables)
    
    assert decimal_res["convergence_error"] is False
    assert float_res["convergence_error"] is False
    
    assert abs(decimal_res["results"]["Y"]["value"] - 10.5263) < 1e-4
    assert abs(float_res["results"]["Y"]["value"] - 10.5263) < 1e-4
    
    diff_y = abs(decimal_res["results"]["Y"]["value"] - float_res["results"]["Y"]["value"])
    assert diff_y <= 1e-4
