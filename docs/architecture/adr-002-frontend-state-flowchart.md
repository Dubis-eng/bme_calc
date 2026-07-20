# ADR-002: Frontend State & React Flow Canvas Architecture

## Status
Accepted

## Context
The user interface requires:
1. Interactive process flowcharts (10 official industrial sectors + custom flowchart sectors).
2. Reactive synchronization between variable grids, details panel, settings, and the flowcharts.
3. Easy layout editing (node movement, edge addition, custom node labels/values).
4. Prevention of accidental modifications.

## Options Considered

| Option | Pros | Cons | Complexity | When Valid |
|--------|------|------|------------|------------|
| **Option A**: Heavyweight Redux State + Custom Canvas Renderer (SVG/D3) | Absolute customization, infinite layout features. | High boilerplate, complex canvas drag-and-drop implementation, long development timeline. | High | Custom graphics suites, specialized visual editors. |
| **Option B**: Jotai State + React Flow library (Chosen) | Atomic state model (Jotai atoms are light and reactive), React Flow provides standard dragging, connecting, and custom nodes out-of-the-box. | React Flow requires external dependencies and version tracking. | Medium | Modern React SPAs with node/graph-based visual components. |

## Decision
**Chosen**: Option B (Jotai State + React Flow library).

## Rationale
1. **React Flow** simplifies modeling industrial topologies, supporting custom nodes (`processNode`, `ioNode`, `hubNode`).
2. **Jotai** manages lightweight state (e.g. `currentScenarioAtom`, `selectedFieldIdAtom`) avoiding component re-rendering waterfalls.
3. A strict **Layout Lock/Unlock** toggle prevents users from accidentally deleting edges or moving nodes during routine calculations.

## Trade-offs
- **Accepted**: React Flow adds some bundle overhead.
- **Why Acceptable**: BME Calc is an internal corporate desktop/web dashboard, so slight bundle weight increases do not affect UX, while development velocity and interactive capabilities are vastly superior.

## Consequences
- **Positive**: Rich responsive canvas, dynamic nodes showing live values, and custom sectors isolated from math schemas.
- **Negative**: Coordination between graph selections and side panels requires careful Jotai state mapping.
- **Mitigation**: Standardized atoms in `frontend/src/state/atoms.ts`.
