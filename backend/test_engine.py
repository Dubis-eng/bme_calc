import json
from decimal import Decimal
from engine import calculate_state, normalize_formula, parse_equation, FormulaEvaluator

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
    # Test SE lazy evaluation where the unused branch would have error (e.g. div by 0)
    # H5 = 0, H4 = 0, H6 = 2
    state = {
        "H5": Decimal("0"),
        "H4": Decimal("0"),
        "H6": Decimal("2")
    }
    # This formula would raise ZeroDivisionError in false branch (H6/H4), but condition (H5==0) is true
    formula = "=SE(H5=0;0;H6/H4)"
    val = parse_equation(formula, state)
    assert val == Decimal("0")

    # Test SEERRO capturing error
    formula_error = "=SEERRO(H6/H4;999)"
    val_err = parse_equation(formula_error, state)
    assert val_err == Decimal("999")

def test_soma_ranges():
    state = {
        "H199": Decimal("10"),
        "H200": Decimal("20"),
        "H201": Decimal("30"),
        "H202": Decimal("40"),
        "H205": Decimal("5"),
        "H206": Decimal("5")
    }
    # SOMA(H199:H202; H205; H206) = 10+20+30+40 + 5 + 5 = 110
    formula = "=SOMA(H199:H202;H205;H206)"
    val = parse_equation(formula, state)
    assert val == Decimal("110")

def test_decimal_precision():
    # Float precision problem: 0.1 + 0.2 != 0.3
    # With Decimal, it should be exact
    state = {
        "H1": Decimal("0.1"),
        "H2": Decimal("0.2")
    }
    formula = "=H1+H2"
    val = parse_equation(formula, state)
    assert val == Decimal("0.3")

def test_procv_vapor():
    state = {
        "H363": Decimal("1.7") # 1.7 bar gauge
    }
    
    # Test temperature column 2: saturated steam temp at 1.7 bar-g (approx 130.13 °C)
    formula_temp = "=PROCV(H363;Vapor!$A$8:$I$61;2;FALSO)"
    val_temp = parse_equation(formula_temp, state)
    # Saturation temp at 2.71325 bar-a is 130.13... Celsius
    assert abs(float(val_temp) - 130.13) < 0.2, f"Expected ~130.13, got {val_temp}"

    # Test latent heat column 6: saturation latent heat at 1.7 bar-g in kcal/kg
    formula_heat = "=PROCV(1,7;Vapor!$A$8:$I$61;6;FALSO)"
    val_heat = parse_equation(formula_heat, state)
    # latent heat of vaporization is approx 2174.4 kJ/kg -> 2174.4 / 4.18 = 520.19 kcal/kg
    assert abs(float(val_heat) - 520.19) < 0.5, f"Expected ~520.19, got {val_heat}"

def test_epic3_functions():
    # Test LN
    state = {"H1": Decimal("2.718281828459")}
    assert abs(float(parse_equation("=LN(H1)", state)) - 1.0) < 0.0001
    
    # Test SUBTOTAL (9 corresponds to SUM)
    state_sub = {
        "H203": Decimal("15"),
        "H204": Decimal("25")
    }
    assert parse_equation("=SUBTOTAL(9;H203:H204)", state_sub) == Decimal("40")
    
    # Test SOMASES
    state_ses = {
        "H489": Decimal("10"), "H490": Decimal("20"), "H491": Decimal("30"),
        "H349": "v1", "H350": "v2", "H351": "v1"
    }
    # SOMASES(H489:H491; H349:H351; "v1") should sum H489 and H491 -> 10 + 30 = 40
    assert parse_equation("=SOMASES(H489:H491;H349:H351;\"v1\")", state_ses) == Decimal("40")
    
    # Test H273 custom ethanol-water mixture density calculation based on H272 (INPM % of ethanol)
    # INPM = 7.27
    state_density = {"H272": Decimal("7.27")}
    val_density = parse_equation("=SE(H272>100;0;H273)", state_density, ref="H273")
    # density = 0.99823 - 0.001625 * 7.27 - 0.0000045 * (7.27 ** 2)
    # density = 0.99823 - 0.01181375 - 0.0002378385 = 0.9861784
    assert abs(float(val_density) - 0.9861784) < 0.0001, f"Expected ~0.9861784, got {val_density}"

def test_epic1_baseline():
    import os
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    epic_path = os.path.join(base_dir, 'docs', 'epic1.json')
    with open(epic_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    res = calculate_state(data)
    
    # H9 = (H7+H5)*H3 = (900+400)*24 = 31200
    assert res["results"]["H9"] == 31200.0
    
    # H12 = "=SE(H5=0;0;H5*H8/H4*(H11/708)/H10)"
    # 400 * 0.135 / 6 * (4000/708) / 0.119 = 427.289569... -> 427.2896
    assert abs(res["results"]["H12"] - 427.2896) < 0.001
    
    # Check that metadata is returned
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
    assert res["results"]["MOENDA_VELOCIDADE"] == 9.0
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
    print("All custom backend engine tests passed successfully!")

