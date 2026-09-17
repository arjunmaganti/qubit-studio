import path from 'node:path';
import type { NextConfig } from 'next';
import { PHASE_DEVELOPMENT_SERVER } from 'next/constants';

export default function nextConfig(phase: string): NextConfig {
  return {
    // A production build must not erase the live dev server's compiled assets.
    distDir: phase === PHASE_DEVELOPMENT_SERVER ? '.next-dev' : '.next',
    // Keep Turbopack scoped to this app; the parent directory is not a workspace root.
    turbopack: { root: path.resolve('.') },
  };
}
