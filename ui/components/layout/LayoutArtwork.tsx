'use client';

import { useId, type KeyboardEvent } from 'react';
import { planContour, SUBSTRATE_PLAN, TOP_GROUND_PLAN, GATE_PLAN, LEFT_ELECTRODE, RIGHT_ELECTRODE } from '@/lib/chip-plan';
import { CHIP, DIE_SCALE, PLATE } from '@/lib/chip-geometry';
import { BOND_COUNT, BOND_FINISH, bondPoints, bondPosition, FILM_LAUNCHES, FILM_TRANSFORM, PERFORATIONS, PLAN_TRANSFORM, INSPECTION_SCALE, inspectionWorldPoint, JUNCTION_ELECTRODE, JUNCTION_OVERLAP } from '@/lib/chip-detail';
import { DEFAULT_COMPONENT_MATERIALS, resolveMaterial, type ComponentMaterials } from '@/lib/component-materials';
import { inspectionSurface, INSPECTION_LAYER_COLORS } from '@/lib/layout-surface';
import { DEFAULT_LAYER_DISPLAY, type LayerDisplay } from '@/lib/layout-display';
import type { PartId } from '@/lib/parts';

interface Props {
  selected: PartId | null;
  hiddenParts?: PartId[];
  componentMaterials?: ComponentMaterials;
  onSelect?: (id: PartId) => void;
  onInspect?: (id: PartId) => void;
  detail?: boolean;
  pixelsPerUnit?: number;
  layerColors?: boolean;
  layerDisplay?: LayerDisplay;
  miniature?: boolean;
}
const sides = [0, 1, 2, 3];
const world = INSPECTION_SCALE;
const aperture = PLATE.window / DIE_SCALE * world;
const lipOuter = (PLATE.window + .085) / DIE_SCALE * world;
const apertureContour = `M257 47H743Q763 47 763 67V553Q763 573 743 573H257Q237 573 237 553V67Q237 47 257 47Z M${500-aperture/2+12} ${310-aperture/2}h${aperture-24}q12 0 12 12v${aperture-24}q0 12 -12 12h-${aperture-24}q-12 0 -12 -12v-${aperture-24}q0 -12 12 -12Z`;
const polygon = (points: number[][]) => points.map(p => p.join(',')).join(' ');
const perforations: string[] = [];
for (let y = PERFORATIONS.start; y < PERFORATIONS.end; y += PERFORATIONS.pitch)
  for (let x = PERFORATIONS.start; x < PERFORATIONS.end; x += PERFORATIONS.pitch)
    perforations.push(`M${x-1024} ${y-1024}h${PERFORATIONS.size}v${PERFORATIONS.size}h-${PERFORATIONS.size}Z`);

