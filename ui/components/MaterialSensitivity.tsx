'use client';

import MathText from '@/components/MathText';
import type { TopicId } from '@/lib/explain-topics';
import { BCQT_SOURCE, MATERIAL_CATALOG, MATERIAL_RECORDS } from '@/lib/material-records';
import { materialColor } from '@/lib/material-colors';
import { mathRange, mathValue, scientific, signedMathValue } from '@/lib/math-format';
import type { ExperimentSession } from '@/lib/experiment-session';
import { validDeviceResult } from '@/lib/device-snapshot';
import { sameParams } from '@/lib/params';
import type { DeviceParams, DeviceResult } from '@/lib/types';

interface MaterialSensitivityProps {
  params: DeviceParams;
  result: DeviceResult | null;
  onApply: (params: DeviceParams) => void;
  session: ExperimentSession;
  onMaterialsChange: (topMaterial: string, baseMaterial: string) => void;
  topMaterial: string;
  baseMaterial: string;
  onAsk?: (id: TopicId) => void;
}

function plainProcess(deposition: string, treatment: string): string {
  const method = deposition.toLowerCase();
  const steps = treatment.toLowerCase();
  const notes: string[] = [];
  if (method.includes('mbe')) notes.push('The film was grown slowly in a carefully controlled chamber.');
  else if (method.includes('evaporation')) notes.push('The material was heated so a thin coating formed on the chip.');
  else if (method.includes('sputter') || method.includes('pvd')) notes.push('A thin coating was added inside a vacuum chamber.');
  else if (method.includes('pulsed-laser')) notes.push('Laser pulses were used to add a thin coating.');
  else if (method.includes('oxidation')) notes.push('Oxygen and heat were used to form the layer.');
  else notes.push('The source does not clearly explain how the layer was added.');
  if (steps.includes('no surface')) notes.push('The surface was not specially cleaned first.');
  else if (steps.includes('rca') || steps.includes('hf')) notes.push('The surface was carefully cleaned before coating.');
  if (steps.includes('anneal')) notes.push('The chip was heated afterward to improve the film.');
  if (steps.includes('rie') || steps.includes('etch')) notes.push('Unused material was removed to make the pattern.');
  return notes.join(' ');
}

