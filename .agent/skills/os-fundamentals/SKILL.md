---
name: os-fundamentals
description: Core operating system terminal patterns and scripting rules. Combines Bash/Linux and PowerShell/Windows expertise. The agent MUST read CODEBASE.md to determine the host OS before executing commands.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# OS Fundamentals & Terminal Patterns

> CRITICAL: Before writing any script or executing any terminal command, verify the target OS (Windows vs macOS/Linux) defined in `CODEBASE.md`. 
> If the OS is Windows, apply PowerShell rules. If macOS/Linux, apply Bash rules.

---

## 💻 Windows / PowerShell Patterns

When the environment is Windows, strict PowerShell rules apply.

### 1. Operator Syntax Rules (Parentheses)
- **❌ Wrong**: `if (Test-Path "a" -or Test-Path "b")`
- **✅ Correct**: `if ((Test-Path "a") -or (Test-Path "b"))`
- **Rule**: Each cmdlet call MUST be in parentheses when using logical operators.

### 2. Unicode/Emoji Restriction (CRITICAL)
- **❌ Don't Use**: ✓, ✗, 🔴, ⚠️
- **✅ Use**: `[OK]`, `[X]`, `[WARN]`, `[INFO]`
- **Rule**: Use ASCII characters exclusively in PowerShell scripts to avoid encoding errors.

### 3. File Paths and JSON
- **Paths**: Use `Join-Path` for cross-platform safety (e.g., `Join-Path $env:USERPROFILE "file.txt"`).
- **JSON**: Always specify `-Depth` (e.g., `ConvertTo-Json -Depth 10`).

### 4. PowerShell Boilerplate
```powershell
Set-StrictMode -Version Latest
$ErrorActionPreference = "Continue"

try {
    # Logic here
    Write-Output "[OK] Done"
    exit 0
} catch {
    Write-Warning "Error: $_"
    exit 1
}
```

---

## 🐧 Linux & macOS / Bash Patterns

When the environment is Unix-based, apply Bash patterns.

### 1. Operator Syntax
- `;` : Run sequentially (`cmd1; cmd2`)
- `&&` : Run if previous succeeded (`make build && make deploy`)
- `||` : Run if previous failed (`npm test || echo "Failed"`)

### 2. Text Processing & Utilities
- **Find**: `find . -name "*.js" -type f`
- **Search**: `grep -rn "TODO" src/`
- **Process List**: `ps aux | grep node`
- **Kill Port**: `kill -9 $(lsof -t -i :3000)`

### 3. Bash Boilerplate
```bash
#!/bin/bash
set -euo pipefail  # Exit on error, undefined var, pipe fail

# Functions
log_info() { echo "[INFO] $1"; }
log_error() { echo "[ERROR] $1" >&2; }

main() {
    log_info "Starting..."
    # Logic
    log_info "Done!"
}

main "$@"
```

### 4. Common Checks
```bash
# Check if command exists
if command -v node &> /dev/null; then echo "Node installed"; fi

# Default variable value
NAME=${1:-"default_value"}
```

---

## 🔄 Command Equivalents (Cheat Sheet)

| Task | PowerShell (Windows) | Bash (Linux/macOS) |
|------|----------------------|--------------------|
| List files | `Get-ChildItem -Force` | `ls -la` |
| Find files | `Get-ChildItem -Recurse` | `find . -type f` |
| Read Env Var | `$env:VAR_NAME` | `$VAR_NAME` |
| Null check | `if ($x)` | `if [ -n "$x" ]` |
| Ignore error | `-ErrorAction SilentlyContinue` | `2>/dev/null` |
| Empty array | `$arr = @()` | `arr=()` |

---

## 🚨 Final Rule
Never guess the OS. If unsure, run `ruby -e 'puts RUBY_PLATFORM'` or check `CODEBASE.md`. Execute the correct flavor of script.
