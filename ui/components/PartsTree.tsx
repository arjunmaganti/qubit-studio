'use client';

import { ILLUSTRATIVE_PARTS, MODELED_PARTS } from '@/lib/parts';
import type { Part, PartId } from '@/lib/parts';
import MathText from '@/components/MathText';
import { PARAMS } from '@/lib/params';

interface PartsTreeProps {
  selected: PartId | null;
  hiddenParts: PartId[];
  onSelect: (id: PartId) => void;
  onToggleVisible: (id: PartId) => void;
}

export default function PartsTree({ selected, hiddenParts, onSelect, onToggleVisible }: PartsTreeProps) {
  const row = (part: Part) => {
    const hidden = hiddenParts.includes(part.id);
    return (
      <div key={part.id} style={{ display: 'flex' }} data-tour={`part-${part.id}`}>
        <button
          type="button"
          className={`tree-row${part.modeled ? '' : ' dim'}`}
          aria-pressed={selected === part.id}
          onClick={() => onSelect(part.id)}
        >
          <span className="swatch" style={{ background: part.color, opacity: hidden ? 0.3 : 1 }} />
          <span className="label" style={hidden ? { opacity: 0.45 } : undefined}>
            {part.name}
          </span>
          <span className="tag">{part.param ? <MathText math={PARAMS[part.param].symbol} /> : 'context'}</span>
        </button>
          <button
            type="button"
            className="eye"
            aria-label={`${hidden ? 'Show' : 'Hide'} ${part.name}`}
            title={`${hidden ? 'Show' : 'Hide'} in views`}
            onClick={(event) => {
              event.stopPropagation();
              onToggleVisible(part.id);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                event.stopPropagation();
                onToggleVisible(part.id);
              }
            }}
          >
            {hidden ? '◌' : '◉'}
          </button>
      </div>
    );
  };

  return (
    <div className="tree" role="group" aria-label="Parts tree">
      <div className="tree-group">Transmon qubit</div>
      {MODELED_PARTS.map(row)}
      <div className="tree-group">Context, not modelled</div>
      {ILLUSTRATIVE_PARTS.map(row)}
    </div>
  );
}
