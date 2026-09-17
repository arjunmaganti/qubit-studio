'use client';

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { Box, CirclePlus, CircuitBoard, Copy, Download, Grid3X3, Link2, RotateCw, Save, Trash2, Upload } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import MathText from '@/components/MathText';
import MylaIcon from '@/components/MylaIcon';
import { mathValue } from '@/lib/math-format';
import type { DeviceResult } from '@/lib/types';
import { MATERIAL_CATALOG } from '@/lib/material-records';
import { materialColor } from '@/lib/material-colors';
import {
  BUILDER_TEMPLATES,
  BUILDER_DESIGN_PRESETS,
  builderElectricalModel,
  EMPTY_BUILDER_DESIGN,
  createBuilderPart,
  createPresetDesign,
  createStarterDesign,
  designToSvg,
  designWarnings,
  portPoint,
  replaceBuilderPart,
  replacementTemplatesForPart,
  snap,
  validBuilderDesign,
  type BuilderPart,
  type BuilderRole,
  type BuilderShape,
  type BuilderTemplate,
  type ChipBuilderDesign,
} from '@/lib/chip-builder';
import './chip-builder.css';

interface Props {
  onApplyElectrical: (ejGhz: number, ecGhz: number) => void;
  result: DeviceResult | null;
}

const STORAGE_KEY = 'qubit-studio-chip-builder-v1';
const LAYERS = ['Metal 1', 'Metal 2', 'Junction', 'Bridge', 'Ground opening'];
const MATERIALS = [...MATERIAL_CATALOG, 'Au', 'None'];
const ROLE_LABEL: Record<BuilderRole, string> = {
  capacitor: 'Capacitor (modeled)', junction: 'Junction (modeled)', control: 'Control line',
  resonator: 'Resonator', ground: 'Ground opening', visual: 'Visual only',
};

function download(name: string, contents: string, type: string) {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = name; anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function Piece({ part, ghost = false }: { part: BuilderPart; ghost?: boolean }) {
  const common = { fill: part.shape === 'cutout' || part.material === 'None' ? '#092f40' : materialColor(part.material), stroke: ghost ? '#5bc1ff' : '#eef7f8', strokeWidth: ghost ? 4 : 1.5 };
  if (part.shape === 'circle') return <ellipse cx="0" cy="0" rx={part.width / 2} ry={part.height / 2} {...common}/>;
  if (part.shape === 'cross') return <path d={`M${-part.width/6} ${-part.height/2}H${part.width/6}V${-part.height/6}H${part.width/2}V${part.height/6}H${part.width/6}V${part.height/2}H${-part.width/6}V${part.height/6}H${-part.width/2}V${-part.height/6}H${-part.width/6}Z`} {...common}/>;
  if (part.shape === 'stepped') return <path d={`M${-part.width/2} ${-part.height/2}H${part.width*.08}V${-part.height*.34}H${part.width*.24}V${-part.height*.18}H${part.width/2}V${part.height*.18}H${part.width*.24}V${part.height*.34}H${part.width*.08}V${part.height/2}H${-part.width/2}Z`} {...common}/>;
  if (part.shape === 'meander') return <path d={`M${-part.width/2} ${-part.height/3}H${part.width/3}V0H${-part.width/3}V${part.height/3}H${part.width/2}`} fill="none" stroke={common.stroke} strokeWidth={Math.max(8, part.height / 8)} strokeLinejoin="round"/>;
  if (part.shape === 'junction') return <><rect x={-part.width/2} y={-part.height/2} width={part.width*.46} height={part.height} rx="3" {...common}/><rect x={part.width*.04} y={-part.height/2} width={part.width*.46} height={part.height} rx="3" {...common}/><rect x="-3" y={-part.height*.7} width="6" height={part.height*1.4} fill="#f7d987"/></>;
  return <rect x={-part.width/2} y={-part.height/2} width={part.width} height={part.height} rx={part.shape === 'cutout' ? 12 : 5} {...common} strokeDasharray={part.shape === 'cutout' ? '8 6' : undefined}/>;
}

function CircuitPiece({ part, selected, onSelect }: { part: BuilderPart; selected: boolean; onSelect: () => void }) {
  const stroke = materialColor(part.material);
  let symbol: ReactNode;
  if (part.role === 'capacitor') symbol = <><line x1="-18" x2="-3" y1="0" y2="0"/><line x1="-3" x2="-3" y1="-18" y2="18"/><line x1="3" x2="3" y1="-18" y2="18"/><line x1="3" x2="18" y1="0" y2="0"/></>;
  else if (part.role === 'junction') symbol = <><line x1="-22" x2="-9" y1="0" y2="0"/><rect x="-9" y="-13" width="18" height="26" rx="2"/><path d="M-6-9L6 9M6-9L-6 9"/><line x1="9" x2="22" y1="0" y2="0"/></>;
  else if (part.role === 'resonator') symbol = <path d="M-28 0C-20-20-12 20-4 0S12-20 20 0S28 20 36 0"/>;
  else if (part.role === 'control') symbol = <><line x1="-28" x2="22" y1="0" y2="0"/><path d="M14-7L24 0L14 7"/></>;
  else if (part.role === 'ground') symbol = <><line x1="0" x2="0" y1="-20" y2="-4"/><line x1="-18" x2="18" y1="-4" y2="-4"/><line x1="-12" x2="12" y1="3" y2="3"/><line x1="-6" x2="6" y1="10" y2="10"/></>;
  else symbol = <path d="M-24 8Q0-20 24 8M-24 8H24"/>;
  return <g className={`builder-circuit-piece${selected?' selected':''}`} transform={`translate(${part.x} ${part.y})`} role="button" tabIndex={0} aria-label={`Select ${part.name}`} onClick={event=>{event.stopPropagation();onSelect();}} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();onSelect();}}}>
    <circle r="42" fill="#0d3343" stroke={selected?'#58bfff':'#587f90'} strokeWidth={selected?4:2}/><g fill="none" stroke={stroke} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">{symbol}</g><text y="60" textAnchor="middle">{part.name}</text>
  </g>;
}

