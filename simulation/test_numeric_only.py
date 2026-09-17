"""Test-only experiment. No API imports, servers, UI, or production changes.
Run: .venv/bin/python -m pytest -q test_numeric_only.py
Run: .venv/bin/python test_numeric_only.py (writes test evidence only)
"""
import json
import platform
from pathlib import Path
from statistics import median
from time import perf_counter
import numpy as np
import pytest
from engine import DeviceRequest, SearchRequest, evaluate, search, levels

REFERENCE = [-21.82665096, -6.16372350, 8.01931750]


def test_published_fixture_and_units():
    p = evaluate(DeviceRequest(ej_ghz=30, ec_ghz=1.2, ng=0.3, ncut=31))
    np.testing.assert_allclose(p['raw_levels_ghz'][:3], REFERENCE, atol=1e-6, rtol=0)
    assert p['f01_ghz'] > p['f12_ghz'] > 0
    assert p['alpha_mhz'] == pytest.approx((p['f12_ghz'] - p['f01_ghz'])*1000)
    assert p['alpha_mhz'] < 0


def test_independently_assembled_dense_hamiltonian():
    for ej, ec, ng in [(30,1.2,0.3), (15,0.3,0), (18,0.25,0.5)]:
        n = np.arange(-30,31)
        h = np.diag(4*ec*(n-ng)**2) + np.diag(np.full(60,-ej/2),1) + np.diag(np.full(60,-ej/2),-1)
        dense = np.linalg.eigvalsh(h)[:3]
        np.testing.assert_allclose(levels(ej,ec,ng,30), dense, atol=1e-9, rtol=0)


def test_all_candidates_hold_frequency():
    out = search(SearchRequest(points=101))
    for p in out['candidates']:
        assert abs(p['f01_ghz']-5) < 1e-9
        assert p['ej_ghz']/p['ec_ghz'] == pytest.approx(p['ratio'])


def test_optimum_and_nested_feasible_sets():
    loose = search(SearchRequest(points=101, max_dispersion_khz=10))
    tight = search(SearchRequest(points=101, max_dispersion_khz=1))
    assert loose['selected'] and tight['selected']
    assert {p['ratio'] for p in tight['candidates'] if p['feasible']} <= {p['ratio'] for p in loose['candidates'] if p['feasible']}
    for out in [loose,tight]:
        assert out['selected']['anharmonicity_mhz'] == max(p['anharmonicity_mhz'] for p in out['candidates'] if p['feasible'])
    assert tight['selected']['anharmonicity_mhz'] <= loose['selected']['anharmonicity_mhz']


def test_honest_infeasibility():
    out = search(SearchRequest(points=51, min_anharmonicity_mhz=2000))
    assert out['status'] == 'infeasible'
    assert out['selected'] is None
    assert all(p['violations'] for p in out['candidates'])


def test_cutoff_and_explicit_charge_sweep_at_finalists():
    for budget in [10,1]:
        p = search(SearchRequest(points=401, max_dispersion_khz=budget))['selected']
        assert p is not None
        req = DeviceRequest(ej_ghz=p['ej_ghz'], ec_ghz=p['ec_ghz'], ncut=30)
        a = evaluate(req)
        b = evaluate(req.model_copy(update={'ncut':40}))
        assert abs(a['f01_ghz']-b['f01_ghz']) < 1e-7
        assert abs(a['alpha_mhz']-b['alpha_mhz']) < 1e-4
        assert abs(a['dispersion_khz']-b['dispersion_khz']) < max(0.001,0.01*a['dispersion_khz'])
        full_range = np.ptp([v['f01_ghz'] for v in b['charge_response']])*1e6
        assert abs(full_range-b['dispersion_khz']) < 0.001


def test_invalid_numerical_requests():
    for kwargs in [{'target_ghz':0}, {'ratio_min':80,'ratio_max':20}, {'points':100000}, {'max_dispersion_khz':float('nan')}]:
        with pytest.raises(ValueError):
            SearchRequest(**kwargs)


