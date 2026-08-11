# Tech Stack & Implementation Rules

When generating code or UI components, you **MUST** strictly adhere to the following technology choices and patterns.

## Core Stack

- **Framework:** React 18+ (TypeScript is mandatory)
- **Styling Engine:** Tailwind CSS (Mandatory)
- **Component Library:** shadcn/ui primitives.
- **Icons:** Lucide React.
- **State Management:** TanStack Query (React Query) for server state.

## UI Patterns

### 1. Data Tables & Lists

- **Row Expansion:** Use chevron icons for collapsible rows.
- **Badges:** Use the status colors defined in `design-tokens.json`.
- **Empty States:** Clean illustration or icon with a clear "Add item" call to action.

### 2. Forms & Inputs

- **Labels:** Floating labels or consistently placed above inputs.
- **Validation:** Inline validation using red-500 for errors.

### 3. Layout & Navigation

- **Sidebar:** Clean, collapsible sidebar with active state highlighting.
- **Modals:** Slide-over panels (Drawers) or centered modals with a clear overlay.

## Forbidden Patterns

- No hardcoded hex codes; use the Tailwind theme extending the design tokens.
- No bulky CSS frameworks outside of Tailwind.
- Avoid generic browser default scrollbars; use subtle Tailwind-styled ones.
