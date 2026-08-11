#!/usr/bin/env python3
"""
i18n Checker - Antigravity Kit
================================
Verifica a completude de internacionalização do projeto:
- Detecta strings hardcoded longas em componentes (possíveis textos não traduzidos)
- Valida existência de arquivos de locale
- Verifica cobertura de chaves entre arquivos de tradução
- Detecta uso de bibliotecas i18n (next-intl, i18next, react-intl, etc.)

Usage:
    python i18n_checker.py <project_path>
"""

import os
import sys
import json
import re
from pathlib import Path

# Reconfigura stdout e stderr para usar UTF-8 no terminal
try:
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    if hasattr(sys.stderr, 'reconfigure'):
        sys.stderr.reconfigure(encoding='utf-8')
except Exception:
    pass

EXIT_OK   = 0
EXIT_FAIL = 1

KNOWN_I18N_LIBS = {
    "i18next", "react-i18next", "next-intl",
    "react-intl", "vue-i18n", "svelte-i18n",
}
LOCALE_DIRS  = ["locales", "translations", "i18n", "messages", "public/locales"]
HARDCODE_MIN = 20
SOURCE_EXTS  = {".tsx", ".jsx", ".ts", ".js", ".svelte", ".vue"}
IGNORE_DIRS  = {"node_modules", ".git", "dist", "build", ".next", "__pycache__"}

# ─── Detecção de libs i18n ───────────────────────────────────────────────────

def detect_i18n_lib(project_path: Path) -> str | None:
    pkg_file = project_path / "package.json"
    if not pkg_file.exists():
        return None
    try:
        data     = json.loads(pkg_file.read_text(encoding="utf-8"))
        all_deps = {**data.get("dependencies", {}), **data.get("devDependencies", {})}
        for lib in KNOWN_I18N_LIBS:
            if lib in all_deps:
                return lib
    except (json.JSONDecodeError, OSError):
        pass
    return None


# ─── Verificação de locale files ─────────────────────────────────────────────

def find_locale_dir(project_path: Path) -> Path | None:
    for candidate in LOCALE_DIRS:
        locale_dir = project_path / candidate
        if locale_dir.exists() and locale_dir.is_dir():
            return locale_dir
    return None


def check_locale_key_coverage(locale_dir: Path) -> list[str]:
    json_files = list(locale_dir.rglob("*.json"))
    if len(json_files) < 2:
        return []

    issues: list[str]            = []
    key_sets: dict[str, set] = {}

    for locale_file in json_files:
        try:
            data = json.loads(locale_file.read_text(encoding="utf-8"))
            key_sets[locale_file.stem] = set(_flatten_keys(data))
        except (json.JSONDecodeError, OSError):
            issues.append(f"LOCALE INVÁLIDO: {locale_file.name}")

    if len(key_sets) < 2:
        return issues

    all_keys  = set.union(*key_sets.values())
    reference = next(iter(key_sets))

    for locale, keys in key_sets.items():
        if locale == reference:
            continue
        missing = all_keys - keys
        if missing:
            sample = list(missing)[:3]
            issues.append(f"CHAVES AUSENTES em '{locale}': {sample}")

    return issues


def _flatten_keys(obj: dict, prefix: str = "") -> list[str]:
    keys = []
    for key, value in obj.items():
        full_key = f"{prefix}.{key}" if prefix else key
        if isinstance(value, dict):
            keys.extend(_flatten_keys(value, full_key))
        else:
            keys.append(full_key)
    return keys


# ─── Detecção de hardcoded strings ───────────────────────────────────────────

def find_hardcoded_strings(project_path: Path) -> list[str]:
    issues  = []
    pattern = re.compile(r'["\'`]([A-Za-z][^"\'`\n]{' + str(HARDCODE_MIN) + r',})["\']')

    for root, dirs, files in os.walk(project_path):
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
        for file_name in files:
            file_path = Path(root) / file_name
            if file_path.suffix not in SOURCE_EXTS:
                continue
            _check_file_for_hardcodes(file_path, pattern, issues)
            if len(issues) >= 10:
                return issues

    return issues


def _check_file_for_hardcodes(file_path: Path, pattern: re.Pattern, issues: list[str]):
    try:
        content = file_path.read_text(encoding="utf-8", errors="ignore")
        matches = pattern.findall(content)
        if matches:
            sample = matches[0][:50]
            issues.append(
                f"POSSÍVEL HARDCODE em {file_path.name}: \"{sample}\" "
                f"({len(matches)} ocorrência(s))"
            )
    except OSError:
        pass


# ─── Relatório ───────────────────────────────────────────────────────────────

def print_report(lib: str | None, locale_dir: Path | None, issues: list[str]):
    print("\n=== i18n Checker ===\n")
    print(f"  Lib detectada   : {lib or 'nenhuma'}")
    print(f"  Diretório locale: {locale_dir or 'não encontrado'}\n")
    if not issues:
        print("✅ Nenhum problema de i18n detectado.")
        return
    for issue in issues:
        print(f"  ❌ {issue}")


def main() -> int:
    if len(sys.argv) < 2:
        print("Usage: i18n_checker.py <project_path>")
        return EXIT_FAIL

    project_path = Path(sys.argv[1]).resolve()
    if not project_path.exists():
        print(f"❌ Caminho não encontrado: {project_path}")
        return EXIT_FAIL

    lib        = detect_i18n_lib(project_path)
    locale_dir = find_locale_dir(project_path)
    issues     = (
        check_locale_key_coverage(locale_dir)
        if locale_dir
        else find_hardcoded_strings(project_path)
    )

    print_report(lib, locale_dir, issues)
    return EXIT_FAIL if issues else EXIT_OK


if __name__ == "__main__":
    sys.exit(main())
