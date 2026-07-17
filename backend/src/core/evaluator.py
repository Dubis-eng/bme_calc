import ast
from decimal import Decimal
from iapws import IAPWS97

def ok_res(val):
    return {"value": val, "status": "OK", "error_message": ""}

def err_res(status, msg):
    return {"value": None, "status": status, "error_message": msg}

def to_decimal(val):
    if isinstance(val, Decimal): return val
    if isinstance(val, (int, float)): return Decimal(str(val))
    if isinstance(val, str) and val.strip():
        try: return Decimal(val.strip().replace(',', '.'))
        except: raise ValueError(f"Erro ao converter '{val}' para Decimal")
    raise ValueError(f"Valor numérico inválido: {val}")

class FormulaEvaluator:
    def __init__(self, state):
        self.state = state

    def evaluate(self, node):
        if isinstance(node, ast.Expression):
            return self.evaluate(node.body)
        
        if isinstance(node, ast.Constant):
            val = node.value
            if isinstance(val, (int, float)):
                return ok_res(Decimal(str(val)))
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
                try:
                    return ok_res(Decimal(var_val.replace(',', '.')))
                except Exception:
                    return ok_res(var_val)
            from src.core.engine import parse_number
            return ok_res(parse_number(var_val))
                
        if isinstance(node, ast.UnaryOp):
            operand_res = self.evaluate(node.operand)
            if operand_res["status"] != "OK": return operand_res
            try:
                operand_dec = to_decimal(operand_res["value"])
                if isinstance(node.op, ast.USub): return ok_res(-operand_dec)
                if isinstance(node.op, ast.UAdd): return ok_res(+operand_dec)
                return err_res("INVALID_OP", f"Operador unário não suportado: {type(node.op)}")
            except Exception as e:
                return err_res("INVALID_VALUE", str(e))
            
        if isinstance(node, ast.BinOp):
            left_res = self.evaluate(node.left)
            if left_res["status"] != "OK": return left_res
            right_res = self.evaluate(node.right)
            if right_res["status"] != "OK": return right_res
            
            try:
                left_dec = to_decimal(left_res["value"])
                right_dec = to_decimal(right_res["value"])
                if isinstance(node.op, ast.Add): return ok_res(left_dec + right_dec)
                if isinstance(node.op, ast.Sub): return ok_res(left_dec - right_dec)
                if isinstance(node.op, ast.Mult): return ok_res(left_dec * right_dec)
                if isinstance(node.op, ast.Div):
                    if right_dec == 0: return err_res("DIV_BY_ZERO", "Divisão por zero.")
                    return ok_res(left_dec / right_dec)
                if isinstance(node.op, ast.Pow): return ok_res(left_dec ** right_dec)
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
            try: l, r = to_decimal(left_val), to_decimal(right_val)
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
                total = Decimal('0')
                for arg_node in node.args:
                    arg_res = self.evaluate(arg_node)
                    if arg_res["status"] != "OK": return arg_res
                    val = arg_res["value"]
                    if val != "" and val is not None: total += to_decimal(val)
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
                    P_gauge = to_decimal(lookup_res["value"])
                    col_index = int(col_res["value"])
                    P_abs_MPa = (P_gauge + Decimal('1.01325')) * Decimal('0.1')
                    state_vapor = IAPWS97(P=float(P_abs_MPa), x=1)
                    state_liquid = IAPWS97(P=float(P_abs_MPa), x=0)
                    if col_index == 2:
                        return ok_res(Decimal(str(state_vapor.T)) - Decimal('273.15'))
                    if col_index == 6:
                        return ok_res((Decimal(str(state_vapor.h)) - Decimal(str(state_liquid.h))) / Decimal('4.18'))
                    return err_res("INVALID_VALUE", f"Coluna {col_index} não suportada na tabela Vapor")
                except Exception as e:
                    return err_res("MATH_ERROR", f"Erro no PROCV: {str(e)}")
                
            if func_name in {'VAPOR_H', 'VAPOR_S', 'VAPOR_H_SAT', 'VAPOR_H_LIQ', 'VAPOR_H_PS', 'VAPOR_T_SAT', 'VAPOR_LATENT'}:
                try:
                    if func_name in {'VAPOR_H_SAT', 'VAPOR_H_LIQ', 'VAPOR_T_SAT', 'VAPOR_LATENT'}:
                        if len(node.args) != 1: return err_res("INVALID_ARGS", f"{func_name} requer 1 argumento (Pressão)")
                        P_res = self.evaluate(node.args[0])
                        if P_res["status"] != "OK": return P_res
                        P_abs = to_decimal(P_res["value"])
                        P_abs_MPa = P_abs * Decimal('0.1')
                        
                        if func_name == 'VAPOR_H_SAT':
                            state = IAPWS97(P=float(P_abs_MPa), x=1)
                            return ok_res(Decimal(str(state.h)))
                        elif func_name == 'VAPOR_H_LIQ':
                            state = IAPWS97(P=float(P_abs_MPa), x=0)
                            return ok_res(Decimal(str(state.h)))
                        elif func_name == 'VAPOR_T_SAT':
                            state = IAPWS97(P=float(P_abs_MPa), x=1)
                            return ok_res(Decimal(str(state.T)) - Decimal('273.15'))
                        elif func_name == 'VAPOR_LATENT':
                            state_v = IAPWS97(P=float(P_abs_MPa), x=1)
                            state_l = IAPWS97(P=float(P_abs_MPa), x=0)
                            return ok_res(Decimal(str(state_v.h)) - Decimal(str(state_l.h)))
                            
                    elif func_name in {'VAPOR_H', 'VAPOR_S', 'VAPOR_H_PS'}:
                        if len(node.args) != 2: return err_res("INVALID_ARGS", f"{func_name} requer 2 argumentos")
                        P_res = self.evaluate(node.args[0])
                        if P_res["status"] != "OK": return P_res
                        param_res = self.evaluate(node.args[1])
                        if param_res["status"] != "OK": return param_res
                        
                        P_abs = to_decimal(P_res["value"])
                        P_abs_MPa = P_abs * Decimal('0.1')
                        val_param = to_decimal(param_res["value"])
                        
                        if func_name == 'VAPOR_H':
                            T_K = val_param + Decimal('273.15')
                            state = IAPWS97(P=float(P_abs_MPa), T=float(T_K))
                            return ok_res(Decimal(str(state.h)))
                        elif func_name == 'VAPOR_S':
                            T_K = val_param + Decimal('273.15')
                            state = IAPWS97(P=float(P_abs_MPa), T=float(T_K))
                            return ok_res(Decimal(str(state.s)))
                        elif func_name == 'VAPOR_H_PS':
                            s_val = val_param
                            state = IAPWS97(P=float(P_abs_MPa), s=float(s_val))
                            return ok_res(Decimal(str(state.h)))
                            
                except Exception as e:
                    return err_res("MATH_ERROR", f"Erro no {func_name}: {str(e)}")
                
            if func_name == 'LN':
                if len(node.args) != 1: return err_res("INVALID_ARGS", "LN requer 1 argumento")
                arg_res = self.evaluate(node.args[0])
                if arg_res["status"] != "OK": return arg_res
                try:
                    val_dec = to_decimal(arg_res["value"])
                    if val_dec <= 0: return err_res("MATH_ERROR", "LN requer valor positivo")
                    return ok_res(val_dec.ln())
                except Exception as e:
                    return err_res("MATH_ERROR", str(e))
                
            if func_name == 'SUBTOTAL':
                if len(node.args) < 2: return err_res("INVALID_ARGS", "SUBTOTAL requer pelo menos 2 argumentos")
                code_res = self.evaluate(node.args[0])
                if code_res["status"] != "OK": return code_res
                func_num = int(code_res["value"])
                if func_num == 9:
                    total = Decimal('0')
                    for arg_node in node.args[1:]:
                        arg_res = self.evaluate(arg_node)
                        if arg_res["status"] != "OK": return arg_res
                        val = arg_res["value"]
                        if val != "" and val is not None: total += to_decimal(val)
                    return ok_res(total)
                return err_res("NOT_IMPLEMENTED", f"SUBTOTAL código {func_num} não suportado")
                
            if func_name == 'SOMASES':
                num_args = len(node.args)
                if num_args < 3 or (num_args - 1) % 2 != 0: return err_res("INVALID_ARGS", "Assinatura inválida")
                range_size = (num_args - 1) // 2
                criterion_res = self.evaluate(node.args[-1])
                if criterion_res["status"] != "OK": return criterion_res
                criterion = str(criterion_res["value"])
                total = Decimal('0')
                for i in range(range_size):
                    c_res = self.evaluate(node.args[range_size + i])
                    if c_res["status"] != "OK": return c_res
                    if str(c_res["value"]) == criterion:
                        s_res = self.evaluate(node.args[i])
                        if s_res["status"] != "OK": return s_res
                        val = s_res["value"]
                        if val != "" and val is not None: total += to_decimal(val)
                return ok_res(total)
                
            return err_res("INVALID_FUNC", f"Função não suportada: {func_name}")
            
        return err_res("INVALID_AST", f"Tipo de nó AST não suportado: {type(node)}")
