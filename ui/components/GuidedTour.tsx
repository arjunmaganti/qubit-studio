'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import MathText from '@/components/MathText';
import MylaIcon from '@/components/MylaIcon';
import { createTourDisclosures } from '@/lib/tour-disclosures';
import { TOUR_TARGETS } from '@/lib/tour-targets';
import { TOUR_STEPS, type TourStep } from '@/lib/guided-tour';

interface GuidedTourProps {
  index: number;
  sceneKey: string;
  onIndex: (index: number) => void;
  onClose: () => void;
  steps?: TourStep[];
}

const POP_W = 380;
const GAP = 14;
const MARGIN = 8;

function place(rect: DOMRect | null, width: number, height: number) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const ax = rect ? rect.right : 24;
  const ay = rect ? rect.top : 72;
  let left = ax + GAP;
  let top = ay;
  if (left + width > vw - MARGIN) left = (rect ? rect.left : ax) - width - GAP;
  if (left < MARGIN) left = MARGIN;
  if (top + height > vh - MARGIN) top = vh - height - MARGIN;
  if (top < MARGIN) top = MARGIN;
  return { left, top };
}

export default function GuidedTour({ index, sceneKey, onIndex, onClose, steps = TOUR_STEPS }: GuidedTourProps) {
  const step = steps[index];
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState({ left: 24, top: 72 });
  const [spot, setSpot] = useState<DOMRect | null>(null);

  useLayoutEffect(() => {
    if (!step) return;
    const disclosures = createTourDisclosures();
    if (step.openDetails) {
      document.querySelectorAll(step.openDetails).forEach((node) => {
        if (node instanceof HTMLDetailsElement) disclosures.open(node);
      });
    }
    const measure = () => {
      const el = document.querySelector(`[data-tour="${step.target}"]`) ?? document.querySelector(TOUR_TARGETS[step.target] ?? '.wave-inspector') ?? document.querySelector('.wave-inspector');
      if (el instanceof HTMLElement) {
        let ancestor: HTMLElement | null = el;
        while (ancestor) { if (ancestor instanceof HTMLDetailsElement) disclosures.open(ancestor); ancestor = ancestor.parentElement; }
      }
      if (el instanceof HTMLElement) {
        el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        const rect = el.getBoundingClientRect();
        setSpot(rect);
        const panel = panelRef.current?.getBoundingClientRect();
        setPos(place(rect, panel?.width ?? POP_W, panel?.height ?? 240));
      } else {
        setSpot(null);
        setPos({ left: 24, top: 72 });
      }
    };
    measure();
    const frame = requestAnimationFrame(measure);
    const timer = window.setTimeout(measure, 150);
    return () => { cancelAnimationFrame(frame); window.clearTimeout(timer); disclosures.restore(); };
  }, [step, index, sceneKey]);

  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    panelRef.current?.querySelector<HTMLElement>('button')?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); onClose(); }
      if (event.key === 'Tab') {
        const nodes = Array.from(panelRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled)') ?? []);
        const current = nodes.indexOf(document.activeElement as HTMLElement);
        event.preventDefault(); nodes[(current + (event.shiftKey ? -1 : 1) + nodes.length) % nodes.length]?.focus();
      }
    };
    window.addEventListener('keydown', key, true);
    return () => { window.removeEventListener('keydown', key, true); opener?.focus(); };
  }, [onClose]);
  if (!step) return null;
  const last = index === steps.length - 1;

  return (
    <>
      {spot && (
        <div
          className="tour-spot"
          style={{
            left: spot.left - 4,
            top: spot.top - 4,
            width: spot.width + 8,
            height: spot.height + 8,
          }}
        />
      )}
      <div ref={panelRef} className="myla-pop tour-pop" role="dialog" aria-label="Guided learning" style={{ left: pos.left, top: pos.top, width: POP_W }}>
        <button type="button" className="myla-x" onClick={onClose} aria-label="Exit guided learning">
          ×
        </button>
        <div className="myla-head">
          <MylaIcon size={36} />
          <div className="myla-title">
            <span className="myla-mark">Guided learning</span>
            <span className="myla-sub">
              <MathText text={step.title} />
            </span>
          </div>
        </div>
        <p className="tour-progress">
          {index + 1} / {steps.length}
        </p>
        <article className="ask-answer">
          {step.body.split('\n').filter(Boolean).map((para, i) => (
            <p key={i}>
              <MathText text={para} />
            </p>
          ))}
        </article>
        <div className="tour-nav">
          <button type="button" className="btn" onClick={() => onIndex(index - 1)} disabled={index === 0}>
            Back
          </button>
          {last ? (
            <button type="button" className="btn primary" onClick={onClose}>
              Finish
            </button>
          ) : (
            <button type="button" className="btn primary" onClick={() => onIndex(index + 1)}>
              Next
            </button>
          )}
        </div>
      </div>
    </>
  );
}
