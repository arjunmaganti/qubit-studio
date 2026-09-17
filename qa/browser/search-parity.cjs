// Verify the recovered design-search evidence using the real same-origin solver API.
const {chromium}=require('../../ui/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(process.env.QUBIT_UI_URL||'http://127.0.0.1:3117');
  await page.waitForFunction(()=>/ready|live/i.test(document.querySelector('.wave-header [role=status]')?.textContent||''));
  await page.locator('.view-options summary').click();
  const quality=page.getByRole('button',{name:'High detail rendering',exact:true});
  if(await quality.getAttribute('aria-pressed')==='true')await quality.click();
  await page.locator('.view-options summary').click();
  await page.locator('.results-actions summary').click();
  await page.getByRole('button',{name:'Pin baseline',exact:true}).click();
  await page.locator('.results-actions summary').click();
  await page.getByRole('button',{name:'Design',exact:true}).click();
  const response=page.waitForResponse(response=>response.url().endsWith('/api/search')&&response.request().method()==='POST');
  await page.getByRole('button',{name:'Find variables + materials',exact:true}).click();
  const searchResponse=await response;
  assert.equal(searchResponse.status(),200);
  const search=await searchResponse.json();
  assert.ok(search.baseline_evaluation,'Server assesses frozen baseline');
  assert.ok(search.selection_evidence,'Server explains selection from actual evaluated grid');
  await page.locator('.search-baseline-assessment').waitFor();
  assert.match(await page.locator('.search-baseline-assessment').innerText(),/Baseline (qualifies|fails)/);
  assert.ok(await page.locator('.tradeoff-chart [data-marker=baseline]').count());
  assert.ok(await page.locator('.tradeoff-chart [data-marker=applied]').count());
  if(search.selected)assert.ok(await page.locator('.tradeoff-chart [data-marker=recommended]').count());
  await page.getByLabel('Show rejected evaluated designs',{exact:true}).check();
  assert.equal(await page.locator('.tradeoff-point').count(),search.candidates.length);
  const rejected=page.locator('.tradeoff-point.failing');
  if(await rejected.count()){
   const selectedBefore=await page.locator('.tradeoff-point.selected').getAttribute('aria-label');
   await rejected.first().focus();await page.keyboard.press('Enter');
   await page.getByText('Rejected design · cannot apply',{exact:true}).waitFor();
   assert.equal(await page.locator('.tradeoff-point.selected').getAttribute('aria-label'),selectedBefore);
  }
  await page.getByText('Why this recommendation?',{exact:true}).click();
  assert.match(await page.locator('.search-selection-evidence').innerText(),/evaluated grid only/);
  await page.getByRole('button',{name:'Expand graph',exact:true}).click();
  const dialog=page.getByRole('dialog');
  assert.ok(await dialog.locator('[data-marker=baseline]').count());
  assert.match(await dialog.innerText(),/Use variables \+ materials applies/);
  await page.keyboard.press('Escape');
  assert.deepEqual(errors,[]);
  console.log(`PASS real search: ${search.evaluated_count} evaluated points, ${search.feasible_count} passing; baseline assessment, selection evidence, rejected inspection, and comparison markers preserved`);
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
