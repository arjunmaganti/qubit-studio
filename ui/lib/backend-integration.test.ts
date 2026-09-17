import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { DEFAULT_EXPERIMENT_CONTROLS, experimentSnapshot, parseExperimentResult } from './experiment-session.ts';
import { buildChipSnapshot } from './insight-snapshot.ts';
import { composeLocalMyla } from './explain-local.ts';
import { TOPIC_IDS } from './explain-topics.ts';
import { createExplainHandler } from './explain-handler.ts';
import { createDesignShareUrl, parseDesignShareUrl } from './design-link.ts';
import { buildDesignReportPdf } from './design-report.ts';
import { DEFAULT_COMPONENT_MATERIALS } from './component-materials.ts';
import { parseChipSnapshot } from './insight-snapshot.ts';
import { buildExplainUserPrompt } from './explain-llm.ts';

const fixtures = JSON.parse(readFileSync(new URL('../../qa/browser/fixtures/solver.json', import.meta.url), 'utf8'));
const goals = { target_ghz: 5, tolerance_ghz: .25, min_anharmonicity_mhz: 200, max_dispersion_khz: 10 };
const snapshot = () => buildChipSnapshot({ params: fixtures.params, result: fixtures.evaluate, baseline: null, selected: 'junction', stale: false, error: null, goals, materials: { topMaterial: 'Al', baseMaterial: 'Si' }, explode: .5 });

test('local teaching requires validated completed evidence and identifies its source honestly', () => {
  const ready = snapshot();
  assert.equal(ready.readiness, 'ready');
  for (const topic of TOPIC_IDS) {
    const local = composeLocalMyla(topic, ready);
    assert.equal(local.model, 'local-teaching'); assert.ok(local.body.length > 0);
    assert.equal(composeLocalMyla(topic, { ...ready, stale: true }).body, 'Wait for a completed current calculation.');
    assert.equal(composeLocalMyla(topic, { ...ready, readiness: 'pending', outputs: null }).body, 'Wait for a completed current calculation.');
  }
});

test('every expanded topic is accepted by the bounded route without a live provider', async () => {
  const seen: string[] = [];
  const handler = createExplainHandler({ configured: () => true, explain: async topics => {
    seen.push(...topics); return { topic: topics[0], title: 'Mock response', body: 'Explicitly mocked provider.', model: 'gemini-2.5-flash' };
  } });
  for (const topic of TOPIC_IDS) {
    const response = await handler(new Request('http://local/api/explain', { method: 'POST', body: JSON.stringify({ topics: [topic], snapshot: snapshot() }) }));
    assert.equal(response.status, 200, topic);
  }
  assert.deepEqual(seen, [...TOPIC_IDS]);
});

test('Myla receives current component appearances and exploded state while electrical evidence stays fixed', () => {
  const original = snapshot();
  const customized = { ...original, selected_part: 'substrate' as const, view_explode: 1,
    rendered_component_materials: { ...DEFAULT_COMPONENT_MATERIALS, capacitor: 'Ta', package: 'Cu', substrate: 'sapphire' } };
  const parsed = parseChipSnapshot(customized);
  assert.ok(parsed.ok);
  assert.deepEqual(parsed.snapshot.outputs, original.outputs);
  const local = composeLocalMyla('materials', parsed.snapshot).body;
  assert.match(local, /Tantalum/); assert.match(local, /Copper/); assert.match(local, /Sapphire/);
  assert.match(composeLocalMyla('substrate', parsed.snapshot).body, /Sapphire/);
  assert.match(composeLocalMyla('assembly', parsed.snapshot).body, /separated layers/);
  const prompt = buildExplainUserPrompt(['materials', 'assembly'], parsed.snapshot);
  assert.match(prompt, /"rendered_capacitor_material": "Ta"/);
  assert.match(prompt, /"view_explode":1/);
});

test('share links retain full main goal bounds and exact electrical coordinates', () => {
  const design = { params: { ej_ghz: 16.123456789, ec_ghz: .3123456789, ng: 0, ncut: 40 }, goals: { ...goals, max_dispersion_khz: 50000, min_anharmonicity_mhz: 1500 }, topMaterial: 'Al', baseMaterial: 'Si' };
  assert.deepEqual(parseDesignShareUrl(createDesignShareUrl(design, 'https://example.test')), design);
});

test('real PDF includes the producing cutoff and model provenance', async () => {
  const bytes = await buildDesignReportPdf({ generatedAt: '2026-09-12T16:00:00Z', goals, design: fixtures.search.selected,
    material: { name: 'Al on Si', lossRange: '1e-6', preparation: 'Recorded treatment', difficulty: 'Heuristic only', rank: 1, total: 10, sourceUrl: 'https://example.test' },
    explanation: 'Evaluated grid recommendation; materials are independent evidence.', provenance: { ng: 0, ncut: 40, modelVersion: 'integration-provenance' } });
  const text = new TextDecoder().decode(bytes);
  assert.match(text, /^%PDF-/); assert.match(text, /ncut 40/); assert.match(text, /integration-provenance/);
});


test('actual extended search response preserves baseline assessment through the current session parser', () => {
  const context = { params: fixtures.params, goals,
    materials: { topMaterial: 'Al', baseMaterial: 'Si', topColor: '#aaaaaa', baseColor: '#333333' },
    baseline: fixtures.evaluate };
  const snapshot = experimentSnapshot('search', context, DEFAULT_EXPERIMENT_CONTROLS);
  const result = parseExperimentResult('search', fixtures.searchWithBaseline, snapshot);
  assert.deepEqual(result.baseline_evaluation?.params, fixtures.params);
  assert.equal(result.baseline_evaluation?.assessment.ng, fixtures.params.ng);
  assert.equal(result.baseline_evaluation?.assessment.ncut, fixtures.params.ncut);
  assert.ok(result.selection_evidence);
  assert.equal(result.selected?.ej_ghz, fixtures.search.selected.ej_ghz);
  assert.equal(result.selected?.ec_ghz, fixtures.search.selected.ec_ghz);
});
