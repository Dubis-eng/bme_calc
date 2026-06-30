# Specification: Cascade Ordering of Variables (Sector -> Stage -> Control Point -> Variable)

## 1. Overview
This specification details the implementation of a professional, fully normalized database structure and frontend interface for sorting and reordering process sectors, stages (etapas), control points (pontos de controle), and variables in a cascade fashion.

Currently:
* **Sectors** have an explicit `ordem` field.
* **Stages** and **Control Points** are stored as raw text strings directly on each variable. There is no normalized entity or custom sorting mechanism.
* **Variables** are displayed in their database insertion order.

This feature will:
1. Normalize the database schema by introducing `Stage` and `ControlPoint` tables.
2. Maintain backward-compatible API payloads by dynamically resolving `etapa` and `ponto_controle` names on variable details.
3. Add bulk reordering endpoints to the API.
4. Implement a clean, accessible (WCAG-compliant) sorting interface in the frontend using "Move Up" / "Move Down" controls for stages, control points, and variables.

---

## 2. Database Schema & Normalization

### 2.1. New Tables
We introduce two new SQLModel tables:

1. **`Stage` (Etapa)**:
   * `id`: `uuid.UUID` (Primary Key)
   * `nome`: `str` (Stage name, indexed)
   * `sector_id`: `str` (Foreign Key to `sectors.id`, indexed)
   * `ordem`: `int` (Ordering index, indexed, default `0`)

2. **`ControlPoint` (Ponto de Controle)**:
   * `id`: `uuid.UUID` (Primary Key)
   * `nome`: `str` (Control point name, indexed)
   * `stage_id`: `uuid.UUID` (Foreign Key to `stages.id`, indexed)
   * `ordem`: `int` (Ordering index, indexed, default `0`)

### 2.2. Modified Table
We update the **`Variable`** table:
* Add `control_point_id`: `Optional[uuid.UUID]` (Foreign Key to `control_points.id`, indexed)
* Add `ordem`: `int` (Ordering index, indexed, default `0`)
* Deprecate/make nullable the old `etapa` and `ponto_controle` columns (retained as nullable to ensure safe backward-compatibility).

---

## 3. Migration Plan

At startup, the system will run a schema and data migration:
1. Create `stages` and `control_points` tables.
2. Migrate existing variables:
   * Read the variable's `setor_id`, `etapa` (fallback to `"GERAL"` if empty), and `ponto_controle` (fallback to `"GERAL"` if empty).
   * Find or create the corresponding `Stage` for the sector.
   * Find or create the corresponding `ControlPoint` for the stage.
   * Associate the variable with the control point via `control_point_id`.
3. Auto-populate baseline `ordem` values:
   * Sort stages alphabetically within their sector, then assign `ordem = 10, 20, 30...`
   * Sort control points alphabetically within their stage, then assign `ordem = 10, 20, 30...`
   * Sort variables alphabetically by ID/ref within their control point, then assign `ordem = 10, 20, 30...`

---

## 4. Backend Updates

### 4.1. Variable CRUD & Auto-Creation
When creating or updating a variable via the API, the backend will:
1. Ensure the Sector exists (already implemented).
2. Check if a `Stage` with the given `etapa` name exists under the sector. If not, create it and auto-calculate its `ordem` (`max(ordem) + 10`).
3. Check if a `ControlPoint` with the given `ponto_controle` name exists under that stage. If not, create it and auto-calculate its `ordem`.
4. Associate the variable with the `ControlPoint` ID and auto-calculate its variable `ordem` if not specified.

### 4.2. API Response Serialization
The `VariableDetail` schema returned by variables endpoints will fetch the stage name and control point name via relationships and populate `etapa` and `ponto_controle` fields. This ensures all existing frontend pages continue to work without breaking.

### 4.3. Reordering Endpoints
To support sorting in the UI, we implement three transaction-safe bulk reorder endpoints:
* **`PATCH /api/sectors/{sector_id}/stages/reorder`**: Receives an ordered list of Stage IDs (`List[uuid.UUID]`) and reassigns their `ordem` field consecutively (10, 20, 30...).
* **`PATCH /api/stages/{stage_id}/control-points/reorder`**: Receives an ordered list of Control Point IDs (`List[uuid.UUID]`) and reassigns their `ordem` consecutively.
* **`PATCH /api/control-points/{cp_id}/variables/reorder`**: Receives an ordered list of Variable IDs (`List[str]`) and reassigns their `ordem` consecutively.

---

## 5. Frontend Updates

### 5.1. UI Reordering Controls (Sleek Drag-and-Drop + WCAG-Compliant Buttons)
To ensure both rapid reordering for lists of +1000 variables and complete accessibility (WCAG) compliance, we implement a dual-reordering interface:

1. **Native HTML5 Drag-and-Drop**:
   * Drag handles (using a sleek vertical grip icon `⋮⋮` and `cursor-grab`) will be added to the Stage headers, Control Point bars, and Variable table rows.
   * Elements will be marked as `draggable`. Using native React event handlers (`onDragStart`, `onDragOver`, `onDragLeave`, `onDrop`), users can drag and drop to reorder elements:
     * **Stages** within the active Sector.
     * **Control Points** within a Stage.
     * **Variables** within a Control Point.
   * Dropping an element will trigger a reordering transaction: the frontend will instantly calculate the new sequence of IDs, perform a re-render for zero-latency visual feedback, and call the respective backend `PATCH` endpoint to save the persistent order.

2. **Keyboard-Accessible Control Buttons (WCAG Fallback)**:
   * Accessible Up/Down arrow buttons (hidden from screen reader visual display or with descriptive `aria-label` tags) will sit next to the drag handles.
   * These buttons allow users to reorder using keyboard triggers (`Enter` / `Space` key handlers) and serve as a reliable fallback for mouse-free navigation.

### 5.2. Query Sorting
The variables list page will request variables sorted by hierarchy:
1. Sector Order (`Sector.ordem`)
2. Stage Order (`Stage.ordem`)
3. Control Point Order (`ControlPoint.ordem`)
4. Variable Order (`Variable.ordem`)

---

## 6. Verification Plan

### 6.1. Automated Tests
* Add pytest unit tests verifying:
  * Database schema migrations.
  * Auto-creation of Stage/ControlPoint entities during variable CRUD.
  * Reordering endpoints behavior and validation (e.g. ensuring only stages belonging to the same sector can be reordered).
  * Hierarchy queries output items in correct order.

### 6.2. Manual Verification
* Create variables in new/existing stages, verify DB entities are populated.
* Click "Move Up" / "Move Down" on a Stage, verify order persistence and re-render.
* Verify Excel/PDF exports reflect the configured cascade order.
