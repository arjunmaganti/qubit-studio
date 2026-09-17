'use client';

import { useId, useMemo, useRef, useState, type CSSProperties } from 'react';
import { ArrowUpRight, Atom, Check, ChevronRight, RotateCcw, Search, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './ui/dialog';
import { DEFAULT_COMPONENT_MATERIALS, MATERIAL_PROFILES, MATERIAL_BY_ID, PERIODIC_ELEMENTS, RECOMMENDED_MATERIALS, materialProfilesForElement, resolveMaterial, type ComponentMaterials, type MaterialProfile } from '@/lib/component-materials';
import { PART_BY_ID, type PartId } from '@/lib/parts';
import './component-materials.css';

export interface ComponentMaterialPickerProps {
  part: PartId;
  materials: ComponentMaterials;
  onChange: (part: PartId, material: string) => void;
}

function Sample({ material, large = false }: { material: MaterialProfile; large?: boolean }) {
  return <span aria-hidden="true" className={`material-sample finish-${material.finish}${large ? ' is-large' : ''}`}
    style={{ '--sample-color': material.color } as CSSProperties}><i /></span>;
}

export default function ComponentMaterialPicker({ part, materials, onChange }: ComponentMaterialPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [element, setElement] = useState<string | null>(null);
  const [view, setView] = useState<'elements' | 'materials'>('elements');
  const [draftId, setDraftId] = useState(materials[part]);
  const dialogId = useId();
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const current = resolveMaterial(materials[part]);
  const draft = resolveMaterial(draftId);
  const partName = PART_BY_ID[part].name;
  const recommended = RECOMMENDED_MATERIALS[part].map(id => MATERIAL_BY_ID[id]).filter(Boolean);
  const normalizedQuery = query.toLowerCase().trim();
  const matchesQuery = (material: MaterialProfile) =>
    `${material.id} ${material.name} ${material.formula} ${material.category} ${material.elements.join(' ')}`.toLowerCase().includes(normalizedQuery);
  const listed = MATERIAL_PROFILES.filter(material => (!element || material.elements.includes(element)) && matchesQuery(material));
  const availableElements = useMemo(() => new Set(MATERIAL_PROFILES.flatMap(material => material.elements)), []);
  const openLibrary = (next: boolean, opener?: HTMLButtonElement) => {
    setOpen(next);
    if (next) {
      if (opener) openerRef.current = opener;
      setDraftId(materials[part]); setQuery(''); setElement(null);
    }
  };

  return <section className="component-material-picker" aria-label={`${partName} material`}>
    <div className="component-material-heading"><span>Component material</span>
      <button type="button" title="Restore this component's default material" aria-label={`Reset ${partName} material`}
        disabled={materials[part] === DEFAULT_COMPONENT_MATERIALS[part]} onClick={() => onChange(part, DEFAULT_COMPONENT_MATERIALS[part])}><RotateCcw size={11}/> Reset</button>
    </div>
    <button type="button" className="current-material" onClick={event => openLibrary(true, event.currentTarget)} aria-label={`Change ${partName} material. Current material: ${current.name}`}
      aria-haspopup="dialog" aria-expanded={open} aria-controls={dialogId}>
      <Sample material={current}/><span><strong>{current.formula} <b>{current.name}</b></strong><small>{current.finish} · {current.category}</small></span><ChevronRight size={15}/>
    </button>
    <div className="material-quick-picks" role="group" aria-label={`Material suggestions for ${partName}`}>
      {recommended.slice(0, 5).map(material => <button key={material.id} type="button" aria-pressed={material.id === current.id}
        title={material.name} aria-label={`Use ${material.name} for ${partName}`} onClick={() => onChange(part, material.id)}>
        <i style={{ backgroundColor: material.color }}/>{material.formula}
      </button>)}
      <button className="material-browse" type="button" onClick={event => openLibrary(true, event.currentTarget)}
        aria-haspopup="dialog" aria-expanded={open} aria-controls={dialogId}><Atom size={12}/> Elements</button>
    </div>
    <p className="component-material-scope">Changes this part’s appearance in 3D and Layout. Electrical values remain controlled by the model inputs.</p>

    <Dialog open={open} onOpenChange={openLibrary}>
      <DialogContent id={dialogId} className="material-dialog" onCloseAutoFocus={event => {
        if (openerRef.current?.isConnected) {
          event.preventDefault();
          openerRef.current.focus({ preventScroll: true });
        }
      }}>
        <header className="material-dialog-header">
          <span className="material-dialog-eyebrow"><Atom size={14}/> MATERIAL LIBRARY</span>
          <DialogTitle>Choose a material</DialogTitle>
          <DialogDescription>For <strong>{partName}</strong> · {MATERIAL_PROFILES.length} materials with distinct surface finishes</DialogDescription>
        </header>
        <div className="material-dialog-scroll">
          <div className="material-library-tools">
            <div className="material-library-views" role="group" aria-label="Material library view">
              <button type="button" aria-pressed={view === 'elements'} onClick={() => setView('elements')}>Periodic table</button>
              <button type="button" aria-pressed={view === 'materials'} onClick={() => { setView('materials'); setElement(null); }}>All materials</button>
            </div>
            <label className="material-search"><Search size={14}/><input aria-label="Search materials" placeholder="Search name or formula…" value={query} onChange={event => setQuery(event.target.value)}/>
              {query && <button type="button" aria-label="Clear material search" onClick={() => setQuery('')}><X size={12}/></button>}
            </label>
          </div>
          {view === 'elements' && <>
            <div className="periodic-table-scroll" tabIndex={0} aria-label="Periodic table; scroll horizontally on smaller screens">
              <div className="periodic-table" role="group" aria-label="Periodic elements">
                {PERIODIC_ELEMENTS.map(item => {
                  const available = availableElements.has(item.symbol);
                  const profiles = materialProfilesForElement(item.symbol);
                  const matched = !normalizedQuery || `${item.name} ${item.symbol} ${item.number}`.toLowerCase().includes(normalizedQuery) || profiles.some(matchesQuery);
                  return <button type="button" key={item.symbol} disabled={!available} aria-pressed={element === item.symbol}
                    aria-label={`${item.name} (${item.symbol}), atomic number ${item.number}${available ? `, ${profiles.length} material${profiles.length === 1 ? '' : 's'}` : ', no material in this library'}`}
                    title={`${item.name} · ${available ? profiles.map(profile => profile.name).join(', ') : 'No material in this library'}`}
                    className={`periodic-element${available ? ' is-available' : ''}${!matched ? ' is-muted' : ''}${current.elements.includes(item.symbol) ? ' is-current' : ''}`}
                    style={{ gridColumn: item.group, gridRow: item.period >= 8 ? item.period + 1 : item.period }} onClick={() => {
                      const next = element === item.symbol ? null : item.symbol;
                      setElement(next); setQuery('');
                      if (next && profiles[0]) setDraftId(profiles[0].id);
                    }}>
                    <small>{item.number}</small><strong>{item.symbol}</strong>
                  </button>;
                })}
                <span className="periodic-series periodic-lanthanides">57–71</span><span className="periodic-series periodic-actinides">89–103</span>
                <div className="periodic-table-caption"><strong>Start with an element.</strong><span>Highlighted cells have materials in the library. Select O or N to explore oxides and nitrides.</span></div>
              </div>
            </div>
            <div className="periodic-legend"><span><i/> Available material</span><span><i/> Assigned to this component</span><span>118 elements · optical appearance approximations</span></div>
          </>}

          <div className="material-library-bottom">
            <section className="material-candidates" aria-label="Matching materials">
              <div className="material-candidates-title"><strong>{element ? `Containing ${element}` : normalizedQuery ? 'Search results' : 'Materials'}</strong><span>{listed.length}</span>
                {element && <button type="button" onClick={() => setElement(null)}>Clear element <X size={11}/></button>}
              </div>
              <div className={`material-candidate-list${view === 'materials' ? ' is-expanded' : ''}`}>
                {listed.map(material => <button type="button" key={material.id} aria-pressed={draft.id === material.id}
                  aria-label={`Preview ${material.name} (${material.formula})${current.id === material.id ? ', currently assigned' : ''}`} onClick={() => setDraftId(material.id)}>
                  <Sample material={material}/><span><strong>{material.formula}</strong><small>{material.name}</small></span>{current.id === material.id && <Check size={13}/>}
                </button>)}
                {listed.length === 0 && <p className="material-empty">No matching material. Try an element symbol, “silicon”, or “nitride”.</p>}
              </div>
            </section>
            <section className="material-detail" aria-label="Selected material details">
              <div className="material-detail-heading"><Sample material={draft} large/><div><span>{draft.category}</span><h3>{draft.name}</h3><p>{draft.formula} · {draft.finish}</p></div></div>
              <p>{draft.description}</p>
              <p className="material-use">{draft.use}</p>
              <a href={draft.sourceUrl} target="_blank" rel="noreferrer">{draft.sourceLabel} <ArrowUpRight size={12}/></a>
            </section>
          </div>
        </div>
        <footer className="material-dialog-footer">
          <p>Visual materials are illustrative. Choosing a material does not establish a working qubit or change solver inputs.</p>
          <button type="button" className="material-apply" onClick={() => { onChange(part, draft.id); setOpen(false); }}><Check size={15}/>{current.id === draft.id ? 'Keep' : 'Use'} {draft.formula}</button>
        </footer>
      </DialogContent>
    </Dialog>
  </section>;
}
