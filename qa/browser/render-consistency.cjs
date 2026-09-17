// Against a running local UI: node qa/browser/render-consistency.cjs http://127.0.0.1:3126
// Owns a disposable browser; no existing browser profile or saved device is changed.
const {createRequire}=require('node:module');
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const requireUI=createRequire(path.resolve(__dirname,'../../ui/package.json'));
const {chromium}=requireUI('playwright');
const output=path.resolve(__dirname,'../../test-results/render-consistency');
fs.mkdirSync(output,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:1640,height:1100},deviceScaleFactor:1});
 const errors=[],checks=[];
 page.on('pageerror',error=>errors.push(error.message));
 const check=(name)=>{checks.push(name);console.log('PASS',name);};
 const shot=async name=>{await page.waitForTimeout(700);await page.screenshot({path:path.join(output,name+'.png')});};
 const scene=page.locator('.layout-scene');
 const select=async(part)=>{const node=scene.locator(`[data-part="${part}"]`).first();await node.focus();await node.press('Enter');await page.waitForFunction(p=>document.querySelector('.hardware-canvas')?.dataset.selected===p,part);};
 const toggle=async(name,value)=>{await page.locator('.view-options summary').click();await page.getByRole('checkbox',{name,exact:true}).setChecked(value);await page.locator('.view-options summary').click();};
 const labelsClear=async()=>{
  const rects=await page.locator('.layout-annotations button').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height,text:n.textContent};}));
  assert.ok(rects.length>0,'Annotations remain available');
  for(let i=0;i<rects.length;i++)for(let j=i+1;j<rects.length;j++){
   const a=rects[i],b=rects[j];assert.ok(!(a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y),`Overlapping callouts: ${a.text} / ${b.text}`);
  }
 };
 try{
  await page.goto(process.argv[2]||'http://127.0.0.1:3126');
  await page.getByRole('button',{name:'Split view',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('.hardware-canvas')?.dataset.bounds);
  await page.waitForTimeout(1800);
  await select('capacitor');await labelsClear();await shot('01-full-chip');check('Full chip with linked capacitor selection');
  const die=await scene.locator('[data-part="substrate"] .part-outline').boundingBox();assert.ok(Math.abs(die.width-die.height)<1,'Die top projection must be square');
  assert.equal(await scene.locator('[data-detail="bond-contacts"] ellipse').count(),368);check('Undistorted die and all 184 shared bonds with attachment feet');
  await page.getByRole('button',{name:'Inspect capacitor pads',exact:true}).click();await labelsClear();await shot('02-capacitor');
  await page.getByRole('button',{name:'Right pad',exact:true}).click();await labelsClear();await shot('03-right-pad');
  const stateBefore=await scene.getAttribute('viewBox');
  await page.getByRole('button',{name:'Zoom in',exact:true}).click();assert.notEqual(await scene.getAttribute('viewBox'),stateBefore);
  await page.getByRole('button',{name:'Pan layout',exact:true}).click();const box=await page.locator('.layout-drawing').boundingBox();
  const beforePan=await scene.getAttribute('viewBox');await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width/2+45,box.y+box.height/2+20,{steps:5});await page.mouse.up();assert.notEqual(await scene.getAttribute('viewBox'),beforePan);
  await page.getByRole('button',{name:'Select parts',exact:true}).click();check('Both-pad / individual-pad inspection, zoom and pan');
  await select('junction');await labelsClear();await shot('04-junction');
  assert.equal(await scene.locator('[data-part="junction"]').evaluate(n=>getComputedStyle(n).filter),'none','Keyboard focus must preserve sharp junction edges');
  assert.equal(await scene.locator('[data-detail="junction-overlap"] polygon').count(),2);check('Junction inspection uses two overlapping electrode contours');
  await toggle('Ground plane',false);
  assert.equal(await page.locator('.layout-artwork [data-part="ground"]').count(),0);
  assert.equal(await page.locator('.layout-artwork [data-detail="bond-contacts"]').count(),0);
  await shot('05-hidden-ground');check('Hidden ground removes metal, fanouts and bonds from layout and locator');
  await toggle('Ground plane',true);
  await page.getByRole('tab',{name:'Appearance',exact:true}).click();
  await page.getByRole('button',{name:'Use Niobium for Josephson junction',exact:true}).click();
  assert.equal(await scene.locator('[data-part="junction"]').getAttribute('data-material'),'Nb');
  assert.equal(await page.locator('.layout-locator [data-part="junction"]').getAttribute('data-material'),'Nb');
  await page.locator('.assembly-menu summary').click();
  await page.getByRole('button',{name:'Exploded',exact:true}).click();
  await page.waitForTimeout(2400);
  assert.ok((await page.getByRole('group',{name:'Exploded component materials'}).getByRole('button',{name:/Junction/}).innerText()).includes('Nb'));
  await page.getByRole('group',{name:'Exploded component materials'}).getByRole('button',{name:/Pads/}).click();
  assert.equal(await scene.locator('[data-part="capacitor"]').first().getAttribute('aria-pressed'),'true');check('Material changes and selection propagate through hardware controls, layout and locator');
  await page.locator('.assembly-menu summary').click();
  await page.getByRole('button',{name:'Assembled',exact:true}).click();
  await page.getByRole('button',{name:'Fit whole chip',exact:true}).click();
  await page.setViewportSize({width:1260,height:1000});
  const divider=page.getByRole('separator',{name:'Resize 3D and Layout panes'});await divider.focus();await divider.press('ArrowRight');await divider.press('ArrowRight');await divider.press('ArrowRight');
  await labelsClear();await shot('06-narrow-split');
  assert.ok((await page.locator('.layout-drawing').boundingBox()).width<400);
  await select('junction');await page.getByRole('button',{name:'Inspect junction',exact:true}).click();await labelsClear();await shot('07-narrow-junction');check('Narrow split at 65/35 retains collision-free inspection labels');
  await page.setViewportSize({width:880,height:1350});await labelsClear();await shot('08-stacked-junction');check('Stacked split remains usable with readable labels');
  await page.setViewportSize({width:1640,height:1100});
  await page.getByRole('button',{name:'Fit whole chip',exact:true}).click();
  // Restore the two non-default materials in the supplied visual reference, in this disposable profile.
  await page.evaluate(()=>{const key='qubit-studio.component-materials.v1';const value=JSON.stringify({package:'LaAlO3',board:'Cr',substrate:'Si',ground:'Al',capacitor:'Al',junction:'Al',gate:'Al'});localStorage.setItem(key,value);window.dispatchEvent(new StorageEvent('storage',{key,newValue:value}));});
  await divider.focus();await divider.press('ArrowLeft');await divider.press('ArrowLeft');await divider.press('ArrowLeft');
  await select('capacitor');await shot('09-reference-materials');
  assert.equal(await scene.locator('[data-part="package"]').getAttribute('data-material'),'LaAlO3');assert.equal(await scene.locator('[data-part="board"]').getAttribute('data-material'),'Cr');check('Reference package and carrier materials propagate to layout');
  const modelSnapshot=()=>page.evaluate(()=>({
   materials:localStorage.getItem('qubit-studio.component-materials.v1'),
   inputs:[...document.querySelectorAll('input')].map(n=>[n.id,n.value]),
   parts:[...document.querySelectorAll('.layout-scene [data-part]')].map(n=>[n.getAttribute('data-part'),n.getAttribute('data-material'),n.getAttribute('aria-pressed')]),
   geometry:[...document.querySelectorAll('.layout-scene .part-outline')].map(n=>['d','points','x','y','width','height','transform'].map(a=>n.getAttribute(a))),
   camera:document.querySelector('.layout-scene').getAttribute('viewBox'),
  }));
  const materialState=await modelSnapshot();
  await page.getByRole('button',{name:'Use layer colors',exact:true}).click();
  await labelsClear();await shot('12-layer-colors');
  assert.equal(await scene.locator('.uses-layer-colors').count(),1);
  assert.deepEqual(await modelSnapshot(),materialState);
  await page.getByRole('button',{name:'Use layer colors',exact:true}).click();
  assert.equal(await scene.locator('.uses-layer-colors').count(),0);
  check('Layer palette is reversible and preserves materials, inputs, selection, geometry and camera');
  await toggle('Package & clamps',false);await toggle('Carrier board',false);
  await page.locator('.view-options summary').click();
  await page.getByRole('button',{name:'Reset 3D view',exact:true}).click();
  await page.locator('.view-options summary').click();
  await page.getByRole('button',{name:'Inspect capacitor pads',exact:true}).click();await shot('10-die-and-pads');
  await select('junction');await shot('11-die-and-junction');check('Both views at die scale with package and carrier hidden');
  await page.getByRole('button',{name:'Use layer colors',exact:true}).click();
  assert.equal(await page.locator('.layout-locator .uses-layer-colors').count(),1);
  await labelsClear();await shot('13-layer-junction');
  await page.getByRole('button',{name:'Use layer colors',exact:true}).click();
  check('Layer colors remain synchronized with the close-inspection locator');
  for(const name of ['Substrate','Ground plane','Shunt capacitor pads','Josephson junction','Charge gate line'])await toggle(name,false);
  assert.equal(await page.locator('.layout-artwork [data-part]').count(),0);
  await page.waitForFunction(()=>!document.querySelector('.hardware-canvas')?.dataset.bounds);check('Hide all clears both renderers and locator');
  assert.equal(errors.length,0,errors.join('\n'));
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({status:'passed',checks,pageErrors:errors,browser:browser.version()},null,2));
 }catch(error){await shot('failure');fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({status:'failed',checks,pageErrors:errors,error:error.stack},null,2));throw error;}
 finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