export default function ChipBuilder({ onApplyElectrical, result }: Props) {
  const [open, setOpen] = useState(false);
  const [design, setDesign] = useState<ChipBuilderDesign>(() => createStarterDesign());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view, setView] = useState<'layout' | 'circuit' | '3d'>('layout');
  const [pendingPort, setPendingPort] = useState<{ partId: string; port: number } | null>(null);
  const [saved, setSaved] = useState<ChipBuilderDesign[]>([]);
  const [status, setStatus] = useState('');
  const [custom, setCustom] = useState({ name:'My custom piece', shape:'rectangle' as BuilderShape, role:'visual' as BuilderRole, material:'Al', width:100, height:60 });
  const svgRef = useRef<SVGSVGElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const drag = useRef<{ id: string; dx: number; dy: number } | null>(null);
  const selected = design.parts.find(part => part.id === selectedId) ?? null;
  const replacements = useMemo(() => selected ? replacementTemplatesForPart(selected) : [], [selected]);
  const warnings = useMemo(() => designWarnings(design), [design]);
  const builderElectrical = useMemo(() => builderElectricalModel(design), [design]);
  const builderResult = result && builderElectrical
    && Math.abs(result.ej_ghz - builderElectrical.ejGhz) < 1e-9
    && Math.abs(result.ec_ghz - builderElectrical.ecGhz) < 1e-9 ? result : null;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
        if (Array.isArray(parsed)) setSaved(parsed.filter(validBuilderDesign).slice(0, 8));
      } catch { setStatus('Saved custom chips are unavailable.'); }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const point = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    const matrix = svg?.getScreenCTM();
    if (!svg || !matrix) return { x: 0, y: 0 };
    const cursor = svg.createSVGPoint();
    cursor.x = clientX; cursor.y = clientY;
    return cursor.matrixTransform(matrix.inverse());
  };
  const updatePart = (id: string, patch: Partial<BuilderPart>) => setDesign(current => ({ ...current, parts: current.parts.map(part => part.id === id ? { ...part, ...patch } : part) }));
  const addTemplate = (template: BuilderTemplate, at?: { x: number; y: number }) => {
    const part = createBuilderPart(template, design.parts.length);
    if (at) { part.x = snap(at.x, design.grid); part.y = snap(at.y, design.grid); }
    setDesign(current => ({ ...current, parts: [...current.parts, part] }));
    setSelectedId(part.id); setStatus(`${template.name} added`);
  };
  const removeSelected = () => {
    if (!selectedId) return;
    setDesign(current => ({ ...current, parts: current.parts.filter(part => part.id !== selectedId), connections: current.connections.filter(connection => connection.from.partId !== selectedId && connection.to.partId !== selectedId) }));
    setSelectedId(null); setPendingPort(null);
  };
  const duplicateSelected = () => {
    if (!selected) return;
    const copy = { ...selected, id:crypto.randomUUID(), name:`${selected.name} copy`, x:snap(selected.x+design.grid*3,design.grid), y:snap(selected.y+design.grid*3,design.grid) };
    setDesign(current => ({ ...current, parts:[...current.parts,copy] })); setSelectedId(copy.id);
  };
  const swapSelected = (template: BuilderTemplate) => {
    if (!selected) return;
    setDesign(current => replaceBuilderPart(current, selected.id, template.id));
    setStatus(`${selected.name} replaced with ${template.name}. Position and compatible connections were kept.`);
  };
  const connect = (partId: string, port: number) => {
    if (!pendingPort || !design.parts.some(part => part.id === pendingPort.partId && pendingPort.port >= 0 && pendingPort.port < part.ports)) { setPendingPort({ partId, port }); setStatus('Choose a port on another piece.'); return; }
    if (pendingPort.partId === partId && pendingPort.port === port) { setPendingPort(null); return; }
    const duplicate = design.connections.some(item => (item.from.partId===pendingPort.partId&&item.from.port===pendingPort.port&&item.to.partId===partId&&item.to.port===port)||(item.to.partId===pendingPort.partId&&item.to.port===pendingPort.port&&item.from.partId===partId&&item.from.port===port));
    if (!duplicate) setDesign(current => ({ ...current, connections:[...current.connections,{ id:crypto.randomUUID(), from:pendingPort, to:{partId,port} }] }));
    setPendingPort(null); setStatus(duplicate ? 'Those ports are already connected.' : 'Connection added.');
  };
  const addCustom = () => {
    const template: BuilderTemplate = { id:'custom', category:'Custom', explanation:'A user-created parametric piece.', layer:'Metal 1', ports:custom.role==='visual'||custom.role==='ground'?0:2, sourceName:'User-created', sourceUrl:'', ...custom };
    const part = createBuilderPart(template, design.parts.length); part.custom = true;
    setDesign(current => ({ ...current, parts:[...current.parts,part] })); setSelectedId(part.id); setStatus('Custom piece added.');
  };
  const save = () => {
    if (!validBuilderDesign(design)) { setStatus('Check piece dimensions, areas, and connections before saving.'); return; }
    const snapshot = structuredClone(design);
    const next = [snapshot, ...saved.filter(item => JSON.stringify(item) !== JSON.stringify(snapshot))].slice(0, 8);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); setSaved(next); setStatus('Custom chip saved in this browser.'); }
    catch { setStatus('Browser storage is unavailable or full. Export JSON to keep this chip.'); }
  };
  const apply = () => {
    if (!builderElectrical) return;
    onApplyElectrical(builderElectrical.ejGhz, builderElectrical.ecGhz);
    setStatus(builderElectrical.bounded
      ? 'Areas exceed the solver range; the nearest supported electrical values were applied.'
      : 'Supported junction and capacitor areas applied to the teaching model.');
  };
  const importJson = async (file?: File) => {
    if (!file) return;
    try { const parsed: unknown = JSON.parse(await file.text()); if (!validBuilderDesign(parsed)) throw new Error('Unsupported chip file'); setDesign(parsed); setSelectedId(null); setPendingPort(null); setStatus('Chip file imported.'); }
    catch (reason) { setStatus(reason instanceof Error ? reason.message : 'Could not import that file.'); }
  };
  const renderConnections = (offset = 0) => design.connections.map(connection => {
    const a = design.parts.find(part => part.id===connection.from.partId), b = design.parts.find(part => part.id===connection.to.partId); if (!a||!b)return null;
    const p1=portPoint(a,connection.from.port),p2=portPoint(b,connection.to.port);
    return <line key={connection.id} x1={p1.x+offset} y1={p1.y+offset} x2={p2.x+offset} y2={p2.y+offset} className="builder-connection"/>;
  });

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof Element && event.target.closest('input,select,textarea')) return;
      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedId) { event.preventDefault(); removeSelected(); }
      if (event.key === 'r' && selected) updatePart(selected.id,{rotation:(selected.rotation+90)%360});
      if (event.key === 'Escape') { setPendingPort(null); setSelectedId(null); }
    };
    window.addEventListener('keydown',onKey); return()=>window.removeEventListener('keydown',onKey);
  });

  const categories = [...new Set(BUILDER_TEMPLATES.map(template => template.category))];
  const filename = design.name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') || 'quantum-chip';
  const modeledReady = !!builderElectrical;
  let canvas: ReactNode;
  if (view === '3d') canvas = <svg className="builder-scene builder-scene-3d" viewBox={`0 0 ${design.chipWidth+100} ${design.chipHeight+100}`} aria-label="Automatic three-dimensional preview of the custom chip">
    <g transform="translate(55 30) skewX(-22) scale(1 .78)"><rect width={design.chipWidth} height={design.chipHeight} rx="24" fill="#061d29" stroke="#42778f" strokeWidth="20"/>{renderConnections(7)}{design.parts.map(part=><g key={`${part.id}-depth`} transform={`translate(${part.x+8} ${part.y+10}) rotate(${part.rotation})`} opacity=".45"><Piece part={part}/></g>)}{design.parts.map(part=><g key={part.id} transform={`translate(${part.x} ${part.y}) rotate(${part.rotation})`}><Piece part={part}/></g>)}</g>
    {design.parts.length===0&&<g className="builder-empty"><text x="50%" y="46%">This chip is empty.</text><text x="50%" y="53%">Add a part or load the starter layout.</text></g>}
  </svg>;
  else if (view === 'circuit') canvas = <svg className="builder-scene builder-circuit-scene" viewBox={`0 0 ${design.chipWidth} ${design.chipHeight}`} aria-label="Automatic circuit view of the custom chip" onClick={()=>setSelectedId(null)}>
    <defs><pattern id="builder-circuit-grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="#6090a5" strokeOpacity=".12"/></pattern></defs>
    <rect width="100%" height="100%" rx="20" fill="#082837"/><rect width="100%" height="100%" rx="20" fill="url(#builder-circuit-grid)"/>
    {renderConnections()}{design.parts.map(part=><CircuitPiece key={part.id} part={part} selected={selectedId===part.id} onSelect={()=>setSelectedId(part.id)}/>)}
    {design.parts.length===0&&<g className="builder-empty"><text x="50%" y="46%">This circuit is empty.</text><text x="50%" y="53%">Load a design or add reusable pieces.</text></g>}
  </svg>;
  else canvas = <svg ref={svgRef} className="builder-scene" viewBox={`0 0 ${design.chipWidth} ${design.chipHeight}`} aria-label="Editable custom quantum chip layout"
    onDragOver={event=>event.preventDefault()} onDrop={event=>{event.preventDefault();const template=BUILDER_TEMPLATES.find(item=>item.id===event.dataTransfer.getData('text/qubit-part'));if(template)addTemplate(template,point(event.clientX,event.clientY));}}
    onPointerMove={event=>{if(!drag.current)return;const at=point(event.clientX,event.clientY);updatePart(drag.current.id,{x:snap(at.x-drag.current.dx,design.grid),y:snap(at.y-drag.current.dy,design.grid)});}}
    onPointerUp={()=>{drag.current=null;}} onPointerLeave={()=>{drag.current=null;}}>
    <defs><pattern id="builder-grid" width={design.grid} height={design.grid} patternUnits="userSpaceOnUse"><path d={`M ${design.grid} 0 L 0 0 0 ${design.grid}`} fill="none" stroke="#6090a5" strokeOpacity=".22" strokeWidth="1"/></pattern></defs>
    <rect width="100%" height="100%" rx="20" fill="#092f40" stroke="#5790a8" strokeWidth="8" onClick={()=>setSelectedId(null)}/><rect width="100%" height="100%" rx="20" fill="url(#builder-grid)" onClick={()=>setSelectedId(null)}/>
    {renderConnections()}
    {design.parts.map(part=><g key={part.id} className={`builder-piece${selectedId===part.id?' selected':''}`} role="button" tabIndex={0} aria-label={`Select ${part.name}`} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();setSelectedId(part.id);}}} transform={`translate(${part.x} ${part.y}) rotate(${part.rotation})`} onClick={event=>{event.stopPropagation();setSelectedId(part.id);}} onPointerDown={(event:ReactPointerEvent<SVGGElement>)=>{if((event.target as Element).classList.contains('builder-port'))return;event.stopPropagation();setSelectedId(part.id);const at=point(event.clientX,event.clientY);drag.current={id:part.id,dx:at.x-part.x,dy:at.y-part.y};event.currentTarget.ownerSVGElement?.setPointerCapture(event.pointerId);}}>
      <Piece part={part} ghost={selectedId===part.id}/><text y={part.height/2+18} textAnchor="middle" transform={`rotate(${-part.rotation})`} className="builder-piece-label">{part.name}</text>
      {Array.from({length:part.ports},(_,port)=>{const p=portPoint({...part,x:0,y:0,rotation:0},port);const active=pendingPort?.partId===part.id&&pendingPort.port===port;return <circle key={port} className={`builder-port${active?' active':''}`} cx={p.x} cy={p.y} r="8" onPointerDown={event=>event.stopPropagation()} onClick={event=>{event.stopPropagation();connect(part.id,port);}}><title>Connection port {port+1}</title></circle>;})}
    </g>)}
  </svg>;

  return <>
    <button type="button" className="wave-tool-button chip-builder-trigger" onClick={()=>setOpen(true)}><Box size={15}/> Chip builder</button>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="chip-builder-dialog">
      <DialogHeader><DialogTitle>Build your own quantum chip</DialogTitle><DialogDescription>Arrange reusable teaching components or create a piece. Dimensions and exports are illustrative until verified in fabrication software.</DialogDescription></DialogHeader>
      <div className="chip-builder-toolbar">
        <input aria-label="Chip design name" value={design.name} onChange={event=>setDesign(current=>({...current,name:event.target.value}))}/>
        <div role="group" aria-label="Builder view"><button aria-pressed={view==='layout'} onClick={()=>setView('layout')}><Grid3X3 size={15}/>Layout</button><button aria-pressed={view==='circuit'} onClick={()=>setView('circuit')}><CircuitBoard size={15}/>Circuit</button><button aria-pressed={view==='3d'} onClick={()=>setView('3d')}><Box size={15}/>3D preview</button></div>
        <button onClick={()=>{setDesign(createStarterDesign());setSelectedId(null);setPendingPort(null);setStatus('Starter transmon loaded.');}}>Starter layout</button>
        <button onClick={save}><Save size={15}/>Save</button><button disabled={!saved.length} onClick={()=>{if(saved[0]){setDesign(structuredClone(saved[0]));setSelectedId(null);setPendingPort(null);}}}><MathText math={`${saved.length}`} /> saved</button>
        <button onClick={()=>fileRef.current?.click()}><Upload size={15}/>Import JSON</button><input ref={fileRef} hidden type="file" accept="application/json,.json" onChange={event=>importJson(event.target.files?.[0])}/>
        <button onClick={()=>download(`${filename}.json`,JSON.stringify(design,null,2),'application/json')}><Download size={15}/>JSON</button>
        <button onClick={()=>download(`${filename}.svg`,designToSvg(design),'image/svg+xml')}><Download size={15}/>SVG</button>
      </div>
      <div className="chip-builder-grid">
        <aside className="builder-palette">
          <h3>Chip design library</h3><p>Load a complete example, then exchange its pieces like a LEGO set.</p>
          <div className="builder-design-library">{BUILDER_DESIGN_PRESETS.map(preset=><button key={preset.id} type="button" onClick={()=>{setDesign(createPresetDesign(preset.id));setSelectedId(null);setPendingPort(null);setStatus(`${preset.name} loaded.`);}}><strong>{preset.name}</strong><small>{preset.explanation}</small><span>{preset.pieces.join(' · ')}</span></button>)}</div>
          <h3 className="builder-parts-title">Materials</h3><p>{selected ? `Choose a material for ${selected.name}. The color updates immediately.` : 'Select a piece on the chip, then choose its material here.'}</p><div className="builder-materials">{MATERIALS.filter(material=>material!=='None').map(material=><button key={material} type="button" disabled={!selected} aria-pressed={selected?.material===material} onClick={()=>selected&&updatePart(selected.id,{material})}><i style={{background:materialColor(material)}}/><span>{material}</span></button>)}</div><h3 className="builder-parts-title">Loose pieces</h3><p>Drag a part onto the chip or click to add it.</p>{categories.map(category=><section key={category}><h4>{category}</h4>{BUILDER_TEMPLATES.filter(item=>item.category===category).map(template=><button key={template.id} draggable onDragStart={event=>event.dataTransfer.setData('text/qubit-part',template.id)} onClick={()=>addTemplate(template)}><CirclePlus size={14}/><span><strong>{template.name}</strong><small>{template.explanation}</small></span></button>)}</section>)}</aside>
        <main className="builder-canvas"><div className="builder-canvas-head"><span>{view==='layout'?'TOP LAYOUT · drag pieces · click ports to connect':view==='circuit'?'CIRCUIT · updates automatically when pieces change':'AUTOMATIC 3D PREVIEW · visual only'}</span><span><MathText math={`${design.parts.length}`} /> pieces · <MathText math={`${design.connections.length}`} /> connections</span></div>{canvas}<div className="builder-canvas-foot"><span>Grid <strong><MathText math={`${design.grid}`} /></strong> · chip <strong><MathText math={`${design.chipWidth}\\times${design.chipHeight}`} /></strong> layout units</span><span><Link2 size={13}/>{view==='circuit'?'Symbols follow each piece’s purpose':'Blue lines are user connections'}</span></div></main>
        <aside className="builder-inspector">
          {selected ? <><div className="builder-selection-head"><span>Selected piece</span><div><button title="Duplicate" onClick={duplicateSelected}><Copy size={15}/></button><button title="Rotate one quarter turn" onClick={()=>updatePart(selected.id,{rotation:(selected.rotation+90)%360})}><RotateCw size={15}/></button><button title="Delete" onClick={removeSelected}><Trash2 size={15}/></button></div></div><input className="builder-name" value={selected.name} onChange={event=>updatePart(selected.id,{name:event.target.value})}/>
            <section className="builder-myla" aria-label={`Myla replacement suggestions for ${selected.name}`}>
              <div className="builder-myla-head"><MylaIcon size={28}/><span><strong>Myla</strong><small>{selected.name}</small></span></div>
              <h3>Pieces that can replace this one</h3>
              <p>Choose a compatible piece. Its position stays the same, and connections that still fit are kept.</p>
              <div className="builder-replacements">{replacements.length ? replacements.map(template=><button key={template.id} type="button" onClick={()=>swapSelected(template)}><span><strong>{template.name}</strong><small>{template.explanation}</small></span><b>Use</b></button>) : <small>No direct replacement is available for this custom piece.</small>}</div>
              <small className="builder-myla-source">Local component guide · no AI request</small>
            </section>
            <label><span>Width · <MathText math={`${selected.width}`} /></span><input type="number" min="4" max="800" value={selected.width} onChange={event=>updatePart(selected.id,{width:Number(event.target.value)})}/></label><label><span>Height · <MathText math={`${selected.height}`} /></span><input type="number" min="4" max="500" value={selected.height} onChange={event=>updatePart(selected.id,{height:Number(event.target.value)})}/></label><label><span>Rotation · <MathText math={`${selected.rotation}^{\\circ}`} /></span><input type="number" step="15" value={selected.rotation} onChange={event=>updatePart(selected.id,{rotation:Number(event.target.value)})}/></label><label>Layer<select value={selected.layer} onChange={event=>updatePart(selected.id,{layer:event.target.value})}>{LAYERS.map(item=><option key={item}>{item}</option>)}</select></label><label>Material<select value={selected.material} onChange={event=>updatePart(selected.id,{material:event.target.value})}>{MATERIALS.map(item=><option key={item}>{item}</option>)}</select></label>
            {(selected.role==='junction'||selected.role==='capacitor')&&<label><span>Physical area (<MathText math="\mu\mathrm{m}^{2}" />)</span><input type="number" min=".001" step=".001" value={selected.areaUm2??0} onChange={event=>updatePart(selected.id,{areaUm2:Number(event.target.value)})}/><small>This stated area, not the drawing scale, feeds the teaching conversion.</small></label>}
            <p className="builder-explanation">{selected.explanation}</p>{selected.sourceUrl?<a href={selected.sourceUrl} target="_blank" rel="noreferrer">Pattern reference: {BUILDER_TEMPLATES.find(item=>item.id===selected.templateId)?.sourceName??'open-source project'} ↗</a>:<span className="builder-user-source">User-created piece</span>}
          </> : <><h3>Create a piece</h3><p>Choose a basic shape and say what it represents.</p><label>Name<input value={custom.name} onChange={event=>setCustom({...custom,name:event.target.value})}/></label><label>Shape<select value={custom.shape} onChange={event=>setCustom({...custom,shape:event.target.value as BuilderShape})}>{(['rectangle','circle','cross','stepped','meander','cutout'] as const).map(shape=><option key={shape}>{shape}</option>)}</select></label><label>Purpose<select value={custom.role} onChange={event=>setCustom({...custom,role:event.target.value as BuilderRole})}>{Object.entries(ROLE_LABEL).map(([role,label])=><option key={role} value={role}>{label}</option>)}</select></label><label>Material<select value={custom.material} onChange={event=>setCustom({...custom,material:event.target.value})}>{MATERIALS.filter(material=>material!=='None').map(material=><option key={material}>{material}</option>)}</select></label><label><span>Width · <MathText math={`${custom.width}`} /></span><input type="number" value={custom.width} onChange={event=>setCustom({...custom,width:Number(event.target.value)})}/></label><label><span>Height · <MathText math={`${custom.height}`} /></span><input type="number" value={custom.height} onChange={event=>setCustom({...custom,height:Number(event.target.value)})}/></label><button className="builder-primary" onClick={addCustom}><CirclePlus size={15}/>Add custom piece</button></>}
          <button className="builder-clear-selection" disabled={!selected} onClick={()=>setSelectedId(null)}>Create another custom piece</button>
        </aside>
      </div>
      <footer className="builder-footer"><div className="builder-footer-summary"><div className={`builder-checks${warnings.length?' warning':''}`}><strong>{warnings.length ? <><MathText math={`${warnings.length}`} /> design checks</> : 'Basic checks passed'}</strong>{warnings.length?<ul>{warnings.map(warning=><li key={warning}>{warning}</li>)}</ul>:<span>Junction, capacitance, boundaries, and connections are present.</span>}</div><div className={`builder-simulation${builderResult?' current':''}`}><strong>{builderResult?'Current simulation for this chip':'Simulation scope'}</strong>{builderResult?<span><MathText math={`f_{01}=${mathValue(builderResult.f01_ghz, 3, 'GHz')}`} /> · <MathText math={`|\\alpha|=${mathValue(builderResult.anharmonicity_mhz, 1, 'MHz')}`} /> · <MathText math={`\\delta f_{01}\\le ${mathValue(builderResult.dispersion_upper_khz, 3, 'kHz')}`} /></span>:<span>Use this chip to calculate its supported electrical values.</span>}<small>Only stated junction and capacitor areas affect the solver. Placement, routing, readout pieces, and materials remain visual.</small>{!builderElectrical&&<small>Add a junction and capacitor with positive finite physical areas to simulate.</small>}{builderElectrical?.bounded&&<small>Areas exceed the solver range. The simulation uses the nearest supported electrical values.</small>}{builderElectrical&&builderElectrical.junctionCount>1&&<small>This fixed-transmon preview uses the first junction. Use the separate flux experiment to explore a two-junction model.</small>}</div></div><div className="builder-footer-actions"><span role="status">{status}</span><button onClick={()=>{setDesign(structuredClone(EMPTY_BUILDER_DESIGN));setSelectedId(null);setPendingPort(null);}}>New blank chip</button><button className="builder-primary" disabled={!modeledReady} onClick={apply}>Use this chip in simulation</button></div></footer>
    </DialogContent></Dialog>
  </>;
}
