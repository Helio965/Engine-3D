import { createContext, useContext } from 'react';
import type * as THREE from 'three';
import type { EngineDefinition } from '../types/engine';
import type { EngineLayout } from '../simulation/cylinderLayout';
import type { MaterialLibrary } from './materials';
import type { EngineDims } from './dims';

export interface EngineModelContext {
  def: EngineDefinition;
  layout: EngineLayout;
  dims: EngineDims;
  lib: MaterialLibrary;
  quality: 'low' | 'medium' | 'high' | 'ultra';
  /** Radial segment count scaled by graphics quality (geometry LOD). */
  seg: (base: number) => number;
  /** Shared geometry cache, disposed when the engine is unloaded. */
  geo: <T extends THREE.BufferGeometry>(key: string, make: () => T) => T;
}

export const EngineCtx = createContext<EngineModelContext | null>(null);

export function useEngine(): EngineModelContext {
  const c = useContext(EngineCtx);
  if (!c) throw new Error('useEngine must be used inside <EngineCtx.Provider>');
  return c;
}
