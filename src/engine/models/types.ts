import type { ComponentType } from 'react';
import type { EngineModelContext } from '../EngineContext';
import type { ValvetrainConfig } from '../parts/Internals';
import type { Vec3 } from '../parts/Plumbing';

/** Paths (engine space, metres) followed by the flow-visualisation particles. */
export interface FlowPaths {
  air: Vec3[][];
  fuel: Vec3[][];
  exhaust: Vec3[][];
  coolant: Vec3[][];
}

export type AnchorName = 'intake' | 'exhaust' | 'induction' | 'pistons' | 'crankshaft' | 'fuel' | 'valvetrain' | 'front';

export interface ModelMeta {
  valvetrain: ValvetrainConfig;
  /** Points of interest used by the camera presets and the guided tour. */
  anchors: (ctx: EngineModelContext) => Partial<Record<AnchorName, Vec3>>;
  flows: (ctx: EngineModelContext) => FlowPaths;
  /** Where the fuel feed line reaches the engine (fuel rail inlet). */
  fuelInlet: (ctx: EngineModelContext) => Vec3;
  /** Approximate overall bounding size (m) used to frame the camera. */
  size: (ctx: EngineModelContext) => Vec3;
}

export interface EngineModelModule {
  default: ComponentType;
  meta: ModelMeta;
}
