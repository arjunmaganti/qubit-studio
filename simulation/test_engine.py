import numpy as np
import pytest
from fastapi.testclient import TestClient
from engine import (
    DeviceRequest,
    MaterialScenarioRequest,
    SearchRequest,
    StressRequest,
    TunableDeviceRequest,
    evaluate,
    evaluate_tunable,
    material_scenario,
    search,
    stress_test,
)
from api import app


def test_official_reference():
    out = evaluate(DeviceRequest(ej_ghz=30, ec_ghz=1.2, ng=0.3, ncut=31))
    assert np.allclose(out['raw_levels_ghz'][:3], [-21.82665096, -6.16372350, 8.01931750], atol=1e-6, rtol=0)
    assert out['alpha_mhz'] < 0
    assert out['f01_ghz'] > out['f12_ghz'] > 0
    assert out['alpha_mhz'] == pytest.approx((out['f12_ghz'] - out['f01_ghz']) * 1000)


def test_frequency_lock_and_selection():
    req = SearchRequest(points=101)
    out = search(req)
    eligible = [p for p in out['candidates'] if p['feasible']]
    assert eligible
    assert out['selected']['anharmonicity_mhz'] == max(p['anharmonicity_mhz'] for p in eligible)
    for p in out['candidates']:
        assert p['f01_ghz'] == pytest.approx(req.target_ghz, abs=1e-9)
        assert p['ej_ghz'] / p['ec_ghz'] == pytest.approx(p['ratio'])


def test_stricter_requirement_and_infeasibility():
    loose = search(SearchRequest(points=101, max_dispersion_khz=10))
    tight = search(SearchRequest(points=101, max_dispersion_khz=1))
    assert {p['ratio'] for p in tight['candidates'] if p['feasible']} <= {p['ratio'] for p in loose['candidates'] if p['feasible']}
    if tight['selected']:
        assert tight['selected']['anharmonicity_mhz'] <= loose['selected']['anharmonicity_mhz']
    impossible = search(SearchRequest(points=51, min_anharmonicity_mhz=2000))
    assert impossible['status'] == 'infeasible'
    assert impossible['selected'] is None
    assert all(p['violations'] for p in impossible['candidates'])


def test_cutoff_and_charge_shortcut():
    a = evaluate(DeviceRequest(ej_ghz=15, ec_ghz=0.3, ncut=30))
    b = evaluate(DeviceRequest(ej_ghz=15, ec_ghz=0.3, ncut=40))
    assert a['f01_ghz'] == pytest.approx(b['f01_ghz'], abs=1e-7)
    assert a['alpha_mhz'] == pytest.approx(b['alpha_mhz'], abs=1e-4)
    f = [v['f01_ghz'] for v in a['charge_response']]
    assert a['dispersion_khz'] == pytest.approx((max(f)-min(f))*1e6, abs=0.001)


def test_material_scenario_effective_parameter_mapping():
    req = MaterialScenarioRequest(
        scenario_name='Demo process shift',
        ej_ghz=15,
        ec_ghz=0.3,
        junction_critical_current_factor=0.9,
        total_capacitance_factor=1.1,
    )
    out = material_scenario(req)
    assert out['status'] == 'ok'
    assert out['modified']['ej_ghz'] == pytest.approx(13.5)
    assert out['modified']['ec_ghz'] == pytest.approx(0.3 / 1.1)
    assert out['deltas']['f01_ghz'] == pytest.approx(
        out['modified']['f01_ghz'] - out['baseline']['f01_ghz']
    )
    assert 'not a fabricated-device prediction' in out['scope']


def test_material_scenario_rejects_out_of_domain_transformation():
    with pytest.raises(ValueError):
        MaterialScenarioRequest(ej_ghz=40, junction_critical_current_factor=1.5)


def test_engineering_values_are_derived_from_hamiltonian_inputs():
    out = evaluate(DeviceRequest(ej_ghz=15, ec_ghz=0.3))
    assert out['critical_current_na'] == pytest.approx(30.2, rel=0.01)
    assert out['total_capacitance_ff'] == pytest.approx(64.6, rel=0.01)
    doubled_ec = evaluate(DeviceRequest(ej_ghz=15, ec_ghz=0.6))
    assert doubled_ec['total_capacitance_ff'] == pytest.approx(out['total_capacitance_ff'] / 2)


def test_stress_grid_is_deterministic_and_contains_nominal():
    out = stress_test(StressRequest(ej_ghz=15, ec_ghz=0.3, variation_percent=5))
    assert len(out['scenarios']) == 9
    assert out['nominal']['f01_ghz'] == pytest.approx(
        evaluate(DeviceRequest(ej_ghz=15, ec_ghz=0.3))['f01_ghz']
    )
    for value_range in out['ranges'].values():
        assert value_range['min'] <= value_range['max']
        assert value_range['span'] == pytest.approx(value_range['max'] - value_range['min'])


def test_tunable_transmon_flux_changes_effective_josephson_energy():
    zero = evaluate_tunable(TunableDeviceRequest(ejmax_ghz=15, asymmetry=0.1, flux=0))
    half = evaluate_tunable(TunableDeviceRequest(ejmax_ghz=15, asymmetry=0.1, flux=0.5))
    assert zero['effective_ej_ghz'] == pytest.approx(15)
    assert half['effective_ej_ghz'] == pytest.approx(1.5)
    assert half['f01_ghz'] < zero['f01_ghz']
    assert len(zero['flux_response']) == 51


def test_http_contract_and_invalid_inputs():
    with TestClient(app) as c:
        assert c.get('/health').json()['status'] == 'ok'
        res = c.post('/evaluate', json={'ej_ghz':15,'ec_ghz':0.3})
        assert res.status_code == 200
        assert len(res.json()['charge_response']) == 101
        res = c.post('/search', json={'points':51})
        assert res.status_code == 200
        assert res.json()['selected'] is not None
        res = c.post('/material-scenario', json={
            'scenario_name': 'API demo',
            'junction_critical_current_factor': 0.9,
            'total_capacitance_factor': 1.1,
        })
        assert res.status_code == 200
        assert res.json()['modified']['ej_ghz'] == pytest.approx(13.5)
        assert c.post('/stress', json={'variation_percent': 5}).status_code == 200
        assert c.post('/evaluate-tunable', json={'flux': 0.25}).status_code == 200
        for payload in [{'ec_ghz':0}, {'ej_ghz':-1}, {'ncut':10000}, {'ej_ghz':'NaN'}, {'fake':1}]:
            assert c.post('/evaluate', json=payload).status_code == 422
        for payload in [{'points':100000}, {'target_ghz':0}, {'ratio_min':80,'ratio_max':20}, {'ej_min_ghz':40,'ej_max_ghz':5}]:
            assert c.post('/search', json=payload).status_code == 422
        for payload in [{'junction_critical_current_factor': 2}, {'total_capacitance_factor': 0}]:
            assert c.post('/material-scenario', json=payload).status_code == 422
        assert c.post('/stress', json={'variation_percent': 50}).status_code == 422
        assert c.post('/evaluate-tunable', json={'flux': 2}).status_code == 422
