"""Maintenance probe: empty suites must fail, even when Node counts the file."""
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile

root = Path(__file__).resolve().parents[1]
output = root / "test-results" / "guards"
output.mkdir(parents=True, exist_ok=True)
results = []
with tempfile.TemporaryDirectory(prefix="qubit-empty-tests-") as temporary:
    probe = Path(temporary)
    (probe / "qa").mkdir()
    (probe / "ui" / "lib").mkdir(parents=True)
    (probe / "simulation").mkdir()
    for name in ("run-unit.cjs", "run-python.py"):
        shutil.copyfile(root / "qa" / name, probe / "qa" / name)
    (probe / "ui" / "lib" / "empty.test.ts").write_text(
        "// Intentionally registers no tests.\n"
    )
    for name, command, summary_path in (
        ("empty-unit", ["node", "qa/run-unit.cjs"], "test-results/unit/summary.json"),
        ("empty-python", [sys.executable, "qa/run-python.py"], "test-results/python/summary.json"),
    ):
        result = subprocess.run(command, cwd=probe, text=True, capture_output=True, check=False)
        (output / f"{name}.log").write_text(result.stdout + result.stderr)
        summary = json.loads((probe / summary_path).read_text())
        assert result.returncode == 1 and summary["ok"] is False, f"{name}: empty suite passed"
        if name == "empty-unit":
            assert summary["emptyFiles"] == ["empty.test.ts"], "Did not detect Node's synthetic file test"
        else:
            assert summary["tests"] == 0 and summary["exitCode"] == 5, "Did not reach pytest's empty collection"
        results.append({"probe": name, "exitCode": result.returncode, "summary": summary})
(output / "summary.json").write_text(json.dumps(results, indent=2) + "\n")
print("PASS: empty Node and Python suites were rejected at the expected execution guard.")
