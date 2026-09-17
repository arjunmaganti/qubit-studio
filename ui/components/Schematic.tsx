'use client';

import { PARTS } from '@/lib/parts';
import MathText from '@/components/MathText';
import type { PartId } from '@/lib/parts';
import { num } from '@/lib/format';
import type { DeviceParams } from '@/lib/types';

const ACCENT = '#1a6fe0';
const WIRE = '#39424d';
const DIM = '#97a0ab';

interface SchematicProps {
  params: DeviceParams;
  selected: PartId | null;
  hiddenParts: PartId[];
  onSelect: (id: PartId) => void;
  onClearSelection: () => void;
  materialColors: Partial<Record<PartId, string>>;
}

/** Flat circuit view of the same device. Selection is shared with the 3D view. */
export default function Schematic({
  params,
  selected,
  hiddenParts,
  onSelect,
  onClearSelection,
  materialColors,
}: SchematicProps) {
  const stroke = (id: PartId) => (selected === id ? ACCENT : WIRE);
  const width = (id: PartId) => (selected === id ? 3 : 1.8);
  const labelFill = (id: PartId) => (selected === id ? ACCENT : '#5c6672');
  const shown = (id: PartId) => !hiddenParts.includes(id);
  const pick = (id: PartId) => ({
    className: 'pick',
    onClick: (event: React.MouseEvent) => {
      event.stopPropagation();
      onSelect(id);
    },
    tabIndex: 0,
    role: 'button' as const,
    'aria-label': PARTS.find((p) => p.id === id)?.name,
    'aria-pressed': selected === id,
    onKeyDown: (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onSelect(id);
      }
    },
  });

  return (
    <svg viewBox="0 0 480 290" role="img" aria-label="Transmon circuit schematic" onClick={onClearSelection}>
      <rect x="0" y="0" width="480" height="290" fill="#ffffff" />

      {shown('substrate') && (
        <g {...pick('substrate')}>
          <rect
            x="22"
            y="26"
            width="436"
            height="238"
            rx="8"
            fill="none"
            strokeDasharray="5 4"
            stroke={selected === 'substrate' ? ACCENT : '#c9d0d8'}
            strokeWidth={selected === 'substrate' ? 2.4 : 1.4}
            pointerEvents="stroke"
          />
          <rect x="28" y="32" width="10" height="10" rx="2" fill={materialColors.substrate} />
          <text x="32" y="44" fontSize="10" fill={labelFill('substrate')}>
            substrate — illustrative
          </text>
        </g>
      )}

      {/* island rails */}
      <path d="M150 86 H340" stroke={WIRE} strokeWidth="1.8" fill="none" />
      <text x="245" y="76" fontSize="10" textAnchor="middle" fill={DIM}>
        island
      </text>

      {shown('ground') && (
        <g {...pick('ground')}>
          <path d="M150 216 H340" stroke={stroke('ground')} strokeWidth={width('ground')} fill="none" />
          <path
            d="M245 216 V232 M231 232 H259 M236 238 H254 M241 244 H249"
            stroke={stroke('ground')}
            strokeWidth={width('ground')}
            fill="none"
          />
          <text x="245" y="260" fontSize="10" textAnchor="middle" fill={labelFill('ground')}>
            ground plane
          </text>
        </g>
      )}

      {/* Josephson junction branch */}
      {shown('junction') && (
        <g {...pick('junction')}>
          <path d="M196 86 V124 M196 158 V216" stroke={stroke('junction')} strokeWidth={width('junction')} fill="none" />
          <rect
            x="178"
            y="124"
            width="36"
            height="34"
            fill="#fff"
            style={{ fill: materialColors.junction ?? '#fff', fillOpacity: 0.32 }}
            stroke={stroke('junction')}
            strokeWidth={width('junction')}
          />
          <path
            d="M178 124 L214 158 M214 124 L178 158"
            stroke={stroke('junction')}
            strokeWidth={width('junction')}
            fill="none"
          />
          <text x="168" y="118" fontSize="11" textAnchor="end" fill={labelFill('junction')} fontWeight={selected === 'junction' ? 600 : 400}>
            junction
          </text>
          <foreignObject x="55" y="121" width="113" height="20" style={{ color: DIM, fontSize: 10, textAlign: 'right' }}>
            <MathText math={`E_J/h=${num(params.ej_ghz, 2)}\\,\\mathrm{GHz}`} />
          </foreignObject>
        </g>
      )}

      {/* shunt capacitor branch */}
      {shown('capacitor') && (
        <g {...pick('capacitor')}>
          <path d="M300 86 V132 M300 150 V216" stroke={stroke('capacitor')} strokeWidth={width('capacitor')} fill="none" />
          <path
            d="M274 132 H326 M274 150 H326"
            stroke={selected === 'capacitor' ? ACCENT : (materialColors.capacitor ?? stroke('capacitor'))}
            strokeWidth={selected === 'capacitor' ? 3.4 : 2.4}
            fill="none"
          />
          <text x="336" y="128" fontSize="11" fill={labelFill('capacitor')} fontWeight={selected === 'capacitor' ? 600 : 400}>
            shunt pads
          </text>
          <foreignObject x="336" y="132" width="130" height="20" style={{ color: DIM, fontSize: 10 }}>
            <MathText math={`E_C/h=${num(params.ec_ghz, 3)}\\,\\mathrm{GHz}`} />
          </foreignObject>
        </g>
      )}

      {/* charge gate branch */}
      {shown('gate') && (
        <g {...pick('gate')}>
          <path d="M150 86 H104" stroke={stroke('gate')} strokeWidth={width('gate')} fill="none" />
          <path
            d="M104 68 V104 M90 68 V104"
            stroke={stroke('gate')}
            strokeWidth={selected === 'gate' ? 3.4 : 2.4}
            fill="none"
          />
          <path d="M90 86 H60 V150" stroke={stroke('gate')} strokeWidth={width('gate')} fill="none" />
          <circle cx="60" cy="168" r="18" fill="#fff" stroke={stroke('gate')} strokeWidth={width('gate')} />
          <foreignObject x="47" y="157" width="26" height="22" style={{ color: labelFill('gate'), fontSize: 11, textAlign: 'center' }}>
            <MathText math="n_g" />
          </foreignObject>
          <path
            d="M60 186 V202 M48 202 H72 M52 208 H68 M56 214 H64"
            stroke={stroke('gate')}
            strokeWidth={width('gate')}
            fill="none"
          />
          <text x="60" y="58" fontSize="11" textAnchor="middle" fill={labelFill('gate')} fontWeight={selected === 'gate' ? 600 : 400}>
            charge gate
          </text>
          <foreignObject x="25" y="225" width="70" height="20" style={{ color: DIM, fontSize: 10, textAlign: 'center' }}>
            <MathText math={`n_g=${num(params.ng, 3)}`} />
          </foreignObject>
        </g>
      )}
    </svg>
  );
}
