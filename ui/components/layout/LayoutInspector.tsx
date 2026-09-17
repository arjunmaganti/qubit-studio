'use client';
import { useState, type ComponentProps } from 'react';
import { ArrowLeft, Info, LockKeyhole, ScanSearch } from 'lucide-react';
import type Inspector from '@/components/Inspector';
import GeometryEditor from '@/components/GeometryEditor';
import ParamField from '@/components/ParamField';
import DesignLab from '@/components/DesignLab';
import MaterialSensitivity from '@/components/MaterialSensitivity';
import { INSPECTIONS } from '@/lib/layout-inspection';
import { PARAMS } from '@/lib/params';
import { PART_BY_ID } from '@/lib/parts';
import { TOPICS, TOPIC_IDS } from '@/lib/explain-topics';
import { num } from '@/lib/format';
import MathText from '@/components/MathText';
import { mathValue } from '@/lib/math-format';
import type { DeviceParams, DeviceResult } from '@/lib/types';
import ComponentMaterialPicker from '@/components/ComponentMaterialPicker';
import type { ComponentMaterials } from '@/lib/component-materials';
import type { PartId } from '@/lib/parts';

type Props = ComponentProps<typeof Inspector> & {
  readOnly: boolean;
  candidate: DeviceParams | null;
  candidateCurrent: boolean;
  inspecting: boolean;
  onInspect: () => void;
  solverOpen: boolean;
  onSolverOpen: (open: boolean) => void;
  componentMaterials: ComponentMaterials;
  onComponentMaterialChange: (part: PartId, material: string) => void;
  tourTarget?: string;
  baseline?: DeviceResult | null;
};
const copy = {
  board:{name:'Carrier board',id:'PCB',role:'The carrier supports the chip and its bond contacts. It adds no electrical input to this model.',label:''},
  package:{name:'Package & clamps',id:'PKG',role:'The machined frame and clamps hold the assembly. Use Exploded in the 3D pane to see the stack.',label:''},
  junction: { name:'Josephson junction', id:'JJ1', role:'Controls the nonlinearity of this simplified circuit.', label:'Josephson energy' },
  capacitor: { name:'Capacitor pads', id:'C1', role:'Sets the charging energy of this simplified circuit. Both pads share this parameter.', label:'Charging energy' },
  gate: { name:'Charge gate', id:'G1', role:'Sets the offset charge on the transmon island.', label:'Offset charge' },
  ground: { name:'Ground metal', id:'GND', role:'Surrounding metal with openings that expose the continuous substrate beneath. These are not holes through the chip.', label:'' },
  substrate: { name:'Substrate', id:'SUB', role:'The continuous base underneath the metal. Geometry and material appearance are illustrative.', label:'' },
};

