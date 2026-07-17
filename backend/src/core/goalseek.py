import scipy.optimize as opt
from typing import List, Dict, Any
from src.core import engine

def run_goal_seek(
    variables: List[Dict[str, Any]],
    input_id: str,
    target_id: str,
    target_value: float,
    min_val: float,
    max_val: float
) -> Dict[str, Any]:
    """
    Finds the input value that makes the target output value converge to target_value.
    Uses Brentq if bounds bracket the root, otherwise falls back to Secant or Nelder-Mead.
    """
    curr_input_val = 0.0
    for var in variables:
        if var["ID - REF"] == input_id:
            try:
                # Parse existing value
                val_str = str(var["EQUAÇÕES E VALORES"]).replace(',', '.')
                curr_input_val = float(val_str)
            except Exception:
                curr_input_val = 0.0
            break

    # Objective function
    def f(x: float) -> float:
        modified_vars = []
        for var in variables:
            if var["ID - REF"] == input_id:
                modified_vars.append({**var, "EQUAÇÕES E VALORES": float(x)})
            else:
                modified_vars.append(var)
        
        res_data = engine.calculate_state(modified_vars)
        target_res = res_data["results"].get(target_id, {"value": 0.0})
        if isinstance(target_res, dict):
            val = target_res.get("value")
            actual_val = float(val) if val is not None else 0.0
        else:
            actual_val = float(target_res)
        return actual_val - target_value

    converged = False
    root = curr_input_val

    try:
        f_min = f(min_val)
        f_max = f(max_val)
        
        # Check if we bracket the root
        if f_min * f_max <= 0:
            sol = opt.root_scalar(f, bracket=[min_val, max_val], method='brentq', xtol=1e-5, maxiter=50)
            converged = sol.converged
            root = float(sol.root)
        else:
            # Try Secant method
            x0 = curr_input_val if min_val <= curr_input_val <= max_val else (min_val + max_val) / 2.0
            x1 = x0 + (max_val - min_val) * 0.1
            if x1 > max_val or x1 < min_val:
                x1 = x0 - (max_val - min_val) * 0.1
                
            sol = opt.root_scalar(f, x0=x0, x1=x1, method='secant', xtol=1e-5, maxiter=50)
            converged = sol.converged
            root = float(sol.root)
            
            # Clamp root to limits
            if root < min_val:
                root = min_val
            elif root > max_val:
                root = max_val
    except Exception:
        # Fallback to Nelder-Mead minimization of absolute difference
        try:
            def abs_f(x_arr):
                return abs(f(x_arr[0]))
            
            res = opt.minimize(
                abs_f,
                x0=[curr_input_val],
                bounds=[(min_val, max_val)],
                method='Nelder-Mead',
                options={'maxiter': 50}
            )
            root = float(res.x[0])
            converged = res.success
        except Exception as err:
            raise ValueError(f"Falha ao executar a busca de metas: {str(err)}")

    # Recalculate full state with optimal value
    final_vars = []
    for var in variables:
        if var["ID - REF"] == input_id:
            final_vars.append({**var, "EQUAÇÕES E VALORES": root})
        else:
            final_vars.append(var)
            
    final_state = engine.calculate_state(final_vars)
    
    return {
        "input_id": input_id,
        "optimal_value": root,
        "target_id": target_id,
        "target_value": target_value,
        "converged": converged,
        "results": final_state["results"],
        "convergence_error": final_state["convergence_error"],
        "iterations": final_state["iterations"]
    }
