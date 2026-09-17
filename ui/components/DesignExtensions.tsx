'use client';

import { useEffect, useRef, useState } from 'react';
import MathText from './MathText';
import { buildDesignReportPdf, designReportFilename } from '@/lib/design-report';
import { experimentSnapshot, parseExperimentResult, type ExperimentSession } from '@/lib/experiment-session';
import { rankDistinctMaterialPairs, processBurden } from '@/lib/material-ranking';
import { BCQT_SOURCE } from '@/lib/material-records';
import type { DesignGoals, DeviceParams, SearchResult } from '@/lib/types';
import type { MaterialAppearance } from '@/lib/material-colors';
import { num } from '@/lib/format';

const PRESETS = [
  { label: 'Balanced', target: 5, alpha: 200, charge: 10, priority: 65 },
  { label: 'Charge-stable', target: 5, alpha: 150, charge: 1, priority: 100 },
  { label: 'Fast', target: 7, alpha: 180, charge: 20, priority: 100 },
  { label: 'Easier build', target: 5, alpha: 180, charge: 25, priority: 0 },
];

export default function DesignExtensions({ session, params, goals, materials, onGoalsChange }: {
  session: ExperimentSession; params: DeviceParams; goals: DesignGoals; materials: MaterialAppearance;
  onGoalsChange: (goals: DesignGoals) => void;
}) {
  const [preview, setPreview] = useState<{ key: string; result: SearchResult } | null>(null);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const controller = useRef<AbortController | null>(null);
  const key = JSON.stringify({ params, goals, materials, controls: session.controls });
  const latest = useRef(key);
  useEffect(() => { latest.current = key; controller.current?.abort(); return () => controller.current?.abort(); }, [key]);
  const candidate = session.chosenCandidate;
  const producing = session.search.snapshot;
  const stacks = rankDistinctMaterialPairs(producing?.controls.materialPriority ?? session.controls.materialPriority,
    producing?.controls.substratePreference ?? session.controls.substratePreference);
  const stack = stacks.find(item => item.id === session.chosenMaterialId) ?? stacks[0];
  const rank = stacks.findIndex(item => item.id === stack.id) + 1;
  const recommended = session.search.result?.selected;
  const explanation = candidate && recommended
    ? `This evaluated grid point passes the electrical search constraints. Level separation is ${num(candidate.anharmonicity_mhz, 1)} MHz and charge sensitivity is bounded by ${num(candidate.dispersion_upper_khz, 3)} kHz. ${candidate.ratio === recommended.ratio ? 'It is the solver recommendation.' : `It is your inspected alternative to the recommendation (${num(recommended.anharmonicity_mhz, 1)} MHz, charge bound ${num(recommended.dispersion_upper_khz, 3)} kHz).`} Material ranking is independent resonator evidence.` : '';

  const quickPreview = async () => {
    if (session.validationError('search')) return;
    controller.current?.abort();
    const request = new AbortController(); controller.current = request;
    setPendingKey(key); setError(null); setPreview(null);
    const snapshot = experimentSnapshot('search', { params, goals, materials }, session.controls);
    snapshot.payload.points = 51;
    try {
      const response = await fetch('/api/search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(snapshot.payload), signal: request.signal });
      if (!response.ok) throw new Error(`Preview failed (HTTP ${response.status}).`);
      const result = parseExperimentResult('search', await response.json(), snapshot);
      if (!request.signal.aborted && latest.current === key) setPreview({ key, result });
    } catch (reason) {
      if (!request.signal.aborted && latest.current === key) setError(reason instanceof Error ? reason.message : 'Preview failed.');
    } finally { if (controller.current === request) setPendingKey(null); }
  };
  const exportPdf = async () => {
    const producingResult = session.search.result;
    const applied = session.getApply('search'), appliedMaterials = session.getSearchMaterials();
    if (!applied || !appliedMaterials || !candidate || !producing || !producingResult || !session.isCurrentSearch(producingResult)) return;
    setError(null);
    try {
      const generatedAt = new Date().toISOString();
      const pdf = await buildDesignReportPdf({ generatedAt, goals: producing.goals, design: candidate,
        provenance: { ncut: producing.params.ncut, ng: candidate.ng, modelVersion: session.search.result!.model_version },
        material: { name: `${stack.material} + ${stack.substrate}`, lossRange: `${stack.lowPowerLossMin.toExponential(1)}–${stack.lowPowerLossMax.toExponential(1)}`,
          preparation: stack.treatment, difficulty: `${num(processBurden(stack), 1)} heuristic points`, rank, total: stacks.length, sourceUrl: BCQT_SOURCE }, explanation });
      // Recheck the session's live guard after the asynchronous PDF import/render.
      if (!session.isCurrentSearch(producingResult) || JSON.stringify(session.getApply('search')) !== JSON.stringify(applied) || JSON.stringify(session.getSearchMaterials()) !== JSON.stringify(appliedMaterials) || latest.current !== key) return;
      const url = URL.createObjectURL(new Blob([pdf.slice().buffer as ArrayBuffer], { type: 'application/pdf' }));
      const anchor = document.createElement('a'); anchor.href = url; anchor.download = designReportFilename(generatedAt);
      document.body.appendChild(anchor); anchor.click(); anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'PDF export failed.'); }
  };
  return <details className="tech backend-design-tools" data-tour="design-extensions" open>
    <summary>Quick starts, preview & design alternatives</summary>
    <div className="body">
      <div className="row-actions">{PRESETS.map(preset => <button type="button" className="btn" key={preset.label} onClick={() => {
        onGoalsChange({ target_ghz: preset.target, tolerance_ghz: .25, min_anharmonicity_mhz: preset.alpha, max_dispersion_khz: preset.charge });
        session.setControls({ materialPriority: preset.priority });
      }}>{preset.label}</button>)}</div>
      <button type="button" className="btn" disabled={pendingKey === key || !!session.validationError('search')} aria-busy={pendingKey === key} onClick={quickPreview}>Preview 51 designs</button>
      {preview?.key === key && <p role="status">{preview.result.feasible_count} of {preview.result.evaluated_count} quick samples passed. {preview.result.feasible_count ? 'Run the full search to inspect and apply a design.' : 'Inspect the constraints or relax your charge sensitivity or level separation goal.'}</p>}
      {session.search.result && candidate && <>
        {!session.search.current && <p role="status">Outdated alternatives — rerun search.</p>}
        <p>The visible complete-design selector contains all <MathText math={`${stacks.length}`} /> measured material pairs. The current pair is ranked <MathText math={`${rank}`} />.</p>
        <p>{explanation}</p>
        <p>Inspecting a point changes the candidate only. Choose “Use variables + materials” to apply its exact parameters.</p>
        <button type="button" className="btn" disabled={!session.getApply('search')} onClick={exportPdf}>Export design PDF</button>
      </>}
      {error && <p role="alert">{error}</p>}
    </div>
  </details>;
}
