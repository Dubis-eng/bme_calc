# Audit Report — {{PROJECT_NAME}}
> **Generated:** {{DATE}} by `/reverse-engineer`
> **Analyzed Path:** `{{PROJECT_ROOT}}`
> **Tech Stack:** {{TECH_STACK_SUMMARY}}
> **Total Files Scanned:** {{TOTAL_FILES}}

---

## Executive Summary

| Category | Status | Issues Found |
|---|---|---|
| Documentation | {{DOC_STATUS}} | {{DOC_ISSUES}} |
| Architecture | {{ARCH_STATUS}} | {{ARCH_ISSUES}} |
| Technical Debt | {{DEBT_STATUS}} | {{DEBT_ISSUES}} |
| Test Coverage | {{TEST_STATUS}} | {{TEST_ISSUES}} |
| Dependencies | {{DEP_STATUS}} | {{DEP_ISSUES}} |
| Security | {{SEC_STATUS}} | {{SEC_ISSUES}} |
| Module Map | {{MAP_STATUS}} | — |

---

## Section 1: Documentation Gap Analysis

### Docs Created (New)

> The following files did not exist and were generated from templates:

| File | Template Used | Status |
|---|---|---|
| `docs/{{DOC_CREATED_1}}` | `{{TEMPLATE_1}}` | CREATED |
| `docs/{{DOC_CREATED_2}}` | `{{TEMPLATE_2}}` | CREATED |

### Docs Requiring Updates

> The following files exist but may be outdated. Review the diffs below:

#### `docs/ARCHITECTURE.md`

**Issue:** {{ARCH_ISSUE_DESCRIPTION}}

```diff
- {{OLD_ARCH_LINE_1}}
+ {{NEW_ARCH_LINE_1}}
- {{OLD_ARCH_LINE_2}}
+ {{NEW_ARCH_LINE_2}}
```

> ACTION: Review and apply the diff above, or run `/reverse-engineer --update-docs` to regenerate.

#### `docs/{{OUTDATED_DOC_2}}`

**Issue:** {{OUTDATED_DOC_2_ISSUE}}

```diff
- {{OLD_LINE_1}}
+ {{NEW_LINE_1}}
```

---

## Section 2: Architecture Insights

**Detected Pattern:** {{DETECTED_ARCH_PATTERN}}

### Naming Conventions

| Convention | Usage | Consistency |
|---|---|---|
| Functions | `{{FUNC_CONVENTION}}` (e.g., camelCase) | {{FUNC_CONSISTENCY}}% consistent |
| Variables | `{{VAR_CONVENTION}}` | {{VAR_CONSISTENCY}}% consistent |
| Files | `{{FILE_CONVENTION}}` | {{FILE_CONSISTENCY}}% consistent |

### Inconsistencies Found

| File | Pattern Violation | Expected | Found |
|---|---|---|---|
| `{{INCONS_FILE_1}}` | {{INCONS_TYPE_1}} | `{{EXPECTED_1}}` | `{{FOUND_1}}` |
| `{{INCONS_FILE_2}}` | {{INCONS_TYPE_2}} | `{{EXPECTED_2}}` | `{{FOUND_2}}` |

### Module Dependency Map

```
{{MODULE_1}} → {{MODULE_2}} → {{MODULE_3}}
     ↓
{{MODULE_4}} → {{MODULE_5}}
```

---

## Section 3: Technical Debt (GEMINI.md P0)

### Files Exceeding 300 Lines

| File | Lines | Violation | Suggested Action |
|---|---|---|---|
| `{{LONG_FILE_1}}` | {{LONG_LINES_1}} | +{{OVER_LINES_1}} over limit | Split into `{{SPLIT_SUGGESTION_1}}` |
| `{{LONG_FILE_2}}` | {{LONG_LINES_2}} | +{{OVER_LINES_2}} over limit | Split into `{{SPLIT_SUGGESTION_2}}` |

### Functions Exceeding 40 Lines

| File | Function | Lines | Suggested Refactor |
|---|---|---|---|
| `{{FUNC_FILE_1}}` | `{{FUNC_NAME_1}}` | {{FUNC_LINES_1}} | Extract `{{EXTRACT_NAME_1}}` |

### Nesting Exceeding 3 Levels

| File | Approx. Line | Nesting Level | Suggestion |
|---|---|---|---|
| `{{NEST_FILE_1}}` | L{{NEST_LINE_1}} | {{NEST_LEVEL_1}} | Use early return / guard clause |

---

## Section 4: Test Coverage

| Module | Test Files Found | Coverage Estimate | Status |
|---|---|---|---|
| `{{MOD_1}}` | {{TEST_FILES_1}} | {{COV_1}}% | {{COV_STATUS_1}} |
| `{{MOD_2}}` | {{TEST_FILES_2}} | {{COV_2}}% | {{COV_STATUS_2}} |

### Untested Modules

- `{{UNTESTED_1}}` — No test files detected
- `{{UNTESTED_2}}` — No test files detected

---

## Section 5: Dependency Health

### Outdated Packages

| Package | Current | Latest | Type | Risk |
|---|---|---|---|---|
| `{{PKG_1}}` | `{{CUR_1}}` | `{{LAT_1}}` | Major | High |
| `{{PKG_2}}` | `{{CUR_2}}` | `{{LAT_2}}` | Minor | Low |

### Security Vulnerabilities

> CRITICAL: The following issues were detected. Do NOT expose secrets in this report.

| Severity | Type | Location | Detail |
|---|---|---|---|
| {{SEV_1}} | {{VULN_TYPE_1}} | `{{VULN_LOC_1}}` | {{VULN_DESC_1}} |
| {{SEV_2}} | Hardcoded Secret | `{{SECRET_LOC}}` | Value: [REDACTED] — Remove and use environment variable |

---

## Section 6: Internal Module Dependency Map

> Full dependency graph inferred from import statements.

```
{{FULL_DEPENDENCY_MAP}}
```

### Circular Dependencies Detected

| Cycle | Files Involved |
|---|---|
| Cycle 1 | `{{CYCLE_1_FILE_A}}` ↔ `{{CYCLE_1_FILE_B}}` |

---

## Recommended Next Steps

1. **[CRITICAL]** {{CRITICAL_ACTION_1}}
2. **[HIGH]** {{HIGH_ACTION_1}}
3. **[MEDIUM]** {{MEDIUM_ACTION_1}}
4. **[LOW]** {{LOW_ACTION_1}}

---

> Run `/reverse-engineer` again after applying fixes to regenerate this report.
