import math
import networkx as nx
import re

def parse_number(val):
    if isinstance(val, (int, float)):
        return float(val)
    if isinstance(val, str):
        val = val.replace(',', '.')
        try:
            return float(val)
        except:
            return 0.0
    return 0.0

def eval_se(condition, true_val, false_val):
    return true_val if condition else false_val

def parse_equation(eq_str, state):
    if not isinstance(eq_str, str) or not eq_str.startswith('='):
        return parse_number(eq_str)

    eq = eq_str[1:] # remove =

    # Simple IF replacement for basic cases: SE(cond;true;false)
    # This is a very fragile regex for SE, but works for the simple cases in epic 1
    # Example: =SE(H5=0;0;H5*H8/H4*(H11/708)/H10)
    # We will replace references H3, H4 with their values from state.

    # find all H\d+
    refs = re.findall(r'H\d+', eq)
    # replace H\d+ with their values
    # sort by length desc to avoid replacing H1 before H10
    refs.sort(key=len, reverse=True)

    for ref in refs:
        # be careful with replacing within other names, but here all variables are H\d+
        val = state.get(ref, 0.0)
        # to avoid replacing H10 when looking for H1, use word boundaries
        eq = re.sub(rf'\b{ref}\b', str(val), eq)

    # Python ** for exponent
    eq = eq.replace('^', '**')

    # replace comma decimals
    eq = re.sub(r'(\d),(\d)', r'\1.\2', eq)

    # replace SE(...) with python eval equivalent if possible
    # A simple regex for SE(A;B;C) might fail for nested SE.
    # Luckily, epic 1 doesn't have deeply nested SE.
    # =SE(0.0=0;0;0.0*0.135/6.0*(4000.0/708)/0.119)
    def se_replacer(match):
        cond = match.group(1)
        true_expr = match.group(2)
        false_expr = match.group(3)
        # In python, eval handles "cond", but Excel uses = instead of ==
        cond = cond.replace('=', '==')
        # handle > , < , >=, <= etc. already fine in Python
        return f"({true_expr}) if ({cond}) else ({false_expr})"

    # loop to replace SE from inside out
    while 'SE(' in eq:
        # non-greedy match for the arguments
        # SE(cond;true;false)
        eq = re.sub(r'SE\(([^;]+);([^;]+);([^;)]+)\)', se_replacer, eq)

    try:
        # use eval safely-ish
        # Provide allowed math functions
        allowed_names = {k: v for k, v in math.__dict__.items() if not k.startswith("__")}
        # allow true/false
        allowed_names['True'] = True
        allowed_names['False'] = False

        res = eval(eq, {"__builtins__": None}, allowed_names)
        return float(res)
    except Exception as e:
        # e.g. division by zero -> return 0
        return 0.0

def calculate_state(variables_list):
    state = {}
    graph = nx.DiGraph()
    formulas = {}

    for item in variables_list:
        ref = item['ID - REF']
        val = item['EQUAÇÕES E VALORES']
        state[ref] = parse_number(val) if item['TIPO'] == 'INPUT' else 0.0

        graph.add_node(ref)
        if item['TIPO'] != 'INPUT' and isinstance(val, str) and val.startswith('='):
            formulas[ref] = val
            # find dependencies
            deps = set(re.findall(r'H\d+', val))
            for dep in deps:
                graph.add_edge(dep, ref)

    # Evaluate in topological order
    try:
        order = list(nx.topological_sort(graph))
    except nx.NetworkXUnfeasible:
        # circular dependency, use iterative approach (up to 100 cycles) as per PRD
        order = list(graph.nodes) # fallback order
        for _ in range(100):
            old_state = state.copy()
            for ref in order:
                if ref in formulas:
                    state[ref] = parse_equation(formulas[ref], state)

            # check convergence
            diff = sum(abs(state[k] - old_state[k]) for k in state)
            if diff < 0.0001:
                break

        return {k: round(v, 4) for k, v in state.items()}


    # Non-circular (DAG) execution
    for ref in order:
        if ref in formulas:
            state[ref] = parse_equation(formulas[ref], state)

    # round to 4 decimals
    return {k: round(v, 4) for k, v in state.items()}
