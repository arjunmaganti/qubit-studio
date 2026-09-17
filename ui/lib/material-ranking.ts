import { MATERIAL_RECORDS } from './material-records.ts';
import type { ResonatorMaterialRecord } from './material-records.ts';

export type SubstratePreference = 'any' | 'Si' | 'Al₂O₃ (sapphire)';

/** Design search should optimize measured performance unless the user asks for a process tradeoff. */
export const DEFAULT_MATERIAL_PRIORITY = 100;

export const VALID_RESONATOR_STACKS = MATERIAL_RECORDS.filter(
  (record): record is ResonatorMaterialRecord =>
    record.kind === 'resonator-loss' && record.category === 'superconducting film',
);

/** A transparent fabrication-burden heuristic derived only from the recorded process text. */
export function processBurden(record: ResonatorMaterialRecord): number {
  const deposition = record.deposition.toLowerCase();
  const treatment = record.treatment.toLowerCase();
  let burden = deposition.includes('e-beam') ? 1
    : deposition.includes('pvd') ? 1.6
      : deposition.includes('sputter') ? 1.8
        : deposition.includes('mbe') ? 3
          : 2.2;
  if (treatment.includes('rca')) burden += 1;
  if (treatment.includes('anneal')) burden += 0.8;
  if (treatment.includes('hf')) burden += 0.4;
  if (treatment.includes('rie')) burden += 0.3;
  return burden;
}

export function recommendMaterialStack(
  performancePriority: number,
  substrate: SubstratePreference,
): ResonatorMaterialRecord {
  return rankMaterialStacks(performancePriority, substrate)[0];
}

/** Rank every measured stack so the UI can offer alternatives, not only one winner. */
export function rankMaterialStacks(
  performancePriority: number,
  substrate: SubstratePreference,
): ResonatorMaterialRecord[] {
  const candidates = substrate === 'any'
    ? VALID_RESONATOR_STACKS
    : VALID_RESONATOR_STACKS.filter((record) => record.substrate === substrate);
  const losses = candidates.map((record) => Math.log10(record.lowPowerLossMax));
  const burdens = candidates.map(processBurden);
  const minLoss = Math.min(...losses);
  const maxLoss = Math.max(...losses);
  const minBurden = Math.min(...burdens);
  const maxBurden = Math.max(...burdens);
  const weight = Math.min(100, Math.max(0, performancePriority)) / 100;

  const score = (candidate: ResonatorMaterialRecord) => {
    const loss = Math.log10(candidate.lowPowerLossMax);
    const lossScore = maxLoss === minLoss ? 0 : (loss - minLoss) / (maxLoss - minLoss);
    const burden = processBurden(candidate);
    const burdenScore = maxBurden === minBurden ? 0 : (burden - minBurden) / (maxBurden - minBurden);
    return weight * lossScore + (1 - weight) * burdenScore;
  };

  return [...candidates].sort((a, b) => score(a) - score(b));
}

/** Show one clear option per material/substrate pair, backed by its highest-ranked study. */
export function rankDistinctMaterialPairs(
  performancePriority: number,
  substrate: SubstratePreference,
): ResonatorMaterialRecord[] {
  const seen = new Set<string>();
  return rankMaterialStacks(performancePriority, substrate).filter((record) => {
    const pair = `${record.material}\u0000${record.substrate}`;
    if (seen.has(pair)) return false;
    seen.add(pair);
    return true;
  });
}
