import ast
import math
import re
from decimal import Decimal
import networkx as nx
from iapws import IAPWS97

from src.core.engine import normalize_formula
from src.core.evaluator import ok_res, err_res


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
            return ok_res(float(node.value) if isinstance(node.value, (int, float)) else node.value)
        if isinstance(node, ast.Name):
            if node.id == 'True': return ok_res(True)
            if node.id == 'False': return ok_res(False)
            if node.id not in self.state: return err_res("MISSING_VAR", f"Variável '{node.id}' não cadastrada.")
            var_val = self.state[node.id]
            if isinstance(var_val, dict) and "status" in var_val: return var_val
            if isinstance(var_val, str):
                try: return ok_res(float(var_val.replace(',', '.')))
                except: return ok_res(var_val)
            return ok_res(to_float(var_val))
        if isinstance(node, ast.UnaryOp):
            res = self.evaluate(node.operand)
            if res["status"] != "OK": return res
            try:
                flt = to_float(res["value"])
                if isinstance(node.op, ast.USub): return ok_res(-flt)
                if isinstance(node.op, ast.UAdd): return ok_res(+flt)
                return err_res("INVALID_OP", f"Operador unário não suportado: {type(node.op)}")
            except Exception as e: return err_res("INVALID_VALUE", str(e))
        if isinstance(node, ast.BinOp):
            l_res, r_res = self.evaluate(node.left), self.evaluate(node.right)
            if l_res["status"] != "OK": return l_res
            if r_res["status"] != "OK": return r_res
            try:
                l, r = to_float(l_res["value"]), to_float(r_res["value"])
                if isinstance(node.op, ast.Add): return ok_res(l + r)
                if isinstance(node.op, ast.Sub): return ok_res(l - r)
                if isinstance(node.op, ast.Mult): return ok_res(l * r)
                if isinstance(node.op, ast.Div): return err_res("DIV_BY_ZERO", "Divisão por zero.") if r == 0.0 else ok_res(l / r)
                if isinstance(node.op, ast.Pow): return ok_res(l ** r)
                return err_res("INVALID_OP", f"Operador binário: {type(node.op)}")
            except Exception as e: return err_res("INVALID_VALUE", str(e))
        if isinstance(node, ast.Compare):
            l_res, r_res = self.evaluate(node.left), self.evaluate(node.comparators[0])
            if l_res["status"] != "OK": return l_res
            if r_res["status"] != "OK": return r_res
            l_val, r_val = l_res["value"], r_res["value"]
            try: l, r = to_float(l_val), to_float(r_val)
            except: l, r = l_val, r_val
            op = node.ops[0]
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
                cond = self.evaluate(node.args[0])
                if cond["status"] != "OK": return cond
                return self.evaluate(node.args[1]) if cond["value"] else self.evaluate(node.args[2])
            if func_name == 'SEERRO':
                if len(node.args) != 2: return err_res("INVALID_ARGS", "SEERRO requer 2 argumentos")
                first = self.evaluate(node.args[0])
                return first if first["status"] == "OK" else self.evaluate(node.args[1])
            if func_name == 'SOMA':
                total = 0.0
                for a in node.args:
                    r = self.evaluate(a)
                    if r["status"] != "OK": return r
                    if r["value"] not in ("", None): total += to_float(r["value"])
                return ok_res(total)
            if func_name == 'PROCV':
                if len(node.args) not in (3, 4): return err_res("INVALID_ARGS", "PROCV requer 3 ou 4 argumentos")
                lk, tb, cl = self.evaluate(node.args[0]), self.evaluate(node.args[1]), self.evaluate(node.args[2])
                if lk["status"] != "OK": return lk
                if tb["status"] != "OK": return tb
                if cl["status"] != "OK": return cl
                if tb["value"] != "Vapor": return err_res("INVALID_VALUE", f"Tabela desconhecida: {tb['value']}")
                try:
                    P_abs_MPa = (to_float(lk["value"]) + 1.01325) * 0.1
                    col_index = int(cl["value"])
                    if col_index == 2: return ok_res(float(IAPWS97(P=P_abs_MPa, x=1).T) - 273.15)
                    if col_index == 6: return ok_res((float(IAPWS97(P=P_abs_MPa, x=1).h) - float(IAPWS97(P=P_abs_MPa, x=0).h)) / 4.18)
                    return err_res("INVALID_VALUE", f"Coluna {col_index} não suportada")
                except Exception as e: return err_res("MATH_ERROR", str(e))
            if func_name in {'VAPOR_H', 'VAPOR_S', 'VAPOR_H_SAT', 'VAPOR_H_LIQ', 'VAPOR_H_PS', 'VAPOR_T_SAT', 'VAPOR_LATENT'}:
                try:
                    if func_name in {'VAPOR_H_SAT', 'VAPOR_H_LIQ', 'VAPOR_T_SAT', 'VAPOR_LATENT'}:
                        p_res = self.evaluate(node.args[0])
                        if p_res["status"] != "OK": return p_res
                        P_MPa = to_float(p_res["value"]) * 0.1
                        if func_name == 'VAPOR_H_SAT': return ok_res(float(IAPWS97(P=P_MPa, x=1).h))
                        if func_name == 'VAPOR_H_LIQ': return ok_res(float(IAPWS97(P=P_MPa, x=0).h))
                        if func_name == 'VAPOR_T_SAT': return ok_res(float(IAPWS97(P=P_MPa, x=1).T) - 273.15)
                        if func_name == 'VAPOR_LATENT': return ok_res(float(IAPWS97(P=P_MPa, x=1).h) - float(IAPWS97(P=P_MPa, x=0).h))
                    elif func_name in {'VAPOR_H', 'VAPOR_S', 'VAPOR_H_PS'}:
                        p_res, param_res = self.evaluate(node.args[0]), self.evaluate(node.args[1])
                        if p_res["status"] != "OK": return p_res
                        if param_res["status"] != "OK": return param_res
                        P_MPa, p_val = to_float(p_res["value"]) * 0.1, to_float(param_res["value"])
                        if func_name == 'VAPOR_H': return ok_res(float(IAPWS97(P=P_MPa, T=p_val + 273.15).h))
                        if func_name == 'VAPOR_S': return ok_res(float(IAPWS97(P=P_MPa, T=p_val + 273.15).s))
                        if func_name == 'VAPOR_H_PS': return ok_res(float(IAPWS97(P=P_MPa, s=p_val).h))
                except Exception as e: return err_res("MATH_ERROR", str(e))
            if func_name == 'LN':
                if len(node.args) != 1: return err_res("INVALID_ARGS", "LN requer 1 argumento")
                arg = self.evaluate(node.args[0])
                if arg["status"] != "OK": return arg
                try:
                    val = to_float(arg["value"])
                    return err_res("MATH_ERROR", "LN requer valor positivo") if val <= 0 else ok_res(math.log(val))
                except Exception as e: return err_res("MATH_ERROR", str(e))
            if func_name == 'SUBTOTAL':
                code_res = self.evaluate(node.args[0])
                if code_res["status"] != "OK": return code_res
                if int(code_res["value"]) == 9:
                    total = 0.0
                    for a in node.args[1:]:
                        r = self.evaluate(a)
                        if r["status"] != "OK": return r
                        if r["value"] not in ("", None): total += to_float(r["value"])
                    return ok_res(total)
                return err_res("NOT_IMPLEMENTED", "SUBTOTAL")
            if func_name == 'SOMASES':
                range_size = (len(node.args) - 1) // 2
                crit_res = self.evaluate(node.args[-1])
                if crit_res["status"] != "OK": return crit_res
                criterion = str(crit_res["value"])
                total = 0.0
                for i in range(range_size):
                    c_res = self.evaluate(node.args[range_size + i])
                    if c_res["status"] != "OK": return c_res
                    if str(c_res["value"]) == criterion:
                        s_res = self.evaluate(node.args[i])
                        if s_res["status"] != "OK": return s_res
                        if s_res["value"] not in ("", None): total += to_float(s_res["value"])
                return ok_res(total)
            return err_res("INVALID_FUNC", f"Função não suportada: {func_name}")
        return err_res("INVALID_AST", f"Nó AST não suportado: {type(node)}")


