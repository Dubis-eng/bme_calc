#!/usr/bin/env python3
"""
API Validator - Shell AST Delegator.
Instead of fragile regex parsing, this script delegates API validation 
to native, AST-based tools (ESLint, Ruff, Spectral).
"""
import sys
import subprocess
from pathlib import Path
import json

def run_cmd(cmd, cwd=None):
    try:
        result = subprocess.run(cmd, shell=True, check=False, capture_output=True, text=True, cwd=cwd)
        return result.returncode, result.stdout, result.stderr
    except Exception as e:
        return 1, "", str(e)

def validate_openapi(project_path: Path):
    print("\n🔍 Checking for OpenAPI/Swagger schemas...")
    schemas = list(project_path.glob("**/openapi.yaml")) + list(project_path.glob("**/swagger.yaml")) + list(project_path.glob("**/openapi.json"))
    schemas = [s for s in schemas if 'node_modules' not in str(s) and '.venv' not in str(s)]
    
    if not schemas:
        print("   [INFO] No OpenAPI schemas found.")
        return 0

    print(f"   [INFO] Found schemas: {[s.name for s in schemas]}")
    print("   [RUN] Executing AST Validation via Spectral...")
    
    for schema in schemas:
        code, out, err = run_cmd(f"npx @stoplight/spectral-cli lint {schema.name}", cwd=schema.parent)
        if code != 0:
            print(f"\n❌ [FAILED] Spectral validation for {schema.name}:")
            print(out or err)
            return 1
        print(f"✅ [OK] {schema.name} passed Spectral AST validation.")
    return 0

def validate_nodejs(project_path: Path):
    pkg_json = project_path / "package.json"
    if not pkg_json.exists():
        return 0
    
    print("\n🔍 Node.js project detected. Checking AST Linter (ESLint/Prettier)...")
    try:
        data = json.loads(pkg_json.read_text())
        scripts = data.get("scripts", {})
        if "lint" in scripts:
            print("   [RUN] npm run lint...")
            code, out, err = run_cmd("npm run lint", cwd=project_path)
            if code != 0:
                print(f"\n❌ [FAILED] ESLint validation failed:")
                print(out)
                return 1
            print("✅ [OK] ESLint AST validation passed.")
            return 0
        else:
            print("⚠️ [WARNING] No 'lint' script found in package.json. Naive regex is BANNED. Please configure ESLint.")
            return 0
    except Exception as e:
        print(f"❌ [ERROR] Reading package.json: {e}")
        return 1

def validate_python(project_path: Path):
    if not (project_path / "requirements.txt").exists() and not (project_path / "pyproject.toml").exists():
        return 0

    print("\n🔍 Python project detected. Checking AST Linter (Ruff/MyPy)...")
    # Try Ruff first
    code, out, err = run_cmd("ruff check .", cwd=project_path)
    if 'command not found' not in err.lower() and 'not recognized' not in err.lower():
        if code != 0:
            print(f"\n❌ [FAILED] Ruff AST validation failed:")
            print(out)
            return 1
        print("✅ [OK] Ruff AST validation passed.")
        return 0
    
    print("⚠️ [WARNING] Ruff not installed. Naive regex is BANNED. Please install Ruff/Flake8.")
    return 0

def main():
    target = sys.argv[1] if len(sys.argv) > 1 else "."
    project_path = Path(target)
    
    print("\n" + "=" * 60)
    print(" 🛡️  API VALIDATOR (AST-NATIVE) ")
    print("=" * 60)
    
    errors = 0
    
    errors += validate_openapi(project_path)
    
    is_node = (project_path / "package.json").exists()
    is_python = (project_path / "requirements.txt").exists() or (project_path / "pyproject.toml").exists()
    
    if is_node:
        errors += validate_nodejs(project_path)
    elif is_python:
        errors += validate_python(project_path)
    else:
        print("\n[INFO] Neither Node.js nor Python detected. Ensure you have AST linters configured for your language.")

    print("\n" + "=" * 60)
    if errors == 0:
        print("✅ [SUCCESS] All AST validations passed (or gracefully warned).")
        sys.exit(0)
    else:
        print("❌ [BLOCKED] Structural AST errors found. Fix them before continuing.")
        sys.exit(1)

if __name__ == "__main__":
    main()
