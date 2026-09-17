'use client';

import { useState } from 'react';
import ChargeQubitPeer from '@/components/ChargeQubitPeer';
import DriveCartoon from '@/components/DriveCartoon';
import MathText from '@/components/MathText';
import { DASH, delta, dispersionDisplay, num, paramSummary, signed } from '@/lib/format';
import { approxDeltaMhz, transmonApproxF01Ghz } from '@/lib/transmon-approx';
import { mathValue } from '@/lib/math-format';
import type { TopicId } from '@/lib/explain-topics';
import type { ChargePoint, DesignGoals, DeviceResult } from '@/lib/types';
import { validExperimentGoals } from '@/lib/experiment-session';

interface ResultsDockProps {
  result: DeviceResult | null;
  baseline: DeviceResult | null;
  stale: boolean;
  error: string | null;
  canPin: boolean;
  onPin: () => void;
  onClearBaseline: () => void;
  onRetry: () => void;
  goals: DesignGoals;
  selectedTopics: Set<TopicId>;
  onSelectTopic: (id: TopicId) => void;
  goalHint?: string;
  chartsOpen?: boolean;
}

interface MetricProps {
  topicId: TopicId;
  selected: boolean;
  label: string;
  symbol?: string;
  value: string;
  muted?: boolean;
  note?: string;
  deltaText?: { text: string; tone: 'up' | 'down' | 'flat' } | null;
  onSelectTopic: (id: TopicId) => void;
}

function Metric({ topicId, selected, label, symbol, value, muted, note, deltaText, onSelectTopic }: MetricProps) {
  return (
    <button
      type="button"
      className={`metric${selected ? ' on' : ''}`}
      data-tour={`metric-${topicId}`}
      aria-pressed={selected}
      title={selected ? 'Selected for AI analysis — click to deselect' : 'Click to select for AI analysis'}
      onClick={() => onSelectTopic(topicId)}
    >
      <div className="k">
        <MathText text={label} /> {symbol && <span className="sym"><MathText text={symbol} /></span>}
      </div>
      <div className={`v${muted ? ' none' : ''}`}><MathText text={value} /></div>
      {deltaText && <div className={`d ${deltaText.tone}`}><MathText text={deltaText.text} /></div>}
      {note && <div className="note"><MathText text={note} /></div>}
    </button>
  );
}

const LEVEL_W = 300;
const LEVEL_H = 132;

function EnergyLevels({ result, baseline }: { result: DeviceResult; baseline: DeviceResult | null }) {
  const levels = result.levels_ghz;
  const top = Math.max(...levels, ...(baseline?.levels_ghz ?? [])) || 1;
  const y = (value: number) => LEVEL_H - 14 - (value / top) * (LEVEL_H - 28);

  return (
    <svg viewBox={`0 0 ${LEVEL_W} ${LEVEL_H}`} role="img" aria-label="Energy levels relative to the ground state">
      {baseline?.levels_ghz.map((value, index) => (
        <line
          key={`b-${index}`}
          x1="40"
          x2={LEVEL_W - 8}
          y1={y(value)}
          y2={y(value)}
          stroke="#b7bec8"
          strokeWidth="1"
          strokeDasharray="4 3"
        />
      ))}
      {levels.map((value, index) => (
        <g key={index}>
          <line x1="40" x2={LEVEL_W - 60} y1={y(value)} y2={y(value)} stroke="#1b2027" strokeWidth="2" />
          <foreignObject x="0" y={y(value) - 9} width="35" height="18"><div className="svg-math-label right"><MathText math={`|${index}\\rangle`} /></div></foreignObject>
          <foreignObject x={LEVEL_W - 55} y={y(value) - 9} width="55" height="18"><div className="svg-math-label"><MathText math={num(value, 3)} /></div></foreignObject>
        </g>
      ))}
      {levels.length > 2 && (
        <>
          <line x1="62" x2="62" y1={y(levels[0])} y2={y(levels[1])} stroke="#1a6fe0" strokeWidth="1.4" />
          <foreignObject x="68" y={(y(levels[0]) + y(levels[1])) / 2 - 9} width="150" height="20"><div className="svg-math-label blue"><MathText math={`f_{01}=${mathValue(result.f01_ghz, 3, 'GHz')}`} /></div></foreignObject>
          <line x1="62" x2="62" y1={y(levels[1])} y2={y(levels[2])} stroke="#5c6672" strokeWidth="1.4" />
          <foreignObject x="68" y={(y(levels[1]) + y(levels[2])) / 2 - 9} width="150" height="20"><div className="svg-math-label"><MathText math={`f_{12}=${mathValue(result.f12_ghz, 3, 'GHz')}`} /></div></foreignObject>
        </>
      )}
    </svg>
  );
}

