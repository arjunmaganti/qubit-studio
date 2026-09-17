import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildDesignReportPdf, designReportFilename } from './design-report.ts';
import type { SearchCandidate } from './types.ts';

const candidate = {
  ej_ghz: 15,
  ec_ghz: 0.3,
  ng: 0,
  ratio: 50,
  raw_levels_ghz: [0, 5, 9.7, 14.1],
  levels_ghz: [0, 5, 9.7, 14.1],
  f01_ghz: 5,
  f12_ghz: 4.7,
  alpha_mhz: -300,
  anharmonicity_mhz: 300,
  dispersion_khz: 1,
  dispersion_status: 'resolved',
  dispersion_upper_khz: 1,
  feasible: true,
  margins: {},
  violations: [],
} satisfies SearchCandidate;

describe('one-page design report', () => {
  it('creates a real PDF containing the selected design report', async () => {
    const pdf = await buildDesignReportPdf({
      generatedAt: '2026-09-12T12:00:00.000Z',
      goals: { target_ghz: 5, tolerance_ghz: 0.25, min_anharmonicity_mhz: 200, max_dispersion_khz: 10 },
      design: candidate,
      material: { name: 'TiN + Al₂O₃', lossRange: '3.0e-7', preparation: 'heated after it was added', difficulty: 'More specialized steps', rank: 1, total: 10, sourceUrl: 'https://example.com/materials' },
      explanation: 'It passes all three goals.',
    });

    assert.equal(new TextDecoder().decode(pdf.slice(0, 5)), '%PDF-');
    assert.ok(pdf.byteLength > 3_000);
    assert.equal(designReportFilename('2026-09-12T12:00:00.000Z'), 'qubit-studio-design-2026-09-12.pdf');
  });
});
