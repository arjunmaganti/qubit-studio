"""Search integration contracts: real calculations plus targeted failure boundaries."""
from copy import deepcopy
import json
import math

import numpy as np
import pytest
from fastapi.testclient import TestClient

import api
import engine
from engine import (
    CHARGE_BUDGET_BUFFER_KHZ, COMPARISON_RESOLUTION_MHZ,
    DISPERSION_RESOLUTION_KHZ, FREQUENCY_TOLERANCE_GHZ,
    DeviceRequest, SearchRequest, SearchResponse, evaluate, search,
)


@pytest.fixture(scope='module')
def initial():
    return search(SearchRequest(points=41))


def device(candidate, **changes):
    params = {key: candidate[key] for key in ('ej_ghz', 'ec_ghz', 'ng', 'ncut')}
    params.update(changes)
    return DeviceRequest(**params)


def test_frozen_response_schema_and_candidate_metadata(initial):
    validated = SearchResponse.model_validate(initial)
    assert validated.model_dump() == initial
    selected = initial['selected']
    assert selected is not None
    assert selected in initial['candidates']
    summary = evaluate(device(selected))
    summary.pop('charge_response')
    summary.pop('elapsed_ms')
    for name, value in summary.items():
        assert selected[name] == value
    assert initial['frequency_tolerance_ghz'] == 1e-9
    assert initial['charge_budget_buffer_khz'] == 0.001
    assert initial['comparison_resolution_mhz'] == 1e-4
    assert initial['baseline_evaluation'] is None


def test_stable_ids_ignore_budget_and_grid_index(initial):
    tighter = search(SearchRequest(points=41, max_dispersion_khz=1))
    assert [p['candidate_id'] for p in initial['candidates']] == [p['candidate_id'] for p in tighter['candidates']]
    assert len({p['candidate_id'] for p in initial['candidates']}) == initial['evaluated_count']
    # Shared endpoints get the same identity even when their grid indices differ.
    shorter = search(SearchRequest(points=21))
    assert shorter['candidates'][-1]['candidate_id'] == initial['candidates'][-1]['candidate_id']
    original = initial['selected']
    for patch in [
        {'ej_ghz': math.nextafter(original['ej_ghz'], math.inf)},
        {'ng': 0.25}, {'ncut': 40}, {'model_version': 'next'},
    ]:
        changed = {**original, **patch}
        assert engine.candidate_id(changed) != original['candidate_id']


def test_tiny_ratio_interval_returns_distinct_devices_only():
    out = search(SearchRequest(ratio_min=50., ratio_max=math.nextafter(50., math.inf), points=21))
    ids = [p['candidate_id'] for p in out['candidates']]
    assert len(ids) == len(set(ids)) == out['evaluated_count']
    assert 0 < out['evaluated_count'] < out['request']['points']


def test_baseline_score_matches_same_grid_candidate(initial):
    baseline = device(initial['selected'])
    out = search(SearchRequest(points=41, baseline=baseline))
    assert out['baseline_evaluation']['assessment'] == out['selected']
    assert out['baseline_evaluation']['params'] == baseline.model_dump()
    assert out['request']['baseline'] == baseline.model_dump()
    assert out['evaluated_count'] == 41


def test_baseline_is_not_retuned_for_changed_target_or_cutoff(initial):
    baseline = device(initial['selected'], ncut=40)
    before = evaluate(baseline)
    out = search(SearchRequest(points=21, target_ghz=6, ncut=30, baseline=baseline))
    assessed = out['baseline_evaluation']['assessment']
    for key in ('ej_ghz', 'ec_ghz', 'ng', 'ncut', 'f01_ghz', 'alpha_mhz', 'dispersion_khz'):
        assert assessed[key] == before[key]
    assert assessed['f01_ghz'] == pytest.approx(5, abs=1e-9)
    assert 'frequency_target_mismatch' in assessed['violations']
    assert 'frequency_lock_numerical_error' not in assessed['violations']
    assert assessed['margins']['frequency_target_ghz'] < 0
    assert all(p['f01_ghz'] == pytest.approx(6, abs=1e-9) for p in out['candidates'])


