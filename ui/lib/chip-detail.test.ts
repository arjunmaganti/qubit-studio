import assert from 'node:assert/strict';
import test from 'node:test';
import { planContour, SUBSTRATE_PLAN, LEFT_ELECTRODE, RIGHT_ELECTRODE } from './chip-plan.ts';
import { BOND_COUNT, bondPoints, inspectionWorldPoint, JUNCTION_ELECTRODE, JUNCTION_OVERLAP } from './chip-detail.ts';
import { CHIP, DIE_SCALE, PLATE } from './chip-geometry.ts';

test('inspection preserves the square die and the main renderer electrode proportions',()=>{
 const contour=planContour(SUBSTRATE_PLAN).map(([x,z])=>inspectionWorldPoint(x,z));
 const span=(axis:number)=>Math.max(...contour.map(p=>p[axis]))-Math.min(...contour.map(p=>p[axis]));
 assert.ok(Math.abs(span(0)-span(1))<1e-9);
 for(const path of [LEFT_ELECTRODE,RIGHT_ELECTRODE]){
  const points=planContour(path),projected=points.map(([x,z])=>inspectionWorldPoint(x,z));
  for(let i=1;i<points.length;i++){
   const a=points[i],b=points[i-1],pa=projected[i],pb=projected[i-1];
   assert.ok(Math.abs(Math.hypot(pa[0]-pb[0],pa[1]-pb[1])/Math.hypot(a[0]-b[0],a[1]-b[1])-350)<1e-7);
  }
 }
});
test('shared bonds connect die perimeter to package lands, with 46 distinct contacts per side',()=>{
 for(let side=0;side<4;side++){
  const bonds=Array.from({length:BOND_COUNT},(_,i)=>bondPoints(i,side));
  assert.equal(new Set(bonds.map(p=>p[0][0])).size,46);
  for(const [inner,crest,outer] of bonds){
   assert.equal(inner[2],CHIP.size/2-.022);
   assert.equal(outer[2]*DIE_SCALE,PLATE.window/2+.028);
   assert.ok(crest[1]>inner[1]&&crest[1]>outer[1]);
  }
 }
});
test('overlapping junction electrodes still bridge the shared capacitor necks',()=>{
 const lower=JUNCTION_ELECTRODE.map(([x,y])=>[x,-y]);
 const upper=JUNCTION_ELECTRODE.map(([x,y])=>[-x,y+JUNCTION_OVERLAP.upperZ]);
 assert.ok(Math.min(...lower.map(p=>p[0]))<Math.max(...planContour(LEFT_ELECTRODE).map(p=>p[0])));
 assert.ok(Math.max(...upper.map(p=>p[0]))>Math.min(...planContour(RIGHT_ELECTRODE).map(p=>p[0])));
 assert.ok(Math.max(...lower.map(p=>p[0]))>Math.min(...upper.map(p=>p[0])));
 assert.ok(JUNCTION_OVERLAP.width>0&&JUNCTION_OVERLAP.depth>0);
});
