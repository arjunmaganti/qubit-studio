import type { PartId } from './parts.ts';
import type { InspectionLabel } from './layout-inspection.ts';
import { inspectionPoint } from './chip-detail.ts';

export interface LabelRect { x: number; y: number; width: number; height: number }
export interface PlacedLabel extends InspectionLabel, LabelRect { ax: number; ay: number }
export const labelsOverlap = (a: LabelRect, b: LabelRect, gap = 6) =>
  a.x < b.x+b.width+gap && a.x+a.width+gap > b.x && a.y < b.y+b.height+gap && a.y+a.height+gap > b.y;

/** Place screen-sized callouts around visible anchors; keep selection first in tight panes. */
export function placeInspectionLabels(labels: InspectionLabel[], box: LabelRect, size: {width:number;height:number}, selected: PartId|null, hidden: PartId[], reserved: LabelRect[] = []): PlacedLabel[] {
  const placed: PlacedLabel[] = [];
  const candidates = labels.filter(l=>!hidden.includes(l.part)).sort((a,b)=>Number(b.part===selected)-Number(a.part===selected));
  for (const label of candidates) {
    const [px,py] = inspectionPoint(...label.anchor);
    const ax=(px-box.x)/box.width*size.width, ay=(py-box.y)/box.height*size.height;
    if(ax<0||ax>size.width||ay<0||ay>size.height)continue;
    const width=Math.min(size.width-20,label.text.length*6.05+18),height=24;
    if(width<80||size.height<60)continue;
    const preferred={x:ax+label.offset[0],y:ay+label.offset[1]};
    const positions=[preferred];
    for(const dy of [-65,45,-105,85,-145,125])for(const dx of [12,-width-12,-width/2])positions.push({x:ax+dx,y:ay+dy});
    const available=positions.map(p=>({...p,x:Math.max(10,Math.min(size.width-width-10,p.x)),y:Math.max(10,Math.min(size.height-height-10,p.y)),width,height}))
      .filter(p=>![...placed,...reserved].some(r=>labelsOverlap(p,r)))
      .sort((a,b)=>Math.hypot(a.x-preferred.x,a.y-preferred.y)-Math.hypot(b.x-preferred.x,b.y-preferred.y));
    if(available[0])placed.push({...label,...available[0],ax,ay});
  }
  return placed;
}
