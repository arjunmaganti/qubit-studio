import type { Metadata } from 'next';
import DocsArticle from '@/components/DocsArticle';

export const metadata: Metadata = {
  title: 'Notes · Qubit Studio',
  description:
    'Quantum computing, the isolated-transmon Hamiltonian, and what Qubit Studio computes — and does not.',
};

export default function DocsPage() {
  return <DocsArticle />;
}
