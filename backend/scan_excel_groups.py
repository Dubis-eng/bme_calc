import openpyxl

def main():
    wb = openpyxl.load_workbook("MEMORIAL CALCULO.xlsx", read_only=True)
    sheet = wb["MEMORIAL CALCULO"]
    print("Scanning cells for turbine groups...")
    found_groups = set()
    for r in range(1, 1200):
        val = sheet.cell(r, 4).value # Column D is PONTO DE CONTROLE
        if val and ("entrada" in str(val).lower() or "saída" in str(val).lower() or "turbina" in str(val).lower()):
            val_str = str(val).strip()
            if val_str not in found_groups:
                found_groups.add(val_str)
                print(f"Row {r}: {val_str}")

if __name__ == "__main__":
    main()
