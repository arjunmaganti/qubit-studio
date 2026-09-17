'use client';

import { useEffect, useRef } from 'react';
import MylaIcon from '@/components/MylaIcon';
import {
  workshopCanAdvance,
  workshopRecap,
  WORKSHOP_STEPS,
  type WorkshopChoices,
} from '@/lib/build-workshop';
import { num } from '@/lib/format';
import type { DeviceResult } from '@/lib/types';

interface BuildWorkshopProps {
  index: number;
  choices: WorkshopChoices;
  solverReady: boolean;
  result: DeviceResult | null;
  onChoose: (apply: Partial<WorkshopChoices>) => void;
  onIndex: (index: number) => void;
  onClose: () => void;
}

export default function BuildWorkshop({
  index,
  choices,
  solverReady,
  result,
  onChoose,
  onIndex,
  onClose,
}: BuildWorkshopProps) {
  const step = WORKSHOP_STEPS[index];
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    panelRef.current?.querySelector<HTMLElement>('button:not(.myla-x):not(:disabled)')?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      opener?.focus();
    };
  }, [onClose, index]);

  if (!step) return null;
  const last = index === WORKSHOP_STEPS.length - 1;
  const canGo = workshopCanAdvance(step, choices, solverReady);
  const ratio = result ? result.ratio : (choices.ej ?? 15) / (choices.ec ?? 0.3);
  const showLive = Boolean(choices.ej != null && choices.ec != null && result && (step.id === 'readout' || step.id === 'done' || step.id === 'pads' || step.id === 'gate' || step.id === 'package'));

  return (
    <div ref={panelRef} className="myla-pop build-pop" role="dialog" aria-label="Build a chip with Myla">
      <button type="button" className="myla-x" onClick={onClose} aria-label="Exit build demo">
        ×
      </button>
      <div className="myla-head">
        <MylaIcon size={28} />
        <div className="myla-title">
          <span className="myla-wordmark" aria-label="Myla">
            <span>M</span>
            <span>y</span>
            <span>l</span>
            <span>a</span>
          </span>
          <span className="myla-sub">{step.title}</span>
        </div>
      </div>
      <p className="tour-progress">
        {index + 1} / {WORKSHOP_STEPS.length}
      </p>
      <article className="ask-answer">
        {step.body.split('\n').filter(Boolean).map((para, i) => (
          <p key={i}>{para}</p>
        ))}
        {showLive && result && (
          <p>
            {`Your chip’s main note is ${num(result.f01_ghz, 2)} GHz — billions of ticks each second. ${ratio >= 20 ? 'That is a typical calm quantum bit.' : 'This one is a bit more sensitive than the usual design.'}`}
          </p>
        )}
        {step.id === 'done' && (
          <p>{workshopRecap(choices)}</p>
        )}
      </article>
      {step.options && (
        <div className={`build-options${step.options.length > 3 ? ' is-grid' : ''}`}>
          {step.options.map((option) => {
            const key = Object.keys(option.apply)[0] as keyof WorkshopChoices;
            const selected = key && choices[key] === option.apply[key];
            return (
              <button
                key={option.label}
                type="button"
                className={selected ? 'is-on' : ''}
                aria-pressed={selected}
                onClick={() => onChoose(option.apply)}
              >
                <strong>{option.label}</strong>
                <span>{option.hint}</span>
              </button>
            );
          })}
        </div>
      )}
      {step.options && !canGo && (
        <p className="ask-status">Pick one to continue.</p>
      )}
      {step.require === 'solve' && !solverReady && (
        <p className="ask-status">Waiting for a live result…</p>
      )}
      <div className="tour-nav">
        <button type="button" className="btn" onClick={() => onIndex(index - 1)} disabled={index === 0}>
          Back
        </button>
        {last ? (
          <button type="button" className="btn primary" onClick={onClose}>
            Finish
          </button>
        ) : (
          <button type="button" className="btn primary" onClick={() => onIndex(index + 1)} disabled={!canGo}>
            Next
          </button>
        )}
      </div>
    </div>
  );
}
