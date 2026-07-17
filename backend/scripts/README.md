# 🛠️ Scripts Utilitários de Operação e Dados

Esta pasta contém scripts utilitários auxiliares que servem para manutenção, conversão de dados do Excel e exportação de banco de dados. Eles **não fazem parte do código de produção** rodado no servidor FastAPI.

---

## 📋 Lista de Scripts e Uso

### 1. `convert_xlsx_to_json.py`
* **Propósito:** Lê a planilha `MEMORIAL CALCULO.xlsx` (dados de engenharia e fórmulas de balanço de massa) e a converte para o formato JSON estruturado `memorial_de_calculo_balanco.json` utilizado como semente (seed) do banco de dados e fallback no frontend.
* **Execução:**
  ```bash
  python backend/scripts/convert_xlsx_to_json.py
  ```

### 2. `export_database_to_json.py`
* **Propósito:** Exporta o estado atual das variáveis, equações e resultados de um cenário no banco de dados SQLite para o arquivo JSON estruturado, permitindo versionar ou salvar o estado atualizado do modelo de cálculo.
* **Execução:**
  ```bash
  python backend/scripts/export_database_to_json.py
  ```

### 3. `scan_excel_groups.py`
* **Propósito:** Varre a planilha de referência buscando e identificando agrupamentos de variáveis, setores e relações de fórmulas. Útil para auditoria do modelo matemático.
* **Execução:**
  ```bash
  python backend/scripts/scan_excel_groups.py
  ```

### 4. `scan_excel_turbinas.py`
* **Propósito:** Script especializado para inspecionar os blocos específicos de turbinas de contrapressão e condensação dentro da planilha, mapeando suas variáveis e constantes de calibração.
* **Execução:**
  ```bash
  python backend/scripts/scan_excel_turbinas.py
  ```

---

## ⚙️ Modo de Execução Recomendado

Execute os scripts a partir da pasta raiz `backend/` usando o Python do ambiente virtual para garantir que as dependências (`openpyxl`, `sqlmodel`, etc.) e o path do pacote `src` sejam localizados:

```bash
# Executando convert_xlsx_to_json a partir da pasta backend/
.venv/Scripts/python scripts/convert_xlsx_to_json.py
```
