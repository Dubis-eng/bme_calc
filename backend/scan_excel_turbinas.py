import openpyxl

def main():
    wb = openpyxl.load_workbook("MEMORIAL CALCULO.xlsx", read_only=True)
    sheet = wb["MEMORIAL CALCULO"]
    print("Scanning cells for 'turbina'...")
    for r in range(1, 1200):
        for c in range(1, 12):
            val = sheet.cell(r, c).value
            if val and "turbina" in str(val).lower():
                print(f"Row {r}, Col {c}: {val}")

if __name__ == "__main__":
    main()
