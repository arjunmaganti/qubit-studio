'use client';

import MathText from '@/components/MathText';
import { mathValue } from '@/lib/math-format';
import type { DeviceResult } from '@/lib/types';

/** Tiny frequency-axis sketch: drive at f01 vs leakage at f12. */
export default function DriveCartoon({ result }: { result: DeviceResult }) {
  const alpha = Math.abs(result.alpha_mhz);
  const leaky = alpha < 150;
  const w = 320;
  const h = 78;
  const x01 = 160;
  const x12 = x01 + Math.sign(result.f12_ghz - result.f01_ghz) * (leaky ? 48 : 98);
  const pulse = (cx: number, wide: boolean) => {
    const s = wide ? 28 : 16;
    return `M ${cx - s} 48 C ${cx - s / 2} 48, ${cx - 8} 18, ${cx} 18 C ${cx + 8} 18, ${cx + s / 2} 48, ${cx + s} 48`;
  };

  return (
    <div className="drive-cartoon" data-tour="drive-cartoon">
      <h4>Drive vs leakage</h4>
      <p className="cap"><MathText text="A drive at $f_{01}$ should miss $f_{12}$. A short pulse (or small $|\\alpha|$) is spectrally wide and leaks into $|2\\rangle$." /></p>
      <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Drive pulse at f01 versus leakage at f12">
        <line x1="24" x2={w - 16} y1="48" y2="48" stroke="#d2d7de" />
        <path d={pulse(x01, leaky)} fill="#1a6fe0" opacity="0.22" />
        <path d={pulse(x01, leaky)} fill="none" stroke="#1a6fe0" strokeWidth="1.6" />
        <line x1={x01} x2={x01} y1="16" y2="48" stroke="#1a6fe0" strokeWidth="1.2" />
        <foreignObject x={x01-55} y="0" width="110" height="18"><div className="svg-math-label blue center"><MathText math={`f_{01}=${mathValue(result.f01_ghz, 2, 'GHz')}`} /></div></foreignObject>
        <line x1={x12} x2={x12} y1="22" y2="48" stroke="#b3261e" strokeWidth="1.2" />
        <foreignObject x={x12-55} y="3" width="110" height="18"><div className="svg-math-label red center"><MathText math={`f_{12}=${mathValue(result.f12_ghz, 2, 'GHz')}`} /></div></foreignObject>
        <text x={w - 16} y="64" textAnchor="end" fontSize="10" fill="#878f9b">
          frequency (qualitative)
        </text>
      </svg>
      <p className={`drive-note${leaky ? ' warn' : ''}`}>
        <MathText math={`|\\alpha|=${mathValue(alpha, 0, 'MHz')}`} />. The drawing is qualitative; pulse duration and leakage probability are not simulated.
      </p>
    </div>
  );
}
