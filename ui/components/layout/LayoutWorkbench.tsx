'use client';
import { useCallback, useRef, useState, type ComponentProps, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { Blocks, Box, ChevronDown, CircuitBoard, RotateCcw, SlidersHorizontal, Sparkles } from 'lucide-react';
import GuidedTour from '@/components/GuidedTour';
import MylaIcon from '@/components/MylaIcon';
import { TOUR_STEPS } from '@/lib/guided-tour';
import { FULL_TOUR_STEPS } from '@/lib/full-guided-tour';
import { PARTS, type PartId } from '@/lib/parts';
import type Inspector from '@/components/Inspector';
import type ResultsDock from '@/components/ResultsDock';
import LayoutViewport from './LayoutViewport';
import { INITIAL_LAYOUT_VIEW, inspectPart, returnFromInspection, type PadFocus, type LayoutViewState } from '@/lib/layout-inspection';
import LayoutInspector from './LayoutInspector';
import LayoutCircuit from './LayoutCircuit';
import LayoutResults from './LayoutResults';
import { HardwareContext } from './HardwareContext';
import { resolveMaterial, type ComponentMaterials } from '@/lib/component-materials';
import './layout.css';
import './product.css';
import './inspection.css';
import './layer-artwork.css';
import './display-controls.css';
import './workspace.css';
import { DEFAULT_LAYER_DISPLAY, type LayerDisplay } from '@/lib/layout-display';
import type { SavedInspectionView } from './LayoutDisplayControls';

interface Props {
  mode:'explore'|'design'; onMode:(mode:'explore'|'design')=>void;
  inspector:ComponentProps<typeof Inspector>; results:ComponentProps<typeof ResultsDock>;
  status:{className:string;text:string}; hiddenParts:PartId[]; onToggleVisible:(id:PartId)=>void;
  onRestoreInspectionView:(selected:PartId|null,hiddenParts:PartId[])=>void;
  explode:number; onExplode:(value:number)=>void; onReset3d:()=>void;
  onExport:()=>void; canExport:boolean; onPreset:(name:string)=>void; onResetParams:()=>void; atDefaults:boolean;
  children:ReactNode; builderTool?:ReactNode; designTools?:ReactNode;
  componentMaterials:ComponentMaterials; onComponentMaterialChange:(part:PartId,material:string)=>void;
  renderQuality:'balanced'|'high'; onRenderQuality:(quality:'balanced'|'high')=>void;
  onTourActive?: (active: boolean) => void;
  onBuildChip?: () => void;
  buildingChip?: boolean;
}
export default function LayoutWorkbench(props:Props) {
  const [tour,setTour]=useState<number|null>(null);
  const [fullTour,setFullTour]=useState(false);
  const tourSteps=fullTour?FULL_TOUR_STEPS:TOUR_STEPS;
  const { onTourActive } = props;
  const closeTour=useCallback(()=>{ setTour(null); onTourActive?.(false); }, [onTourActive]);
  const [view,setView]=useState<'layout'|'3d'>('3d');
  const [split,setSplit]=useState(false);
  const [ratio,setRatio]=useState(50);
  const [circuit,setCircuit]=useState(false);
  const [annotations,setAnnotations]=useState(true);
  const [layoutView,setLayoutView]=useState(INITIAL_LAYOUT_VIEW);
  const [layerDisplay,setLayerDisplay]=useState<LayerDisplay>({...DEFAULT_LAYER_DISPLAY});
  const [layerColors,setLayerColors]=useState(false);
  const [focus,setFocus]=useState<{part:PartId;previous:LayoutViewState;hiddenParts:PartId[];selected:PartId|null}|null>(null);
  const [savedViews,setSavedViews]=useState<SavedInspectionView[]>([]);
  const [solverOpen,setSolverOpen]=useState(false);
  const aside=useRef<HTMLElement>(null),stage=useRef<HTMLElement>(null),panes=useRef<HTMLDivElement>(null);
  const {inspector,results,mode}=props;
  const {selected,params,session}=inspector;
  const show3d=split||view==='3d',showLayout=split||view==='layout';
  const effectiveHidden=focus?PARTS.filter(part=>part.id!==focus.part).map(part=>part.id):props.hiddenParts;
  const setPartVisible=(part:PartId,visible:boolean)=>{
    const baseline=focus?.hiddenParts??props.hiddenParts;
    const hidden=visible?baseline.filter(id=>id!==part):[...new Set([...baseline,part])];
    setFocus(null);props.onRestoreInspectionView(selected,hidden);
  };
  const filmIds = new Set([props.componentMaterials.capacitor, props.componentMaterials.junction, props.componentMaterials.gate, props.componentMaterials.ground]);
  const filmLabel = filmIds.size === 1 ? resolveMaterial(props.componentMaterials.capacitor).formula : 'Mixed films';
  const inspectionSize=()=>{const rect=stage.current?.querySelector('.layout-drawing')?.getBoundingClientRect();return {width:rect?.width||500,height:rect?.height||500};};
  const onSelect=(part:PartId)=>{
    inspector.onSelect(part);setFocus(current=>current?{...current,part}:null);aside.current?.scrollTo({top:0});
    if(layoutView.inspecting&&layoutView.inspecting!==part){const {width,height}=inspectionSize();setLayoutView(current=>inspectPart(current,part,width,height));}
  };
  const openInspection=(part:PartId,focus:PadFocus='both')=>{
    // The fit needs the revealed pane's dimensions. Commit this layout change
    // before measuring instead of waiting behind a potentially expensive GPU frame.
    if(!showLayout)flushSync(()=>setSplit(true));
    inspector.onSelect(part);setFocus(current=>current?{...current,part}:null);aside.current?.scrollTo({top:0});
    const {width,height}=inspectionSize();setLayoutView(current=>inspectPart(current,part,width,height,focus));
  };
  const restoreFocus=()=>{if(focus){setLayoutView(focus.previous);props.onRestoreInspectionView(focus.selected,focus.hiddenParts);}setFocus(null);};
  const focusSelected=()=>{
    if(focus){restoreFocus();return;}
    if(!selected)return;
    setFocus({part:selected,previous:layoutView,hiddenParts:[...props.hiddenParts],selected});
    const {width,height}=inspectionSize();setLayoutView(current=>inspectPart(current,selected,width,height));
  };
  const saveView=(name:string)=>{
    const snapshot:SavedInspectionView={name,view:structuredClone(layoutView),layerDisplay:{...layerDisplay},layerColors,hiddenParts:[...effectiveHidden],selected,annotations};
    setSavedViews(current=>[...current.filter(item=>item.name!==name),snapshot]);
  };
  const applyView=(name:string)=>{
    const snapshot=savedViews.find(item=>item.name===name);if(!snapshot)return;
    setFocus(null);props.onRestoreInspectionView(snapshot.selected,[...snapshot.hiddenParts]);setLayoutView(structuredClone(snapshot.view));
    setLayerDisplay({...snapshot.layerDisplay});setLayerColors(snapshot.layerColors);setAnnotations(snapshot.annotations);
  };
  const goTour=(index:number,complete=fullTour)=>{
    const step=(complete?FULL_TOUR_STEPS:TOUR_STEPS)[index]; if(!step)return;
    setFullTour(complete); setTour(index); props.onTourActive?.(true); props.onMode(step.tab==='experiment'?'design':'explore');
    if(index===0)document.querySelectorAll('.learning-menu').forEach(node=>node.removeAttribute('open'));
    if(step.part)inspector.onSelect(step.part);
    if(step.view==='3d'){setView('3d');setSplit(false);}
    if(step.view==='schematic'){setView('layout');setSplit(false);setCircuit(true);}
    if(step.view==='split')setSplit(true);
  };
  const startBuild=()=>{
    setTour(null);
    props.onTourActive?.(false);
    document.querySelectorAll('.learning-menu').forEach(node=>node.removeAttribute('open'));
    setView('3d');
    setSplit(false);
    props.onBuildChip?.();
  };
  const candidateSource=session.chosenCandidate;
  const candidate=candidateSource&&session.search.snapshot?{ej_ghz:candidateSource.ej_ghz,ec_ghz:candidateSource.ec_ghz,ng:0,ncut:session.search.snapshot.params.ncut}:null;
  const inspect=()=>{if(showLayout&&layoutView.inspecting===selected)setLayoutView(returnFromInspection(layoutView));else if(selected)openInspection(selected);};
  const openSolver=()=>{setSolverOpen(true);requestAnimationFrame(()=>{const node=aside.current?.querySelector<HTMLElement>('.layout-solver summary');node?.focus();node?.scrollIntoView({block:'nearest'});});};
  const resize=(clientX:number)=>{const rect=panes.current?.getBoundingClientRect();if(rect)setRatio(Math.max(35,Math.min(65,(clientX-rect.left)/rect.width*100)));};
  const selectView=(next:'layout'|'3d')=>{setView(next);setSplit(false);};
  return <div className={`wave-shell product-shell${mode==='design'?' is-design':''}${split?' has-split':''}`}>
    <header className="wave-header">
      <div className="wave-brand"><Blocks size={24} strokeWidth={1.8}/>Qubit Studio</div>
      <nav className="wave-modes" aria-label="Workspace mode">{(['explore','design'] as const).map(item=><button key={item} aria-pressed={mode===item} onClick={()=>props.onMode(item)}>{item==='explore'?'Explore':'Design'}</button>)}</nav>
      <details className="layout-popover learning-menu"><summary>Design tools</summary><div>{props.designTools}</div></details>
      <span className="wave-device">Transmon / 01</span><span role="status" className={props.status.className}>{props.status.text}</span>
      <details className="layout-popover learning-menu"><summary aria-pressed={!!props.buildingChip||tour!==null}>Learn</summary><div>
        <button type="button" onClick={()=>goTour(0,false)}>Guided tour</button>
        <button type="button" onClick={()=>goTour(0,true)}>Full feature tour</button>
        <button type="button" onClick={startBuild} aria-pressed={!!props.buildingChip}>Build a chip</button>
        <a href="/docs">Notes</a>
      </div></details>
      <button className="wave-tool-button workspace-ask" onClick={inspector.onAskLlm}><MylaIcon size={18}/>Ask Myla{inspector.selectedTopics.size>0?` (${inspector.selectedTopics.size})`:''}</button>
      <details className="layout-popover device-menu"><summary>Device <ChevronDown size={14}/></summary><div><label>Demo preset<select defaultValue="" disabled={mode==='design'} onChange={e=>{if(e.target.value)props.onPreset(e.target.value);e.target.value='';}}><option value="" disabled>Choose preset…</option><option value="default">Balanced default</option><option value="reference">scqubits reference</option><option value="protected">Low charge sensitivity</option><option value="anharmonic">High anharmonicity</option></select></label><button disabled={props.atDefaults||mode==='design'} onClick={props.onResetParams}>Reset all parameters</button></div></details>
    </header>
    <div className="wave-toolbar">
      <details className="layout-popover components-menu"><summary><Box size={16}/>Components <ChevronDown size={14}/></summary><div aria-label="Component selection">{[...PARTS.filter(p=>p.modeled),...PARTS.filter(p=>!p.modeled)].map(part=><button key={part.id} onClick={event=>{onSelect(part.id);event.currentTarget.closest('details')?.removeAttribute('open');}} aria-pressed={selected===part.id}><span>{part.name}</span><small>{resolveMaterial(props.componentMaterials[part.id]).formula}</small></button>)}</div></details>
      <div className="wave-view-switch" role="group" aria-label="Representation">{(['3d','layout'] as const).map(item=><button key={item} aria-pressed={!split&&view===item} onClick={()=>selectView(item)}>{item==='3d'?'3D':'Layout'}</button>)}<button className="split-toggle" aria-label="Split view" aria-pressed={split} onClick={()=>setSplit(!split)}>Split</button></div>
      {props.builderTool}
      <span className="spacer"/>
      {show3d&&<details className="layout-popover assembly-menu"><summary>{props.explode===1?'Exploded':'Assembled'} <ChevronDown size={14}/></summary><div role="group" aria-label="Assembly state"><span className="options-hint">Presentation only · no electrical effect</span>{([0,1] as const).map(value=><button key={value} aria-pressed={props.explode===value} onClick={event=>{props.onExplode(value);event.currentTarget.closest('details')?.removeAttribute('open');}}>{value===0?'Assembled':'Exploded'}</button>)}</div></details>}
      <details className="layout-popover view-options"><summary><SlidersHorizontal size={17}/>View options <ChevronDown size={14}/></summary><div><strong>{split?'3D + Layout':showLayout?'Layout':'3D'}</strong>
        {show3d&&<><button onClick={props.onReset3d}><RotateCcw size={14}/> Reset 3D view</button><button aria-label="High detail rendering" aria-pressed={props.renderQuality==='high'} onClick={()=>props.onRenderQuality(props.renderQuality==='high'?'balanced':'high')}><Sparkles size={14}/> High detail {props.renderQuality==='high'?'✓':''}</button></>}
        <button aria-expanded={circuit} aria-controls="wave-circuit" onClick={()=>setCircuit(!circuit)}><CircuitBoard size={14}/> {circuit?'Hide circuit':'Show circuit'}</button>
        {showLayout&&<label><input type="checkbox" checked={annotations} onChange={e=>setAnnotations(e.target.checked)}/>Annotations</label>}
        <span className="options-hint">Visible components · shared across views</span>
        {PARTS.map(part=><label key={part.id}><input type="checkbox" checked={!effectiveHidden.includes(part.id)} onChange={event=>setPartVisible(part.id,event.target.checked)}/>{part.name}</label>)}
      </div></details>
    </div>
    <main ref={stage} className="wave-stage" aria-label={split?'Linked 3D and Layout workspace':showLayout?'Layout workspace':'3D workspace'}>
      <div ref={panes} className={`product-panes${split?' is-split':''}`} style={split?{gridTemplateColumns:`minmax(0,${ratio}fr) 8px minmax(0,${100-ratio}fr)`}:undefined}>
        <section className="product-hardware" hidden={!show3d} aria-label="3D chip pane">

          <div className="hardware-surface">
            <HardwareContext.Provider value={{active:show3d,onSelect,hiddenPartsOverride:effectiveHidden}}>{props.children}</HardwareContext.Provider>
            <div className="hardware-caption"><span>QS–01</span><strong>Transmon</strong><small>{filmLabel} / {resolveMaterial(props.componentMaterials.substrate).formula} · {props.explode===1?'Layer separation':'Packaged device'}</small></div>
          </div>
          {props.explode===1&&<div className="hardware-layer-materials" role="group" aria-label="Exploded component materials">{(['package','board','substrate','ground','capacitor','junction','gate'] as PartId[]).map(id=>{const material=resolveMaterial(props.componentMaterials[id]);return <button key={id} aria-pressed={selected===id} onClick={()=>onSelect(id)} title={`${PARTS.find(part=>part.id===id)?.name} · ${material.name}`}><i style={{backgroundColor:material.color}}/><span>{id==='capacitor'?'Pads':id==='package'?'Package':id==='board'?'Carrier':id[0].toUpperCase()+id.slice(1)}</span><strong>{material.formula}</strong></button>;})}</div>}
          <div className="hardware-status">Drag to orbit · scroll to zoom <span>Illustrative assembly</span></div>
        </section>
        {split&&<div className="product-divider" role="separator" tabIndex={0} aria-label="Resize 3D and Layout panes" aria-orientation="vertical" aria-valuemin={35} aria-valuemax={65} aria-valuenow={Math.round(ratio)} onDoubleClick={()=>setRatio(50)} onKeyDown={event=>{if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();setRatio(current=>Math.max(35,Math.min(65,current+(event.key==='ArrowLeft'?-5:5))));}}} onPointerDown={event=>{event.currentTarget.setPointerCapture(event.pointerId);resize(event.clientX);}} onPointerMove={event=>{if(event.currentTarget.hasPointerCapture(event.pointerId))resize(event.clientX);}} onPointerUp={event=>event.currentTarget.releasePointerCapture(event.pointerId)}/>}
        <section className="wave-renderer product-layout" hidden={!showLayout} aria-label="Planar layout pane"><LayoutViewport componentMaterials={props.componentMaterials} selected={selected} hiddenParts={effectiveHidden} onSelect={onSelect} onInspect={openInspection} annotations={annotations} viewState={layoutView} onViewState={setLayoutView} layerDisplay={layerDisplay} onLayerDisplay={setLayerDisplay} layerColors={layerColors} onLayerColors={setLayerColors} onSetVisible={setPartVisible} focusedPart={focus?.part??null} onFocus={focusSelected} onRestoreFocus={restoreFocus} savedViews={savedViews} onSaveView={saveView} onApplyView={applyView}/></section>
      </div>
      {circuit&&<div id="wave-circuit"><LayoutCircuit params={params} selected={selected} onSelect={onSelect}/></div>}
    </main>
    <aside ref={aside} className="wave-inspector"><LayoutInspector {...inspector} baseline={results.baseline} tourTarget={tour!==null?tourSteps[tour].target:undefined} componentMaterials={props.componentMaterials} onComponentMaterialChange={props.onComponentMaterialChange} readOnly={mode==='design'} candidate={candidate} candidateCurrent={session.search.current} inspecting={showLayout&&layoutView.inspecting===selected} onInspect={inspect} solverOpen={solverOpen} onSolverOpen={setSolverOpen}/></aside>
    <section className="wave-results"><LayoutResults {...results} tourExpanded={tour!==null} onSolver={openSolver} onExport={props.onExport} canExport={props.canExport} design={mode==='design'}/></section>
    {tour!==null&&<GuidedTour index={tour} sceneKey={`${mode}-${view}-${selected}`} steps={tourSteps} onIndex={index=>goTour(index)} onClose={closeTour}/>}
  </div>;
}
