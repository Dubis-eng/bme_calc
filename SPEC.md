# Specification: Decimal Rounding and Percentage Standardization in Variables

## 1. Overview
Currently, the Energy and Mass Balance Calculator does not enforce a standardized number of decimal places or format type (percentage vs. raw numbers) on variables. This results in inconsistent visual representations across the Frontend interface, Excel exports, and PDF reports.
Additionally, variables expressing percentages (%) are represented inconsistently in equations (some as decimal values like `0.10` representing `10%`, others as integer values like `10` because equations divide them by `100`).

This specification defines a metadata-driven approach to:
1. Allow users to define a custom number of decimal rounding places for each variable's display representation.
2. Standardize percentage representation visually on the frontend and export modules without modifying existing calculation formulas or breaking mathematical expressions.

---

## 2. Requirements & Design Decisions

### 2.1. Decimal Rounding
* **Database Representation**: Values are stored with full floating-point precision (raw floats) in the `results` table. No rounding is applied when writing to the database or during AST calculation loops.
* **Variable Metadata**:
  * Add a `casas_decimais` (integer, nullable) field to the `variables` table.
  * If `casas_decimais` is `null`, fallback to a system default (e.g., `2` decimal places).
  * Minimum value: `0`. Maximum value: `6`.
* **Visual Formatting**: Rounding is applied strictly when rendering values in UI inputs, tables, dashboard charts, PDF reports, and Excel sheets.

### 2.2. Percentage (%) Representation
* **Variable Metadata**:
  * Add a `tipo_exibicao` field (string/enum: `NUMBER` or `PERCENTAGE`) to the `variables` table.
  * Add a `percent_base` field (string/enum: `DECIMAL` or `INTEGER`) to the `variables` table, applicable only when `tipo_exibicao` is `PERCENTAGE`.
* **Behavior by Base Type**:
  * **`DECIMAL` Base**:
    * Calculated/Stored value in DB: e.g., `0.10`.
    * Formatted UI/Export representation: `10.00%` (using the specified `casas_decimais` scaled).
    * UI Input behavior: The user types `10`, the input shows `10%`, and the system automatically saves `0.10` to the database.
  * **`INTEGER` Base**:
    * Calculated/Stored value in DB: e.g., `10`.
    * Formatted UI/Export representation: `10.00%`.
    * UI Input behavior: The user types `10`, the input shows `10%`, and the system saves `10` to the database.

---

## 3. Proposed Changes

### 3.1. Backend Updates (`backend/`)
* **`backend/database.py`**:
  * Add columns to `Variable`:
    * `casas_decimais: Optional[int] = Field(default=None, sa_column_kwargs={"nullable": True})`
    * `tipo_exibicao: str = Field(default="NUMBER", sa_column_kwargs={"nullable": False})`
    * `percent_base: str = Field(default="DECIMAL", sa_column_kwargs={"nullable": False})`
  * Add corresponding schema migration in `backend/migrations.py` to add these columns and assign default values (`casas_decimais = null`, `tipo_exibicao = 'NUMBER'`, `percent_base = 'DECIMAL'`).
* **`backend/schemas.py`**:
  * Add `casas_decimais`, `tipo_exibicao`, and `percent_base` to `VariableCreate`, `VariableUpdate`, and `VariableDetail`.
* **`backend/seeding.py` / Initial Seed Data**: Ensure metadata fields are seeded appropriately.
* **`backend/exports.py`**:
  * Format values in PDF and Excel sheets using the custom rounding rules and suffixing `%` for variables with `tipo_exibicao == 'PERCENTAGE'`.

### 3.2. Frontend Updates (`frontend/src/`)
* **Variable Registration Component (`VariableModal.tsx`)**:
  * Add fields to edit `casas_decimais` (number input, 0-6), `tipo_exibicao` (dropdown: Número / Percentual), and `percent_base` (dropdown: Decimal (0.10) / Inteiro (10) - visible only if Percentual is selected).
* **Scenario Grid & Input fields (`SectorModules.tsx` / `App.tsx`)**:
  * Format cells/inputs according to variable configuration:
    * If `PERCENTAGE` with `DECIMAL` base: display `value * 100`, edit as `value * 100` and send `value / 100` to backend.
    * If `PERCENTAGE` with `INTEGER` base: display `value`, edit as `value` and send `value` to backend.
    * Append `%` badge or text to the field.
    * Apply `casas_decimais` rounding using `.toFixed(casas_decimais ?? 2)`.

---

## 4. Verification Plan

### 4.1. Automated Tests
* Create unit/integration tests in `backend/test_variables_formatting.py` (or existing test files) verifying:
  * Variable creation with `casas_decimais`, `tipo_exibicao`, and `percent_base`.
  * Export formatting maps apply correct rounding and % suffix.
  * Formula execution persists full floating-point accuracy despite rounding configurations.

### 4.2. Manual Verification
* Access Variable modal, update a variable to display as PERCENTAGE (Decimal) with 3 decimal places.
* Open the scenario page, modify the variable to 12.345%, verify that it displays formatted correctly.
* Run calculations and check if other dependent variables receive the correct decimal representation (`0.12345`).
* Export PDF/Excel and check visual compliance.
