import type { PartId } from './parts';

/** Inspection-only presentation; never changes component material or visibility. */
export type LayerFillMode = 'solid' | 'translucent' | 'outline';
export type LayerDisplay = Record<PartId, LayerFillMode>;

export const DEFAULT_LAYER_DISPLAY: LayerDisplay = {
  package: 'solid',
  board: 'solid',
  substrate: 'solid',
  ground: 'solid',
  capacitor: 'solid',
  junction: 'solid',
  gate: 'solid',
};
