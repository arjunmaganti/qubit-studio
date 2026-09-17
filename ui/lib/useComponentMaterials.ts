'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { DEFAULT_COMPONENT_MATERIALS, type ComponentMaterials } from './component-materials';
import { restoreComponentMaterials } from './component-material-selection';

const KEY = 'qubit-studio.component-materials.v1';
const DEFAULT_SNAPSHOT = JSON.stringify(DEFAULT_COMPONENT_MATERIALS);
let memorySnapshot = DEFAULT_SNAPSHOT;
let memoryOnly = false;
const listeners = new Set<() => void>();

function snapshot() {
  if (memoryOnly) return memorySnapshot;
  try { return window.localStorage.getItem(KEY) ?? memorySnapshot; }
  catch { return memorySnapshot; }
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === KEY || event.key === null) {
      memorySnapshot = event.newValue ?? DEFAULT_SNAPSHOT;
      listener();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => { listeners.delete(listener); window.removeEventListener('storage', onStorage); };
}

/** The server starts with the default chip; React restores saved selections after hydration. */
export function useComponentMaterials() {
  const raw = useSyncExternalStore(subscribe, snapshot, () => DEFAULT_SNAPSHOT);
  const materials = useMemo(() => restoreComponentMaterials(raw), [raw]);
  const update = useCallback((change: (current: ComponentMaterials) => ComponentMaterials) => {
    const next = change(restoreComponentMaterials(snapshot()));
    memorySnapshot = JSON.stringify(next);
    try { window.localStorage.setItem(KEY, memorySnapshot); } catch { memoryOnly = true; }
    listeners.forEach(listener => listener());
  }, []);
  return [materials, update] as const;
}
