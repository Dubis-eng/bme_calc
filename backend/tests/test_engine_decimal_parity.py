import pytest
from src.core.engine import calculate_state
from .float_evaluator import calculate_state_float


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
        {"ID - REF": "VAR_PREC", "TIPO": "OUTPUT", "EQUAÇÕES E VALORES": "=INPUT_C + INPUT_D"},
        {"ID - REF": "VAR_SE_TRUE", "TIPO": "OUTPUT", "EQUAÇÕES E VALORES": "=SE(INPUT_A > 100; 10; 20)"},
        {"ID - REF": "VAR_SE_FALSE", "TIPO": "OUTPUT", "EQUAÇÕES E VALORES": "=SE(INPUT_A < 100; 10; 20)"},
        {"ID - REF": "VAR_SOMA", "TIPO": "OUTPUT", "EQUAÇÕES E VALORES": "=SOMA(INPUT_A; INPUT_B; INPUT_C)"},
        {"ID - REF": "VAR_LN", "TIPO": "OUTPUT", "EQUAÇÕES E VALORES": "=LN(INPUT_A)"},
        {"ID - REF": "VAR_SEERRO_OK", "TIPO": "OUTPUT", "EQUAÇÕES E VALORES": "=SEERRO(INPUT_A / INPUT_B; 999)"},
        {"ID - REF": "VAR_SEERRO_ERR", "TIPO": "OUTPUT", "EQUAÇÕES E VALORES": "=SEERRO(INPUT_A / 0; 999)"},
        {"ID - REF": "VAR_NESTED", "TIPO": "OUTPUT", "EQUAÇÕES E VALORES": "=SE(VAR_ADD > 100; VAR_MULT * 2; 0)"},
        {"ID - REF": "H272", "TIPO": "INPUT", "EQUAÇÕES E VALORES": "7.27"},
        {"ID - REF": "H273", "TIPO": "OUTPUT", "EQUAÇÕES E VALORES": "=H272"},
        {"ID - REF": "J269", "TIPO": "INPUT", "EQUAÇÕES E VALORES": "45.0"},
        {"ID - REF": "J270", "TIPO": "OUTPUT", "EQUAÇÕES E VALORES": "=J269"},
    ]
    
    decimal_res = calculate_state(variables)
    float_res = calculate_state_float(variables)
    
    assert decimal_res["convergence_error"] == float_res["convergence_error"]
    
    for key in decimal_res["results"]:
        dec_item = decimal_res["results"][key]
        flt_item = float_res["results"][key]
        
        assert dec_item["status"] == flt_item["status"], f"Status mismatch for {key}"
        
        if dec_item["status"] == "OK":
            val_dec = dec_item["value"]
            val_flt = flt_item["value"]
            if isinstance(val_dec, bool):
                assert val_dec == val_flt
            else:
                diff = abs(val_dec - val_flt)
                assert diff <= 1e-4, f"Divergence mismatch for {key}"
                
                if key == "VAR_PREC":
                    assert val_dec == 0.3
                    assert abs(val_flt - 0.3) < 1e-15
                    assert val_flt != 0.3


def test_engine_decimal_parity_on_cycles():
    variables = [
        {"ID - REF": "X", "TIPO": "INPUT", "EQUAÇÕES E VALORES": "10"},
        {"ID - REF": "Y", "TIPO": "OUTPUT", "EQUAÇÕES E VALORES": "=X + 0.5 * Z"},
        {"ID - REF": "Z", "TIPO": "OUTPUT", "EQUAÇÕES E VALORES": "=0.1 * Y"},
    ]
    
    decimal_res = calculate_state(variables)
    float_res = calculate_state_float(variables)
    
    assert decimal_res["convergence_error"] is False
    assert float_res["convergence_error"] is False
    
    assert abs(decimal_res["results"]["Y"]["value"] - 10.5263) < 1e-4
    assert abs(float_res["results"]["Y"]["value"] - 10.5263) < 1e-4
    
    diff_y = abs(decimal_res["results"]["Y"]["value"] - float_res["results"]["Y"]["value"])
    assert diff_y <= 1e-4
