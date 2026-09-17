import assert from 'node:assert/strict';
import test from 'node:test';
import { placeInspectionLabels, labelsOverlap } from './layout-labels.ts';
import { INSPECTIONS, inspectPart, INITIAL_LAYOUT_VIEW } from './layout-inspection.ts';
import { layoutViewBox } from './layout-geometry.ts';

test('inspection labels stay inside narrow panes, avoid each other and leave the locator clear',()=>{
 for(const width of [280,360,480,640,1100])for(const part of ['capacitor','junction','gate','ground'] as const){
  const size={width,height:390};
  const view=inspectPart(INITIAL_LAYOUT_VIEW,part,width,size.height),box=layoutViewBox(width,size.height,view.camera);
  const reserved={x:10,y:226,width:146,height:154};
  const labels=placeInspectionLabels(INSPECTIONS[part].labels,box,size,part,[],[reserved]);
  assert.ok(labels.some(l=>l.part===part),`${part} has a visible label at ${width}px`);
  labels.forEach((label,i)=>{
   assert.ok(label.x>=0&&label.x+label.width<=width&&label.y>=0&&label.y+label.height<=size.height);
   assert.ok(!labelsOverlap(label,reserved));
   for(const other of labels.slice(i+1))assert.ok(!labelsOverlap(label,other));
  });
 }
});
test('hidden components have no callouts and offscreen anchors are not clamped onto the chip',()=>{
 const size={width:360,height:390},box=layoutViewBox(360,390,{x:500,y:310,zoom:6});
 const labels=placeInspectionLabels(INSPECTIONS.capacitor.labels,box,size,'junction',['capacitor']);
 assert.deepEqual(labels.map(l=>l.part),['junction']);
});
