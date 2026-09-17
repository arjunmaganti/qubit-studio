import { LEFT_ELECTRODE, RIGHT_ELECTRODE } from './layout-geometry.ts';

/** Shared illustrative chip outlines. SVG pixels and 3D world units are presentation only. */
export { LEFT_ELECTRODE, RIGHT_ELECTRODE };
export const SUBSTRATE_PLAN = 'M177 116H823L849 142V468L823 494H177L151 468V142Z';
export const TOP_GROUND_PLAN = 'M223 147H777L799 169V226H643V257L590 271L511 294H489L410 271L357 257V226H201V169Z';
export const GATE_PLAN = 'M733 304H942V316H733Z';
export function planPoint(x:number,y:number): [number,number] { return [(x-500)*1.08/698,(y-310)*1.08/378]; }
/** Decode the explicit straight-edged M/L/H/V/Z paths used by the chip artwork. */
export function planContour(path:string): Array<[number,number]> {
 const tokens=path.match(/[MLHVZ]|-?\d+(?:\.\d+)?/g)??[];
 const points:Array<[number,number]>=[];let x=0,y=0;
 for(let i=0;i<tokens.length;){const op=tokens[i++];
  if(op==='Z')break;
  if(op==='M'||op==='L'){x=Number(tokens[i++]);y=Number(tokens[i++]);}
  else if(op==='H')x=Number(tokens[i++]);else if(op==='V')y=Number(tokens[i++]);else throw new Error('Unsupported chip contour command');
  if(!Number.isFinite(x)||!Number.isFinite(y))throw new Error('Invalid chip contour');
  points.push(planPoint(x,y));
 }
 return points;
}