export default function MaterialSensitivity({ session, params, result, onApply, onMaterialsChange, topMaterial, baseMaterial, onAsk }: MaterialSensitivityProps) {
  const { junctionFactor, capacitanceFactor } = session.controls;
  const comparison = session.material.result, error = session.material.error;
  const loading = session.material.status === 'pending';
  const compare = () => session.run('material');

  const matchingRecord = MATERIAL_RECORDS
    .filter((record) => record.kind === 'resonator-loss' && record.material === topMaterial && record.substrate === baseMaterial)
    .sort((a, b) => a.kind === 'resonator-loss' && b.kind === 'resonator-loss' ? a.lowPowerLossMax - b.lowPowerLossMax : 0)[0];
  const isMajoranaPair =
    (topMaterial === 'Pb' && ['InAs', 'InAsSb'].includes(baseMaterial)) ||
    (baseMaterial === 'Pb' && ['InAs', 'InAsSb'].includes(topMaterial));
  const majoranaRecord = MATERIAL_RECORDS.find((record) => record.id === 'microsoft-majorana-2-2026');

  const decayScaleUs = (loss: number) =>
    result && validDeviceResult(result) && sameParams(params, result) ? 1e6 / (2 * Math.PI * result.f01_ghz * 1e9 * loss) : null;
  const decayLow = matchingRecord?.kind === 'resonator-loss'
    ? decayScaleUs(matchingRecord.lowPowerLossMax)
    : null;
  const decayHigh = matchingRecord?.kind === 'resonator-loss'
    ? decayScaleUs(matchingRecord.lowPowerLossMin)
    : null;

  const changeMaterial = (layer: 'top' | 'base', material: string) => {
    if (!MATERIAL_CATALOG.includes(material as (typeof MATERIAL_CATALOG)[number])) return;
    onMaterialsChange(
      layer === 'top' ? material : topMaterial,
      layer === 'base' ? material : baseMaterial,
    );
  };

  return (
    <div className="insp-section material-sensitivity">
      <button type="button" className="insp-title myla-hit" onClick={() => onAsk?.('materials')}>
        Materials sandbox
      </button>
      <p className="insp-role">Pick the circuit film and the wafer underneath. Click the title for Myla.</p>

      <div className="sandbox-pickers">
        <label className="material-picker" data-tour="top-mat">
          <span>Circuit material</span>
          <select value={topMaterial} onChange={(event) => changeMaterial('top', event.target.value)}>
            {MATERIAL_CATALOG.map((material) => <option key={material} value={material}>{material}</option>)}
          </select>
        </label>
        <label className="material-picker" data-tour="base-mat">
          <span>Supporting material</span>
          <select value={baseMaterial} onChange={(event) => changeMaterial('base', event.target.value)}>
            {MATERIAL_CATALOG.map((material) => <option key={material} value={material}>{material}</option>)}
          </select>
        </label>
      </div>

      <div className="material-selection-summary" aria-label={`Selected materials: ${topMaterial} and ${baseMaterial}`}>
        <span><i style={{ background: materialColor(topMaterial) }} /><small>Circuit</small><strong>{topMaterial}</strong></span>
        <span><i style={{ background: materialColor(baseMaterial) }} /><small>Support</small><strong>{baseMaterial}</strong></span>
      </div>

      <p className="visual-note">The chip color updates immediately. Circuit film recolors electrodes, gate and ground; the wafer recolors only the substrate. Per-part finishes are under Components. Appearance does not change the solver unless you run a compare/apply scenario.</p>

      <div className="material-record">
        {matchingRecord?.kind === 'resonator-loss' ? (
          <>
            <div className="material-evidence-heading"><span>✓</span><div><strong>Published data found</strong><small>This exact material pair was tested in a resonator.</small></div></div>
            <dl className="kv material-simple-facts"><dt>Signal loss</dt><dd>{matchingRecord.lowPowerLossMin === matchingRecord.lowPowerLossMax ? <MathText math={scientific(matchingRecord.lowPowerLossMin)} /> : <MathText math={`${scientific(matchingRecord.lowPowerLossMin)}-${scientific(matchingRecord.lowPowerLossMax)}`} />}<small>Smaller is better.</small></dd>{decayLow !== null && decayHigh !== null && <><dt>Comparison time</dt><dd><MathText math={decayLow !== decayHigh ? `\\sim ${mathRange(decayLow, decayHigh, 1, 'us')}` : `\\sim ${mathValue(decayLow, 1, 'us')}`} /><small>Useful for comparing choices, not a promised lifetime.</small></dd></>}</dl>
            <details className="tech material-study-details"><summary>How this pair was tested</summary><div className="body"><p>{plainProcess(matchingRecord.deposition, matchingRecord.treatment)}</p><p>The study used a {matchingRecord.geometry}.</p><a href={BCQT_SOURCE} target="_blank" rel="noreferrer">View the source data ↗</a></div></details>
          </>
        ) : isMajoranaPair && majoranaRecord?.kind === 'device-stack' ? (
          <>
            <div className="material-evidence-heading neutral"><span>i</span><div><strong>Different kind of device</strong><small>This pair appears in a published quantum device, but not in a matching transmon test.</small></div></div>
            <details className="tech material-study-details"><summary>See the published device</summary><div className="body"><p>Reported materials: {majoranaRecord.layers.join(' · ')}.</p><a href={majoranaRecord.sourceUrl} target="_blank" rel="noreferrer">View the source ↗</a></div></details>
          </>
        ) : (
          <div className="material-evidence-heading neutral"><span>i</span><div><strong>No exact test found</strong><small>You can still use this pair for the visual design, but the app will not guess its performance.</small></div></div>
        )}
      </div>

      <details className="tech material-effects">
        <summary>Optional: test possible electrical changes</summary>
        <div className="body"><p>Use these only for “what if?” experiments. They do not predict what the selected materials will do.</p>
      <label className="scenario-field" data-tour="junction-fx">
        <span>Change in junction energy <strong><MathText math={signedMathValue((junctionFactor - 1) * 100, 0, 'percent')} /></strong></span>
        <input
          type="range"
          min={0.5}
          max={1.5}
          step={0.01}
          value={junctionFactor}
          onChange={(event) => {
            session.setControls({ junctionFactor: Number(event.target.value) });
          }}
        />
      </label>

      <label className="scenario-field" data-tour="cap-fx">
        <span>Change in capacitance <strong><MathText math={signedMathValue((capacitanceFactor - 1) * 100, 0, 'percent')} /></strong></span>
        <input
          type="range"
          min={0.5}
          max={1.5}
          step={0.01}
          value={capacitanceFactor}
          onChange={(event) => {
            session.setControls({ capacitanceFactor: Number(event.target.value) });
          }}
        />
      </label>

      <div className="row-actions">
        <button type="button" className="btn primary" aria-label="Compare scenario" aria-busy={loading} onClick={compare} disabled={loading || !!session.validationError('material')}>
          <span role="status">{loading ? 'Calculating…' : 'Run what-if test'}</span>
        </button>
        <button type="button" className="btn" onClick={() => {
          session.setControls({ junctionFactor: 1, capacitanceFactor: 1 });
        }}>
          Reset changes
        </button>
      </div>

      {(error || session.validationError('material')) && <p className="scenario-error" role="status">{error || session.validationError('material')}</p>}

      {comparison && (
        <div className="scenario-result" aria-live="polite">
          {!session.material.current && <p className="scenario-error" role="status">Outdated result — rerun this scenario.</p>}
          <dl className="kv">
            <dt>Scenario</dt><dd>{comparison.scenario_name}</dd>
            <dt>Frequency</dt><dd><MathText math={`${mathValue(comparison.baseline.f01_ghz, 3, 'GHz')}\\to ${mathValue(comparison.modified.f01_ghz, 3, 'GHz')}`} /></dd>
            <dt>Change</dt><dd><MathText math={signedMathValue(comparison.deltas.f01_ghz, 3, 'GHz')} /></dd>
            <dt>Anharmonicity</dt><dd><MathText math={`${mathValue(comparison.baseline.anharmonicity_mhz, 1, 'MHz')}\\to ${mathValue(comparison.modified.anharmonicity_mhz, 1, 'MHz')}`} /></dd>
            <dt>Dispersion bound</dt><dd><MathText math={`${mathValue(comparison.baseline.dispersion_upper_khz, 3, 'kHz')}\\to ${mathValue(comparison.modified.dispersion_upper_khz, 3, 'kHz')}`} /></dd>
          </dl>
          <button type="button" className="btn" disabled={!session.getApply('material')} onClick={() => { const applied = session.getApply('material'); if (applied) onApply(applied); }}>
            Use these test values
          </button>
          <p className="scenario-scope">{comparison.scope}.</p>
        </div>
      )}
        </div>
      </details>
      {onAsk && <button type="button" className="btn material-explain-button" onClick={() => onAsk('materials')}>Explain these materials with AI</button>}
    </div>
  );
}
