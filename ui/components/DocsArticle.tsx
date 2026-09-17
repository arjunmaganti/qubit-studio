'use client';

import Link from 'next/link';
import { Blocks } from 'lucide-react';
import MathText from '@/components/MathText';
import { DOCS_SECTIONS, type DocsBlock } from '@/lib/studio-docs';

function Block({ block }: { block: DocsBlock }) {
  if (block.type === 'p') {
    return (
      <p>
        <MathText text={block.text} />
      </p>
    );
  }
  if (block.type === 'eq') {
    return (
      <figure className="docs-eq">
        <MathText math={block.tex} block />
        {block.caption && (
          <figcaption>
            <MathText text={block.caption} />
          </figcaption>
        )}
      </figure>
    );
  }
  if (block.type === 'note') {
    return (
      <aside className="docs-note">
        <MathText text={block.text} />
      </aside>
    );
  }
  return (
    <ul>
      {block.items.map((item) => (
        <li key={item}>
          <MathText text={item} />
        </li>
      ))}
    </ul>
  );
}

export default function DocsArticle() {
  return (
    <div className="docs-shell">
      <header className="docs-top">
        <Link href="/" className="docs-brand">
          <Blocks size={22} strokeWidth={1.8} />
          Qubit Studio
        </Link>
        <span className="docs-kicker">Notes</span>
        <Link href="/" className="btn primary">
          Open studio
        </Link>
      </header>
      <div className="docs-layout">
        <nav className="docs-toc" aria-label="On this page">
          <strong>On this page</strong>
          <ol>
            {DOCS_SECTIONS.map((section) => (
              <li key={section.id}>
                <a href={`#${section.id}`}>{section.title}</a>
              </li>
            ))}
          </ol>
        </nav>
        <article className="docs-article">
          <p className="docs-lead">
            Quantum computing, the transmon, and what this site actually solves.
          </p>
          {DOCS_SECTIONS.map((section) => (
            <section key={section.id} id={section.id}>
              <h2>{section.title}</h2>
              {section.blocks.map((block, index) => (
                <Block key={index} block={block} />
              ))}
            </section>
          ))}
        </article>
      </div>
    </div>
  );
}
