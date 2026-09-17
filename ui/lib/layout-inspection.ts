import { inspectionPoint, PLAN_ASPECT } from './chip-detail.ts';
import type { PartId } from './parts';
import { boundedCamera, layoutViewBox, OVERVIEW_CAMERA, type LayoutCamera } from './layout-geometry.ts';

export type PadFocus = 'both' | 'left' | 'right';
export interface LayoutViewState {
  camera: LayoutCamera;
  beforeInspection: LayoutCamera | null;
  inspecting: PartId | null;
  padFocus: PadFocus;
}
export interface InspectionLabel { text: string; part: PartId; anchor: [number,number]; offset: [number,number] }
export const INITIAL_LAYOUT_VIEW: LayoutViewState = { camera: OVERVIEW_CAMERA, beforeInspection: null, inspecting: null, padFocus: 'both' };
export const INSPECTIONS: Record<PartId, { title: string; action: string; explanation: string; region: [number,number,number,number]; labels: InspectionLabel[] }> = {
  board:{title:'Carrier board detail',action:'Inspect carrier board',region:[220,150,320,260],explanation:'The carrier and contacts support the chip. This is illustrated packaging context, not an additional circuit.',labels:[{text:'Carrier board',part:'board',anchor:[145,250],offset:[10,-55]}]},
  package:{title:'Package detail',action:'Inspect package',region:[250,155,380,310],explanation:'This view inspects the shield aperture and bond lands around the die. The 3D assembly shows the wider package and mounting hardware.',labels:[{text:'Package aperture',part:'package',anchor:[95,190],offset:[30,30]}]},
  junction: {title:'Junction detail',action:'Inspect junction',region:[500,310,100/PLAN_ASPECT,70],explanation:'Metal opening exposes the continuous substrate; it is not a through-hole.',labels:[
    {text:'Electrode',part:'capacitor',anchor:[436,300],offset:[-45,-65]},
    {text:'JJ1 · Josephson junction',part:'junction',anchor:[500,310],offset:[30,-95]},
    {text:'Junction overlap',part:'junction',anchor:[500,312],offset:[-100,80]},
    {text:'Exposed substrate · metal opening',part:'substrate',anchor:[536,325],offset:[55,72]},
  ]},
  capacitor:{title:'Capacitor detail',action:'Inspect capacitor pads',region:[500,310,670,245],explanation:'Both electrodes share EC. Inspect either pad to see its stepped neck; changing EC keeps this illustrative geometry fixed.',labels:[
    {text:'Left capacitor pad',part:'capacitor',anchor:[270,280],offset:[-55,-75]},
    {text:'Right capacitor pad',part:'capacitor',anchor:[720,280],offset:[-50,-75]},
    {text:'Stepped electrode neck',part:'capacitor',anchor:[410,307],offset:[-100,70]},
    {text:'Shared junction',part:'junction',anchor:[500,310],offset:[15,-65]},
  ]},
  gate:{title:'Charge gate detail',action:'Inspect charge gate',region:[790,310,365,230],explanation:'The gate sits inside a clearance opening beside the electrode. Adjust offset charge in the same editor.',labels:[
    {text:'G1 · Charge gate',part:'gate',anchor:[845,310],offset:[-30,-90]},
    {text:'Electrode edge',part:'capacitor',anchor:[704,285],offset:[-135,-50]},
    {text:'Clearance · exposed substrate',part:'substrate',anchor:[768,325],offset:[-120,65]},
  ]},
  ground:{title:'Ground metal detail',action:'Inspect ground metal',region:[450,245,430,285],explanation:'The perforated region is ground metal. Its shaped opening reveals substrate around the electrodes, not a hole through the chip.',labels:[
    {text:'Ground metal',part:'ground',anchor:[450,205],offset:[-110,-65]},
    {text:'Ground-metal boundary',part:'ground',anchor:[442,280],offset:[30,-70]},
    {text:'Exposed substrate',part:'substrate',anchor:[450,289],offset:[50,55]},
    {text:'Capacitor electrode',part:'capacitor',anchor:[325,310],offset:[-85,75]},
  ]},
  substrate:{title:'Substrate & chip edge',action:'Inspect substrate',region:[225,180,350,280],explanation:'The chip base is continuous beneath the metal. The gold frame and its mounting holes are carrier context outside the chip.',labels:[
    {text:'Chip boundary',part:'substrate',anchor:[160,155],offset:[-90,55]},
    {text:'Continuous substrate',part:'substrate',anchor:[180,205],offset:[10,60]},
    {text:'Metal on the substrate',part:'ground',anchor:[245,185],offset:[35,-55]},
  ]},
};
export function inspectPart(view: LayoutViewState, part: PartId, width: number, height: number, padFocus: PadFocus = 'both'): LayoutViewState {
  const region = part==='capacitor' && padFocus!=='both' ? [padFocus==='left'?330:670,310,350,245] : INSPECTIONS[part].region;
  const [legacyX,y,legacyWidth,h] = region;
  const [x] = inspectionPoint(legacyX,y);
  const w = legacyWidth * PLAN_ASPECT;
  const fit=layoutViewBox(width,height,OVERVIEW_CAMERA);
  const camera = boundedCamera({x,y,zoom:Math.min(fit.width/w,fit.height/h)});
  return {camera,beforeInspection:view.beforeInspection??{...view.camera},inspecting:part,padFocus};
}
export function returnFromInspection(view: LayoutViewState): LayoutViewState {
  return {...INITIAL_LAYOUT_VIEW,camera:view.beforeInspection??OVERVIEW_CAMERA};
}
