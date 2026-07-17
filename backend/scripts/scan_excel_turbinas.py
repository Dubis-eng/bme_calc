import os
import openpyxl

def main():
    scripts_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(os.path.dirname(scripts_dir))
    xlsx_path = os.path.join(project_root, "backend", "data", "reference", "MEMORIAL CALCULO.xlsx")
    wb = openpyxl.load_workbook(xlsx_path, read_only=True)
    sheet = wb["MEMORIAL CALCULO"]
    print("Scanning cells for 'turbina'...")
    for r in range(1, 1200):
        for c in range(1, 12):
            val = sheet.cell(r, c).value
            if val and "turbina" in str(val).lower():
                print(f"Row {r}, Col {c}: {val}")

if __name__ == "__main__":
    main()
