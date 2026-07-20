# ADR-001: AST Parser & Topological Solver (NetworkX) for Excel Formulas

## Status
Accepted

## Context
The application needs to evaluate spreadsheet-style equations for a Mass and Energy Balance Calculator. The system must support variables whose inputs depend on other variables, compute them in the correct sequence, detect cyclic dependencies (e.g., process recycles), and converge on a stable numeric state.

## Options Considered

| Option | Pros | Cons | Complexity | When Valid |
|--------|------|------|------------|------------|
| **Option A**: Integration with a headless spreadsheet engine (e.g., Excel/LibreOffice) | Complete out-of-the-box Excel compatibility. | Heavy execution overhead, difficult to orchestrate inside Docker, no fine-grained control over intermediate cycle steps. | High | Enterprise apps with static spreadsheets. |
| **Option B**: AST Parser + Topological Sorting via NetworkX (Chosen) | Extremely fast execution, fine-grained control over calculation loops, dependency analysis, and custom physical lookups (IAPWS). | Formulas must be parsed, normalized, and executed in Python manually. | Medium | Dynamic calculation engines requiring strict loop/recycle handling. |

## Decision
**Chosen**: Option B (AST Parser + Topological Sorting via NetworkX).

## Rationale
1. **NetworkX** allows us to construct a directed graph (`DiGraph`) of variables and edges to represent dependencies.
2. If the graph is acylic, it returns a fast topological execution order. If cyclic dependencies (recycles) are detected, we use an iterative convergence loop with a delta tolerance limit (default `0.0001`) to reach a stable balance.
3. Python's `ast` package permits parsing standard formulas (like `=A1+B1`) securely without using unsafe `eval()` calls.

## Trade-offs
- **Accepted**: We have to implement parsing logic and normalization for Excel-like behaviors (like converting `;` to `,`, handling case insensitivity, etc.) manually.
- **Why Acceptable**: Gives us total control over the math execution, enabling injection of specialized IAPWS-IF97 and alcohol density calculations directly into the AST evaluation chain.

## Consequences
- **Positive**: High speed, minimal memory footprint, and clear tracking of convergence errors.
- **Negative**: Formula syntax must conform strictly to the AST evaluator's supported functions.
- **Mitigation**: Syntactic checking and auditing tools in the UI to validate equations prior to submission.
