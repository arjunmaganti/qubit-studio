// Browser integration journeys: import production components; never copy state logic here.
import { StrictMode, useLayoutEffect, useMemo, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { useEvaluate } from '@/lib/useEvaluate.ts';
import { completedDevice } from '@/lib/device-snapshot.ts';
import { sameParams } from '@/lib/params.ts';
import { useExperimentSession } from '@/lib/useExperimentSession.ts';
import { useExplain } from '@/lib/useExplain.ts';
import { buildChipSnapshot } from '@/lib/insight-snapshot.ts';
import AskLlm from '@/components/AskLlm.tsx';
import Inspector from '@/components/Inspector.tsx';
import fixtures from './fixtures/solver.json';
import provider from './fixtures/provider.json';
import contract from './contract.json';
const { EXPECTED_JOURNEYS } = contract;
import Page from '@/app/page.tsx';

const requests: any[] = [], checks: string[] = [], renderErrors: string[] = [];
const p = fixtures.params;
const g = { target_ghz: 5, tolerance_ghz: .25, min_anharmonicity_mhz: 200, max_dispersion_khz: 10 };
const m = { topMaterial: 'Al', baseMaterial: 'Si', topColor: '#c5c9ce', baseColor: '#4a4b50' };
let root: Root, current: any, actions: any = {}, applyCalls = 0;
// Deliberately ignore AbortSignal completion: late responses must be rejected by real hooks.
const allowedRoutes = new Set(['/api/evaluate', '/api/explain', '/api/search', '/api/stress', '/api/evaluate-tunable', '/api/material-scenario']);
globalThis.fetch = (url, init) => {
  const route = String(url);
  if (!allowedRoutes.has(route)) throw new Error(`Unexpected network request: ${route}`);
  return new Promise((resolve, reject) => requests.push({ route, body: JSON.parse(init!.body as string), signal: init!.signal, resolve, reject, answered: false, taken: false }));
};
const pause = () => new Promise(resolve => setTimeout(resolve, 15));
async function until(fn: () => unknown, label: string, timeout = 4000) {
  const start = Date.now();
  while (!fn()) { if (Date.now() - start > timeout) throw new Error(`Timed out: ${label}`); await pause(); }
}
function assert(ok: unknown, label: string) { if (!ok) throw new Error(label); }
function pass(label: string) { assert(!checks.includes(label), 'Journey labels must be unique'); checks.push(label); }
async function next(route: string, label: string) {
  await until(() => requests.some(r => r.route === route && !r.taken), label);
  const r = requests.find(r => r.route === route && !r.taken); r.taken = true; return r;
}
function answer(r: any, payload: any, status=200) { r.answered = true; r.resolve(Response.json(structuredClone(payload), {status})); }
function fail(r: any, message='Controlled transport failure') { r.answered = true; r.reject(new Error(message)); }
function invoke(key: string, ...args: any[]) { flushSync(() => actions[key](...args)); }
function clickText(label: string) {
  const node = [...document.querySelectorAll('button')].find(el => el.textContent?.trim() === label) as HTMLButtonElement;
  assert(node, `Button exists: ${label}`); flushSync(() => node.click());
}
function mount(Component: any) {
  if (root) flushSync(() => root.unmount());
  const container = document.getElementById('root')!; container.innerHTML=''; current=null; actions={};
  root=createRoot(container); flushSync(() => root.render(<StrictMode><Component /></StrictMode>));
}
function EvalApp() {
  const [params,setParams] = useState(p);
  const evaluation=useEvaluate(params);
  const ready=completedDevice(params,evaluation.result,evaluation.status,evaluation.stale);
  useLayoutEffect(() => {
    current={params,evaluation,ready}; actions={params:setParams,retry:evaluation.retry};
    if (ready && !sameParams(params,evaluation.result!)) renderErrors.push('A mismatched result was actionable during render.');
    if (evaluation.status==='ready' && !sameParams(params,evaluation.result!)) renderErrors.push('A ready render carried mismatched parameters.');
  });
  return <pre id="state">{JSON.stringify({params,status:evaluation.status,stale:evaluation.stale,ready})}</pre>;
}
async function evaluateChecks() {
  mount(EvalApp);
  answer(await next('/api/evaluate','initial calculation'),fixtures.evaluate);
  await until(()=>current.ready,'initial ready');
  invoke('params',{...p,ej_ghz:16});
  assert(current.evaluation.stale && !current.ready,'First render after edit disables actions and marks previous result outdated');
  const old=await next('/api/evaluate','old edit request');
  invoke('params',{...p,ej_ghz:17});
  const newest=await next('/api/evaluate','newest edit request');
  assert(old.signal.aborted,'Edit aborts older transport');
  answer(newest,fixtures.evaluate17); await until(()=>current.ready,'newest ready');
  answer(old,fixtures.evaluate16); await pause(); await pause();
  assert(current.evaluation.result.ej_ghz===17,'Late success cannot replace newest result even if transport ignores abort');
  pass('Evaluation disables stale actions in the first edited render, preserves useful old output, and ignores reversed successes.');

  invoke('params',{...p,ej_ghz:16}); const lateFailure=await next('/api/evaluate','late failure request');
  invoke('params',p); const restored=await next('/api/evaluate','restored request');
  answer(restored,fixtures.evaluate); await until(()=>current.ready,'restored ready');
  fail(lateFailure); await pause(); await pause();
  assert(!current.evaluation.error && current.ready,'Late failure cannot disturb current success');
  invoke('retry'); const mismatch=await next('/api/evaluate','mismatched payload');
  answer(mismatch,fixtures.evaluate16); await until(()=>current.evaluation.status==='error','mismatched result rejection');
  assert(current.evaluation.stale && current.evaluation.result.ej_ghz===15 && !current.ready,'Malformed/mismatched response leaves old output explicitly outdated');
  invoke('retry'); answer(await next('/api/evaluate','retry after mismatch'),fixtures.evaluate);
  await until(()=>current.ready,'retry complete');
  pass('Old failures cannot win; mismatched solver payloads are rejected; retry restores a matching completed calculation.');

  invoke('params',{...p,ej_ghz:NaN});
  const prior=requests.length; await until(()=>current.evaluation.status==='error','invalid parameter error');
  assert(requests.length===prior && !current.ready,'Non-finite device inputs never reach solver or actions');
  invoke('params',p); const unmounted=await next('/api/evaluate','unmount request');
  flushSync(()=>root.unmount()); root=undefined as any;
  assert(unmounted.signal.aborted,'Unmount aborts active evaluation');
  answer(unmounted,fixtures.evaluate); await pause();
  pass('Invalid device inputs never issue requests, and evaluation unmount cancels pending transport.');
}
function ExplainApp() {
  const [context,setContext]=useState({params:p,result:fixtures.evaluate,baseline:null,selected:null,stale:false,error:null,goals:g,materials:m,experiments:[]});
  const [topics,setTopics]=useState<any>(['f01','junction','f01']);
  const [open,setOpen]=useState(false);
  const snapshot=useMemo(()=>buildChipSnapshot(context as any),[context]);
  // Duplicate topics exercise hook normalization; the dialog gets unique visible badges.
  const explain=useExplain(snapshot,topics);
  useLayoutEffect(()=>{
    current={context,snapshot,explain,open}; actions={context:(patch:any)=>setContext(c=>({...c,...patch})),topics:setTopics,open:setOpen,ask:explain.ask,duplicate:()=>{explain.ask();explain.ask();},cancel:explain.cancel};
    if(explain.canAsk && (snapshot.readiness!=='ready' || !snapshot.outputs)) renderErrors.push('Explanation was available without current evaluated output.');
  });
  return <><button id="explain-opener" onClick={()=>setOpen(true)}>Open explanation</button><button id="explain-opener-secondary" onClick={()=>setOpen(true)}>Open explanation from another section</button><AskLlm open={open} onOpenChange={setOpen} topics={[...new Set(topics)] as any} snapshot={snapshot} explain={explain} /></>;
}
function openExplanation(id='explain-opener') {
  const button=document.getElementById(id) as HTMLButtonElement;
  assert(button,'Explanation opener exists');
  button.focus();
  assert(document.activeElement===button,'Real opener is focused before synthetic click');
  flushSync(()=>button.click());
}
async function explainChecks(){
  mount(ExplainApp); const start=requests.length;
  openExplanation(); await pause(); await pause();
  assert(document.activeElement?.closest('[role="dialog"]'),'Opening the real dialog moves keyboard focus inside');
  for (let i=0;i<4;i++) {
    await (globalThis as any).qaPressKey('Tab');
    assert(document.activeElement?.closest('[role="dialog"]'),'Real Tab key keeps focus inside the modal');
  }
  assert(requests.length===start,'Opening dialog never automatically calls provider');
  clickText('Ask Gemini about this'); const first=await next('/api/explain','deliberate explanation');
  invoke('duplicate'); await pause();
  assert(requests.filter(r=>r.route==='/api/explain').length===1,'Repeated clicks and same-event calls produce one active request');
  assert(JSON.stringify(first.body.topics)===JSON.stringify(['f01','junction']),'Topics are deduplicated');
  assert(first.body.snapshot.outputs.critical_current_na===fixtures.evaluate.critical_current_na && first.body.snapshot.outputs.total_capacitance_ff===fixtures.evaluate.total_capacitance_ff,'Electrical engineering values reach explain request');
  clickText('Close'); await until(()=>document.activeElement?.id==='explain-opener','Close restores the focused opener');
  assert(!current.open && document.activeElement?.id==='explain-opener','Actual Close returns keyboard focus to the opening control');
  assert(first.signal.aborted,'Closing actual dialog cancels provider transport');
  answer(first,{title:'Obsolete mock',body:'Must never reappear.'}); await pause();
  assert(!current.explain.answer && !current.explain.loading,'Late closed-dialog success cannot reattach');
  openExplanation('explain-opener-secondary'); await pause();
  assert(requests.length===start+1,'Reopening does not automatically retry');
  clickText('Ask Gemini about this'); const escaped=await next('/api/explain','explanation cancelled by Escape');
  await (globalThis as any).qaPressKey('Escape');
  await until(()=>!current.open && document.activeElement?.id==='explain-opener-secondary','Escape restores the new focused opener');
  assert(escaped.signal.aborted,'Escape cancels the active explanation');
  answer(escaped,{title:'Escaped mock',body:'Must never reattach.'});await pause();
  assert(!current.explain.answer && !current.explain.loading,'Late Escape response cannot reattach');
  const afterEscape=requests.length;openExplanation();await pause();
  assert(requests.length===afterEscape,'Reopen after Escape never creates an automatic request');
  clickText('Ask Gemini about this'); const cancelled=await next('/api/explain','explicit Cancel button request');
  clickText('Cancel');
  assert(current.open && !current.explain.loading && cancelled.signal.aborted,'Cancel aborts transport while keeping the actual dialog open');
  answer(cancelled,provider.obsolete); await pause();
  assert(!current.explain.answer,'Late response after explicit Cancel cannot reattach');
  const afterCancel=requests.length; await pause();
  assert(requests.length===afterCancel,'Cancel does not automatically retry');
  pass('Explicit Cancel keeps the dialog open, aborts work, rejects the late answer, and issues no automatic retry.');
  clickText('Ask Gemini about this'); const second=await next('/api/explain','second deliberate request');
  answer(second,provider.success);
  await until(()=>current.explain.answer,'answer shown');
  assert(document.body.textContent?.includes('MOCK response'),'Mock explanation is rendered by real dialog component');
  pass('Actual Gemini dialog restores the focused opener after Close/Escape/reopen, cancels both pending requests, asks deliberately, deduplicates requests/topics, preserves Ic/C, and ignores late responses.');

  const before=requests.length;
  invoke('context',{baseline:fixtures.evaluate16});
  assert(!current.explain.answer,'Baseline-only change invalidates answer in the first render');
  await pause(); assert(requests.length===before,'Baseline updates never create paid request loops');
  clickText('Ask Gemini about this'); const pending=await next('/api/explain','baseline snapshot request');
  invoke('context',{goals:{...g,max_dispersion_khz:1}}); await pause();
  assert(pending.signal.aborted && !current.explain.answer && !current.explain.loading,'Goal edit invalidates pending explanation');
  fail(pending); await pause(); assert(!current.explain.error,'Aborted old failure is ignored');
  invoke('ask'); const failCurrent=await next('/api/explain','failure request');
  answer(failCurrent,provider.unavailable,503);
  await until(()=>current.explain.error,'readable failure');
  clickText('Retry Gemini explanation'); const retry=await next('/api/explain','explicit Retry button');
  answer(retry,provider.retry); await until(()=>current.explain.answer,'retry answer');
  invoke('context',{materials:{...m,topMaterial:'Ta'}});
  assert(!current.explain.answer,'Visual material evidence edits invalidate previous explanation');
  invoke('context',{experiments:[{kind:'tunable',current:true,status:'ready',scope:'Separate tunable model; not applied to the current device.',model:'separate tunable transmon',inputs:{flux:.25,ncut:40},summary:{f01_ghz:fixtures.tunable.f01_ghz}}]});
  invoke('ask'); const experiment=await next('/api/explain','experiment context');
  assert(experiment.body.snapshot.experiments[0].kind==='tunable','Completed separate model evidence included in explicit request');
  invoke('context',{params:{...p,ncut:41},stale:true});
  assert(!current.explain.canAsk && !current.explain.answer,'Cutoff edit immediately removes matching ready context');
  const oldCount=requests.length; invoke('ask'); await pause();
  assert(requests.length===oldCount && experiment.signal.aborted,'Pending calculation cannot issue premature explanation');
  answer(experiment,{title:'Old experiment',body:'Obsolete'}); await pause();
  assert(!current.explain.answer,'Old experiment context cannot reattach');
  pass('Full baseline, goals, materials, experiments, ncut and readiness control explanation freshness; Retry is deliberate and old failures cannot win.');

  invoke('context',{params:p,stale:false}); invoke('ask'); const unmounted=await next('/api/explain','unmount explanation');
  flushSync(()=>root.unmount());root=undefined as any;
  assert(unmounted.signal.aborted,'Explanation unmount aborts pending work');
  answer(unmounted,{title:'Unmounted',body:'Obsolete'});await pause();
  pass('Explanation hook and dialog unmount cancel pending work without a late response restoring state.');
}
function ExperimentApp() {
  const [params,setParams]=useState(p), [goals,setGoals]=useState(g), [materials,setMaterials]=useState(m);
  const session=useExperimentSession(params,goals,materials);
  const [selected,setSelected]=useState<any>(null);
  const onApply=(next:any)=>{applyCalls++;setParams(next);};
  useLayoutEffect(()=>{
    current={params,goals,materials,session}; actions={params:setParams,goals:setGoals,materials:setMaterials,controls:session.setControls,run:session.run,apply:(kind:any)=>{const next=session.getApply(kind);if(next)onApply(next);},controlAndApply:(patch:any)=>{session.setControls(patch);const next=session.getApply('search');if(next)onApply(next);}};
  });
  return <Inspector selected={selected} params={params} result={sameParams(params,p)?fixtures.evaluate as any:null} session={session} onSelect={setSelected} onChange={(key,value)=>setParams(prev=>({...prev,[key]:value}))} onApplyMaterialScenario={onApply} goals={goals} onGoalsChange={setGoals} onMaterialsChange={(topMaterial,baseMaterial)=>setMaterials(prev=>({...prev,topMaterial,baseMaterial}))} materials={materials} selectedTopics={new Set()} onSelectTopic={()=>{}} onClearTopics={()=>{}} onAskLlm={()=>{}} />;
}
async function experimentChecks(){
  mount(ExperimentApp);
  clickText('Try a goal');
  const searchAction=document.querySelector('.design-lab button.full-button') as HTMLButtonElement;
  assert(searchAction?.getAttribute('aria-label')==='Find variables + materials','Search action has an explicit stable accessible name independent of its live status child');
  assert(searchAction.getAttribute('aria-busy')==='false','Idle Search action exposes aria-busy=false');
  invoke('run','search'); const first=await next('/api/search','initial experiment search');
  assert(current.session.search.status==='pending' && !current.session.getApply('search'),'Search pending blocks Apply');
  assert(searchAction.getAttribute('aria-label')==='Find variables + materials' && searchAction.getAttribute('aria-busy')==='true' && searchAction.disabled,'Pending Search retains its accessible name and exposes busy/disabled state');
  assert(!('tolerance_ghz' in first.body) && first.body.ncut===40,'Search keeps exact frequency lock and independent acceptance tolerance');
  answer(first,fixtures.search); await until(()=>current.session.search.current,'completed search current');
  assert(searchAction.getAttribute('aria-busy')==='false' && !searchAction.disabled,'Completed Search clears busy state and re-enables the named action');
  const exact=current.session.getApply('search');
  assert(exact.ng===0 && exact.ncut===40 && exact.ej_ghz===fixtures.search.selected.ej_ghz && exact.ec_ghz===fixtures.search.selected.ec_ghz,'Search Apply preserves exact candidate electrical coordinates including ng/ncut');
  assert(applyCalls===0 && sameParams(current.params,p),'Fresh search never applies automatically');
  clickText('Materials');clickText('Try a goal');
  assert(current.session.search.current && current.session.search.result.selected.ej_ghz===exact.ej_ghz,'Switching actual inspector tabs preserves completed search');
  pass('Actual named Search action exposes idle/pending/completed busy states; page-owned session survives Inspector tabs, never auto-applies, and preserves exact ng=0/ncut=40 Apply inputs.');

  const target=document.querySelector('.goal-primary input[type=number]') as HTMLInputElement;
  assert(target,'Actual numeric goal input exists');
  flushSync(()=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')!.set!.call(target,'');target.dispatchEvent(new Event('input',{bubbles:true}));});
  assert(Number.isNaN(current.goals.target_ghz) && !current.session.getApply('search'),'Blank actual goal input stays invalid rather than becoming zero');
  const findButton=[...document.querySelectorAll('button')].find(el=>el.textContent?.trim()==='Find variables + materials') as HTMLButtonElement;
  assert(findButton.disabled,'Actual Search button disables while goal is blank');
  flushSync(()=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')!.set!.call(target,'5');target.dispatchEvent(new Event('input',{bubbles:true}));});
  assert(current.goals.target_ghz===5,'Valid actual goal edit restores a finite draft');
  pass('The actual goal number input treats blank as invalid and disables search/apply instead of silently accepting zero.');

  invoke('controls',{materialPriority:40});
  assert(!current.session.search.current && !current.session.getApply('search'),'Ranking preference edit invalidates recommendation and Apply');
  invoke('controls',{materialPriority:65});invoke('run','search');
  const old=await next('/api/search','search to supersede');
  invoke('goals',{...g,max_dispersion_khz:1});
  assert(!current.session.search.current && !current.session.getApply('search') && old.signal.aborted,'Goal edit blocks Apply and cancels producing request');
  answer(old,fixtures.search); await pause();
  assert(!current.session.search.current,'Late search after goal edit cannot become current');
  invoke('goals',g);invoke('run','search');answer(await next('/api/search','fresh search retry'),fixtures.search);
  await until(()=>current.session.search.current,'search rerun ready');
  invoke('controlAndApply',{materialPriority:30});
  assert(applyCalls===0,'Same-event preference edit blocks stale Apply before React commits');
  invoke('controls',{materialPriority:65});
  pass('Edited goals and material ranking invalidate search immediately; late search responses and same-event stale Apply are blocked.');

  invoke('run','stress'); const stressOld=await next('/api/stress','stress pending');
  invoke('controls',{variation:8}); assert(stressOld.signal.aborted && !current.session.stress.current,'Variation edit cancels pending stress result');
  fail(stressOld);await pause();assert(!current.session.stress.error,'Late stress failure cannot reattach');
  invoke('controls',{variation:5});invoke('run','stress');
  const stressSuperseded=await next('/api/stress','superseded stress');invoke('run','stress');
  const stressNew=await next('/api/stress','replacement stress');
  answer(stressNew,fixtures.stress);await until(()=>current.session.stress.current,'current stress result');
  answer(stressSuperseded,fixtures.stress);await pause();assert(current.session.stress.current,'Out-of-order stress success cannot replace lifecycle');
  clickText('Materials');clickText('Try a goal');
  assert(current.session.controls.variation===5 && current.session.stress.current,'Stress controls and result survive actual inspector remount');
  invoke('controls',{variation:NaN});const invalidBefore=requests.length;invoke('run','stress');await pause();
  assert(requests.length===invalidBefore && !current.session.stress.current,'Invalid stress values never issue requests');
  invoke('controls',{variation:5});
  pass('Stress results survive tab switches, cancel on control edits, reject invalid controls, and ignore superseded successes and failures.');

  invoke('run','tunable'); const tunable=await next('/api/evaluate-tunable','tunable calculation');
  answer(tunable,fixtures.tunable);await until(()=>current.session.tunable.current,'tunable ready');
  assert(current.session.evidence.find((e:any)=>e.kind==='tunable').scope.includes('Separate'),'Flux evidence identifies a separate model');
  invoke('controls',{flux:.5});
  assert(!current.session.tunable.current && current.session.tunable.result.flux===.25,'Flux edit retains original output but marks it outdated');
  invoke('controls',{flux:.25});invoke('run','tunable');const tunableOld=await next('/api/evaluate-tunable','pending flux');
  invoke('params',{...p,ncut:41});assert(tunableOld.signal.aborted,'Cutoff edit cancels flux request');
  answer(tunableOld,fixtures.tunable);await pause();assert(!current.session.tunable.current,'Late flux response cannot attach to edited cutoff');
  invoke('params',p);
  pass('Flux retains useful outdated output with its separate model scope and never attaches old results after flux or cutoff edits.');

  clickText('Materials');
  const compareAction=document.querySelector('button[aria-label="Compare scenario"]') as HTMLButtonElement;
  assert(compareAction?.getAttribute('aria-label')==='Compare scenario','Compare action has an explicit stable accessible name independent of its live status child');
  assert(compareAction.getAttribute('aria-busy')==='false','Idle Compare action exposes aria-busy=false');
  invoke('run','material');const material=await next('/api/material-scenario','material scenario');
  assert(compareAction.getAttribute('aria-label')==='Compare scenario' && compareAction.getAttribute('aria-busy')==='true' && compareAction.disabled,'Pending Compare retains its accessible name and exposes busy/disabled state');
  answer(material,fixtures.material);await until(()=>current.session.material.current,'material current');
  assert(compareAction.getAttribute('aria-busy')==='false' && !compareAction.disabled,'Completed Compare clears busy state and re-enables the named action');
  const materialExact=current.session.getApply('material');
  assert(materialExact.ng===p.ng && materialExact.ncut===p.ncut && materialExact.ec_ghz===fixtures.material.modified.ec_ghz,'Material Apply includes all exact evaluated inputs');
  clickText('Try a goal');clickText('Materials');
  assert(current.session.material.current && current.session.controls.junctionFactor===.9,'Material scenario controls and result survive actual tabs');
  invoke('run','material');const materialOld=await next('/api/material-scenario','material old');
  invoke('materials',{...m,topMaterial:'Ta'});
  assert(materialOld.signal.aborted && !current.session.getApply('material'),'Visual selection change invalidates material scenario provenance');
  answer(materialOld,fixtures.material);await pause();assert(!current.session.material.current,'Old material response cannot attach to different material labels');
  invoke('materials',m);invoke('controls',{capacitanceFactor:0});const materialBefore=requests.length;invoke('run','material');await pause();
  assert(requests.length===materialBefore && !current.session.getApply('material'),'Out-of-bounds factor never reaches request or Apply');
  pass('Actual named Compare action exposes idle/pending/completed busy states; material comparisons persist across tabs, preserve exact Apply inputs, and reject stale labels and invalid factors.');

  invoke('controls',{capacitanceFactor:1.1});invoke('run','search');answer(await next('/api/search','apply final search'),fixtures.search);
  await until(()=>current.session.search.current,'apply final ready');
  clickText('Try a goal');
  const applyButton=[...document.querySelectorAll('button')].find(el=>el.textContent?.trim()==='Use variables + materials' && !el.disabled) as HTMLButtonElement;
  assert(applyButton,'Actual recommendation Apply button is enabled');flushSync(()=>applyButton.click());
  assert(applyCalls===1 && current.params.ng===0 && current.params.ncut===40 && current.params.ej_ghz===fixtures.search.selected.ej_ghz,'Actual DesignLab button applies exact evaluated candidate once');
  pass('The real DesignLab Apply button applies the recommendation exactly once at its evaluated ng and solver cutoff.');

  invoke('params',p);invoke('run','stress');const unmounted=await next('/api/stress','unmount stress');
  flushSync(()=>root.unmount());root=undefined as any;
  assert(unmounted.signal.aborted,'Session owner unmount cancels pending experiments');
  answer(unmounted,fixtures.stress);await pause();
  pass('Unmounting the owning page session cancels pending experiment transport.');
}

const exportedReports:any[]=[];
async function pageExportChecks(){
  const originalObjectURL=URL.createObjectURL, originalAnchorClick=HTMLAnchorElement.prototype.click;
  const blobs=new Map<string,Blob>();
  URL.createObjectURL=(blob:Blob)=>{const url=originalObjectURL(blob);blobs.set(url,blob);return url;};
  HTMLAnchorElement.prototype.click=function(){
    if(this.download && blobs.has(this.href)) {void blobs.get(this.href)!.text().then(text=>exportedReports.push({filename:this.download,report:JSON.parse(text)})); return;}
    originalAnchorClick.call(this);
  };
  try {
    mount(Page);
    // Exercise the real renderer's public performance setting on CI's software
    // GPU; these journeys time interaction/state correctness, not GPU speed.
    const quality=document.querySelector('button[aria-label="High detail rendering"]');
    assert(quality?.getAttribute('aria-pressed')==='true','Actual Page defaults to high detail');
    const viewOptions=document.querySelector('.view-options summary') as HTMLElement;
    flushSync(()=>viewOptions.click());
    flushSync(()=>quality!.dispatchEvent(new MouseEvent('click',{bubbles:true})));
    flushSync(()=>viewOptions.click());
    assert(quality?.getAttribute('aria-pressed')==='false','Balanced rendering is selected through the actual toolbar');
    const exportedButton=()=>[...document.querySelectorAll('button')].find(el=>el.textContent?.trim()==='Export report') as HTMLButtonElement;
    assert(exportedButton().disabled,'Actual Page disables export before first completed result');
    const initial=await next('/api/evaluate','actual Page initial evaluation');
    assert(sameParams(initial.body,fixtures.default),'Actual Page starts at documented default parameters');
    answer(initial,fixtures.default);await until(()=>!exportedButton().disabled,'Page export enabled');
    // The lazy 3D scene compiles its physical-material shaders on first paint.
    // Wait for real geometry before timing interactions: software WebGL on CI
    // can otherwise start that compilation while a download Blob is being read.
    await until(()=>{
      const viewport=document.querySelector('.hardware-canvas') as HTMLElement | null;
      const canvas=viewport?.querySelector('canvas');
      const bounds=viewport?.dataset.bounds?.split(',').map(Number);
      return canvas && canvas.width>0 && canvas.height>0 && bounds?.length===4
        && bounds.every(Number.isFinite) && bounds[2]>bounds[0] && bounds[3]>bounds[1];
    },'Actual Page 3D geometry is framed',45000);
    const pad=document.querySelector('.layout-scene [data-part=capacitor]') as SVGElement;
    flushSync(()=>pad.dispatchEvent(new MouseEvent('click',{bubbles:true})));
    assert(document.querySelectorAll('.layout-scene [data-part=capacitor].is-selected').length===2,'Both pads share selection');
    clickText('Inspect capacitor pads');
    assert(document.querySelector('.layout-inspection-caption')?.textContent?.includes('Capacitor'),'Layout inspection enters in the action commit without waiting for a GPU frame');
    clickText('Right pad');
    assert(document.querySelector('.layout-inspection-caption')?.textContent?.includes('Capacitor'),'Actual Page opens capacitor inspection');
    clickText('Return to full chip');
    const resultActions=document.querySelector('.results-actions summary') as HTMLElement;
    flushSync(()=>resultActions.click());
    clickText('Pin baseline');
    flushSync(()=>resultActions.click());
    clickText('Design');
    const stressDetails=[...document.querySelectorAll('summary')].find(el=>el.textContent?.trim()==='How robust is this design?');
    assert(stressDetails,'Actual robustness disclosure exists');flushSync(()=>stressDetails!.click());
    clickText('Test robustness');const stress=await next('/api/stress','actual Page stress');
    answer(stress,fixtures.defaultStress);await until(()=>document.body.textContent?.includes('Frequency could be'),'Page stress displayed');
    flushSync(()=>resultActions.click());
    clickText('Export report');await until(()=>exportedReports.length===1,'first actual download Blob captured',15000);
    const first=exportedReports[0].report;
    assert(sameParams(first.parameters,fixtures.default) && sameParams(first.result,fixtures.default),'Exported JSON parameters match exact producing result');
    assert(sameParams(first.pinned_baseline,fixtures.default),'Export includes frozen baseline coordinates');
    assert(first.experiments.length===1 && first.experiments[0].kind==='stress' && first.experiments[0].current===true,'Actual Page export includes fresh completed experiment provenance');
    clickText('Explore');
    const preset=document.querySelector('.device-menu select') as HTMLSelectElement;
    flushSync(()=>{preset.value='reference';preset.dispatchEvent(new Event('change',{bubbles:true}));});
    assert(exportedButton().disabled,'Actual export button disables in first pending edited frame');
    clickText('Export report');await pause();assert(exportedReports.length===1,'Disabled stale export emits no download');
    const reference=await next('/api/evaluate','actual Page reference calculation');
    answer(reference,fixtures.reference);await until(()=>!exportedButton().disabled,'reference completed');
    for(const label of ['More detail','Choose and compare materials']) {
      const disclosure=[...document.querySelectorAll('summary')].find(el=>el.textContent?.trim()===label);
      assert(disclosure,`Actual ${label} disclosure exists`);flushSync(()=>disclosure!.click());
    }
    const top=document.querySelector('.sandbox-pickers select') as HTMLSelectElement;
    assert(top,'Actual material picker exists');flushSync(()=>{top.value='Ta';top.dispatchEvent(new Event('change',{bubbles:true}));});
    clickText('Export report');await until(()=>exportedReports.length===2,'second actual download Blob captured',15000);
    const second=exportedReports[1].report;
    assert(sameParams(second.parameters,fixtures.reference) && sameParams(second.result,fixtures.reference),'Edited export uses completed current inputs and result');
    assert(JSON.stringify(second.pinned_baseline)===JSON.stringify(first.pinned_baseline),'Exported baseline remains byte-for-byte frozen after editing');
    assert(second.experiments[0].current===false && second.experiments[0].inputs.params_ncut===30 && second.parameters.ncut===31,'Old experiment is labeled outdated and retains its producing cutoff');
    assert(second.selected_materials.top_material==='Ta' && second.selected_materials.scope.includes('not electrical solver inputs'),'Selected visual materials export separately without fabricating solver effects');
    pass('Actual Page Export report clicks create coherent JSON downloads, freeze the baseline, disable stale exports immediately, retain old experiment provenance, and separate visual materials from solver physics.');
  } finally {
    URL.createObjectURL=originalObjectURL;HTMLAnchorElement.prototype.click=originalAnchorClick;
    if(root){flushSync(()=>root.unmount());root=undefined as any;}
  }
}

void evaluateChecks().then(explainChecks).then(experimentChecks).then(pageExportChecks).then(()=>{
  assert(renderErrors.length===0,'All rendered current identities remained coherent');
  assert(checks.length===EXPECTED_JOURNEYS, `Expected ${EXPECTED_JOURNEYS} journeys; executed ${checks.length}`);
  document.getElementById('report')!.textContent=JSON.stringify({status:'passed',checks,applyCalls,renderErrors,exportedReports,
    network:Object.fromEntries([...new Set(requests.map(r=>r.route))].map(route=>[route,requests.filter(r=>r.route===route).length])),
    renderQuality:'Balanced selected through the actual Page toolbar for software WebGL; high detail remains the production default.',
    runtime:'Locked React/ReactDOM in StrictMode; real repository Page, hooks, Inspector, DesignLab, MaterialSensitivity and AskLlm; isolated Playwright Chromium.',
    evidence:'Numerical responses were produced by the fixture-generating Python engine (see fixtures/provenance.json). Transport timing, failures and Gemini responses were controlled fixtures. No live provider calls.'},null,2);
}).catch(error=>{
  document.getElementById('report')!.textContent=JSON.stringify({status:'FAILED',error:error.stack,checks,applyCalls,renderErrors,
    current:current&&{params:current.params,goals:current.goals,session:current.session&&{search:current.session.search.status,stress:current.session.stress.status,tunable:current.session.tunable.status,material:current.session.material.status,error:current.session.material.error}},
    requests:requests.map(({route,body,signal,answered})=>({route,body,answered,aborted:signal.aborted}))},null,2);
});
