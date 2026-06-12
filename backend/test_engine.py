import json
from engine import calculate_state

def test_engine():
    with open('docs/epic1.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

    res = calculate_state(data)

    # Let's check some known values from the Epic 1 inputs
    # H3 = 24
    # H5 = 400
    # H7 = 900
    # H9 = =(H7+H5)*H3 = (900+400)*24 = 1300*24 = 31200
    assert res["H9"] == 31200.0, f"Expected 31200, got {res['H9']}"

    # Test decimal values
    # ID H12 is "=SE(H5=0;0;H5*H8/H4*(H11/708)/H10)"
    # H5=400, H8=0.135, H4=6, H11=4000, H10=0.119
    # 400 * 0.135 / 6 * (4000/708) / 0.119 = 427.289569... -> 427.2896
    assert abs(res["H12"] - 427.2896) < 0.001, f"Expected ~427.2896, got {res['H12']}"

    # Verify formatting (PRD states results should have 4 decimal places where possible)
    # the function `calculate_state` returns rounded values

    # If we got here, tests passed
    print("All backend tests passed successfully!")

if __name__ == "__main__":
    test_engine()
