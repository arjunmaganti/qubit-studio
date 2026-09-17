'use client';
import { createContext } from 'react';
import type { PartId } from '@/lib/parts';
/** Presentation bridge only; the page continues to own device selection and parameters. */
export const HardwareContext = createContext<{active:boolean;onSelect:(part:PartId)=>void;hiddenPartsOverride?:PartId[]}|null>(null);