const CHART_W = 340;
const CHART_H = 132;

function ChargeResponse({ result, baseline }: { result: DeviceResult; baseline: DeviceResult | null }) {
  const points = result.charge_response;
  if (points.length === 0) return <p className="empty">The backend returned no charge-response points.</p>;

  // The dispersion is a few kHz on a ~5 GHz line: plot the shift, not the absolute.
  const reference = points.reduce((a, b) => (b.ng < a.ng ? b : a)).f01_ghz;
  const basePoints = baseline?.charge_response ?? [];
  const baseReference = basePoints.length
    ? basePoints.reduce((a, b) => (b.ng < a.ng ? b : a)).f01_ghz
    : null;
  const shiftKhz = (f01: number, ref: number) => (f01 - ref) * 1e6;

  const values = [
    ...points.map((p) => shiftKhz(p.f01_ghz, reference)),
    ...(baseReference === null ? [] : basePoints.map((p) => shiftKhz(p.f01_ghz, baseReference))),
  ];
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const span = hi - lo;
  const pad = span === 0 ? 1 : 0;
  const x = (ng: number) => 52 + ng * (CHART_W - 68);
  const y = (khz: number) => CHART_H - 22 - ((khz - lo + pad) / (span + 2 * pad)) * (CHART_H - 40);
  const path = (data: ChargePoint[], ref: number) =>
    data.map((p) => `${x(p.ng)},${y(shiftKhz(p.f01_ghz, ref))}`).join(' ');

  return (
    <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} role="img" aria-label="Transition frequency shift versus offset charge">
      <line x1="52" x2={CHART_W - 16} y1={CHART_H - 22} y2={CHART_H - 22} stroke="#d2d7de" />
      <line x1="52" x2="52" y1="10" y2={CHART_H - 22} stroke="#d2d7de" />
      {baseReference !== null && (
        <polyline points={path(basePoints, baseReference)} fill="none" stroke="#b7bec8" strokeWidth="1.4" strokeDasharray="4 3" />
      )}
      <polyline points={path(points, reference)} fill="none" stroke="#1a6fe0" strokeWidth="1.8" />
      <circle cx={x(result.ng)} cy={y(shiftKhz(result.f01_ghz, reference))} r="3.6" fill="#1a6fe0" />
      <text x="52" y={CHART_H - 8} fontSize="10" fill="#878f9b">
        n_g 0
      </text>
      <text x={CHART_W - 16} y={CHART_H - 8} fontSize="10" textAnchor="end" fill="#878f9b">
        1
      </text>
      <text x="48" y="14" fontSize="10" textAnchor="end" fill="#878f9b" fontFamily="ui-monospace, Menlo, monospace">
        {signed(hi, 3)}
      </text>
      <text x="48" y={CHART_H - 24} fontSize="10" textAnchor="end" fill="#878f9b" fontFamily="ui-monospace, Menlo, monospace">
        {signed(lo, 3)}
      </text>
    </svg>
  );
}