/** The same die and nearby package aperture as Assembly, in an undistorted top projection. */
export default function LayoutArtwork({ selected, hiddenParts = [], componentMaterials = DEFAULT_COMPONENT_MATERIALS, onSelect, onInspect, detail, miniature, pixelsPerUnit = 1, layerColors = false, layerDisplay = DEFAULT_LAYER_DISPLAY }: Props) {
  const prefix = useId().replaceAll(':', '');
  const id = (name: string) => `${prefix}-${name}`;
  const fill = (name: string) => `url(#${id(name)})`;
  const visible = (part: PartId) => !hiddenParts.includes(part);
  const material = (part: PartId) => resolveMaterial(componentMaterials[part]);
  const pick = (part: PartId, label: string) => ({
    className: `layout-pick${selected === part ? ' is-selected' : ''}`,
    'data-part': part, 'data-display': layerDisplay[part], 'data-material': material(part).id, 'data-finish': material(part).finish,
    'aria-label': label, 'aria-pressed': selected === part,
    'aria-keyshortcuts': onInspect ? 'I' : undefined,
    onDoubleClick: onInspect ? () => onInspect(part) : undefined,
    role: onSelect ? 'button' : undefined,
    tabIndex: onSelect && !miniature ? 0 : undefined,
    onClick: onSelect ? () => onSelect(part) : undefined,
    onKeyDown: onSelect ? (event: KeyboardEvent<SVGGElement>) => {
      if (event.key.toLowerCase() === 'i' && onInspect) { event.preventDefault(); onInspect(part); }
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(part); }
    } : undefined,
  });
  const finish = (part: PartId) => fill(material(part).finish);
  const surface = (part: PartId) => inspectionSurface(part, layerColors ? {...material(part),color:INSPECTION_LAYER_COLORS[part],id:'display-layer'} : material(part));
  const fine = !miniature && pixelsPerUnit > 1.45;
  const groundRegions = (props: React.SVGProps<SVGPathElement> = {}) => <g>
    {[-1,1].map(sign=><path key={sign} d={planContour(TOP_GROUND_PLAN).map(([x,z],i)=>`${i?'L':'M'}${inspectionWorldPoint(x,sign*z).join(' ')}`).join('')+'Z'} {...props}/>)}
  </g>;
  return <g className={`layout-artwork${layerColors?' uses-layer-colors':''}`}>
    <defs>
      {(['package','board','substrate','ground','capacitor','junction','gate'] as PartId[]).map(part => <linearGradient key={part} id={id(part)} x1="0" y1="0" x2=".65" y2="1">
        <stop stopColor={surface(part).light}/><stop offset=".23" stopColor={surface(part).base}/><stop offset=".52" stopColor={surface(part).light}/><stop offset=".77" stopColor={surface(part).base}/><stop offset="1" stopColor={surface(part).dark}/>
      </linearGradient>)}
      <linearGradient id={id('contact')} x2="1" y2="0"><stop stopColor="#7d612f"/><stop offset=".17" stopColor="#d1aa65"/><stop offset=".42" stopColor="#f5dda4"/><stop offset=".68" stopColor={BOND_FINISH.land}/><stop offset="1" stopColor="#97733b"/></linearGradient>
      <linearGradient id={id('seat')} x2=".7" y2="1"><stop stopColor="#886d3e"/><stop offset=".35" stopColor="#b89a5d"/><stop offset=".67" stopColor="#d2bb7e"/><stop offset="1" stopColor="#92703b"/></linearGradient>
      <pattern id={id('brushed')} width="73" height="17" patternUnits="userSpaceOnUse"><path d="M0 .8H73M12 3.7H53M2 8.5H31M48 12.2H73M18 15.3H62" stroke="#fff" strokeWidth=".16" opacity=".28"/><path d="M4 2.4H65M22 10.7H71M0 14.1H11" stroke="#132532" strokeWidth=".15" opacity=".2"/></pattern>
      <pattern id={id('ceramic')} width="8" height="7" patternUnits="userSpaceOnUse"><path d="M1 2h.5M6 5h.5M3 6h.4" stroke="#fff" strokeWidth=".5" opacity=".12"/></pattern>
      <pattern id={id('etch')} width="5.5" height="5.5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0V5.5" stroke="#d0dee0" strokeWidth=".27" opacity=".2"/></pattern>
      <linearGradient id={id('polished')} x2=".3" y2="1"><stop stopColor="#fff" stopOpacity=".13"/><stop offset=".5" stopColor="#fff" stopOpacity="0"/><stop offset="1" stopColor="#142332" stopOpacity=".09"/></linearGradient>
      <linearGradient id={id('crystalline')} x2=".5" y2="1"><stop stopColor="#c3c9df" stopOpacity=".12"/><stop offset=".55" stopColor="#354b72" stopOpacity=".03"/><stop offset="1" stopColor="#030c19" stopOpacity=".08"/></linearGradient>
      <clipPath id={id('substrate-clip')}><path d={SUBSTRATE_PLAN} transform={PLAN_TRANSFORM}/></clipPath>
      <clipPath id={id('region')}><rect x="237" y="47" width="526" height="526" rx="20"/></clipPath>
      <mask id={id('perforations')} maskUnits="userSpaceOnUse" x="290" y="90" width="420" height="440">
        <rect x="290" y="90" width="420" height="440" fill="white"/>
        <path d={perforations.join('')} transform={FILM_TRANSFORM} fill="black"/>
        {groundRegions({fill:'none',stroke:'white',strokeWidth:PERFORATIONS.border * CHIP.size * world / 2048})}
      </mask>
    </defs>
    {visible('board') && <g {...pick('board','Carrier board — chip support')} clipPath={fill('region')}>
      <rect className="part-outline layer-fill" x="237" y="47" width="526" height="526" rx="20" fill={fill('board')} stroke="#747b7d"/>
      <rect x="237" y="47" width="526" height="526" rx="20" className="layer-treatment" fill={finish('board')}/>
      <rect className="layer-fill" stroke="#bdae80" strokeWidth=".6" x={500-.445/DIE_SCALE*world} y={310-.445/DIE_SCALE*world} width={.89/DIE_SCALE*world} height={.89/DIE_SCALE*world} rx="2" fill={fill('seat')}/>
    </g>}
    {visible('package') && <g {...pick('package','Package aperture — surrounding shield detail')}>
      <path className="part-outline layer-fill" d={apertureContour} fill={fill('package')} fillRule="evenodd" stroke={surface('package').edge} strokeWidth=".7"/>
      <path d={apertureContour} className="layer-treatment" fill={finish('package')} fillRule="evenodd"/>
      <rect x={500-lipOuter/2} y={310-lipOuter/2} width={lipOuter} height={lipOuter} rx="20" fill="none" stroke="#444940" strokeOpacity=".5" strokeWidth="1.1"/>
      <rect className="layer-relief" x={500-aperture/2-2} y={310-aperture/2-2} width={aperture+4} height={aperture+4} rx="13" fill="none" stroke={surface('package').dark} strokeWidth="4"/>
      {sides.map(side=><g key={side} transform={`rotate(${side*90} 500 310)`} fill={fill('contact')}>
        {Array.from({length:BOND_COUNT},(_,i)=><rect className="layer-fill" key={i} x={500+bondPosition(i)*1.05*world-.009/DIE_SCALE*world/2} y={310+(PLATE.window/2+.040)/DIE_SCALE*world-.043/DIE_SCALE*world/2} width={.009/DIE_SCALE*world} height={.043/DIE_SCALE*world} rx=".65" stroke="#f3d899" strokeWidth=".25"/>)}
      </g>)}
      <rect x={500-aperture/2+.8} y={310-aperture/2+.8} width={aperture-1.6} height={aperture-1.6} rx="11" fill="none" stroke={surface('package').edge} strokeWidth=".6"/>
      <rect x="243" y="53" width="514" height="514" rx="17" fill="none" stroke={surface('package').dark} strokeOpacity=".55" strokeWidth=".45"/>
      {sides.map(side=><g className="layer-identifier" data-display={layerDisplay.package} key={side} aria-hidden="true" transform={`rotate(${side*90} 500 310)`} fontFamily="monospace" fontSize="4.1" fill={surface('package').dark}>
        {Array.from({length:6},(_,i)=><text key={i} x={500+bondPosition(i*9)*1.05*world} y="553" textAnchor="middle">{String(i*9+1).padStart(2,'0')}</text>)}
      </g>)}
      <g className="layer-identifier" data-display={layerDisplay.package} aria-hidden="true" fill="#303a36" fontFamily="monospace" fontSize="5.5" letterSpacing=".6"><text x="500" y="63" textAnchor="middle">QS–01 / SHIELD APERTURE</text><text x="500" y="562" textAnchor="middle">TRANSMON · REV A</text></g>
    </g>}
    {visible('substrate') && <g {...pick('substrate','Substrate — continuous chip base')} transform={PLAN_TRANSFORM}>
      <path className="part-outline layer-fill" d={SUBSTRATE_PLAN} fill={fill('substrate')} stroke="#657387" strokeWidth="1.2" vectorEffect="non-scaling-stroke"/>
      <path d={SUBSTRATE_PLAN} className="layer-treatment" fill={finish('substrate')}/>
      <path d="M182 121H818L843 146V464L818 489H182L157 464V146Z" fill="none" stroke="#8ab1bc" strokeWidth=".65" opacity=".55"/>
      <path d="M186 125H814L839 150V460L814 485H186L161 460V150Z" fill="none" stroke="#5f929f" strokeWidth=".4" opacity=".4"/>
    </g>}
    {visible('ground') && <g {...pick('ground','Ground metal — openings expose the substrate')}>
      <g mask={fill('perforations')} data-detail="ground-perforations">
        {groundRegions({className:'part-outline layer-fill',fill:fill('ground'),stroke:'#d7dce0',strokeWidth:.65,vectorEffect:'non-scaling-stroke'})}
        {groundRegions({className:'layer-treatment',fill:finish('ground')})}
        {groundRegions({className:'layer-treatment',fill:fill('etch')})}
        {groundRegions({fill:'none',stroke:'#f5f4e2',strokeWidth:.28,opacity:.5})}
      </g>
      <g clipPath={fill('substrate-clip')} data-detail="film-fanouts" fill={layerColors?'#b8cbb4':surface('ground').edge} stroke={layerColors?'#b8cbb4':surface('ground').edge}>
        <g transform={FILM_TRANSFORM}>
          {sides.map(side=><g key={side} transform={`rotate(${side*90})`}>
            {FILM_LAUNCHES.map((launch,i)=><g key={i}><rect className="layer-fill" x={launch.x-4.5} y="936" width="9" height="38" strokeWidth=".8" rx="1.2"/><rect className="layer-treatment" x={launch.x-2.3} y="941" width="4.6" height="26" fill={surface('ground').dark} stroke="none"/><rect className="layer-fill" x={launch.x-3} y="904" width="6" height="14" strokeWidth=".8"/><polyline points={polygon(launch.points)} fill="none" strokeWidth={launch.width}/></g>)}
            <rect x="-895" y="890" width="1790" height="101" fill="none" strokeWidth="2"/>
          </g>)}
          {[-1,1].flatMap(x=>[-1,1].map(y=><g key={`${x},${y}`} fill="none" strokeWidth="2"><rect x={x*795-17} y={y*795-17} width="34" height="34"/><path d={`M${x*690-13} ${y*690}h26M${x*690} ${y*690-13}v26`}/></g>))}
        </g>
      </g>
      <g data-detail="bond-contacts" fill={fill('contact')}>
        {sides.map(side=><g key={side} transform={`rotate(${-side*90} 500 310)`}>
          {Array.from({length:BOND_COUNT},(_,i)=>{const points=bondPoints(i,side).map(([x,,z])=>inspectionWorldPoint(x,z));return <g key={i}><polyline points={polygon(points)} fill="none" stroke="#312918" strokeOpacity=".55" strokeWidth={.0045*world} strokeLinejoin="round"/><polyline points={polygon(points)} fill="none" stroke={BOND_FINISH.wire} strokeWidth={.0023*world} strokeLinejoin="round"/><polyline points={polygon(points)} fill="none" stroke="#f8e3b4" strokeWidth={.0006*world} strokeLinejoin="round"/>{[points[0],points[2]].map(([x,y],j)=><ellipse className="layer-fill" key={j} cx={x} cy={y} rx={.0032*world} ry={.0062*world} stroke="#f4d796" strokeWidth=".23"/>)}</g>;})}
        </g>)}
      </g>
    </g>}
    {visible('capacitor') && <g transform={PLAN_TRANSFORM}>
      {[['left',LEFT_ELECTRODE],['right',RIGHT_ELECTRODE]].map(([side,path])=><g key={side} {...pick('capacitor',`${side==='left'?'Left':'Right'} capacitor pad — charging energy`)} data-side={side}>
        <path className="part-outline layer-fill" d={path} fill={fill('capacitor')} stroke={surface('capacitor').edge} strokeWidth=".8" vectorEffect="non-scaling-stroke"/>
        <path d={path} className="layer-treatment" fill={finish('capacitor')}/>
        <path d={path} fill='none' stroke={surface('capacitor').edge} strokeWidth='.4' transform='translate(0 -.8)' opacity='.8'/>
        <path d={path} fill='none' stroke={surface('capacitor').dark} strokeWidth='.5' opacity='.6'/>
      </g>)}
    </g>}
    {visible('gate') && <g {...pick('gate','Charge gate — offset charge')} transform={PLAN_TRANSFORM}>
      <path className="part-outline layer-fill" d={GATE_PLAN} fill={fill('gate')} stroke="#e0e4e6" strokeWidth=".7" vectorEffect="non-scaling-stroke"/>
      <path d={GATE_PLAN} className="layer-treatment" fill={finish('gate')}/><path d="M733 310H942" stroke="transparent" strokeWidth="28"/>
    </g>}
    {visible('junction') && <g {...pick('junction','Josephson junction — Josephson energy')} data-detail="junction-overlap">
      <polygon className="part-outline layer-fill" points={polygon(JUNCTION_ELECTRODE.map(([x,y])=>inspectionWorldPoint(x,-y)))} fill={fill('junction')} stroke="#e6e8e9" strokeWidth=".45"/>
      <rect className="layer-fill" x={500-JUNCTION_OVERLAP.width*world/2} y={310+(JUNCTION_OVERLAP.z-JUNCTION_OVERLAP.depth/2)*world} width={JUNCTION_OVERLAP.width*world} height={JUNCTION_OVERLAP.depth*world} fill={JUNCTION_OVERLAP.color} stroke="#e2d5ff" strokeWidth=".35"/>
      <polygon className="part-outline layer-fill" points={polygon(JUNCTION_ELECTRODE.map(([x,y])=>inspectionWorldPoint(-x,y+JUNCTION_OVERLAP.upperZ)))} fill={fill('junction')} stroke="#eef0f2" strokeWidth=".45"/>
      {detail&&<path d={`M${500-JUNCTION_OVERLAP.width*world/2} ${310+(JUNCTION_OVERLAP.z-JUNCTION_OVERLAP.depth/2)*world}h${JUNCTION_OVERLAP.width*world}`} stroke={JUNCTION_OVERLAP.color} strokeWidth=".7"/>}
      <rect className="junction-selection" x="484" y="299" width="32" height="24" rx="1" fill="none" stroke={selected==='junction'?'#2c9cff':'transparent'} strokeWidth=".8"/>
      <rect x="479" y="288" width="42" height="44" fill="transparent"/>
    </g>}
    {!miniature && <g data-detail="layout-identifiers" aria-hidden="true" pointerEvents="none" fontFamily="monospace">
      {visible('capacitor')&&<g className="layer-identifier" data-display={layerDisplay.capacitor} fill="#364b57" fontSize={fine?6:5.4} letterSpacing=".65">
        <text x="367" y="290" textAnchor="middle">C1.L</text><text x="633" y="278" textAnchor="middle">C1.R</text>
        <text x="367" y="300" textAnchor="middle" fontSize="4.5" opacity=".7">{material('capacitor').formula} / ELECTRODE</text><text x="633" y="288" textAnchor="middle" fontSize="4.5" opacity=".7">{material('capacitor').formula} / ELECTRODE</text>
      </g>}
      {visible('ground')&&<g className="layer-identifier" data-display={layerDisplay.ground} fill="#d3dfdf" fontSize="4.7" letterSpacing=".65"><text x="500" y="189" textAnchor="middle">GND / {material('ground').formula} FILM</text><text x="500" y="454" textAnchor="middle">PERFORATED GROUND METAL</text></g>}
      {fine&&visible('ground')&&sides.map(side=><g className="layer-identifier" data-display={layerDisplay.ground} key={side} transform={`rotate(${side*90} 500 310)`} fill="#c3cbd1" fontSize="3.1">{Array.from({length:12},(_,i)=><text key={i} x={500+bondPosition(i*4)*world} y="492" textAnchor="middle">B{String(i*4+1).padStart(2,'0')}</text>)}</g>)}
    </g>}
  </g>;
}
