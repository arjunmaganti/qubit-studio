'use client';

import { useState } from 'react';
import MathText from '@/components/MathText';
import { validDeviceParams } from '@/lib/device-snapshot';
import { num } from '@/lib/format';
import { mathValue } from '@/lib/math-format';
import { PARAMS } from '@/lib/params';
import {
  capacitorAreaFromEc,
  DEFAULT_GEOMETRY_ASSUMPTIONS,
  ecFromCapacitorArea,
  ejFromJunctionArea,
  junctionAreaFromEj,
} from '@/lib/geometry-model';
import type { DeviceParams } from '@/lib/types';

interface GeometryEditorProps {
  params: DeviceParams;
  onApply: (ejGhz: number, ecGhz: number) => void;
  initiallyOpen?: boolean;
}

const CAPACITOR_AREA_MIN = capacitorAreaFromEc(
  PARAMS.ec_ghz.max,
  DEFAULT_GEOMETRY_ASSUMPTIONS.capacitanceDensityFfUm2,
);
const CAPACITOR_AREA_MAX = capacitorAreaFromEc(
  PARAMS.ec_ghz.min,
  DEFAULT_GEOMETRY_ASSUMPTIONS.capacitanceDensityFfUm2,
);

function capacitorAreaFromSlider(value: string): number {
  return Math.exp(Number(value));
}

export default function GeometryEditor({ params, onApply, initiallyOpen = false }: GeometryEditorProps) {
  const [junctionArea, setJunctionArea] = useState(() =>
    junctionAreaFromEj(params.ej_ghz, DEFAULT_GEOMETRY_ASSUMPTIONS.criticalCurrentDensityAcm2),
  );
  const [capacitorArea, setCapacitorArea] = useState(() =>
    capacitorAreaFromEc(params.ec_ghz, DEFAULT_GEOMETRY_ASSUMPTIONS.capacitanceDensityFfUm2),
  );

  const nextEj = ejFromJunctionArea(junctionArea, DEFAULT_GEOMETRY_ASSUMPTIONS.criticalCurrentDensityAcm2);
  const nextEc = ecFromCapacitorArea(capacitorArea, DEFAULT_GEOMETRY_ASSUMPTIONS.capacitanceDensityFfUm2);
  const junctionVisualScale = Math.min(1.6, Math.max(0.55, Math.sqrt(junctionArea / 0.06)));
  const capacitorVisualScale = Math.min(1.35, Math.max(0.7, Math.sqrt(capacitorArea / 810)));

  const canApply = validDeviceParams({ ...params, ej_ghz: nextEj, ec_ghz: nextEc });
  return (
    <details className="tech geometry-editor" data-tour="geometry" open={initiallyOpen || undefined}>
      <summary>Shape the junction and capacitor</summary>
      <div className="body">
        <p className="geometry-intro">Explore how physical size could affect <MathText math="E_J" /> and <MathText math="E_C" /> using two stated assumptions.</p>

        <label className="geometry-field">
          <span><strong>Junction area</strong><output><MathText math={mathValue(junctionArea, 3, 'um2')} /></output></span>
          <input type="range" min="0.001" max="0.2" step="0.001" value={junctionArea} onChange={(event) => setJunctionArea(Number(event.target.value))} />
          <small>Shown as roughly <MathText math={`${mathValue(Math.sqrt(junctionArea), 3, 'um')}\\times ${mathValue(Math.sqrt(junctionArea), 3, 'um')}`} /> if square.</small>
        </label>

        <div className="geometry-shape-stage">
          <span>Live shape preview</span>
          <div className="geometry-shape-assembly" aria-label="Preview of the capacitor pads and junction shape">
            <i className="geometry-pad" style={{ transform: `scale(${capacitorVisualScale})` }} />
            <i className="geometry-junction" style={{ transform: `scale(${junctionVisualScale})` }} />
            <i className="geometry-pad" style={{ transform: `scale(${capacitorVisualScale})` }} />
          </div>
          <small>This separate shape preview illustrates the area assumptions. Apply sends the estimated energies to the solver; the linked chip drawing stays illustrative.</small>
        </div>

        <label className="geometry-field">
          <span><strong>Capacitor area</strong><output><MathText math={mathValue(capacitorArea, 0, 'um2')} /></output></span>
          <input
            type="range"
            min={Math.log(CAPACITOR_AREA_MIN)}
            max={Math.log(CAPACITOR_AREA_MAX)}
            step="0.001"
            value={Math.log(capacitorArea)}
            onChange={(event) => setCapacitorArea(capacitorAreaFromSlider(event.target.value))}
          />
          <small>A larger capacitor lowers <MathText math="E_C" />. The curved slider scale keeps both small and large areas adjustable.</small>
        </label>

        <div className="geometry-preview">
          <span><small>Estimated <MathText math="E_J/h" /></small><strong><MathText math={mathValue(nextEj, 2, 'GHz')} /></strong></span>
          <span><small>Estimated <MathText math="E_C/h" /></small><strong><MathText math={mathValue(nextEc, 3, 'GHz')} /></strong></span>
          <span><small><MathText math="E_J/E_C" /></small><strong><MathText math={num(nextEj / nextEc, 1)} /></strong></span>
        </div>

        <button type="button" className="btn primary full-button" disabled={!canApply} onClick={() => { if (canApply) onApply(nextEj, nextEc); }}>Apply estimated energies</button>

        <details className="geometry-assumptions">
          <summary>Assumptions used</summary>
          <p>Critical-current density: <MathText math={mathValue(DEFAULT_GEOMETRY_ASSUMPTIONS.criticalCurrentDensityAcm2, 0, 'Acm2')} />.</p>
          <p>Capacitance per area: <MathText math={mathValue(DEFAULT_GEOMETRY_ASSUMPTIONS.capacitanceDensityFfUm2, 0, 'fFum2')} />.</p>
          <p>These fixed teaching values ignore fringe fields, wiring, material-specific processing, and fabrication variation. The 3D shapes scale for comparison, not as a fabrication drawing.</p>
        </details>
      </div>
    </details>
  );
}
