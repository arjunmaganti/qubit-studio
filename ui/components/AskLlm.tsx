'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { ChevronDown, X } from 'lucide-react';
import MathText from '@/components/MathText';
import MylaTeachingNote from '@/components/MylaTeachingNote';
import { formatTopicHeadline, TOPICS, TOPIC_IDS, type TopicId } from '@/lib/explain-topics';
import { parseChipSnapshot } from '@/lib/insight-snapshot';
import { useExplain, type ExplainHandle } from '@/lib/useExplain';
import type { ChipSnapshot } from '@/lib/insight-types';
import './myla-panel.css';

interface AskLlmProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topics: TopicId[];
  snapshot: ChipSnapshot;
  explain?: ExplainHandle;
  modal?: boolean;
  onTopicsChange?: (topics: TopicId[]) => void;
}

/** Keep one request owner, whether supplied by a host or owned by the panel. */
export default function AskLlm(props: AskLlmProps) {
  return props.explain
    ? <MylaPanel {...props} explain={props.explain} />
    : <ConnectedMyla {...props} />;
}

function ConnectedMyla(props: AskLlmProps) {
  const explain = useExplain(props.snapshot, props.topics);
  return <MylaPanel {...props} explain={explain} />;
}

function MylaPanel({ open, onOpenChange, topics, snapshot, explain, modal = true, onTopicsChange }: AskLlmProps & { explain: ExplainHandle }) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const { answer, loading, error, ask, cancel, canAsk } = explain;
  const selectedTopics = [...new Set(topics)];
  const topic = selectedTopics[0] ?? null;
  const topicsKey = selectedTopics.join(',');
  const current = snapshot.readiness === 'ready' && parseChipSnapshot(snapshot).ok;
  const headline = selectedTopics.length > 1
    ? `${selectedTopics.length} selected topics`
    : topic ? current ? formatTopicHeadline(topic, snapshot) : TOPICS[topic].label : 'Explore your chip';
  const calculationStatus = current ? 'Current calculation · completed'
    : snapshot.readiness === 'error' ? 'Calculation failed'
    : snapshot.readiness === 'pending' ? 'Updating calculation…' : 'Waiting for a calculation';

  // Anchor to the actual workspace edges, including an expanded results dock.
  useLayoutEffect(() => {
    if (!open) return;
    const toolbar = document.querySelector('.wave-toolbar');
    const results = document.querySelector('.wave-results');
    const position = () => {
      const panel = panelRef.current;
      if (!panel) return;
      const vh = window.innerHeight;
      const compact = window.innerWidth <= 720 || vh < 560;
      const top = compact ? 12 : Math.max(12, Math.min((toolbar?.getBoundingClientRect().bottom ?? 94) + 12, vh - 300));
      const resultTop = results?.getBoundingClientRect().top ?? vh;
      const bottom = compact ? 12 : Math.max(16, Math.min(vh - resultTop + 12, vh - top - 280));
      panel.style.setProperty('--myla-top', `${top}px`);
      panel.style.setProperty('--myla-bottom', `${bottom}px`);
    };
    position();
    const frame = requestAnimationFrame(position);
    const observer = new ResizeObserver(position);
    if (toolbar) observer.observe(toolbar);
    if (results) observer.observe(results);
    window.addEventListener('resize', position);
    window.addEventListener('scroll', position, true);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('resize', position);
      window.removeEventListener('scroll', position, true);
    };
  }, [open]);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 });
  }, [topicsKey]);

  useEffect(() => {
    if (!open) cancel();
    return cancel;
  }, [cancel, open]);

  return (
    <DialogPrimitive.Root open={open} modal={modal} onOpenChange={next => {
      if (!next) cancel();
      onOpenChange(next);
    }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Content
          ref={panelRef}
          className="myla-panel"
          aria-label="Myla"
          onOpenAutoFocus={event => {
            const focused = document.activeElement;
            if (focused instanceof HTMLElement && !focused.closest('[role="dialog"]')) opener.current = focused;
            if (!modal) event.preventDefault();
          }}
          onCloseAutoFocus={event => {
            if (modal && opener.current?.isConnected) { event.preventDefault(); opener.current.focus(); }
          }}
          onInteractOutside={event => {
            // Contextual notes stay beside the workspace while its selection changes.
            if (!modal) event.preventDefault();
          }}
        >
          <header className="myla-panel-header">
            <div className="myla-panel-brand">
              <svg width="34" height="30" viewBox="0 0 34 30" fill="none" aria-hidden="true">
                <path d="M3 24V11a7 7 0 0 1 14 0v13M17 11a7 7 0 0 1 14 0v13" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
              <DialogPrimitive.Title>Myla</DialogPrimitive.Title>
            </div>
            <DialogPrimitive.Close asChild>
              <button type="button" className="myla-panel-close" aria-label="Close Myla">
                <X size={18} aria-hidden="true" />
                <span className="sr-only">Close</span>
              </button>
            </DialogPrimitive.Close>
          </header>
          <DialogPrimitive.Description className="sr-only">
            Local teaching notes for your selection. Request a Gemini explanation using the button below.
          </DialogPrimitive.Description>
          <div className="myla-panel-body" ref={bodyRef}>
            <div className="myla-panel-context"><MathText text={headline} /></div>
            {selectedTopics.map(id => <MylaTeachingNote key={id} topic={id} snapshot={snapshot} multiple={selectedTopics.length > 1} />)}
            {!topic && <article className="myla-panel-note"><h3>What would you like to understand?</h3><p>Select a topic below to see its teaching note.</p></article>}
            {onTopicsChange && <details className="myla-panel-disclosure">
              <summary><ChevronDown size={16} aria-hidden="true" />Choose explanation topics <span>({selectedTopics.length})</span></summary>
              <div className="myla-panel-topics">
                {TOPIC_IDS.map(id => <label key={id}>
                  <input type="checkbox" checked={selectedTopics.includes(id)} onChange={event => onTopicsChange(event.target.checked ? [...selectedTopics, id] : selectedTopics.filter(topic => topic !== id))} />
                  {TOPICS[id].label}
                </label>)}
                <button type="button" className="myla-panel-clear" disabled={!selectedTopics.length} onClick={() => onTopicsChange([])}>Clear topic selection</button>
              </div>
            </details>}
            {loading && <p className="myla-panel-context" role="status">Asking Gemini about your selection…</p>}
            {error && <p className="myla-panel-error" role="alert">{error} Local teaching notes remain available.</p>}
            {answer && <article className="myla-panel-answer" aria-label="Gemini explanation" aria-live="polite">
              <span className="myla-panel-context">Gemini explanation</span>
              <h3><MathText text={answer.title} /></h3>
              {answer.body.split('\n').filter(Boolean).map((para, index) => <p key={index}><MathText text={para} /></p>)}
            </article>}
          </div>
          <footer className="myla-panel-footer">
            <div className="myla-panel-provenance">
              <strong>{answer ? 'Gemini explanation' : 'Local teaching note'}</strong>
              <span>{answer ? 'Based on this completed snapshot' : loading ? 'AI explanation requested' : error ? 'AI explanation unavailable' : 'Available instantly · no AI requested'}</span>
            </div>
            <div className="myla-panel-status" data-state={current ? 'ready' : snapshot.readiness === 'error' ? 'error' : 'updating'} role="status">
              {calculationStatus}
              {!current && snapshot.outputs && <span>Previous snapshot · out of date</span>}
              {current && !canAsk && topic && <span>Check the design goals before asking Gemini.</span>}
            </div>
            <div className="myla-panel-actions">
              {loading && <button type="button" className="myla-panel-cancel" onClick={cancel}>Cancel</button>}
              <button type="button" className="myla-panel-primary" onClick={ask} disabled={!canAsk || loading} aria-busy={loading}>
                {loading ? 'Asking Gemini…' : error ? 'Retry Gemini explanation' : answer ? 'Ask Gemini again' : 'Ask Gemini about this'}
              </button>
            </div>
          </footer>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