def parse_equation_float(eq_str, state, ref=None):
    if ref in {'H273', 'J270'}:
        try:
            inpm_ref = 'H272' if ref == 'H273' else 'J269'
            inpm_res = state.get(inpm_ref, ok_res(0.0))
            I = to_float(inpm_res["value"] if isinstance(inpm_res, dict) else inpm_res)
            if I > 100 or I < 0: return err_res("MATH_ERROR", "Teor alcoólico fora de 0-100")
            return ok_res(0.99823 - 0.001625 * I - 0.0000045 * (I ** 2))
        except Exception as e: return err_res("MATH_ERROR", str(e))
    if not isinstance(eq_str, str) or not eq_str.startswith('='):
        try: return ok_res(float(str(eq_str).replace(',', '.')))
        except Exception as e: return err_res("INVALID_VALUE", str(e))
    try:
        return FloatFormulaEvaluator(state).evaluate(ast.parse(normalize_formula(eq_str), mode='eval'))
    except ZeroDivisionError: return err_res("DIV_BY_ZERO", "Divisão por zero.")
    except Exception as e: return err_res("SYNTAX_ERROR", str(e))


def calculate_state_float(variables_list, tolerance=0.0001):
    state, graph, formulas = {}, nx.DiGraph(), {}
    for item in variables_list:
        ref, val, tipo = item['ID - REF'], item['EQUAÇÕES E VALORES'], item.get('TIPO', 'INPUT')
        if tipo in {'INPUT', 'CENARIO'} and not (isinstance(val, str) and val.startswith('=')):
            try: state[ref] = ok_res(float(str(val).replace(',', '.')))
            except Exception as e: state[ref] = err_res("INVALID_VALUE", str(e))
        else:
            state[ref] = err_res("PENDING", "Aguardando cálculo.")
        graph.add_node(ref)
        if isinstance(val, str) and val.startswith('='):
            formulas[ref] = val
            norm = normalize_formula(val)
            try:
                for node in ast.walk(ast.parse(norm, mode='eval')):
                    if isinstance(node, ast.Name) and node.id not in {'True', 'False', 'SE', 'SEERRO', 'SOMA', 'PROCV', 'LN', 'SUBTOTAL', 'SOMASES', 'Vapor'}:
                        graph.add_edge(node.id, ref)
            except:
                for dep in re.findall(r'[a-zA-Z_][a-zA-Z0-9_]*', norm): graph.add_edge(dep, ref)
        elif ref in {'H273', 'J270'}:
            inpm = 'H272' if ref == 'H273' else 'J269'
            formulas[ref] = f'={inpm}'
            graph.add_edge(inpm, ref)
    try:
        order = list(nx.topological_sort(graph))
        has_cycle = False
    except nx.NetworkXUnfeasible:
        order = list(graph.nodes)
        has_cycle = True
    convergence_error, iterations, max_delta = False, 0, 0.0
    if has_cycle:
        for ref in formulas: state[ref] = ok_res(0.0)
        for i in range(100):
            iterations = i + 1
            old_state = state.copy()
            for ref in order:
                if ref in formulas: state[ref] = parse_equation_float(formulas[ref], state, ref=ref)
            max_delta = 0.0
            for k in state:
                if state[k]["status"] == "OK" and old_state[k]["status"] == "OK":
                    try:
                        delta = abs(to_float(state[k]["value"]) - to_float(old_state[k]["value"]))
                        if delta > max_delta: max_delta = delta
                    except: pass
            if max_delta < float(tolerance): break
        else: convergence_error = True
    else:
        for ref in order:
            if ref in formulas: state[ref] = parse_equation_float(formulas[ref], state, ref=ref)
        iterations = 1
    rounded_results = {}
    for k, v in state.items():
        if v["status"] == "OK":
            val = v["value"]
            if isinstance(val, bool): rounded_results[k] = {"value": val, "status": "OK", "error_message": ""}
            else:
                try: rounded_results[k] = {"value": float(val), "status": "OK", "error_message": ""}
                except Exception as e: rounded_results[k] = {"value": None, "status": "INVALID_VALUE", "error_message": str(e)}
        else: rounded_results[k] = {"value": None, "status": v["status"], "error_message": v.get("error_message", "")}
    return {"results": rounded_results, "convergence_error": convergence_error, "iterations": iterations, "residual": float(max_delta)}
