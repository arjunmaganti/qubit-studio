'use client';

import { ChevronDown } from 'lucide-react';
import MathText from '@/components/MathText';
import { composeLocalMyla } from '@/lib/explain-local';
import { TOPICS, type TopicId } from '@/lib/explain-topics';
import { num } from '@/lib/format';
import { parseChipSnapshot } from '@/lib/insight-snapshot';
import type { ChipSnapshot } from '@/lib/insight-types';

interface MylaTeachingNoteProps {
  topic: TopicId;
  snapshot: ChipSnapshot;
  multiple?: boolean;
}

function Paragraphs({ paragraphs }: { paragraphs: string[] }) {
  return paragraphs.map((text, index) => <p key={index}><MathText text={text} /></p>);
}

function JunctionDiagram() {
  return (
    <figure className="myla-panel-visual">
      <svg viewBox="0 0 340 134" role="img" aria-label="Two superconductors separated by a thin tunnel barrier, with a two-way arrow showing Cooper-pair tunnelling">
        <rect x="8" y="45" width="138" height="58" fill="#edf0f4" stroke="#52647b" strokeWidth="1.5" />
        <rect x="194" y="45" width="138" height="58" fill="#edf0f4" stroke="#52647b" strokeWidth="1.5" />
        <rect x="146" y="45" width="8" height="58" fill="#dbe8ff" stroke="#3567df" strokeWidth="1.5" />
        <path d="M151 43 L170 18" fill="none" stroke="#52647b" />
        <circle cx="170" cy="18" r="2.5" fill="#52647b" />
        <text x="180" y="22" fill="#28374b" fontSize="11">thin barrier</text>
        <text x="77" y="79" textAnchor="middle" fill="#28374b" fontSize="11">Superconductor</text>
        <text x="263" y="79" textAnchor="middle" fill="#28374b" fontSize="11">Superconductor</text>
        <path d="M160 80 H188 M160 80 L165 76 M160 80 L165 84 M188 80 L183 76 M188 80 L183 84" fill="none" stroke="#3567df" strokeWidth="1.6" />
        <text x="170" y="124" textAnchor="middle" fill="#3567df" fontSize="11">Cooper-pair tunnelling</text>
      </svg>
      <figcaption>Junction close-up · illustrative, not to scale</figcaption>
    </figure>
  );
}

function FrequencyDiagram({ frequency }: { frequency: number }) {
  return (
    <figure className="myla-panel-visual">
      <svg viewBox="0 0 340 134" role="img" aria-label={`Illustrative ground and first excited energy levels, with transition frequency ${num(frequency, 3)} gigahertz`}>
        <path d="M66 30 H218 M66 103 H218" fill="none" stroke="#52647b" strokeWidth="2" />
        <text x="38" y="35" fill="#28374b" fontSize="16">|1⟩</text>
        <text x="38" y="108" fill="#28374b" fontSize="16">|0⟩</text>
        <path d="M143 93 V40 M143 40 L137 47 M143 40 L149 47" fill="none" stroke="#3567df" strokeWidth="2" />
        <text x="170" y="69" fill="#3567df" fontSize="15">f₀₁ = {num(frequency, 3)} GHz</text>
      </svg>
      <figcaption>Energy-level spacing · illustrative, not to scale</figcaption>
    </figure>
  );
}

/** Local teaching content always follows the completed, validated snapshot. */
export default function MylaTeachingNote({ topic, snapshot, multiple = false }: MylaTeachingNoteProps) {
  const note = composeLocalMyla(topic, snapshot);
  const paragraphs = note.body.split(/\n+/).filter(Boolean);
  const ready = snapshot.readiness === 'ready' && snapshot.outputs !== null && parseChipSnapshot(snapshot).ok;

  if (!ready) {
    return (
      <article className="myla-panel-note">
        {multiple && <h3>{TOPICS[topic].label}</h3>}
        <Paragraphs paragraphs={paragraphs} />
      </article>
    );
  }

  if (topic === 'junction') {
    return (
      <article className="myla-panel-note">
        {multiple && <div className="myla-panel-note-label">{TOPICS[topic].label}</div>}
        <h3>A tiny gap with a big role</h3>
        <p>Cooper pairs tunnel through a thin barrier. Its nonlinearity lets the first two transitions respond at different frequencies.</p>
        <JunctionDiagram />
        <details className="myla-panel-disclosure">
          <summary><ChevronDown size={16} aria-hidden="true" /> See the math</summary>
          <div className="myla-panel-math">
            <MathText math="I = I_c\sin\varphi" block />
            <dl>
              <div><dt><MathText math="I_c" /></dt><dd>critical current</dd></div>
              <div><dt><MathText math="\varphi" /></dt><dd>phase difference across the junction</dd></div>
            </dl>
            <Paragraphs paragraphs={paragraphs} />
            {snapshot.outputs?.critical_current_na !== undefined && (
              <p><MathText text={`Derived critical current: $I_c=${num(snapshot.outputs.critical_current_na, 2)}\\,\\mathrm{nA}$.`} /></p>
            )}
          </div>
        </details>
      </article>
    );
  }

  if (topic === 'f01') {
    return (
      <article className="myla-panel-note">
        {multiple && <div className="myla-panel-note-label">{TOPICS[topic].label}</div>}
        <h3>The frequency that drives your qubit</h3>
        <p><MathText text="This microwave tone drives the $|0\rangle\to|1\rangle$ transition. It is calculated from your junction and capacitor settings." /></p>
        <FrequencyDiagram frequency={snapshot.outputs!.f01_ghz} />
        <details className="myla-panel-disclosure">
          <summary><ChevronDown size={16} aria-hidden="true" /> See the math</summary>
          <div className="myla-panel-math"><Paragraphs paragraphs={paragraphs} /></div>
        </details>
      </article>
    );
  }

  return (
    <article className="myla-panel-note">
      <h3>{TOPICS[topic].label}</h3>
      <Paragraphs paragraphs={paragraphs} />
    </article>
  );
}
