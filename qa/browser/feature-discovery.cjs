const { chromium } = require('../../ui/node_modules/playwright');
const assert = require('node:assert/strict');
const fixture = require('./fixtures/solver.json');
(async () => {
 const browser = await chromium.launch({headless:true});
 try {
 const page = await browser.newPage({viewport:{width:1440,height:900}});
 const waitForFraming=()=>page.waitForFunction(()=>{
   const viewport=document.querySelector('.hardware-canvas');
   const bounds=viewport?.dataset.bounds?.split(',').map(Number);
   return bounds?.length===4 && bounds.every(Number.isFinite) && bounds[0]>=-1 && bounds[1]>=-1 && bounds[2]<=viewport.clientWidth+1 && bounds[3]<=viewport.clientHeight+1;
 },null,{timeout:45000});
 let aiRequests=0;
 await page.route('**/api/evaluate', route=>route.fulfill({json:fixture.default}));
 await page.route('**/api/explain', route=>{aiRequests++;return route.abort();});
 await page.goto(process.env.QUBIT_UI_URL || 'http://localhost:3190');
 await page.getByRole('button',{name:'Ask Myla',exact:true}).first().waitFor();
 await page.waitForFunction(()=>document.querySelector('.hardware-canvas')?.dataset.bounds && !document.querySelector('.layout-results-toolbar button')?.disabled);
 await page.evaluate(()=>document.fonts.ready);
 for(const selector of ['.wave-brand','.layout-editor h1','.layout-primary-field .num','.layout-result-value']) {
   assert.match(await page.locator(selector).first().evaluate(node=>getComputedStyle(node).fontFamily),/Instrument Sans/,'Instrument Sans is applied to '+selector);
 }
 assert.equal(await page.evaluate(()=>document.fonts.check('400 14px "Instrument Sans"')),true,'Self-hosted font loaded');
 await page.screenshot({path:'/tmp/discovery-desktop.png'});
 await page.getByRole('tab',{name:'Model',exact:true}).focus();
 await page.keyboard.press('ArrowRight');
 assert.equal(await page.getByRole('tab',{name:'Appearance',exact:true}).getAttribute('aria-selected'),'true');
 assert.equal(await page.locator('#inspector-panel-model').isVisible(),false);
 assert.equal(await page.locator('.component-material-picker').isVisible(),true);
 await page.screenshot({path:'/tmp/discovery-appearance.png'});
 await page.keyboard.press('ArrowRight');
 assert.equal(await page.getByRole('button',{name:'Apply estimated energies',exact:true}).isVisible(),true);
 await page.screenshot({path:'/tmp/discovery-geometry.png'});
 await page.getByRole('tab',{name:'Model',exact:true}).click();
 await page.locator('.results-actions>summary').click();
 await page.getByRole('button',{name:'Pin baseline',exact:true}).click();
 assert.equal(await page.locator('.layout-result-comparison').count(),3);
 await page.locator('.results-actions>summary').click();
 await page.getByRole('button',{name:'Ask Myla',exact:true}).first().click();
 await page.getByRole('dialog').waitFor();
 assert.ok((await page.getByRole('dialog').locator('.ask-answer').first().innerText()).length>40,'Local notes should be visible immediately');
 assert.match(await page.getByRole('dialog').innerText(),/Myla/);
 assert.equal(aiRequests,0,'Opening Myla must not send an AI request');
 await page.keyboard.press('Escape');
 await page.getByRole('button',{name:'Details & compare',exact:true}).click();
 assert.equal(await page.locator('.results-technical').getAttribute('open'),'');
 await page.locator('[data-tour="chart-levels"]').scrollIntoViewIfNeeded();
 await waitForFraming();
 await page.screenshot({path:'/tmp/discovery-graphs.png'});
 await page.getByRole('button',{name:'Hide graphs & details',exact:true}).click();
 await page.getByRole('button',{name:'Split view',exact:true}).click();
 assert.equal(await page.getByRole('region',{name:'Planar layout pane'}).isVisible(),true);
 await page.locator('.assembly-menu>summary').click();
 await page.getByRole('button',{name:'Exploded',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('.hardware-canvas')?.dataset.explode==='1');
 await waitForFraming();
 await page.screenshot({path:'/tmp/discovery-split.png'});
 await page.getByRole('button',{name:'3D',exact:true}).click();
 await page.setViewportSize({width:1280,height:720});
 await waitForFraming();
 await page.screenshot({path:'/tmp/discovery-laptop.png'});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth),true,'laptop horizontal overflow');
 await page.setViewportSize({width:390,height:844});
 await page.evaluate(()=>window.scrollTo(0,0));
 await page.screenshot({path:'/tmp/discovery-mobile.png'});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth),true,'mobile horizontal overflow');
 console.log('PASS: keyboard inspector tabs, geometry Apply visibility, baseline pin, Myla without AI request, one-click graphs, exploded split, laptop and mobile without horizontal overflow. Screenshots in /tmp/discovery-*.png. Solver responses mocked.');
 } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
