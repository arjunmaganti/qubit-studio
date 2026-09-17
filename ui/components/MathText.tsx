'use client';

import katex from 'katex';
import { MATH_PARTS, withTex } from '@/lib/math-text';
import 'katex/dist/katex.min.css';

function renderChunk(chunk: string, display: boolean): string {
  try {
    return katex.renderToString(chunk, { displayMode: display, throwOnError: false, trust: false, strict: false });
  } catch {
    return chunk.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
  }
}

export default function MathText({
  text,
  math,
  block = false,
  className = '',
  label,
}: {
  text?: string;
  math?: string;
  block?: boolean;
  className?: string;
  label?: string;
}) {
  if (math !== undefined) {
    const html = renderChunk(math, block);
    const Tag = block ? 'div' : 'span';
    return (
      <Tag
        className={`math-text myla-math${block ? ' math-block myla-math-block' : ''}${className ? ` ${className}` : ''}`}
        aria-label={label}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  const source = withTex(text ?? '');
  const parts = source.split(MATH_PARTS);
  return (
    <>
      {parts.map((part, index) => {
        if ((part.startsWith('$$') && part.endsWith('$$')) || (part.startsWith('\\[') && part.endsWith('\\]'))) {
          return (
            <span
              key={index}
              className="myla-math myla-math-block"
              dangerouslySetInnerHTML={{ __html: renderChunk(part.slice(2, -2), true) }}
            />
          );
        }
        if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
          return (
            <span
              key={index}
              className="myla-math"
              dangerouslySetInnerHTML={{ __html: renderChunk(part.slice(1, -1), false) }}
            />
          );
        }
        if (part.startsWith('\\(') && part.endsWith('\\)')) {
          return (
            <span
              key={index}
              className="myla-math"
              dangerouslySetInnerHTML={{ __html: renderChunk(part.slice(2, -2), false) }}
            />
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
}
