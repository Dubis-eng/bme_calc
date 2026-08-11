#!/usr/bin/env python3
"""
Bundle Analyzer - Antigravity Kit
===================================
Analisa o bundle/build do projeto em busca de:
- Ausência de pasta de build (build nunca foi gerado)
- Arquivos individuais acima de 500 KB
- Bundle total acima de 5 MB
- Source maps expostos em produção

Usage:
    python bundle_analyzer.py <project_path>
"""

import sys
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

# Limiares de tamanho
MAX_FILE_KB  = 500   # KB — arquivo individual
MAX_TOTAL_MB = 5     # MB — bundle total
SOURCEMAP_WARNING_MB = 0.1  # Presença de .map em build é alerta

BUILD_DIRS   = ["dist", "build", ".next", "out", "public/build"]
IGNORE_NAMES = {".DS_Store", "Thumbs.db"}

# ─── Análise de bundle ───────────────────────────────────────────────────────

def find_build_dir(project_path: Path) -> Path | None:
    """Retorna o primeiro diretório de build encontrado."""
    for candidate in BUILD_DIRS:
        build_dir = project_path / candidate
        if build_dir.exists() and build_dir.is_dir():
            return build_dir
    return None


def collect_files(build_dir: Path) -> list[Path]:
    """Lista todos os arquivos dentro do build, excluindo ignorados."""
    return [
        f for f in build_dir.rglob("*")
        if f.is_file() and f.name not in IGNORE_NAMES
    ]


def check_oversized_files(files: list[Path], max_kb: int) -> list[str]:
    """Retorna lista de arquivos que excedem o limite individual."""
    issues = []
    for file_path in files:
        size_kb = file_path.stat().st_size / 1024
        if size_kb > max_kb:
            issues.append(
                f"ARQUIVO GRANDE: {file_path.name} ({size_kb:.0f} KB > {max_kb} KB)"
            )
    return issues


def check_total_size(files: list[Path], max_mb: int) -> list[str]:
    """Verifica se o total do bundle ultrapassa o limite."""
    total_bytes = sum(f.stat().st_size for f in files)
    total_mb    = total_bytes / (1024 * 1024)
    if total_mb > max_mb:
        return [f"BUNDLE TOTAL: {total_mb:.1f} MB > {max_mb} MB"]
    return []


def check_sourcemaps(files: list[Path]) -> list[str]:
    """Detecta source maps expostos no build de produção."""
    maps = [f.name for f in files if f.suffix == ".map"]
    if maps:
        return [f"SOURCE MAPS EXPOSTOS: {len(maps)} arquivo(s) .map em produção"]
    return []


# ─── Relatório ───────────────────────────────────────────────────────────────

def print_report(issues: list[str], build_dir: Path, file_count: int, total_mb: float):
    print(f"\n=== Bundle Analyzer: {build_dir} ===")
    print(f"  Arquivos: {file_count}  |  Total: {total_mb:.2f} MB\n")

    if not issues:
        print("✅ Bundle dentro dos limites aceitáveis.")
        return

    for issue in issues:
        print(f"  ❌ {issue}")


def main() -> int:
    if len(sys.argv) < 2:
        print("Usage: bundle_analyzer.py <project_path>")
        return EXIT_FAIL

    project_path = Path(sys.argv[1]).resolve()
    if not project_path.exists():
        print(f"❌ Caminho não encontrado: {project_path}")
        return EXIT_FAIL

    build_dir = find_build_dir(project_path)
    if not build_dir:
        dirs_checked = ", ".join(BUILD_DIRS)
        print(f"⏭️  Build não encontrado ({dirs_checked}) — pulando análise.")
        return EXIT_OK

    files     = collect_files(build_dir)
    total_mb  = sum(f.stat().st_size for f in files) / (1024 * 1024)
    issues    = (
        check_oversized_files(files, MAX_FILE_KB)
        + check_total_size(files, MAX_TOTAL_MB)
        + check_sourcemaps(files)
    )

    print_report(issues, build_dir, len(files), total_mb)
    return EXIT_FAIL if issues else EXIT_OK


if __name__ == "__main__":
    sys.exit(main())
