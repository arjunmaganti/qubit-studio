'use client';

import { useEffect, useRef, useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { resolveMaterial, type ComponentMaterials } from '@/lib/component-materials';
import { DEFAULT_LAYER_DISPLAY, type LayerDisplay, type LayerFillMode } from '@/lib/layout-display';
import { INSPECTION_LAYER_COLORS } from '@/lib/layout-surface';
import type { LayoutViewState } from '@/lib/layout-inspection';
import type { PartId } from '@/lib/parts';

export const LAYER_NAMES: Record<PartId,string> = {package:'Package',board:'Carrier',substrate:'Substrate',ground:'Ground',capacitor:'Pads',junction:'Junction',gate:'Gate'};
const ORDER: PartId[] = ['package','board','substrate','ground','capacitor','junction','gate'];
export interface SavedInspectionView {
  name:string; view:LayoutViewState; layerDisplay:LayerDisplay; layerColors:boolean;
  hiddenParts:PartId[]; selected:PartId|null; annotations:boolean;
}
interface Props {
  materials:ComponentMaterials; layerColors:boolean; display:LayerDisplay;
  hiddenParts:PartId[]; selected:PartId|null; maxHeight:number;
  onSelect:(part:PartId)=>void; onDisplay:(next:LayerDisplay)=>void;
  onSetVisible:(part:PartId,visible:boolean)=>void;
  savedViews:SavedInspectionView[]; onSaveView:(name:string)=>void; onApplyView:(name:string)=>void;
}
export default function LayoutDisplayControls({materials,layerColors,display,hiddenParts,selected,maxHeight,onSelect,onDisplay,onSetVisible,savedViews,onSaveView,onApplyView}:Props) {
  const [open,setOpen]=useState(false),[name,setName]=useState(''),[saved,setSaved]=useState('');
  const root=useRef<HTMLDivElement>(null),trigger=useRef<HTMLButtonElement>(null);
  const close=()=>{setOpen(false);trigger.current?.focus();};
  useEffect(()=>{
    if(!open)return;
    const outside=(event:globalThis.PointerEvent)=>{if(!root.current?.contains(event.target as Node))setOpen(false);};
    document.addEventListener('pointerdown',outside);
    return()=>document.removeEventListener('pointerdown',outside);
  },[open]);
  return <div ref={root} className="layout-display-controls" onKeyDown={event=>{if(open&&event.key==='Escape'){event.preventDefault();event.stopPropagation();close();}}}>
    <button ref={trigger} className="layout-display-trigger" aria-label="Layer display controls" aria-expanded={open} onClick={()=>setOpen(!open)}><SlidersHorizontal size={13}/>Display</button>
    {open&&<div className="layout-display-panel" role="region" aria-label="Layer display settings" style={{maxHeight}}>
      <div className="layout-display-heading"><strong>Layer display</strong><button aria-label="Close layer display controls" onClick={close}><X size={14}/></button></div>
      <p>Visibility in both views · Fill in Layout</p>
      <div className="layout-display-column-head" aria-hidden="true"><span>Show</span><span>Component</span><span>Fill</span></div>
      {ORDER.map(part=><div className={`layout-display-row${selected===part?' is-active':''}`} key={part}>
        <input type="checkbox" aria-label={`${LAYER_NAMES[part]} visible`} checked={!hiddenParts.includes(part)} onChange={event=>onSetVisible(part,event.target.checked)}/>
        <button className="layout-display-part" aria-pressed={selected===part} onClick={()=>onSelect(part)}><i style={{background:layerColors?INSPECTION_LAYER_COLORS[part]:resolveMaterial(materials[part]).color}}/>{LAYER_NAMES[part]}<small>{resolveMaterial(materials[part]).formula}</small></button>
        <select aria-label={`${LAYER_NAMES[part]} display`} value={display[part]} onChange={event=>onDisplay({...display,[part]:event.target.value as LayerFillMode})}><option value="solid">Solid</option><option value="translucent">Translucent</option><option value="outline">Outline</option></select>
      </div>)}
      <button className="layout-display-reset" onClick={()=>onDisplay({...DEFAULT_LAYER_DISPLAY})}>Reset layer fills</button>
      <div className="layout-saved-views">
        <label htmlFor="saved-inspection-views">Saved inspection views</label>
        <select id="saved-inspection-views" aria-label="Saved inspection views" value="" onChange={event=>{onApplyView(event.target.value);setSaved('');close();}}><option value="" disabled>{savedViews.length?'Choose a saved view…':'No saved views yet'}</option>{savedViews.map(view=><option key={view.name} value={view.name}>{view.name}</option>)}</select>
        <form onSubmit={event=>{event.preventDefault();const next=name.trim();if(!next)return;onSaveView(next);setSaved(next);setName('');}}>
          <input aria-label="Inspection view name" placeholder="Name this view" maxLength={36} value={name} onChange={event=>setName(event.target.value)}/><button disabled={!name.trim()} type="submit">Save current view</button>
        </form>
        <span role="status">{saved?`Saved “${saved}”`:'Camera, visibility and appearance · This session'}</span>
      </div>
    </div>}
  </div>;
}
