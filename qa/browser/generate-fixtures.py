"""Replayable numerical fixture creation; no network or provider credentials."""
import hashlib
import platform
import json
import sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'simulation'))
from engine import DeviceRequest, SearchRequest, StressRequest, TunableDeviceRequest, MaterialScenarioRequest, evaluate, search, stress_test, evaluate_tunable, material_scenario

p = dict(ej_ghz=15, ec_ghz=.3, ng=.3, ncut=40)
search_result = search(SearchRequest(points=201, ncut=40))
candidate = {key: search_result['selected'][key] for key in ('ej_ghz', 'ec_ghz', 'ng')}
candidate['ncut'] = 40
fixtures = {
    'source': 'Actual local engine outputs; transport timing mocked in React wiring harness.',
    'params': p,
    'evaluate': evaluate(DeviceRequest(**p)),
    'evaluate16': evaluate(DeviceRequest(**{**p, 'ej_ghz': 16})),
    'evaluate17': evaluate(DeviceRequest(**{**p, 'ej_ghz': 17})),
    'search': search_result,
    'searchWithBaseline': search(SearchRequest(points=201, ncut=40, baseline=DeviceRequest(**p))),
    'defaultSearchWithBaseline': search(SearchRequest(points=201, ncut=30, baseline=DeviceRequest())),
    'candidate': evaluate(DeviceRequest(**candidate)),
    'stress': stress_test(StressRequest(**p, variation_percent=5)),
    'tunable': evaluate_tunable(TunableDeviceRequest(ejmax_ghz=15, ec_ghz=.3, ng=.3, ncut=40, flux=.25, asymmetry=.1)),
    'material': material_scenario(MaterialScenarioRequest(**p, scenario_name='Al on Si', junction_critical_current_factor=.9, total_capacitance_factor=1.1)),
    'default': evaluate(DeviceRequest()),
    'reference': evaluate(DeviceRequest(ej_ghz=30, ec_ghz=1.2, ng=.3, ncut=31)),
    'defaultStress': stress_test(StressRequest()),
}
fixture_path = Path(__file__).with_name('fixtures') / 'solver.json'
fixture_path.write_text(json.dumps(fixtures, indent=2, allow_nan=False))
metadata = {
    'purpose': 'Numerical fixtures for controlled React wiring tests, not live solver verification.',
    'python': platform.python_version(),
    'sha256': {name: hashlib.sha256((ROOT / name).read_bytes()).hexdigest() for name in ['simulation/engine.py', 'simulation/requirements.txt', 'qa/browser/fixtures/solver.json']},
}
fixture_path.with_name('provenance.json').write_text(json.dumps(metadata, indent=2) + '\n')
print('Generated actual engine fixtures, including 201 exact-frequency candidates.')
