import json
from decimal import Decimal
from src.core.engine import calculate_state, normalize_formula, parse_equation

def test_formula_normalization():
    # Test sheet prefix removal
    assert normalize_formula("=Planilha1!H$17*Planilha1!H22") == "H17*H22"
    # Test absolute dollar signs removal
    assert normalize_formula("=H$17*H22") == "H17*H22"
    # Test implicit intersection removal
    assert normalize_formula("=@Planilha1!H31:P31") == "H31"
    # Test operators replacement
    assert normalize_formula("=H5<>0") == "H5!=0"
    assert normalize_formula("=H5<=0") == "H5<=0"
    # Test comma to period in numbers
    assert normalize_formula("=H213*0,96371+1,63") == "H213*0.96371+1.63"
    # Test semicolon to comma and power
    assert normalize_formula("=SE(H5=0;0;H6^2)") == "SE(H5==0,0,H6**2)"
    # Test PROCV normalizations
    assert normalize_formula("=PROCV(Planilha1!$D363;Vapor!$A$8:$I$61;2;FALSO)") == 'PROCV(H363,"Vapor",2,False)'
    assert normalize_formula("=PROCV(1,7;Vapor!$A$8:$I$61;6;FALSO)") == 'PROCV(1.7,"Vapor",6,False)'

def test_lazy_evaluation():
    state = {
        "H5": Decimal("0"),
        "H4": Decimal("0"),
        "H6": Decimal("2")
    }
    formula = "=SE(H5=0;0;H6/H4)"
    val = parse_equation(formula, state)
    assert val["value"] == Decimal("0")
    assert val["status"] == "OK"

    # Test SEERRO capturing error
    formula_error = "=SEERRO(H6/H4;999)"
    val_err = parse_equation(formula_error, state)
    assert val_err["value"] == Decimal("999")
    assert val_err["status"] == "OK"

def test_soma_ranges():
    state = {
        "H199": Decimal("10"),
        "H200": Decimal("20"),
        "H201": Decimal("30"),
        "H202": Decimal("40"),
        "H205": Decimal("5"),
        "H206": Decimal("5")
    }
    formula = "=SOMA(H199:H202;H205;H206)"
    val = parse_equation(formula, state)
    assert val["value"] == Decimal("110")
    assert val["status"] == "OK"

def test_decimal_precision():
    state = {
        "H1": Decimal("0.1"),
        "H2": Decimal("0.2")
    }
    formula = "=H1+H2"
    val = parse_equation(formula, state)
    assert val["value"] == Decimal("0.3")
    assert val["status"] == "OK"

def test_procv_vapor():
    state = {
        "H363": Decimal("1.7")
    }
    
    formula_temp = "=PROCV(H363;Vapor!$A$8:$I$61;2;FALSO)"
    val_temp = parse_equation(formula_temp, state)
    assert abs(float(val_temp["value"]) - 130.13) < 0.2, f"Expected ~130.13, got {val_temp}"
    assert val_temp["status"] == "OK"

    formula_heat = "=PROCV(1,7;Vapor!$A$8:$I$61;6;FALSO)"
    val_heat = parse_equation(formula_heat, state)
    assert abs(float(val_heat["value"]) - 520.19) < 0.5, f"Expected ~520.19, got {val_heat}"
    assert val_heat["status"] == "OK"

def test_epic3_functions():
    state = {"H1": Decimal("2.718281828459")}
    assert abs(float(parse_equation("=LN(H1)", state)["value"]) - 1.0) < 0.0001
    
    state_sub = {
        "H203": Decimal("15"),
        "H204": Decimal("25")
    }
    assert parse_equation("=SUBTOTAL(9;H203:H204)", state_sub)["value"] == Decimal("40")
    
    state_ses = {
        "H489": Decimal("10"), "H490": Decimal("20"), "H491": Decimal("30"),
        "H349": "v1", "H350": "v2", "H351": "v1"
    }
    assert parse_equation("=SOMASES(H489:H491;H349:H351;\"v1\")", state_ses)["value"] == Decimal("40")
    
    state_density = {"H272": Decimal("7.27")}
    val_density = parse_equation("=SE(H272>100;0;H273)", state_density, ref="H273")
    assert abs(float(val_density["value"]) - 0.9861784) < 0.0001