export default function ResultsDock({
  result,
  baseline,
  stale,
  error,
  canPin,
  onPin,
  onClearBaseline,
  onRetry,
  goals,
  selectedTopics,
  onSelectTopic,
  goalHint = 'Open “Try a goal” on the right and let the app find settings that pass.',
  chartsOpen = false,
}: ResultsDockProps) {
  const [detailsOpen, setDetailsOpen] = useState(chartsOpen);
  const dispersion = dispersionDisplay(result);
  const approx = result ? transmonApproxF01Ghz(result.ej_ghz, result.ec_ghz) : null;
  const approxDelta = result && approx !== null ? approxDeltaMhz(result.f01_ghz, result.ej_ghz, result.ec_ghz) : null;
  const approxNote =
    result && approx !== null && Number.isFinite(approx)
      ? `approx $\\sqrt{8 E_J E_C}-E_C$ = ${num(approx, 3)} GHz · solver − formula ${signed(approxDelta, 0)} MHz`
      : 'How fast the qubit changes between its two lowest states.';
  const baselineDispersion = baseline ? dispersionDisplay(baseline) : null;
  const goalsValid = validExperimentGoals(goals);
  const checks = result && canPin && goalsValid ? [
    {
      label: 'Frequency',
      pass: Math.abs(result.f01_ghz - goals.target_ghz) <= goals.tolerance_ghz,
      detail: `${num(Math.abs(result.f01_ghz - goals.target_ghz), 3)} GHz from target`,
    },
    {
      label: 'Anharmonicity',
      pass: result.anharmonicity_mhz >= goals.min_anharmonicity_mhz,
      detail: `${num(result.anharmonicity_mhz - goals.min_anharmonicity_mhz, 1)} MHz margin`,
    },
    {
      label: 'Charge dispersion',
      pass: result.dispersion_upper_khz <= goals.max_dispersion_khz,
      detail: `${num(goals.max_dispersion_khz - result.dispersion_upper_khz, 3)} kHz margin`,
    },
  ] : [];
  const passing = checks.filter((check) => check.pass).length;

  return (
    <>
      <div className="panel-head">
        Results
        <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--text-3)' }}>
          {result ? <MathText text={paramSummary(result)} /> : error ? 'no completed calculation' : 'waiting for first result'}
        </span>
      </div>

      {error && (
        <div className="errbox">
          <strong>Calculation failed.</strong> {error}
          <div style={{ marginTop: 7 }}>
            <button type="button" className="btn" onClick={onRetry}>
              Retry
            </button>
          </div>
        </div>
      )}

      {(!canPin || !goalsValid) && (
        <div className="verdict pending" role="status">
          <div className="verdict-copy">
            <strong>{error ? 'Current design has no completed result' : !goalsValid ? 'Complete your goal values' : 'Calculating current design…'}</strong>
            <span>{canPin ? 'The current calculation is complete; goal assessment waits for valid goal values.' : result ? 'Previous result shown below is outdated; goal assessment and actions wait for a current result.' : 'Goal assessment is available when the solver finishes.'}</span>
          </div>
        </div>
      )}
      {checks.length > 0 && (
        <div className={`verdict ${passing === checks.length ? 'pass' : 'adjust'}`}>
          <div className="verdict-copy">
            <strong>{passing === checks.length ? 'This design passes your goals' : `This design passes ${passing} of ${checks.length} goals`}</strong>
            <span>{passing === checks.length
              ? 'This completed calculation meets your selected frequency, level-separation, and charge-sensitivity thresholds.'
              : goalHint}</span>
          </div>
          <div className="verdict-checks">
            {checks.map((check) => <span key={check.label} className={`pill ${check.pass ? 'ok' : 'no'}`} title={check.detail}>{check.pass ? '✓' : '×'} {check.label}</span>)}
          </div>
        </div>
      )}

      <div className="result-intro">
        <span className="eyebrow">At a glance</span>
        <span>Click a number — Myla explains it.</span>
      </div>
      <div className="dock-grid summary-grid">
        <Metric
          topicId="f01"
          selected={selectedTopics.has('f01')}
          onSelectTopic={onSelectTopic}
          label="Operating frequency"
          value={result ? `${num(result.f01_ghz, 3)} GHz` : DASH}
          muted={!result}
          note={approxNote}
          deltaText={delta(result?.f01_ghz, baseline?.f01_ghz, 4, 'GHz')}
        />
        <Metric
          topicId="f12"
          selected={selectedTopics.has('f12')}
          onSelectTopic={onSelectTopic}
          label="Next rung $f_{12}$"
          value={result ? `${num(result.f12_ghz, 3)} GHz` : DASH}
          muted={!result}
          note="$|1\\rangle \\to |2\\rangle$. A drive at $f_{01}$ should miss this line."
          deltaText={delta(result?.f12_ghz, baseline?.f12_ghz, 4, 'GHz')}
        />
        <Metric
          topicId="alpha"
          selected={selectedTopics.has('alpha')}
          onSelectTopic={onSelectTopic}
          label="Level separation"
          value={result ? `${num(result.anharmonicity_mhz, 1)} MHz` : DASH}
          muted={!result}
          note="$\\alpha = f_{12}-f_{01}$. Bigger $|\\alpha|$ means less leakage into $|2\\rangle$."
          deltaText={delta(result?.anharmonicity_mhz, baseline?.anharmonicity_mhz, 1, 'MHz')}
        />
        <Metric
          topicId="dispersion"
          selected={selectedTopics.has('dispersion')}
          onSelectTopic={onSelectTopic}
          label="Charge sensitivity"
          value={dispersion.text}
          muted={!result || !dispersion.resolved}
          note={dispersion.note || 'How much stray $n_g$ would move $f_{01}$.'}
          deltaText={
            dispersion.resolved && baselineDispersion?.resolved
              ? delta(result?.dispersion_khz, baseline?.dispersion_khz, 3, 'kHz')
              : null
          }
        />
      </div>

      <div className="result-actions">
          <span><MathText text={baseline ? `Frozen baseline · ${paramSummary(baseline)}` : 'Save a baseline before applying a recommendation.'} /></span>
          {baseline && <span className="pill" title={paramSummary(baseline)}>Baseline saved</span>}
          <button type="button" className="btn" onClick={onPin} disabled={!canPin}>Save baseline</button>
          <button type="button" className="btn" onClick={onClearBaseline} disabled={!baseline}>Clear baseline</button>
        </div>
      <details className="results-technical" data-tour="tech-results" open={detailsOpen} onToggle={event => setDetailsOpen(event.currentTarget.open)}>
        <summary>Technical details and charts</summary>
        <div className="dock-grid technical-grid">
          <Metric topicId="ratio" selected={selectedTopics.has('ratio')} onSelectTopic={onSelectTopic} label="$E_J/E_C$ ratio" value={result ? num(result.ratio, 1) : DASH} muted={!result} deltaText={delta(result?.ratio, baseline?.ratio, 1, '')} />
          <Metric topicId="alpha" selected={selectedTopics.has('alpha')} onSelectTopic={onSelectTopic} label="Signed anharmonicity" symbol="$\\alpha = f_{12}-f_{01}$" value={result ? `${signed(result.alpha_mhz, 1)} MHz` : DASH} muted={!result} deltaText={delta(result?.alpha_mhz, baseline?.alpha_mhz, 1, 'MHz')} />
          <Metric topicId="junction" selected={selectedTopics.has('junction')} onSelectTopic={onSelectTopic} label="Critical current" symbol="derived from $E_J$" value={result?.critical_current_na !== undefined ? `${num(result.critical_current_na, 2)} nA` : DASH} muted={result?.critical_current_na === undefined} />
          <Metric topicId="capacitor" selected={selectedTopics.has('capacitor')} onSelectTopic={onSelectTopic} label="Total capacitance" symbol="derived from $E_C$" value={result?.total_capacitance_ff !== undefined ? `${num(result.total_capacitance_ff, 2)} fF` : DASH} muted={result?.total_capacitance_ff === undefined} />
        </div>
        {result && canPin && <DriveCartoon result={result} />}
        {result && canPin && detailsOpen && <ChargeQubitPeer params={result} result={result} enabled={detailsOpen} />}
        <div className="dock-lower">
          <button
            type="button"
            className={`chart${selectedTopics.has('levels') ? ' on' : ''}`}
            data-tour="chart-levels"
            aria-pressed={selectedTopics.has('levels')}
            onClick={() => onSelectTopic('levels')}
          >
            <h4>Energy levels</h4>
            <p className="cap">Height shows energy relative to the ground state. Dashed lines show a saved baseline.</p>
            {result ? <EnergyLevels result={result} baseline={baseline} /> : <p className="empty">Waiting for a calculation…</p>}
          </button>
          <button
            type="button"
            className={`chart${selectedTopics.has('charge') ? ' on' : ''}`}
            data-tour="chart-charge"
            aria-pressed={selectedTopics.has('charge')}
            onClick={() => onSelectTopic('charge')}
          >
            <h4>Response to stray charge</h4>
            <p className="cap">A flatter line means the operating frequency is less sensitive to charge.</p>
            {result ? <ChargeResponse result={result} baseline={baseline} /> : <p className="empty">Waiting for a calculation…</p>}
          </button>
        </div>
      </details>

      {stale && (
        <p style={{ margin: 0, padding: '6px 12px 10px', fontSize: 11, color: 'var(--warn)' }}>
          Outdated — the values above describe {result ? <MathText text={paramSummary(result)} /> : 'the previous parameters'}.
        </p>
      )}
    </>
  );
}
