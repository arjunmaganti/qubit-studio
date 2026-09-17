import { inspectionPoint, PLAN_ASPECT } from './chip-detail.ts';
import assert from 'node:assert/strict';
import test from 'node:test';
import { INITIAL_LAYOUT_VIEW, INSPECTIONS, inspectPart, returnFromInspection } from './layout-inspection.ts';
import { layoutViewBox, MAX_LAYOUT_ZOOM } from './layout-geometry.ts';

test('inspection follows different parts and pad focuses without losing the original camera',()=>{
 const origin={...INITIAL_LAYOUT_VIEW,camera:{x:530,y:280,zoom:1.25}};
 let view=inspectPart(origin,'capacitor',1000,560);
 assert.equal(view.inspecting,'capacitor');
 view=inspectPart(view,'capacitor',1000,560,'right');assert.equal(view.padFocus,'right');assert.equal(view.camera.x,inspectionPoint(670,310)[0]);
 view=inspectPart(view,'gate',1000,560);view=inspectPart(view,'ground',1000,560);
 assert.deepEqual(returnFromInspection(view),{...INITIAL_LAYOUT_VIEW,camera:origin.camera});
 assert.deepEqual(origin.camera,{x:530,y:280,zoom:1.25});
});
test('each inspection frames its region on desktop and narrow screens',()=>{
 for(const part of ['board','package','junction','capacitor','gate','ground','substrate'] as const){
  for(const [w,h] of [[1100,550],[980,400],[390,340],[280,550]]){
   const view=inspectPart(INITIAL_LAYOUT_VIEW,part,w,h),box=layoutViewBox(w,h,view.camera);
   const [px,y,pw,rh]=INSPECTIONS[part].region;
   const [x]=inspectionPoint(px,y),rw=pw*PLAN_ASPECT;
   assert.ok(box.x<=x-rw/2+1e-8&&box.x+box.width>=x+rw/2-1e-8,part+' horizontal fit');
   assert.ok(box.y<=y-rh/2+1e-8&&box.y+box.height>=y+rh/2-1e-8,part+' vertical fit');
  }
 }
});
test('junction inspection reveals the overlap and adjacent electrode necks at a useful scale',()=>{
 for(const [w,h] of [[1100,550],[980,400],[390,340],[280,550]]){
  const view=inspectPart(INITIAL_LAYOUT_VIEW,'junction',w,h),box=layoutViewBox(w,h,view.camera);
  assert.ok(view.camera.zoom>=5.6&&view.camera.zoom<MAX_LAYOUT_ZOOM);
  assert.ok(box.width>=100-1e-8&&box.height>=70-1e-8);
  assert.ok(Math.min(box.width/100,box.height/70)<=1+1e-8);
  for(const [legacyX,y] of [[436,300],[564,320],[500,310]]){
   const [x]=inspectionPoint(legacyX,y);
   assert.ok(x>=box.x&&x<=box.x+box.width&&y>=box.y&&y<=box.y+box.height);
  }
 }
});
test('per-pad inspection preserves complete pad shape and return restores deep user zoom',()=>{
 const origin={...INITIAL_LAYOUT_VIEW,camera:{x:510,y:306,zoom:18}};
 for(const focus of ['left','right'] as const){
  const view=inspectPart(origin,'capacitor',320,550,focus),box=layoutViewBox(320,550,view.camera);
  const [centerX]=inspectionPoint(focus==='left'?330:670,310),halfWidth=350*PLAN_ASPECT/2;
  assert.ok(box.x<=centerX-halfWidth+1e-8&&box.x+box.width>=centerX+halfWidth-1e-8);
  assert.ok(box.y<=310-245/2+1e-8&&box.y+box.height>=310+245/2-1e-8);
  assert.deepEqual(returnFromInspection(view).camera,origin.camera);
 }
 for(const [w,h] of [[0,0],[Number.NaN,0]]){
  const view=inspectPart(origin,'junction',w,h);
  assert.ok(Object.values(view.camera).every(Number.isFinite));
 }
});
