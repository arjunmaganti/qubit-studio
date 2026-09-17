'use client';
import type { KeyboardEvent } from 'react';
import type { PartId } from '@/lib/parts';
import type { DeviceParams } from '@/lib/types';
import { num } from '@/lib/format';
import MathText from '@/components/MathText';
import { mathValue } from '@/lib/math-format';

export default function LayoutCircuit({ params, selected, onSelect }: { params: DeviceParams; selected: PartId | null; onSelect: (part: PartId) => void }) {
  const pick=(id:PartId,label:string)=>({role:'button',tabIndex:0,'aria-label':label,'aria-pressed':selected===id,className:`circuit-pick${selected===id?' is-selected':''}`,onClick:()=>onSelect(id),onKeyDown:(event:KeyboardEvent<SVGGElement>)=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();onSelect(id);}}});
  return <section className="layout-circuit" aria-label="Linked equivalent circuit">
    <div className="layout-circuit-heading"><strong>Equivalent circuit</strong><span>Same selection · applied device</span></div>
    <svg viewBox="0 0 430 126" aria-label="Gate capacitively coupled to a transmon with parallel shunt capacitance and Josephson junction">
      <g fill="none" stroke="#536d7e" strokeWidth="1.5"><path d="M32 38H94M107 38H387M184 105H387M210 38V68M210 82V105M325 38V69M325 83V105M184 105V114M174 114H194M177 119H191M181 124H187"/><circle cx="32" cy="38" r="4" fill="#fff"/><circle cx="387" cy="38" r="4" fill="#fff"/><circle cx="387" cy="105" r="4" fill="#fff"/></g>
      <g {...pick('gate','Circuit charge gate — offset charge')}><rect x="20" y="0" width="110" height="66" fill="transparent" stroke="none"/><rect className="circuit-hit" x="76" y="18" width="48" height="46" rx="5"/><path d="M94 25V51M107 25V51"/><text x="80" y="13" textAnchor="middle">Charge gate</text></g>
      <g {...pick('capacitor','Circuit shunt capacitor — charging energy')}><rect x="140" y="0" width="140" height="100" fill="transparent" stroke="none"/><rect className="circuit-hit" x="185" y="51" width="50" height="46" rx="5"/><path d="M196 68H224M196 82H224"/><text x="210" y="19" textAnchor="middle">Shunt capacitance</text></g>
      <g {...pick('junction','Circuit Josephson junction — Josephson energy')}><rect x="298" y="0" width="54" height="100" fill="transparent" stroke="none"/><rect className="circuit-hit" x="302" y="52" width="46" height="44" rx="5"/><path d="M316 65H334V87H316ZM316 65L334 87M334 65L316 87"/><text x="325" y="19" textAnchor="middle">JJ1</text></g>
      <g fill="#294754"><circle cx="210" cy="38" r="2.5"/><circle cx="210" cy="105" r="2.5"/><circle cx="325" cy="105" r="2.5"/></g>
    </svg>
    <p className="layout-circuit-values"><MathText math={`E_J/h=${mathValue(params.ej_ghz,2,'GHz')}`} /><br/><MathText math={`E_C/h=${mathValue(params.ec_ghz,3,'GHz')}; n_g=${num(params.ng,3)}`} /></p>
  </section>;
}