def run_experiment():
    import scqubits, scipy
    import matplotlib.pyplot as plt
    start = perf_counter()
    reference = levels(30,1.2,0.3,31)
    runs = {str(budget): search(SearchRequest(max_dispersion_khz=budget)) for budget in [100,10,1,0.1,0.01]}
    finalists = {}
    for budget in ['10','1']:
        p = runs[budget]['selected']
        req = DeviceRequest(ej_ghz=p['ej_ghz'],ec_ghz=p['ec_ghz'])
        checks = {str(cut):evaluate(req.model_copy(update={'ncut':cut})) for cut in [30,40,50]}
        finalists[budget] = {
            'cutoff_checks':checks,
            'max_frequency_change_hz': max(abs(checks[c]['f01_ghz']-checks['30']['f01_ghz'])*1e9 for c in checks),
            'max_alpha_change_hz': max(abs(checks[c]['alpha_mhz']-checks['30']['alpha_mhz'])*1e6 for c in checks),
            'max_dispersion_change_hz':max(abs(checks[c]['dispersion_khz']-checks['30']['dispersion_khz'])*1000 for c in checks),
            'charge_sweep_range_khz':float(np.ptp([v['f01_ghz'] for v in checks['50']['charge_response']])*1e6),
        }
    repeated_search = [search(SearchRequest())['elapsed_ms'] for _ in range(5)]
    repeated_eval = [evaluate(DeviceRequest())['elapsed_ms'] for _ in range(5)]
    refined = {str(b):search(SearchRequest(points=1001,max_dispersion_khz=b))['selected'] for b in [10,1]}
    selected = {k:v['selected'] for k,v in runs.items()}
    drop = selected['10']['anharmonicity_mhz']-selected['1']['anharmonicity_mhz']
    impossible = search(SearchRequest(max_dispersion_khz=1,min_anharmonicity_mhz=300))
    metrics = {
        'reference_max_abs_error_ghz':float(np.max(np.abs(reference-np.array(REFERENCE)))),
        'frequency_lock_max_error_hz': max(abs(p['f01_ghz']-5)*1e9 for p in runs['10']['candidates']),
        'selected_by_budget_khz':selected,
        'feasible_count_by_budget':{k:v['feasible_count'] for k,v in runs.items()},
        'tightening_cost_mhz':drop,
        'tightening_cost_percent':100*drop/selected['10']['anharmonicity_mhz'],
        'refined_selected_1001_points':refined,
        'refinement_alpha_change_mhz':{k:refined[k]['anharmonicity_mhz']-selected[k]['anharmonicity_mhz'] for k in ['10','1']},
        '1khz_300mhz_requirement_status':impossible['status'],
        'search_401_points_ms':repeated_search,
        'search_median_ms':median(repeated_search),
        'device_101_charge_points_ms':repeated_eval,
        'device_median_ms':median(repeated_eval),
    }
    evidence = {'scope':'test-only nominal simulation; no server/UI/deployment; no stress/yield/lifetime test',
        'versions':{'python':platform.python_version(),'scqubits':scqubits.__version__,'numpy':np.__version__,'scipy':scipy.__version__},
        'system':{'os':platform.system(),'machine':platform.machine()},
        'metrics':metrics,'finalist_checks':finalists,'runs':runs,
        'elapsed_seconds':perf_counter()-start}
    folder = Path(__file__).parent/'test-results'
    folder.mkdir(exist_ok=True)
    (folder/'numerical-evidence.json').write_text(json.dumps(evidence,indent=2,allow_nan=False))
    fig, ax = plt.subplots(figsize=(9,5))
    points=runs['10']['candidates']
    # Only nominal-domain eligible candidates; display resolved values, never log(0).
    points=[p for p in points if p['dispersion_khz'] is not None and all(p['margins'][k]>=0 for k in ['ej_lower_ghz','ej_upper_ghz','ec_lower_ghz','ec_upper_ghz'])]
    ax.plot([p['dispersion_khz'] for p in points],[p['anharmonicity_mhz'] for p in points],color='#364fc7')
    for budget,color in [('10','#e67700'),('1','#087f5b')]:
        p=selected[budget]
        ax.axvline(float(budget),color=color,linestyle='--',label=f'{budget} kHz limit')
        ax.scatter([p['dispersion_khz']],[p['anharmonicity_mhz']],color=color)
        ax.annotate(f"{p['anharmonicity_mhz']:.1f} MHz",(p['dispersion_khz'],p['anharmonicity_mhz']),xytext=(7,7),textcoords='offset points')
    ax.axhline(200,color='#777',linestyle=':',label='200 MHz minimum')
    ax.set_xscale('log')
    ax.set_xlabel('Charge-induced transition frequency range (kHz, logarithmic)')
    ax.set_ylabel('Transition-spacing difference magnitude (MHz)')
    ax.set_title('Test result: simulated trade-off at fixed 5 GHz\n401 evaluated ratios; not a real-device prediction')
    ax.legend();ax.grid(alpha=0.2);fig.tight_layout()
    fig.savefig(folder/'nominal-tradeoff.png',dpi=150);plt.close(fig)
    print(json.dumps({'metrics':metrics,'checks':{k:{n:v for n,v in data.items() if n!='cutoff_checks'} for k,data in finalists.items()},'evidence_path':str(folder/'numerical-evidence.json'),'plot_path':str(folder/'nominal-tradeoff.png')},indent=2))

if __name__ == '__main__':
    run_experiment()