def test_vapor_new_functions():
    # Test superheated steam enthalpy VAPOR_H(P; T) and entropy VAPOR_S(P; T)
    # For J645=21 bar (absolute) and J646=305 °C
    # state = IAPWS97(P=2.1 MPa, T=305+273.15) -> h=3033.04, s=6.7624
    state = {
        "J645": Decimal("21"),
        "J646": Decimal("305")
    }
    formula_h = "=VAPOR_H(J645;J646)"
    val_h = parse_equation(formula_h, state)
    assert abs(float(val_h["value"]) - 3033.04) < 0.1, f"Expected ~3033.04, got {val_h}"
    assert val_h["status"] == "OK"

    formula_s = "=VAPOR_S(J645;J646)"
    val_s = parse_equation(formula_s, state)
    assert abs(float(val_s["value"]) - 6.7624) < 0.01, f"Expected ~6.7624, got {val_s}"
    assert val_s["status"] == "OK"

    # Test saturated vapor enthalpy and saturation temperature
    # at P=2.5 bar absolute
    state_sat = {
        "J650": Decimal("2.5")
    }
    formula_h_sat = "=VAPOR_H_SAT(J650)"
    val_h_sat = parse_equation(formula_h_sat, state_sat)
    assert abs(float(val_h_sat["value"]) - 2716.5) < 0.1, f"Expected ~2716.5, got {val_h_sat}"

    formula_t_sat = "=VAPOR_T_SAT(J650)"
    val_t_sat = parse_equation(formula_t_sat, state_sat)
    assert abs(float(val_t_sat["value"]) - 127.41) < 0.1, f"Expected ~127.41, got {val_t_sat}"

def test_epic1_baseline():
    import os
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    epic_path = os.path.join(base_dir, 'docs', 'epic1.json')
    if not os.path.exists(epic_path):
        epic_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'epic1.json')
    with open(epic_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    res = calculate_state(data)
    
    assert res["results"]["H9"]["value"] == 31200.0
    assert abs(res["results"]["H12"]["value"] - 427.2896) < 0.001
    assert "convergence_error" in res
    assert "iterations" in res
    assert res["convergence_error"] is False

def test_custom_alphanumeric_ids():
    variables = [
        {
            "ID - REF": "MOENDA_RPM",
            "SETOR": "MOAGEM",
            "DEFINIÇÃO": "MOENDA 1",
            "DESCRIÇÃO": "Rotação da Moenda",
            "TIPO": "INPUT",
            "UNIDADE DE MEDIDA": "rpm",
            "EQUAÇÕES E VALORES": "6"
        },
        {
            "ID - REF": "MOENDA_FATOR",
            "SETOR": "MOAGEM",
            "DEFINIÇÃO": "MOENDA 1",
            "DESCRIÇÃO": "Fator de Rotação",
            "TIPO": "INPUT",
            "UNIDADE DE MEDIDA": "-",
            "EQUAÇÕES E VALORES": "1.5"
        },
        {
            "ID - REF": "MOENDA_VELOCIDADE",
            "SETOR": "MOAGEM",
            "DEFINIÇÃO": "MOENDA 1",
            "DESCRIÇÃO": "Velocidade Linear",
            "TIPO": "OUTPUT",
            "UNIDADE DE MEDIDA": "m/s",
            "EQUAÇÕES E VALORES": "=MOENDA_RPM * MOENDA_FATOR"
        }
    ]
    res = calculate_state(variables)
    assert res["results"]["MOENDA_VELOCIDADE"]["value"] == 9.0
    assert res["convergence_error"] is False

if __name__ == "__main__":
    test_formula_normalization()
    test_lazy_evaluation()
    test_soma_ranges()
    test_decimal_precision()
    test_procv_vapor()
    test_epic3_functions()
    test_epic1_baseline()
    test_custom_alphanumeric_ids()
    test_vapor_new_functions()
    print("All custom backend engine tests passed successfully!")
