// Against a running local UI: node qa/browser/inspection-controls.cjs http://127.0.0.1:3126
// Owns a disposable browser/profile. Run after, not alongside, other browser suites.
const {createRequire}=require('node:module');
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const requireUI=createRequire(path.resolve(__dirname,'../../ui/package.json'));
const {chromium}=requireUI('playwright');
const output=path.resolve(__dirname,'../../test-results/inspection-controls');
fs.mkdirSync(output,{recursive:true});
const names={package:'Package',board:'Carrier',substrate:'Substrate',ground:'Ground',capacitor:'Pads',junction:'Junction',gate:'Gate'};
(async()=>{
 const browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:1640,height:1100},deviceScaleFactor:1});
 page.setDefaultTimeout(20000);
 const errors=[],checks=[];
 page.on('pageerror',error=>errors.push(error.message));
 const check=name=>{checks.push(name);console.log('PASS',name);};
 const shot=async name=>{await page.waitForTimeout(600);await page.screenshot({path:path.join(output,name+'.png')});};
 const scene=page.locator('.layout-scene');
 const hardware=page.locator('.hardware-canvas');
 const select=async part=>{
  const node=scene.locator(`[data-part="${part}"]`).first();await node.focus();await node.press('Enter');
  await page.waitForFunction(p=>document.querySelector('.hardware-canvas')?.dataset.selected===p,part);
 };
 const panel=async open=>{
  const trigger=page.getByRole('button',{name:'Layer display controls',exact:true});
  const note=page.locator('.myla-pop[role="dialog"]');
  const [noteBox,triggerBox]=await Promise.all([note.boundingBox(),trigger.boundingBox()]);
  if(noteBox&&triggerBox&&noteBox.x<triggerBox.x+triggerBox.width&&noteBox.x+noteBox.width>triggerBox.x&&noteBox.y<triggerBox.y+triggerBox.height&&noteBox.y+noteBox.height>triggerBox.y){
   await note.getByRole('button',{name:'Close Myla',exact:true}).click();
  }
  const current=await page.getByRole('combobox',{name:'Ground display',exact:true}).isVisible();
  if(current!==open)await trigger.click();
 };
 const display=async(part,mode)=>{
  await panel(true);await page.getByRole('combobox',{name:`${names[part]} display`,exact:true}).selectOption(mode);await panel(false);
 };
 const visible=async(part,value)=>{
  await panel(true);await page.getByRole('checkbox',{name:`${names[part]} visible`,exact:true}).setChecked(value);await panel(false);
 };
 const hidden3d=async()=>((await hardware.getAttribute('data-hidden-parts'))||'').split(',').filter(Boolean).sort();
 const visibleLayout=async()=>scene.locator('[data-part]').evaluateAll(nodes=>[...new Set(nodes.map(n=>n.getAttribute('data-part')))].sort());
 const physicalState=()=>page.evaluate(()=>({
  materials:localStorage.getItem('qubit-studio.component-materials.v1'),
  inputs:[...document.querySelectorAll('input[id^="p-"]')].map(n=>[n.id,n.value]),
  assignments:[...document.querySelectorAll('.layout-scene [data-part]')].map(n=>[n.getAttribute('data-part'),n.getAttribute('data-material')]),
 }));
 const viewSnapshot=async()=>{
  await panel(true);
  const modes={},visibleParts={};
  for(const [part,name] of Object.entries(names)){
   modes[part]=await page.getByRole('combobox',{name:`${name} display`,exact:true}).inputValue();
   visibleParts[part]=await page.getByRole('checkbox',{name:`${name} visible`,exact:true}).isChecked();
  }
  await panel(false);
  return {modes,visibleParts,camera:await scene.getAttribute('viewBox'),selected:await hardware.getAttribute('data-selected'),palette:await page.getByRole('button',{name:'Use layer colors',exact:true}).getAttribute('aria-pressed')};
 };
 const labelsClear=async()=>{
  const drawing=await page.locator('.layout-drawing').boundingBox();
  const rects=await page.locator('.layout-annotations button').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height,text:n.textContent};}));
  assert.ok(rects.length>0,'At least one inspection label remains available');
  for(let i=0;i<rects.length;i++){
   const a=rects[i];assert.ok(a.x>=drawing.x-1&&a.x+a.w<=drawing.x+drawing.width+1,`Callout outside pane: ${a.text}`);
   for(let j=i+1;j<rects.length;j++){const b=rects[j];assert.ok(!(a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y),`Overlapping labels: ${a.text} / ${b.text}`);}
  }
 };
 try{
  await page.goto(process.argv[2]||'http://127.0.0.1:3126');
  await page.getByRole('button',{name:'Split view',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('.hardware-canvas')?.dataset.bounds);
  await select('junction');
  const initial=await physicalState();
  await display('ground','translucent');
  await display('capacitor','outline');
  await display('junction','outline');
  for(const [part,mode] of [['ground','translucent'],['capacitor','outline'],['junction','outline']]){
   assert.ok(await scene.locator(`[data-part="${part}"]`).count());
   assert.equal(await scene.locator(`[data-part="${part}"]`).first().getAttribute('data-display'),mode);
  }
  assert.equal(await scene.locator('[data-part="ground"] .part-outline.layer-fill').first().evaluate(n=>getComputedStyle(n).fillOpacity),'0.24');
  for(const part of ['capacitor','junction'])assert.equal(await scene.locator(`[data-part="${part}"] .part-outline.layer-fill`).first().evaluate(n=>getComputedStyle(n).fill),'none','Outline mode removes actual physical fill while preserving the contour');
  assert.deepEqual(await physicalState(),initial,'Layer rendering must preserve physical material assignments and model inputs');
  await scene.locator('[data-part="capacitor"][data-side="left"] .part-outline').click();
  await page.waitForFunction(()=>document.querySelector('.hardware-canvas')?.dataset.selected==='capacitor');
  await select('junction');
  await labelsClear();await shot('01-layer-display-modes');
  check('Per-layer translucent/outline display preserves component materials, inputs and selectable geometry');
  await display('junction','solid');
  await display('capacitor','solid');
  await visible('package',false);await visible('gate',false);
  assert.deepEqual(await hidden3d(),['gate','package']);
  assert.equal(await scene.locator('[data-part="package"], [data-part="gate"]').count(),0);
  check('Compact layer visibility controls affect both renderers');
  await page.getByRole('button',{name:'Zoom in',exact:true}).click();
  const beforeFocus=await viewSnapshot();
  const before3dDistance=Number(await hardware.getAttribute('data-camera-distance'));
  await page.getByRole('button',{name:'Focus selected component',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('.hardware-canvas')?.dataset.hiddenParts?.split(',').length===6);
  assert.deepEqual(await visibleLayout(),['junction']);
  assert.deepEqual(await hidden3d(),Object.keys(names).filter(n=>n!=='junction').sort());
  assert.notEqual(await scene.getAttribute('viewBox'),beforeFocus.camera);
  await page.waitForFunction(()=>Number(document.querySelector('.hardware-canvas')?.dataset.cameraDistance)<1);
  assert.ok(Number(await hardware.getAttribute('data-camera-near'))<.01,'Isolated 3D junction uses a close near plane');
  await shot('02-isolated-junction');
  await page.getByRole('button',{name:'Restore previous view',exact:true}).click();
  assert.deepEqual(await viewSnapshot(),beforeFocus,'Restoring focus must recover previous camera, visibility, display and selection');
  await page.waitForFunction(distance=>Math.abs(Number(document.querySelector('.hardware-canvas')?.dataset.cameraDistance)-distance)<.01,before3dDistance);
  check('Temporary junction focus enlarges both views and restores the prior cameras and hidden components');
  await visible('ground',false);
  const beforeChangingFocus=await viewSnapshot();
  await page.getByRole('button',{name:'Focus selected component',exact:true}).click();
  await panel(true);await page.locator('.layout-display-panel').getByRole('button',{name:/^Ground/}).click();await panel(false);
  await page.waitForFunction(()=>document.querySelector('.hardware-canvas')?.dataset.selected==='ground');
  assert.deepEqual(await visibleLayout(),['ground']);
  await page.getByRole('button',{name:'Restore previous view',exact:true}).click();
  assert.deepEqual(await viewSnapshot(),beforeChangingFocus,'Selecting a previously hidden part while focused must not change restored selection or visibility');
  await visible('ground',true);
  check('Changing the isolated selection restores a previously hidden component and the original selection correctly');
  await page.getByRole('button',{name:'Inspect junction',exact:true}).click();
  await page.getByRole('button',{name:'Use layer colors',exact:true}).click();
  const savedState=await viewSnapshot();
  await panel(true);
  await page.getByRole('textbox',{name:'Inspection view name',exact:true}).fill('Junction review');
  await page.getByRole('button',{name:'Save current view',exact:true}).click();
  await panel(false);
  await display('ground','outline');await visible('gate',true);
  await page.getByRole('button',{name:'Fit whole chip',exact:true}).click();await select('capacitor');
  await page.getByRole('button',{name:'Use layer colors',exact:true}).click();
  await panel(true);
  await page.getByRole('combobox',{name:'Saved inspection views',exact:true}).selectOption({label:'Junction review'});
  await panel(false);
  assert.deepEqual(await viewSnapshot(),savedState,'Saved view must restore camera, palette, layers, hidden state and selected component');
  assert.equal(await page.locator('.layout-locator [data-part="ground"]').getAttribute('data-display'),'translucent');
  await labelsClear();await shot('03-restored-inspection-view');
  check('Named inspection views restore display, camera and selection; locator shares layer treatments');
  await visible('junction',false);
  const hiddenSelection=await viewSnapshot();
  await panel(true);await page.getByRole('textbox',{name:'Inspection view name',exact:true}).fill('Hidden junction');await page.getByRole('button',{name:'Save current view',exact:true}).click();await panel(false);
  await visible('junction',true);await select('capacitor');
  await panel(true);await page.getByRole('combobox',{name:'Saved inspection views',exact:true}).selectOption({label:'Hidden junction'});await panel(false);
  assert.deepEqual(await viewSnapshot(),hiddenSelection,'Restoring a hidden selected part must preserve its hidden state');
  assert.equal(await scene.locator('[data-part="junction"]').count(),0);
  await panel(true);await page.getByRole('combobox',{name:'Saved inspection views',exact:true}).selectOption({label:'Junction review'});await panel(false);
  check('Saved views preserve a selected component that is intentionally hidden');
  await page.getByRole('button',{name:'Fit whole chip',exact:true}).click();await hardware.click({position:{x:8,y:8}});
  await page.waitForFunction(()=>document.querySelector('.hardware-canvas')?.dataset.selected==='');
  const unselectedView=await viewSnapshot();
  await panel(true);await page.getByRole('textbox',{name:'Inspection view name',exact:true}).fill('Unselected overview');await page.getByRole('button',{name:'Save current view',exact:true}).click();await panel(false);
  await select('junction');
  await panel(true);await page.getByRole('combobox',{name:'Saved inspection views',exact:true}).selectOption({label:'Unselected overview'});await panel(false);
  assert.deepEqual(await viewSnapshot(),unselectedView,'Saved views preserve no selected component');
  await panel(true);await page.getByRole('combobox',{name:'Saved inspection views',exact:true}).selectOption({label:'Junction review'});await panel(false);
  check('Saved views restore an explicitly cleared selection');
  const zoomIn=page.getByRole('button',{name:'Zoom in',exact:true});
  for(let i=0;i<30&&!await zoomIn.isDisabled();i++)await zoomIn.click();
  assert.equal(await page.locator('output[aria-label="Layout zoom"]').innerText(),'2400%');
  assert.ok(await zoomIn.isDisabled(),'Zoom-in control disables at 24×');
  const atMax=await scene.getAttribute('viewBox');
  const box=await page.locator('.layout-drawing').boundingBox();
  await page.mouse.move(box.x+box.width*.66,box.y+box.height*.6);await page.mouse.wheel(0,250);await page.waitForTimeout(180);
  assert.notEqual(await scene.getAttribute('viewBox'),atMax,'Wheel zoom remains available beyond the former 6× cap');
  await page.getByRole('button',{name:'Pan layout',exact:true}).click();
  const beforePan=await scene.getAttribute('viewBox');
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width/2+42,box.y+box.height/2+25,{steps:5});await page.mouse.up();
  assert.notEqual(await scene.getAttribute('viewBox'),beforePan,'High-magnification pan moves the inspection camera');
  await page.getByRole('button',{name:'Select parts',exact:true}).click();
  await shot('04-high-magnification-junction');
  check('24× zoom limit, wheel zoom and pan work at close component inspection scale');
  await page.setViewportSize({width:1260,height:1000});
  const divider=page.getByRole('separator',{name:'Resize 3D and Layout panes'});
  await divider.focus();for(let i=0;i<3;i++)await divider.press('ArrowRight');
  await page.getByRole('button',{name:'Fit whole chip',exact:true}).click();
  await select('junction');await page.getByRole('button',{name:'Inspect junction',exact:true}).click();
  await labelsClear();await panel(true);
  const formRects=await page.getByRole('combobox',{name:/ display$/}).evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return {x:r.x,right:r.right};}));
  assert.ok(formRects.every(r=>r.x>=0&&r.right<=1260),'Layer controls remain on screen in a narrow split');
  await shot('05-narrow-layer-controls');
  const beforeEscape=await scene.getAttribute('viewBox');
  await page.getByRole('combobox',{name:'Ground display',exact:true}).press('Escape');
  assert.equal(await page.getByRole('button',{name:'Layer display controls',exact:true}).getAttribute('aria-expanded'),'false');
  assert.equal(await scene.getAttribute('viewBox'),beforeEscape,'Escape closes the layer panel without abandoning component inspection');
  await labelsClear();
  const junctionBodies=await scene.locator('[data-part="junction"] .part-outline').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height};}));
  const narrowLabels=await page.locator('.layout-annotations button').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height,text:n.textContent};}));
  for(const label of narrowLabels)for(const body of junctionBodies)assert.ok(!(label.x<body.x+body.w&&label.x+label.w>body.x&&label.y<body.y+body.h&&label.y+label.h>body.y),`Callout obscures selected junction: ${label.text}`);
  await shot('06-narrow-junction');
  check('Narrow split keeps layer controls on screen and component callouts collision-free');
  await page.setViewportSize({width:880,height:1350});
  await labelsClear();await shot('07-stacked-junction');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+1),false,'No horizontal page overflow in stacked split');
  check('Stacked split preserves close inspection without horizontal overflow');
  await page.setViewportSize({width:1640,height:1100});
  await display('ground','solid');await visible('package',true);await visible('gate',true);
  await page.getByRole('button',{name:'Fit whole chip',exact:true}).click();
  assert.deepEqual(await physicalState(),initial,'Viewer operations leave physical materials and model inputs unchanged');
  assert.equal(errors.length,0,errors.join('\n'));
  check('Inspection controls leave solver inputs and material assignments unchanged and emit no page errors');
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({status:'passed',checks,pageErrors:errors,browser:browser.version()},null,2));
 }catch(error){await shot('failure');fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({status:'failed',checks,pageErrors:errors,error:error.stack},null,2));throw error;}
 finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
