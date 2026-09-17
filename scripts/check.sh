#!/usr/bin/env sh
set -eu

# Run from any directory. Override QUBIT_PYTHON for another virtual environment.
repo_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
python_bin=${QUBIT_PYTHON:-"$repo_root/simulation/.venv/bin/python"}
cd "$repo_root"

"$python_bin" -m pytest -q simulation
npm --prefix ui test
npm --prefix ui run lint
npm --prefix ui run build
npm --prefix ui run typecheck
