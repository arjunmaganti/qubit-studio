"""Run actual simulation tests; never accept empty or skipped verification."""
import json
from pathlib import Path
import subprocess
import sys
import xml.etree.ElementTree as ET

root = Path(__file__).resolve().parents[1]
output = root / "test-results" / "python"
output.mkdir(parents=True, exist_ok=True)
report = output / "junit.xml"
# An earlier successful report must never stand in for this invocation.
report.unlink(missing_ok=True)
result = subprocess.run(
    [sys.executable, "-m", "pytest", "-q", "simulation", f"--junitxml={report}"],
    cwd=root,
    check=False,
)
suites = ET.parse(report).getroot().iter("testsuite") if report.exists() else []
totals = {key: 0 for key in ("tests", "failures", "errors", "skipped")}
for suite in suites:
    for key in totals:
        totals[key] += int(suite.get(key, "0"))
ok = result.returncode == 0 and totals["tests"] > 0 and not any(
    totals[key] for key in ("failures", "errors", "skipped")
)
(output / "summary.json").write_text(
    json.dumps({**totals, "exitCode": result.returncode, "ok": ok}, indent=2) + "\n"
)
if not ok:
    print("Simulation verification requires executed, passing tests with no skips.", file=sys.stderr)
sys.exit(0 if ok else 1)
