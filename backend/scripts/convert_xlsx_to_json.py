import os
import json
import openpyxl

def clean_value(val):
    if val is None:
        return ""
    if isinstance(val, (int, float)):
        # If it's an integer or float, keep it as is, or convert float to string with decimal dot
        # Let's return it as string to be consistent with the old JSON format
        return str(val)
    return str(val).strip()

def convert_xlsx_to_json():
    scripts_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(os.path.dirname(scripts_dir))
    xlsx_path = os.path.join(project_root, "backend", "data", "reference", "MEMORIAL CALCULO.xlsx")

    wb = openpyxl.load_workbook(xlsx_path, data_only=False)
    sheet = wb.active
    rows = list(sheet.iter_rows(values_only=True))
    
    header = rows[0]
    data_rows = rows[1:]
    
    json_data = []
    
    for row in data_rows:
        if not row or not row[0]:  # Skip if ID - REF is empty
            continue
            
        # Old JSON keys:
        # "ID - REF", "SETOR", "DEFINIÇÃO", "DESCRIÇÃO", "TIPO", "UNIDADE DE MEDIDA", "EQUAÇÕES E VALORES"
        
        # New Excel columns:
        # 0: ID - REF
        # 1: SETOR
        # 2: ETAPA
        # 3: PONTO DE CONTROLE
        # 4: DESCRIÇÃO
        # 5: TIPO
        # 6: UNIDADE DE MEDIDA
        # 7: EQUAÇÕES E VALORES
        
        id_ref = clean_value(row[0])
        setor = clean_value(row[1])
        etapa = clean_value(row[2])
        ponto_controle = clean_value(row[3])
        descricao = clean_value(row[4])
        tipo = clean_value(row[5])
        unidade = clean_value(row[6])
        eq_val = row[7]
        
        # Format the equations/values column:
        # If it starts with '=', it's a formula, keep it as is.
        # Otherwise, clean it up.
        if isinstance(eq_val, str) and eq_val.startswith('='):
            eq_val_str = eq_val.strip()
        else:
            eq_val_str = clean_value(eq_val)
            
        item = {
            "ID - REF": id_ref,
            "SETOR": setor,
            "ETAPA": etapa,
            "PONTO DE CONTROLE": ponto_controle,
            "DESCRIÇÃO": descricao,
            "TIPO": tipo,
            "UNIDADE DE MEDIDA": unidade,
            "EQUAÇÕES E VALORES": eq_val_str
        }
        json_data.append(item)
        
    # Write to target files
    targets = [
        os.path.join(project_root, "backend", "data", "memorial_de_calculo_balanco.json"),
        os.path.join(project_root, "docs", "memorial_de_calculo_balanco.json"),
        os.path.join(project_root, "frontend", "public", "memorial_de_calculo_balanco.json")
    ]
    
    for target in targets:
        try:
            dirname = os.path.dirname(target)
            if dirname:
                os.makedirs(dirname, exist_ok=True)
            with open(target, "w", encoding="utf-8") as f:
                json.dump(json_data, f, ensure_ascii=False, indent=4)
            print(f"Wrote to target: {target}")
        except Exception as e:
            print(f"Could not write to target {target}: {e}")
            
    print(f"Successfully converted {len(json_data)} variables and wrote to targets.")

if __name__ == "__main__":
    convert_xlsx_to_json()
