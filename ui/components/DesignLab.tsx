'use client';

import { useState } from 'react';
import DesignExtensions from './DesignExtensions';
import MathText from './MathText';
import RichMathText from './RichMathText';
import TradeoffChart from './TradeoffChart';
import { num } from '@/lib/format';
import { mathRange, mathValue, scientific } from '@/lib/math-format';
import { BCQT_SOURCE } from '@/lib/material-records';
import type { MaterialAppearance } from '@/lib/material-colors';
import { rankDistinctMaterialPairs } from '@/lib/material-ranking';
import type { SubstratePreference } from '@/lib/material-ranking';
import { numericExperimentInput, type ExperimentSession } from '@/lib/experiment-session';
import type {
  DesignGoals,
  DeviceParams,
  DeviceResult,
} from '@/lib/types';

interface DesignLabProps {
  baseline?: DeviceResult | null;
  params: DeviceParams;
  result: DeviceResult | null;
  goals: DesignGoals;
  onGoalsChange: (goals: DesignGoals) => void;
  onApply: (params: DeviceParams) => void;
  session: ExperimentSession;
  onMaterialsChange: (topMaterial: string, baseMaterial: string) => void;
  currentMaterials: MaterialAppearance;
}

export default function DesignLab({
  session,
  params,
  result,
  goals,
  onGoalsChange,
  onApply,
  onMaterialsChange,
  currentMaterials,
  baseline,
}: DesignLabProps) {
  const [materialChoiceId, setMaterialChoiceId] = useState<string | null>(null);
  const { variation, flux, asymmetry, materialPriority, substratePreference } = session.controls;
  const search = session.search.result, stress = session.stress.result, tunable = session.tunable.result;
  const busy = (['search', 'stress', 'tunable', 'material'] as const).find((kind) => session[kind].status === 'pending') ?? null;
  const producingControls = session.search.snapshot?.controls;
  const rankedStacks = rankDistinctMaterialPairs(
    producingControls?.materialPriority ?? materialPriority,
    producingControls?.substratePreference ?? substratePreference,
  );
  const recommendedStack = rankedStacks.find(stack => stack.id === (materialChoiceId ?? session.chosenMaterialId)) ?? rankedStacks[0];
  const candidate = session.chosenCandidate;
  const candidateParams = candidate && session.search.snapshot ? {
    ej_ghz: candidate.ej_ghz,
    ec_ghz: candidate.ec_ghz,
    ng: candidate.ng,
    ncut: session.search.snapshot.params.ncut,
  } : null;
  const candidateAlreadyApplied = !!candidateParams
    && Math.abs(params.ej_ghz - candidateParams.ej_ghz) < 1e-9
    && Math.abs(params.ec_ghz - candidateParams.ec_ghz) < 1e-9
    && Math.abs(params.ng - candidateParams.ng) < 1e-9
    && params.ncut === candidateParams.ncut;
  const canApplyCompleteDesign = !!candidateParams && (session.search.current || candidateAlreadyApplied);
  const passingCandidates = search?.candidates.filter(item => item.feasible) ?? [];
  const completeCombinationCount = passingCandidates.length * rankedStacks.length;
  const selectedMaterialRank = rankedStacks.findIndex(stack => stack.id === recommendedStack.id) + 1;
  const selectionEvidence = search?.selection_evidence;
  const assessedBaseline = search?.baseline_evaluation;
  const baselineAssessmentCurrent = !!baseline && !!assessedBaseline && session.search.current
    && (['ej_ghz','ec_ghz','ng','ncut'] as const).every(key=>baseline[key]===assessedBaseline.params[key]);
  const constraintName = (reason:string) => ({charge_budget_khz:'charge sensitivity limit',anharmonicity_floor_mhz:'minimum level separation',frequency_tolerance_ghz:'frequency tolerance',ej_min_ghz:'minimum junction energy',ej_max_ghz:'maximum junction energy',ec_min_ghz:'minimum charging energy',ec_max_ghz:'maximum charging energy'}[reason] ?? reason.replaceAll('_',' '));
  const updateGoal = (key: keyof DesignGoals, value: number) => onGoalsChange({ ...goals, [key]: value });
  const run = session.run;
  const error = session.search.error ?? session.stress.error ?? session.tunable.error;
  const currentChecks = result ? [
    {
      name: 'Operating frequency', symbol: 'f_{01}',
      pass: Math.abs(result.f01_ghz - goals.target_ghz) <= goals.tolerance_ghz,
      actual: mathValue(result.f01_ghz, 3, 'GHz'),
      requirement: `${mathValue(goals.target_ghz, 1, 'GHz')}\\pm${mathValue(goals.tolerance_ghz, 2, 'GHz')}`,
      problem: 'The frequency is too far from the target.',
    },
    {
      name: 'Level separation', symbol: '|\\alpha|',
      pass: result.anharmonicity_mhz >= goals.min_anharmonicity_mhz,
      actual: mathValue(result.anharmonicity_mhz, 1, 'MHz'),
      requirement: `\\ge ${mathValue(goals.min_anharmonicity_mhz, 0, 'MHz')}`,
      problem: 'The energy levels are too close together.',
    },
    {
      name: 'Charge sensitivity', symbol: '\\delta f_{01}',
      pass: result.dispersion_upper_khz <= goals.max_dispersion_khz,
      actual: mathValue(result.dispersion_upper_khz, 3, 'kHz'),
      requirement: `\\le ${mathValue(goals.max_dispersion_khz, 2, 'kHz')}`,
      problem: 'The frequency changes too much with stray charge.',
    },
  ] : [];
  const currentPasses = currentChecks.filter(check => check.pass).length;

  return (
    <div className="insp-section design-lab">
      <div className="insp-title">Find a complete design</div>
      <p className="insp-role">Choose a target speed. The app will recommend electrical settings and an evidence-backed material stack.</p>

      <DesignExtensions session={session} params={params} goals={goals} materials={currentMaterials} onGoalsChange={onGoalsChange} />
      <div className="current-stack">
        <span>Currently using</span>
        <strong>{currentMaterials.topMaterial} on {currentMaterials.baseMaterial}</strong>
      </div>

      <section className="design-goals" aria-labelledby="design-goals-title">
        <div className="design-goals-heading"><div><strong id="design-goals-title">The three design goals</strong><small>The search must satisfy all three.</small></div><span><MathText math="3/3" /></span></div>
        <label className="design-goal-card goal-primary" htmlFor="design-target-frequency">
          <span className="design-goal-name"><b><MathText math="f_{01}" /></b><span><strong>Operating frequency</strong><small>How fast the qubit changes state.</small></span></span>
          <output><MathText math={mathValue(goals.target_ghz, 1, 'GHz')} /></output>
          <input id="design-target-frequency" aria-label="Target operating frequency" aria-invalid={!Number.isFinite(goals.target_ghz) || goals.target_ghz < 3 || goals.target_ghz > 8} aria-describedby="design-target-help design-search-validation" type="range" min="3" max="8" step="0.1" value={Number.isFinite(goals.target_ghz) ? goals.target_ghz : ''} onChange={(event) => updateGoal('target_ghz', numericExperimentInput(event.target.value))} />
          <input aria-label="Target operating frequency value" type="number" min="3" max="8" step="0.1" value={Number.isFinite(goals.target_ghz) ? goals.target_ghz : ''} aria-invalid={!Number.isFinite(goals.target_ghz) || goals.target_ghz < 3 || goals.target_ghz > 8} onChange={event=>updateGoal('target_ghz',numericExperimentInput(event.target.value))} />
          <small id="design-target-help"><RichMathText>Choose 3–8 GHz.</RichMathText></small>
        </label>
        <label className="design-goal-card">
          <span className="design-goal-name"><b><MathText math="|\alpha|" /></b><span><strong>Level separation</strong><small>Keeps nearby states easier to tell apart.</small></span></span>
          <output><MathText math={`\\ge ${mathValue(goals.min_anharmonicity_mhz, 0, 'MHz')}`} /></output>
          <input aria-label="Minimum level separation" type="range" min="0" max="1000" step="10" value={goals.min_anharmonicity_mhz} onChange={(event) => updateGoal('min_anharmonicity_mhz', Number(event.target.value))} />
          <small>Higher gives more separation.</small>
        </label>
        <label className="design-goal-card">
          <span className="design-goal-name"><b><MathText math="\delta f_{01}" /></b><span><strong>Charge sensitivity</strong><small>How much stray charge can disturb the qubit.</small></span></span>
          <output><MathText math={`\\le ${mathValue(goals.max_dispersion_khz, 2, 'kHz')}`} /></output>
          <input aria-label="Maximum charge sensitivity" type="range" min="0.01" max="100" step="0.01" value={goals.max_dispersion_khz} onChange={(event) => updateGoal('max_dispersion_khz', Number(event.target.value))} />
          <small>Lower means better protection from charge noise.</small>
        </label>
      </section>

      <section className={`design-verdict ${result && currentPasses === currentChecks.length ? 'ideal' : 'needs-work'}`} aria-live="polite">
        <div className="design-verdict-heading"><span>{result && currentPasses === currentChecks.length ? '✓' : '!'}</span><div><strong>{!result ? 'Checking the current setup…' : currentPasses === currentChecks.length ? 'Current setup is ideal for these goals' : `Current setup is not ideal yet · ${currentPasses} of ${currentChecks.length} goals pass`}</strong><small>{!result ? 'A verdict will appear when the calculation finishes.' : currentPasses === currentChecks.length ? 'The current calculation meets all three limits shown above.' : 'The items marked “Needs changes” explain what is not working.'}</small></div></div>
        {result && <div className="design-verdict-checks">{currentChecks.map(check => <div key={check.name} className={check.pass ? 'passes' : 'fails'}><span>{check.pass ? '✓' : '×'}</span><div><strong>{check.name} · <MathText math={check.symbol} /></strong><small>Current: <MathText math={check.actual} /> · Goal: <MathText math={check.requirement} /></small>{!check.pass && <p>{check.problem}</p>}</div><b>{check.pass ? 'Works' : 'Needs changes'}</b></div>)}</div>}
      </section>

      <details className="tech goal-rules">
        <summary>Advanced: allowed frequency difference</summary>
        <div className="body goal-sliders"><label className="scenario-field"><span>Allowed difference <strong><MathText math={`\\pm ${mathValue(goals.tolerance_ghz, 2, 'GHz')}`} /></strong></span><input aria-label="Allowed frequency error" type="range" min="0.01" max="1" step="0.01" value={goals.tolerance_ghz} onChange={(event) => updateGoal('tolerance_ghz', Number(event.target.value))} /><small>How far the final result may be from goal one and still pass.</small></label></div>
      </details>

      <div className="material-goal">
        <div className="material-goal-title">How should materials be chosen?</div>
        <label className="material-picker compact-picker"><span>What matters most?</span><select aria-label="Material ranking priority" value={materialPriority >= 50 ? 'performance' : 'process'} onChange={(event) => session.setControls({ materialPriority: event.target.value === 'performance' ? 100 : 0 })}><option value="performance">Best measured performance</option><option value="process">Simpler reported manufacturing</option></select></label>
        <label className="material-picker compact-picker">
          <span>Supporting material</span>
          <select value={substratePreference} onChange={(event) => session.setControls({ substratePreference: event.target.value as SubstratePreference })}>
            <option value="any">Any measured substrate</option>
            <option value="Si">Silicon only</option>
            <option value="Al₂O₃ (sapphire)">Sapphire only</option>
          </select>
        </label>
        <small className="material-goal-help">Choose “Any” if you are unsure. The app only ranks material pairs that have published measurements.</small>
      </div>

      <button type="button" className="btn primary lab-button full-button" aria-label="Find variables + materials" aria-busy={busy === 'search'} onClick={() => run('search')} disabled={busy !== null || !!session.validationError('search')}>
        <span role="status">{busy === 'search' ? <>Searching <MathText math="201" /> designs…</> : 'Find variables + materials'}</span>
      </button>
      {session.validationError('search') && <p id="design-search-validation" className="scenario-error" role="status">{session.validationError('search')}</p>}
          {search && (
            <div className="lab-result" aria-live="polite">
              <span className={`pill ${session.search.current || candidateAlreadyApplied ? 'ok' : candidate ? '' : 'no'}`}>{session.search.current ? candidate ? '✓ Found a design that passes' : 'No design passed these rules' : candidateAlreadyApplied ? '✓ Electrical values applied · materials can still be changed' : 'Outdated result — rerun search'}</span>
              <p>The app checked <MathText math={`${search.evaluated_count}`} /> options; <MathText math={`${search.feasible_count}`} /> passed every rule.</p>
              <TradeoffChart candidates={search.candidates} selected={candidate} recommended={search.selected} applied={result} baseline={baseline} current={session.search.current} onSelect={session.chooseCandidate} />
              {selectionEvidence&&<details className="tech search-selection-evidence"><summary>Why this recommendation?</summary><div className="body">
                <p>{selectionEvidence.kind==='higher_a_rejected'?`${selectionEvidence.higher_a_count} evaluated points had higher level separation but failed at least one constraint.`:selectionEvidence.kind==='grid_boundary'?`The recommendation lies at the ${selectionEvidence.selected_at_ratio_boundary} ratio boundary of the evaluated grid.`:selectionEvidence.kind==='infeasible'?'No evaluated point met all constraints. Inspect rejected points in the graph to see which limits failed.':'The recommendation has the highest level separation among the passing evaluated points.'}</p>
                {selectionEvidence.higher_a_rejections.length>0&&<ul>{selectionEvidence.higher_a_rejections.map(item=><li key={item.reason}>{constraintName(item.reason)}: {item.count} rejected points</li>)}</ul>}
                <p>Optimality applies to the evaluated grid only.</p>
              </div></details>}
              {baseline&&<section className="search-baseline-assessment" aria-label="Baseline eligibility"><strong>Frozen baseline against these goals</strong>
                {baselineAssessmentCurrent&&assessedBaseline?<p>{assessedBaseline.assessment.feasible?'Baseline qualifies under the current search requirements.':`Baseline fails: ${assessedBaseline.assessment.violations.map(constraintName).join('; ')}.`}</p>:<p>Rerun search to assess this baseline against the current requirements.</p>}
                {baselineAssessmentCurrent&&assessedBaseline&&candidate&&<p>Selected candidate minus baseline: {num(candidate.anharmonicity_mhz-assessedBaseline.assessment.anharmonicity_mhz,1)} MHz level separation; {num(candidate.dispersion_upper_khz-assessedBaseline.assessment.dispersion_upper_khz,3)} kHz charge bound. These differences describe trade-offs.</p>}
              </section>}
              {candidate && <>
                <div className="recommend-block">
                  <strong>Electrical settings</strong>
                  <dl className="kv"><dt><MathText math="E_J/E_C" /></dt><dd><MathText math={`${mathValue(candidate.ej_ghz, 3, 'GHz')}/${mathValue(candidate.ec_ghz, 3, 'GHz')}`} /></dd><dt>Offset charge / cutoff</dt><dd><MathText math={`n_g=0 / n_{\\mathrm{cut}}=${session.search.snapshot?.params.ncut ?? 0}`} /></dd><dt>Operating frequency</dt><dd><MathText math={mathValue(candidate.f01_ghz, 3, 'GHz')} /></dd><dt>Level separation</dt><dd><MathText math={mathValue(candidate.anharmonicity_mhz, 1, 'MHz')} /></dd><dt>Charge sensitivity</dt><dd><MathText math={`\\le ${mathValue(candidate.dispersion_upper_khz, 3, 'kHz')}`} /></dd></dl>
                </div>
                <section className="complete-design-combinations" aria-labelledby="complete-combinations-title">
                  <div className="complete-design-combinations-head">
                    <div><strong id="complete-combinations-title">Complete design combinations</strong><small>Every passing electrical point can use any measured pair below.</small></div>
                    <span><MathText math={`${passingCandidates.length}\\times${rankedStacks.length}=${completeCombinationCount}`} /></span>
                  </div>
                  <label className="material-picker">
                    <span>Material pair for the selected graph point</span>
                    <select aria-label="Material pair for selected design" value={recommendedStack.id} onChange={event => { setMaterialChoiceId(event.target.value); session.chooseMaterial(event.target.value); }}>
                      {rankedStacks.map((stack, index) => <option key={stack.id} value={stack.id}>{index + 1}. {stack.material} on {stack.substrate}</option>)}
                    </select>
                  </label>
                  <div className="selected-complete-design" aria-live="polite">
                    <small>Selected complete design</small>
                    <strong><MathText math={`E_J/E_C=${num(candidate.ratio, 1)}`} /> · {recommendedStack.material} on {recommendedStack.substrate}</strong>
                    <span>Material rank <MathText math={`${selectedMaterialRank}/${rankedStacks.length}`} /> for your chosen priority</span>
                  </div>
                  <dl className="kv">
                    <dt>Published result</dt><dd><MathText math={`${scientific(recommendedStack.lowPowerLossMin)}-${scientific(recommendedStack.lowPowerLossMax)}`} /><small>Measured signal loss; smaller is better.</small></dd>
                    <dt>Why this pair?</dt><dd>{materialPriority >= 50 ? 'It has strong measured performance.' : 'Its reported manufacturing steps are comparatively simple.'}</dd>
                  </dl>
                  <p>Material pairs share graph positions because the electrical solver does not guess how a material changes <MathText math="E_J" /> or <MathText math="E_C" />.</p>
                </section>
                <button type="button" className="btn primary full-button" onClick={() => {
                  if (!canApplyCompleteDesign || !candidateParams) return;
                  onApply(candidateParams);
                  onMaterialsChange(recommendedStack.material, recommendedStack.substrate);
                }} disabled={!canApplyCompleteDesign}>{candidateAlreadyApplied && !session.search.current ? 'Use selected material' : 'Use variables + materials'}</button>
                <p className="combined-scope">The electrical settings and material evidence are checked separately. This is a learning recommendation, not a promise that a manufactured chip will perform exactly this way. <a href={BCQT_SOURCE} target="_blank" rel="noreferrer">View material data</a>.</p>
              </>}
            </div>
          )}

      <div className="section-divider" />
      <div className="insp-title small-title">Optional experiments</div>
      <p className="insp-role">Open one when you want to explore beyond the basic chip.</p>
      <details className="tech experiment-card">
        <summary>How robust is this design?</summary>
        <div className="body">
          <p>Test <MathText math="9" /> hypothetical electrical cases that vary <MathText math="E_J" /> and <MathText math="E_C" /> independently.</p>
          <label className="scenario-field"><span>Possible variation <strong><MathText math={`\\pm ${mathValue(variation, 1, 'percent')}`} /></strong></span><input type="range" min="0.1" max="20" step="0.1" value={variation} onChange={(e) => { session.setControls({ variation: Number(e.target.value) }); }} /></label>
          <button type="button" className="btn lab-button" onClick={() => run('stress')} disabled={busy !== null || !!session.validationError('stress')}>{busy === 'stress' ? 'Testing…' : 'Test robustness'}</button>
          {session.validationError('stress') && <p className="scenario-error" role="status">{session.validationError('stress')}</p>}
          {stress && <div className="lab-result" aria-live="polite">{!session.stress.current && <p className="scenario-error" role="status">Outdated result — rerun this experiment.</p>}<dl className="kv"><dt>Frequency could be</dt><dd><MathText math={mathRange(stress.ranges.f01_ghz.min, stress.ranges.f01_ghz.max, 3, 'GHz')} /></dd><dt>Level separation</dt><dd><MathText math={mathRange(stress.ranges.anharmonicity_mhz.min, stress.ranges.anharmonicity_mhz.max, 1, 'MHz')} /></dd><dt>Worst charge sensitivity</dt><dd><MathText math={mathValue(stress.ranges.dispersion_upper_khz.max, 3, 'kHz')} /></dd></dl><p>This is a sensitivity test, not a manufacturing-yield prediction.</p></div>}
        </div>
      </details>

      <details className="tech experiment-card">
        <summary>What if the chip is flux-tunable?</summary>
        <div className="body">
          <p>Add a second junction so magnetic flux can tune the operating frequency.</p>
          <label className="scenario-field"><span>Magnetic flux <strong><MathText math={`${num(flux, 2)}\\,\\Phi/\\Phi_0`} /></strong></span><input type="range" min="0" max="1" step="0.01" value={flux} onChange={(e) => { session.setControls({ flux: Number(e.target.value) }); }} /></label>
          <label className="scenario-field"><span>Difference between junctions <strong><MathText math={mathValue(asymmetry * 100, 0, 'percent')} /></strong></span><input type="range" min="0" max="1" step="0.01" value={asymmetry} onChange={(e) => { session.setControls({ asymmetry: Number(e.target.value) }); }} /></label>
          <button type="button" className="btn lab-button" onClick={() => run('tunable')} disabled={busy !== null || !!session.validationError('tunable')}>{busy === 'tunable' ? 'Calculating…' : 'Try flux-tunable chip'}</button>
          {session.validationError('tunable') && <p className="scenario-error" role="status">{session.validationError('tunable')}</p>}
          {tunable && <div className="lab-result" aria-live="polite">{!session.tunable.current && <p className="scenario-error" role="status">Outdated result — rerun this experiment.</p>}<dl className="kv"><dt>Operating frequency</dt><dd><MathText math={mathValue(tunable.f01_ghz, 3, 'GHz')} /></dd><dt>Effective junction energy</dt><dd><MathText math={mathValue(tunable.effective_ej_ghz, 3, 'GHz')} /></dd><dt>Level separation</dt><dd><MathText math={mathValue(tunable.anharmonicity_mhz, 1, 'MHz')} /></dd></dl><p>This uses a separate tunable-transmon model; it does not change the main chip above.</p></div>}
        </div>
      </details>
      {error && <p className="scenario-error" role="status">{error}</p>}
    </div>
  );
}