def test_explore_offset_is_preserved_but_design_ineligible(initial):
    baseline = device(initial['selected'], ng=0.3)
    out = search(SearchRequest(points=21, baseline=baseline))
    assessment = out['baseline_evaluation']['assessment']
    assert assessment['ng'] == 0.3
    assert out['baseline_evaluation']['params']['ng'] == 0.3
    assert 'design_reference_ng_mismatch' in assessment['violations']
    assert not assessment['feasible']
    assert assessment['f01_ghz'] == evaluate(baseline)['f01_ghz']


def test_baseline_can_pass_when_evaluated_grid_is_empty(initial):
    p = initial['selected']
    out = search(SearchRequest(
        baseline=device(p), ratio_min=p['ratio']-1, ratio_max=p['ratio']+1,
        points=22, ej_min_ghz=p['ej_ghz']-1e-8, ej_max_ghz=p['ej_ghz']+1e-8,
    ))
    assert out['status'] == 'infeasible'
    assert out['selected'] is None
    assert out['feasible_count'] == 0
    assert out['evaluated_count'] == 22
    assert out['baseline_evaluation']['assessment']['feasible']
    assert out['selection_evidence']['kind'] == 'infeasible'


def test_evidence_counts_actual_higher_a_rejections(initial):
    winner = initial['selected']
    better = [p for p in initial['candidates'] if p['anharmonicity_mhz'] > winner['anharmonicity_mhz']]
    evidence = initial['selection_evidence']
    assert evidence['kind'] == 'higher_a_rejected'
    assert evidence['higher_a_count'] == len(better)
    for item in evidence['higher_a_rejections']:
        assert item['count'] == sum(item['reason'] in p['violations'] for p in better)
    assert {item['reason'] for item in evidence['higher_a_rejections']} == {reason for p in better for reason in p['violations']}


def test_evidence_does_not_invent_binding_charge_limit(initial):
    p = deepcopy(initial['selected'])
    p['margins']['ratio_lower'] = 0
    assert engine.selection_evidence([p], p) == {
        'kind': 'grid_boundary', 'higher_a_count': 0,
        'higher_a_rejections': [], 'selected_at_ratio_boundary': 'lower',
    }
    p['margins']['ratio_lower'] = 1
    p['margins']['ratio_upper'] = 1
    assert engine.selection_evidence([p], p)['kind'] == 'evaluated_maximum'


def test_float_guard_does_not_change_real_bounds(initial):
    assert engine.bound_margin(math.nextafter(20.0, -math.inf), 20.0) == 0
    assert engine.bound_margin(20.0-1e-9, 20.0) < 0
    p = initial['selected']
    req = SearchRequest(ratio_min=math.nextafter(p['ratio'], math.inf))
    assert 'ratio_lower' not in engine.score_candidate(p, req)['violations']
    req = SearchRequest(ratio_min=p['ratio']+1e-7)
    assert 'ratio_lower' in engine.score_candidate(p, req)['violations']


def test_dispersion_floor_buffer_and_negative_alpha(initial):
    p = deepcopy(initial['selected'])
    p.update(dispersion_khz=None, dispersion_upper_khz=DISPERSION_RESOLUTION_KHZ,
             dispersion_status='below_reporting_floor')
    scored = engine.score_candidate(p, SearchRequest(max_dispersion_khz=0.01))
    assert scored['dispersion_khz'] is None
    assert scored['feasible']
    assert json.loads(json.dumps(scored, allow_nan=False))['dispersion_khz'] is None
    p.update(dispersion_khz=0.02, dispersion_upper_khz=0.02, dispersion_status='resolved')
    for budget, expected in [(0.02, True), (0.0205, True), (0.021, False), (0.0211, False)]:
        scored = engine.score_candidate(p, SearchRequest(max_dispersion_khz=budget))
        assert ('charge_budget_numerical_buffer' in scored['violations']) == expected
    p['alpha_mhz'] = 1
    assert 'requires_negative_anharmonicity' in engine.score_candidate(p, SearchRequest())['violations']