export default function LayoutInspector(props: Props) {
  const [selectedTab, setTab] = useState<'model' | 'appearance' | 'geometry'>('model');
  const tab = props.tourTarget ? (props.tourTarget==='geometry' ? 'geometry' : props.tourTarget==='legend' ? 'appearance' : 'model') : selectedTab;
  const { selected, params, result, readOnly, candidate, candidateCurrent, inspecting, onInspect, onChange, solverOpen, onSolverOpen }=props;
  const part = selected ? PART_BY_ID[selected] : null;
  const text = selected ? copy[selected] : null;
  const recommended = props.session.search.result?.selected;
  const alternative = candidate && recommended && (candidate.ej_ghz !== recommended.ej_ghz || candidate.ec_ghz !== recommended.ec_ghz || candidate.ng !== recommended.ng);
  const inspectedParams = readOnly && candidate ? candidate : params;
  return <div className="layout-inspector">
    <section className="layout-editor" aria-label="Selected component inspector">
      <div className="layout-component-id">{text ? `${text.id} / SELECTED COMPONENT` : 'SELECT A COMPONENT'}</div>
      <h1>{text?.name ?? 'Explore the chip'}</h1>
      <p className="layout-component-role">{text?.role ?? 'Select a component in the layout or circuit to inspect its model parameter.'}</p>
      <div className="inspector-tabs" role="tablist" aria-label="Component controls">
        {(['model', 'appearance', 'geometry'] as const).map((item, index, items) => <button key={item} id={`inspector-tab-${item}`} role="tab" aria-selected={tab===item} aria-controls={`inspector-panel-${item}`} tabIndex={tab===item?0:-1} onClick={()=>setTab(item)} onKeyDown={event=>{
          const next = event.key==='ArrowRight' ? items[(index+1)%items.length] : event.key==='ArrowLeft' ? items[(index+items.length-1)%items.length] : event.key==='Home' ? items[0] : event.key==='End' ? items[items.length-1] : null;
          if(next){event.preventDefault();setTab(next);document.getElementById(`inspector-tab-${next}`)?.focus();}
        }}>{item[0].toUpperCase()+item.slice(1)}</button>)}
      </div>
      <div id="inspector-panel-appearance" role="tabpanel" aria-labelledby="inspector-tab-appearance" hidden={tab!=='appearance'} className="inspector-tabbody">
        <p className="inspector-effect appearance">Visual only · does not change results</p>
        {selected ? <ComponentMaterialPicker key={selected} part={selected} materials={props.componentMaterials} onChange={props.onComponentMaterialChange}/> : <p className="layout-component-role">Select a component to choose its visual material.</p>}
      </div>
      <div id="inspector-panel-geometry" role="tabpanel" aria-labelledby="inspector-tab-geometry" hidden={tab!=='geometry'} className="inspector-tabbody">
        <p className="inspector-effect geometry">Estimates only · apply to change inputs</p>
        {readOnly ? <p className="layout-component-role">Return to Explore to estimate energies from geometry.</p> : <GeometryEditor key={`${params.ej_ghz}-${params.ec_ghz}`} params={params} initiallyOpen onApply={(ej_ghz, ec_ghz) => props.onApplyMaterialScenario({ ...params, ej_ghz, ec_ghz })} />}
      </div>
      <div id="inspector-panel-model" role="tabpanel" aria-labelledby="inspector-tab-model" hidden={tab!=='model'} className="inspector-tabbody">
      <p className="inspector-effect">{part?.param ? 'Changes electrical results' : 'Context only · no electrical input'}</p>
      {readOnly && <p className="layout-readonly"><LockKeyhole size={15}/>{candidate ? `${candidateCurrent?'Candidate':'Outdated candidate'} values · read only` : 'Applied device · read only in Design'}</p>}
      {part?.param && <div className="layout-primary-field"><ParamField key={`${part.param}-${readOnly?'design':'explore'}`} paramKey={part.param} value={inspectedParams[part.param]} onChange={onChange} disabled={readOnly} label={text?.label}/><div className="layout-field-bounds"><span><MathText math={`${PARAMS[part.param].min}`} /></span><span><MathText text={`${PARAMS[part.param].max} ${PARAMS[part.param].unit}`} /></span></div></div>}
      {part?.param && <p className="inspector-helper">This input updates the calculation. Visual material choices are independent.</p>}
      {!part?.modeled && part && <p className="layout-context-note">Context only · no editable model input.</p>}
      <div className="layout-editor-footer"><span><Info size={14}/> Effective model parameters</span><details className="tech"><summary>More detail</summary><div className="body">
        {part?.param && <p>{PARAMS[part.param].meaning}</p>}
        <p>Geometry is illustrative. Editing energy values does not resize the pads or calculate a new capacitance from their shape.</p>
        {selected==='junction' && <p>The enlarged overlap identifies the weak link between the two electrodes. The junction detail is exaggerated for legibility.</p>}
        <p><MathText math={`E_J/h=${mathValue(inspectedParams.ej_ghz,2,'GHz')}; E_C/h=${mathValue(inspectedParams.ec_ghz,3,'GHz')}; n_g=${num(inspectedParams.ng,3)}`} /></p>
        <details className="tech"><summary>Choose and compare materials</summary><MaterialSensitivity onAsk={props.onSelectTopic} session={props.session} params={params} result={result} onApply={props.onApplyMaterialScenario} onMaterialsChange={props.onMaterialsChange} topMaterial={props.materials.topMaterial} baseMaterial={props.materials.baseMaterial}/></details>
        <details className="tech"><summary>Explanation topics</summary><div className="row-actions">{TOPIC_IDS.map(id => <button type="button" className="btn" key={id} aria-pressed={props.selectedTopics.has(id)} onClick={() => props.onSelectTopic(id)}>{TOPICS[id].label}</button>)}</div></details>
      </div></details></div>
      </div>
      {selected && <button className="btn layout-inspect-action" onClick={onInspect}>{inspecting?<ArrowLeft size={16}/>:<ScanSearch size={16}/>} {inspecting?'Return to full chip':INSPECTIONS[selected].action}</button>}
    </section>
    <details className="layout-solver tech" open={solverOpen} onToggle={event=>onSolverOpen(event.currentTarget.open)}>
      <summary>Solver settings</summary><div className="body"><ParamField paramKey="ncut" value={params.ncut} onChange={onChange} disabled={readOnly}/><p>{PARAMS.ncut.meaning}</p>{readOnly&&<p>Return to Explore to change numerical settings.</p>}</div>
    </details>
    {readOnly && <section className="layout-design-tools" aria-label="Existing Design workflow">
      {candidate && <p className="layout-candidate-scope">The inspector shows the {candidateCurrent?'current':'outdated'} {alternative?'selected alternative':'recommendation'}. The chip and results remain the applied device until you choose “Use variables + materials”.</p>}
      <DesignLab baseline={props.baseline} session={props.session} params={params} result={result} goals={props.goals} onGoalsChange={props.onGoalsChange} onApply={props.onApplyMaterialScenario} onMaterialsChange={props.onMaterialsChange} currentMaterials={props.materials}/>
    </section>}
  </div>;
}
