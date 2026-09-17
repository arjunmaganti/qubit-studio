'use client';
import { useEffect, useState } from 'react';
import { createDesignShareUrl, parseDesignShareUrl, type ShareableDesign } from '@/lib/design-link';
import { validDeviceParams } from '@/lib/device-snapshot';
import { validExperimentGoals } from '@/lib/experiment-session';
import { MATERIAL_CATALOG } from '@/lib/material-records';
import { parseComponentMaterials } from '@/lib/component-material-selection';
import MathText from '@/components/MathText';
import { num } from '@/lib/format';

interface SavedDesign extends ShareableDesign { id: string; savedAt: string }
const HISTORY_KEY = 'qubit-studio-saved-designs-v2';
function valid(value: unknown): value is SavedDesign {
  if (!value || typeof value !== 'object') return false;
  const item = value as SavedDesign;
  return !!item.params && validDeviceParams(item.params) && !!item.goals && validExperimentGoals(item.goals)
    && typeof item.id === 'string' && typeof item.savedAt === 'string' && Number.isFinite(Date.parse(item.savedAt))
    && (MATERIAL_CATALOG as readonly string[]).includes(item.topMaterial) && (MATERIAL_CATALOG as readonly string[]).includes(item.baseMaterial)
    && (item.componentMaterials === undefined || parseComponentMaterials(item.componentMaterials) !== null);
}
export default function SavedDesigns({ design, onRestore }: { design: ShareableDesign; onRestore: (design: ShareableDesign) => void }) {
  const [history, setHistory] = useState<SavedDesign[]>([]);
  const [status, setStatus] = useState('');
  const canSave = validDeviceParams(design.params) && validExperimentGoals(design.goals);
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const parsed: unknown = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]');
        if (Array.isArray(parsed)) setHistory(parsed.filter(valid).slice(0, 10));
      } catch { setStatus('Saved designs are unavailable in this browser.'); }
      const shared = parseDesignShareUrl(window.location.href);
      if (shared) { onRestore(shared); setStatus('Shared design loaded'); }
    }, 0);
    return () => clearTimeout(timer);
  }, [onRestore]);
  const save = () => {
    if (!canSave) return;
    const item = { ...structuredClone(design), id: crypto.randomUUID(), savedAt: new Date().toISOString() };
    const signature = (entry: ShareableDesign) => createDesignShareUrl(entry, window.location.href);
    const next = [item, ...history.filter(entry => signature(entry) !== signature(item))].slice(0, 10);
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(next)); setHistory(next); setStatus('Design saved'); }
    catch { setStatus('Could not save this design in browser storage.'); }
  };
  const share = async () => {
    if (!canSave) return;
    const url = createDesignShareUrl(design, window.location.href);
    window.history.replaceState(null, '', url);
    try { await navigator.clipboard.writeText(url); setStatus('Link copied'); }
    catch { setStatus('Share link added to the address bar'); }
  };
  return <div className="saved-design-tools">
    <button type="button" className="btn" data-tour="share-link" disabled={!canSave} onClick={share}>Copy link</button>
    <button type="button" className="btn" data-tour="save-design" disabled={!canSave} onClick={save}>Save design</button>
    <button type="button" className="btn" data-tour="restore-latest" disabled={!history.length} onClick={() => { if (history[0]) onRestore(history[0]); }}>Restore latest</button>
    <details className="history-menu" data-tour="history"><summary>Saved (<MathText math={`${history.length}`} />)</summary><div className="history-popover">
      {history.length === 0 && <p>No saved designs.</p>}
      {history.map(item => <button type="button" key={item.id} onClick={() => { onRestore(item); setStatus('Saved design restored'); }}><span><MathText math={`E_J=${num(item.params.ej_ghz, 3)}, E_C=${num(item.params.ec_ghz, 3)}, n_g=${num(item.params.ng, 3)}, n_{\\mathrm{cut}}=${item.params.ncut}`} /></span><small>{item.topMaterial} on {item.baseMaterial} · {new Date(item.savedAt).toLocaleString()}</small></button>)}
    </div></details>
    {status && <span role="status">{status}</span>}
  </div>;
}
