// Traverse both retained learning experiences against a running integrated UI.
const {chromium}=require('../../ui/node_modules/playwright');
const ts=require('../../ui/node_modules/typescript');
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const fixture=require('./fixtures/solver.json');
const readModule=name=>{const exports={};new Function('exports',ts.transpileModule(fs.readFileSync(path.resolve(__dirname,'../../ui/lib',name),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(exports);return exports;};
const {FULL_TOUR_STEPS}=readModule('full-guided-tour.ts');
const {TOUR_STEPS}=readModule('guided-tour.ts');
const {TOUR_TARGETS}=readModule('tour-targets.ts');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/api/evaluate',route=>route.fulfill({json:fixture.default}));
  await page.goto(process.env.QUBIT_UI_URL||'http://127.0.0.1:3117');
  await page.getByRole('button',{name:'Ask Myla',exact:true}).waitFor();
  await page.locator('.view-options summary').click();
  const quality=page.getByRole('button',{name:'High detail rendering',exact:true});
  if(await quality.getAttribute('aria-pressed')==='true')await quality.click();
  await page.locator('.view-options summary').click();
  const allFailures=[];
  for(const [name,steps] of [['Guided tour',TOUR_STEPS],['Full feature tour',FULL_TOUR_STEPS]]){
   await page.locator('.learning-menu>summary').filter({hasText:/^Learn$/}).click();
   await page.getByRole('button',{name,exact:true}).click();
   const dialog=page.getByRole('dialog',{name:'Guided learning',exact:true});
   const failures=[];
   for(let index=0;index<steps.length;index++){
    await page.waitForFunction(({index,length})=>document.querySelector('.tour-progress')?.textContent?.trim()===`${index+1} / ${length}`,{index,length:steps.length});
    const step=steps[index];
    const target=await page.evaluate(({target,mapped})=>{
     const node=document.querySelector(`[data-tour="${target}"]`)??(mapped?document.querySelector(mapped):null);
     const rect=node?.getBoundingClientRect();
     return {found:!!node,visible:!!rect&&rect.width>0&&rect.height>0,selector:mapped,target};
    },{target:step.target,mapped:TOUR_TARGETS[step.target]});
    if(!target.found||!target.visible)failures.push({step:step.id,...target});
    if(index===steps.length-1)await dialog.getByRole('button',{name:'Finish',exact:true}).click();
    else await dialog.getByRole('button',{name:'Next',exact:true}).click({force:true});
   }
   allFailures.push(...failures.map(failure=>({tour:name,...failure})));
   if(failures.length)console.log('TARGET FAILURES',JSON.stringify(failures));
   assert.equal(await dialog.count(),0);
   if(!failures.length)console.log(`PASS ${name}: all ${steps.length} targets visible, completion closes dialog`);
  }
  assert.deepEqual(allFailures,[],'Every tour step has a visible target');
  assert.deepEqual(errors,[],'No runtime errors during tours');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
