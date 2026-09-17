import type { MaterialProfile } from './component-materials.ts';
import type { PartId } from './parts.ts';

/** Tonal translation for an unlit inspection drawing; identities still come from the material catalog. */
export function mixSurface(color: string, target: string, amount: number): string {
  const rgb = (value: string) => [1,3,5].map(start=>parseInt(value.slice(start,start+2),16));
  const a=rgb(color),b=rgb(target);
  return '#'+a.map((v,i)=>Math.round(v+(b[i]-v)*amount).toString(16).padStart(2,'0')).join('');
}
export function inspectionSurface(part: PartId, profile: MaterialProfile) {
  const color=part==='package'&&profile.id==='Au'?'#959993':profile.color;
  const film=part==='ground';
  const base=film?mixSurface(color,'#13232d',.38):color;
  const contrast=profile.finish==='ceramic'?.055:profile.finish==='brushed'?.18:.12;
  return {base,light:mixSurface(base,'#f2f5ef',contrast),dark:mixSurface(base,'#10202a',contrast),
    edge:mixSurface(color,'#f8fbef',.46)};
}

/** Display-layer colors only; never written back as component materials. */
export const INSPECTION_LAYER_COLORS: Record<PartId,string> = {
  package:'#677376',board:'#3a5960',substrate:'#1d3543',ground:'#56798b',
  capacitor:'#a1c5b0',junction:'#c4a4da',gate:'#d8ba7c',
};
