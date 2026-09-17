import assert from 'node:assert/strict';
import test from 'node:test';
import { boundedCamera, JUNCTION_CAMERA, layoutViewBox, MAX_LAYOUT_ZOOM, MIN_LAYOUT_ZOOM, OVERVIEW_CAMERA } from './layout-geometry.ts';

test('100% fits the entire illustration across laptop and desktop aspect ratios',()=>{
 for(const [w,h] of [[1100,560],[980,430],[390,400]]){
  const box=layoutViewBox(w,h,OVERVIEW_CAMERA);
  assert.ok(box.x<=237&&box.y<=47&&box.x+box.width>=763&&box.y+box.height>=573);
  assert.ok(Math.abs(box.width/box.height-w/h)<1e-9);
 }
});
test('inspection and zoom use one magnification convention without physical units',()=>{
 const overview=layoutViewBox(1000,600,OVERVIEW_CAMERA),detail=layoutViewBox(1000,600,JUNCTION_CAMERA);
 assert.ok(Math.abs(overview.width/detail.width-JUNCTION_CAMERA.zoom)<1e-10);
 assert.equal(detail.x+detail.width/2,500);assert.equal(detail.y+detail.height/2,310);
 assert.deepEqual(boundedCamera({x:-50,y:800,zoom:20}),{x:100,y:550,zoom:20});
 assert.deepEqual(boundedCamera({x:500,y:310,zoom:.25}),OVERVIEW_CAMERA);
});
test('component zoom reaches 24× with bounded panning and remains reversible',()=>{
 assert.equal(MIN_LAYOUT_ZOOM,1);assert.equal(MAX_LAYOUT_ZOOM,24);
 const camera=boundedCamera({x:520,y:305,zoom:100});
 assert.deepEqual(camera,{x:520,y:305,zoom:MAX_LAYOUT_ZOOM});
 for(const [w,h] of [[1100,550],[360,550]]){
  const whole=layoutViewBox(w,h,OVERVIEW_CAMERA),detail=layoutViewBox(w,h,camera);
  assert.equal(whole.width/detail.width,MAX_LAYOUT_ZOOM);
  assert.ok(Math.abs(detail.width/detail.height-w/h)<1e-9);
  assert.equal(detail.x+detail.width/2,camera.x);
 }
 assert.deepEqual(boundedCamera({...camera,zoom:0}),{x:520,y:305,zoom:MIN_LAYOUT_ZOOM});
});
test('collapsed or invalid viewport measurements never produce a nonfinite SVG viewBox',()=>{
 for(const [w,h] of [[0,0],[0,400],[390,0],[Number.NaN,400],[400,Infinity],[-1,-1]]){
  const camera=boundedCamera({x:Number.NaN,y:Infinity,zoom:Number.NaN});
  assert.deepEqual(camera,OVERVIEW_CAMERA);
  const box=layoutViewBox(w,h,{x:Number.NaN,y:Infinity,zoom:0});
  assert.ok(Object.values(box).every(Number.isFinite));
  assert.ok(box.width>0&&box.height>0);
 }
});
