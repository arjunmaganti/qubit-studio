'use client';

import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { ArrowLeft, Focus, Hand, Layers, Maximize, Minus, MousePointer2, Plus, ScanSearch } from 'lucide-react';
import { resolveMaterial, type ComponentMaterials } from '@/lib/component-materials';
import { INSPECTION_LAYER_COLORS } from '@/lib/layout-surface';
import { placeInspectionLabels } from '@/lib/layout-labels';
import type { PartId } from '@/lib/parts';
import { boundedCamera, layoutViewBox, MIN_LAYOUT_ZOOM, MAX_LAYOUT_ZOOM, type LayoutCamera } from '@/lib/layout-geometry';
import LayoutArtwork from './LayoutArtwork';
import LayoutDisplayControls, { LAYER_NAMES, type SavedInspectionView } from './LayoutDisplayControls';
import type { LayerDisplay } from '@/lib/layout-display';
import { INITIAL_LAYOUT_VIEW, INSPECTIONS, returnFromInspection, type LayoutViewState, type InspectionLabel, type PadFocus } from '@/lib/layout-inspection';
import MathText from '@/components/MathText';

interface Props {
  componentMaterials: ComponentMaterials;
  selected: PartId | null;
  hiddenParts: PartId[];
  onSelect: (part: PartId) => void;
  annotations: boolean;
  onInspect: (part: PartId, focus?: PadFocus) => void;
  viewState: LayoutViewState;
  onViewState: (next: LayoutViewState) => void;
  layerDisplay:LayerDisplay; onLayerDisplay:(next:LayerDisplay)=>void;
  layerColors:boolean; onLayerColors:(next:boolean)=>void;
  onSetVisible:(part:PartId,visible:boolean)=>void;
  focusedPart:PartId|null; onFocus:()=>void; onRestoreFocus:()=>void;
  savedViews:SavedInspectionView[]; onSaveView:(name:string)=>void; onApplyView:(name:string)=>void;
}
export default function LayoutViewport({ componentMaterials, selected, hiddenParts, onSelect, onInspect, annotations, viewState, onViewState, layerDisplay, onLayerDisplay, layerColors, onLayerColors, onSetVisible, focusedPart, onFocus, onRestoreFocus, savedViews, onSaveView, onApplyView }: Props) {
  const surface = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 1000, height: 620 });
  const [pan, setPan] = useState(false);
  const drag = useRef<{ x: number; y: number; camera: LayoutCamera; moved: boolean } | null>(null);
  const latest = useRef({ viewState, onViewState, size });
  useEffect(() => { latest.current = { viewState, onViewState, size }; }, [viewState, onViewState, size]);
  useEffect(() => {
    const element = surface.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height }));
    observer.observe(element);
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      const { viewState: current, onViewState: update, size: box } = latest.current;
      const view = layoutViewBox(box.width, box.height, current.camera);
      const bounds = element.getBoundingClientRect();
      const fx = (event.clientX - bounds.left) / Math.max(box.width,1) - .5;
      const fy = (event.clientY - bounds.top) / Math.max(box.height,1) - .5;
      const zoom = Math.max(MIN_LAYOUT_ZOOM, Math.min(MAX_LAYOUT_ZOOM, current.camera.zoom * Math.exp(-event.deltaY * .0015)));
      const scale = current.camera.zoom / zoom;
      update({ ...current, camera: boundedCamera({ zoom, x: current.camera.x + fx * view.width * (1-scale), y: current.camera.y + fy * view.height * (1-scale) }) });
    };
    element.addEventListener('wheel', wheel, { passive: false });
    return () => { observer.disconnect(); element.removeEventListener('wheel', wheel); };
  }, []);
  const { camera, beforeInspection } = viewState;
  const detail = beforeInspection !== null;
  const inspection = viewState.inspecting ? INSPECTIONS[viewState.inspecting] : null;
  const box = layoutViewBox(size.width, size.height, camera);
  const returnToPrevious=()=>focusedPart?onRestoreFocus():onViewState(returnFromInspection(viewState));
  const fitWhole=()=>{if(focusedPart)onRestoreFocus();onViewState(INITIAL_LAYOUT_VIEW);};
  const zoom = (factor: number) => onViewState({ ...viewState, camera: boundedCamera({ ...camera, zoom: camera.zoom * factor }) });
  const startPan = (event: PointerEvent<HTMLDivElement>) => {
    if (!pan && event.button !== 1 && !event.shiftKey) return;
    if ((event.target as Element).closest('button')) return;
    event.preventDefault();
    drag.current = { x: event.clientX, y: event.clientY, camera: { ...camera }, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const movePan = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    const dx = event.clientX - drag.current.x, dy = event.clientY - drag.current.y;
    drag.current.moved ||= Math.abs(dx)+Math.abs(dy)>3;
    onViewState({ ...viewState, camera: boundedCamera({ ...drag.current.camera, x: drag.current.camera.x-dx*box.width/size.width, y: drag.current.camera.y-dy*box.height/size.height }) });
  };
  const labels: InspectionLabel[] = inspection ? inspection.labels.map(label=>viewState.inspecting==='capacitor'&&viewState.padFocus==='right'&&label.text==='Stepped electrode neck'?{...label,anchor:[590,307] as [number,number],offset:[-35,75] as [number,number]}:label) : [
    {text:'C1 · Capacitor pads',part:'capacitor',anchor:[250,285],offset:[12,-85]},
    {text:'JJ1 · Josephson junction',part:'junction',anchor:[500,310],offset:[25,-80]},
    {text:'G1 · Charge gate',part:'gate',anchor:[840,310],offset:[20,-54]},
    {text:'Ground metal',part:'ground',anchor:[420,425],offset:[-135,20]},
  ];
  const reserved = detail||camera.zoom>1 ? [{x:10,y:size.height-143,width:126,height:133}] : [];
  if(selected==='junction'&&!hiddenParts.includes('junction')){
    const scale=size.width/box.width;
    const width=Math.max(36,28*scale),height=Math.max(20,13*scale);
    reserved.push({x:(500-box.x)*scale-width/2,y:(310-box.y)*scale-height/2,width,height});
  }
  const projected = placeInspectionLabels(labels, box, size, selected, hiddenParts,reserved);
  return <section className="layout-viewport" aria-label="Interactive chip layout" onKeyDown={event=>{if((event.target as Element).closest('input,select,textarea'))return;if(event.key==='Escape'&&(detail||focusedPart)){event.preventDefault();returnToPrevious();}if(event.key==='+'||event.key==='='){event.preventDefault();zoom(1.25);}if(event.key==='-'){event.preventDefault();zoom(1/1.25);}}}>
    <div className="layout-canvas-toolbar">
      {detail ? <button className="layout-canvas-button" onClick={returnToPrevious}><ArrowLeft size={16}/>Full chip</button> : <span className="layout-view-caption">DIE / TOP</span>}
      {detail && <span className="layout-inspection-caption">{inspection?.title} · illustrative</span>}
      <div className="layout-camera-controls">
        <button className="layout-display-mode" aria-label="Use layer colors" aria-pressed={layerColors} title={layerColors?'Layer colors · switch to material appearance':'Material appearance · switch to layer colors'} onClick={()=>onLayerColors(!layerColors)}><Layers size={14}/><span>{layerColors?'Layers':'Material'}</span></button>
        <button aria-label="Focus selected component" title="Isolate selected component in both views" aria-pressed={focusedPart!==null} disabled={!selected} onClick={onFocus}><Focus size={16}/></button>
        <button aria-label="Fit selected component" title="Zoom to selected component" disabled={!selected} onClick={()=>selected&&onInspect(selected)}><ScanSearch size={16}/></button>
        <button aria-label="Select parts" aria-pressed={!pan} onClick={()=>setPan(false)}><MousePointer2 size={17}/></button>
        <button aria-label="Pan layout" aria-pressed={pan} onClick={()=>setPan(true)}><Hand size={17}/></button>
        <button aria-label="Zoom out" disabled={camera.zoom<=MIN_LAYOUT_ZOOM} onClick={()=>zoom(1/1.25)}><Minus size={17}/></button>
        <output aria-label="Layout zoom"><MathText math={`${Math.round(camera.zoom*100)}\\,\\%`} /></output>
        <button aria-label="Zoom in" disabled={camera.zoom>=MAX_LAYOUT_ZOOM} onClick={()=>zoom(1.25)}><Plus size={17}/></button>
        <button aria-label="Fit whole chip" onClick={fitWhole}><Maximize size={17}/></button>
      </div>
    </div>
    {focusedPart&&<div className="layout-focus-banner"><span>Focused · {LAYER_NAMES[focusedPart]}</span><button onClick={onRestoreFocus}>Restore previous view</button></div>}
    {viewState.inspecting==='capacitor' && <div className="layout-pad-focus" role="group" aria-label="Capacitor inspection focus"><span>Inspect</span>{(['both','left','right'] as const).map(focus=><button key={focus} aria-pressed={viewState.padFocus===focus} onClick={()=>onInspect('capacitor',focus)}>{focus==='both'?'Both pads':focus==='left'?'Left pad':'Right pad'}</button>)}</div>}
    <div ref={surface} className={`layout-drawing${pan?' is-panning':''}`} onPointerDown={startPan} onPointerMove={movePan} onPointerUp={()=>{drag.current=null;}} onPointerCancel={()=>{drag.current=null;}} data-inspecting={detail}>
      <svg className="layout-scene" viewBox={`${box.x} ${box.y} ${box.width} ${box.height}`} aria-label="Transmon geometry with selectable capacitor pads, junction, gate, ground and substrate">
        <LayoutArtwork layerDisplay={layerDisplay} layerColors={layerColors} componentMaterials={componentMaterials} selected={selected} hiddenParts={hiddenParts} onSelect={part=>{if(!pan&&!drag.current?.moved)onSelect(part);}} onInspect={part=>{if(!pan)onInspect(part);}} detail={detail} pixelsPerUnit={size.width/box.width}/>
      </svg>
      {annotations && size.width>220 && <div className="layout-annotations" aria-label="Component annotations">
        <svg viewBox={`0 0 ${size.width} ${size.height}`} aria-hidden="true">{projected.map((l,i)=><g key={i}><path d={`M${l.ax} ${l.ay}L${l.ax<l.x?l.x-10:l.x+l.width+10} ${l.y+l.height/2}H${l.ax<l.x?l.x:l.x+l.width}`} stroke={l.part===selected?'#87bdcf':'#819da9'} fill="none" strokeWidth=".75"/><circle cx={l.ax} cy={l.ay} r="1.8" fill={l.part===selected?'#acd6e2':'#a8bec6'}/></g>)}</svg>
        {projected.map((l,i)=><button key={i} className={l.part===selected?'selected':''} style={{left:l.x,top:l.y,width:l.width,height:l.height}} onClick={()=>l.part&&onSelect(l.part)}>{l.text}</button>)}
      </div>}
      <div className="layout-datum" aria-hidden="true"><small>Y</small><span>X</span></div>
      {(detail||camera.zoom>1) && <button className="layout-locator" aria-label="Return to previous full-chip view" onClick={returnToPrevious}>
        <svg viewBox="220 30 560 560" aria-hidden="true"><LayoutArtwork layerDisplay={layerDisplay} layerColors={layerColors} componentMaterials={componentMaterials} selected={selected} hiddenParts={hiddenParts} miniature/><rect x={box.x} y={box.y} width={box.width} height={box.height} fill="#2499ff22" stroke="#51baff" strokeWidth="8"/></svg><span>Full-chip locator</span>
      </button>}
    </div>
    <div className="layout-material-legend" aria-label="Layout material legend">
      {(['capacitor','ground','substrate','junction'] as PartId[]).filter(part=>!hiddenParts.includes(part)).map(part=><button key={part} aria-pressed={selected===part} onClick={()=>onSelect(part)}><i style={{background:layerColors?INSPECTION_LAYER_COLORS[part]:resolveMaterial(componentMaterials[part]).color}}/>{part==='capacitor'?'Pads':part==='ground'?'Ground':part==='substrate'?'Die':'Junction'} · {resolveMaterial(componentMaterials[part]).formula}</button>)}
      <LayoutDisplayControls materials={componentMaterials} layerColors={layerColors} display={layerDisplay} hiddenParts={hiddenParts} selected={selected} maxHeight={Math.max(170,size.height-14)} onSelect={onSelect} onDisplay={onLayerDisplay} onSetVisible={onSetVisible} savedViews={savedViews} onSaveView={onSaveView} onApplyView={onApplyView}/>
    </div>
    <div className="layout-canvas-status"><span>{inspection?inspection.explanation:<><span>Illustrative geometry · Double-click a part to inspect · </span><MathText math="100\\,\\%"/><span> fits the whole chip</span></>}</span></div>
  </section>;
}