def test_frequency_guard_edges_and_reason_provenance(initial):
    p = deepcopy(initial['selected'])
    for direction in (-1, 1):
        p['f01_ghz'] = 5 + direction*FREQUENCY_TOLERANCE_GHZ
        assert 'frequency_target_mismatch' not in engine.score_candidate(p, SearchRequest())['violations']
        p['f01_ghz'] = 5 + direction*2*FREQUENCY_TOLERANCE_GHZ
        assert 'frequency_target_mismatch' in engine.score_candidate(p, SearchRequest())['violations']
        assert 'frequency_lock_numerical_error' in engine.score_candidate(p, SearchRequest(), generated=True)['violations']


@pytest.mark.parametrize('payload', [
    {'target_ghz': True}, {'target_ghz': None}, {'target_ghz': '5'},
    {'target_ghz': float('nan')}, {'target_ghz': float('inf')},
    {'points': False}, {'points': 21.5}, {'points': None},
    {'baseline': {'ej_ghz': True}}, {'baseline': {'ng': None}},
    {'baseline': {'ncut': '30'}}, {'baseline': {'extra': 1}},
    {'ratio_min': 90, 'ratio_max': 20}, {'unknown': 1},
])
def test_http_invalid_requests_have_json_safe_field_errors(payload):
    with TestClient(api.app) as client:
        # Send raw JSON to exercise parser handling of non-standard NaN/Infinity.
        response = client.post('/search', content=json.dumps(payload), headers={'Content-Type': 'application/json'})
    assert response.status_code == 422
    body = response.json()
    assert isinstance(body['error'], str)
    assert body['field_errors']
    json.dumps(body, allow_nan=False)
    assert 'input' not in body


def test_http_empty_and_null_baseline_and_typed_response():
    with TestClient(api.app) as client:
        response = client.post('/search', json={'points': 21, 'baseline': None})
        assert response.status_code == 200
        assert SearchResponse.model_validate(response.json()).baseline_evaluation is None
        assert client.post('/search', content='null', headers={'Content-Type': 'application/json'}).status_code == 422
        assert client.post('/search', content='{bad', headers={'Content-Type': 'application/json'}).status_code == 422
        assert client.post('/evaluate', json={'ej_ghz': True}).status_code == 422


def test_numerical_failure_is_error_not_infeasibility(monkeypatch):
    def fail(*args, **kwargs):
        raise ArithmeticError('private solver failure')
    monkeypatch.setattr(engine, 'levels', fail)
    with TestClient(api.app) as client:
        for endpoint in ['/search', '/evaluate']:
            response = client.post(endpoint, json={})
            assert response.status_code == 500
            assert set(response.json()) == {'error'}
            assert 'private' not in response.text
            assert 'infeasible' not in response.text


def test_bad_frequency_map_and_nonfinite_outputs_are_errors(monkeypatch):
    monkeypatch.setattr(engine, 'levels', lambda *args, **kwargs: np.array([1., 1., 2.]))
    with pytest.raises(ArithmeticError, match='frequency-map'):
        search(SearchRequest(points=21))
    monkeypatch.setattr(api, 'search', lambda _request: {'status': 'infeasible', 'elapsed_ms': float('nan')})
    with TestClient(api.app) as client:
        response = client.post('/search', json={'points': 21})
        assert response.status_code == 500
        assert set(response.json()) == {'error'}


def test_generated_frequency_mapping_failure_does_not_hide_as_rejection(monkeypatch, initial):
    p = deepcopy(initial['selected'])
    p['f01_ghz'] = 6
    monkeypatch.setattr(engine, 'metrics', lambda *args, **kwargs: p)
    with pytest.raises(ArithmeticError, match='frequency lock'):
        search(SearchRequest(points=21))
