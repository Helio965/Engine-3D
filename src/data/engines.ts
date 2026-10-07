import type { EngineDefinition, EngineId } from '../types/engine';
import { bugattiVeyron } from './engines/bugattiVeyron';
import { bugattiChiron } from './engines/bugattiChiron';
import { nissanSkylineR34 } from './engines/nissanSkylineR34';
import { bmwM5E60 } from './engines/bmwM5E60';
import { dodgeChallengerHellcat } from './engines/dodgeChallengerHellcat';
import { chevroletZz632 } from './engines/chevroletZz632';
import { ferrari458Italia } from './engines/ferrari458Italia';
import { ferrari812Superfast } from './engines/ferrari812Superfast';
import { vwW12Concept } from './engines/vwW12Concept';

/**
 * Engine catalogue. To add an engine: create a data file in ./engines/
 * (verified specs + sources), a 3D exterior in src/engine/models/, a
 * dashboard style, then register it here and in src/engine/models/index.ts.
 */
export const ENGINES: EngineDefinition[] = [
  bugattiVeyron,
  bugattiChiron,
  nissanSkylineR34,
  bmwM5E60,
  dodgeChallengerHellcat,
  chevroletZz632,
  ferrari458Italia,
  ferrari812Superfast,
  vwW12Concept,
];

export const ENGINE_BY_ID = Object.fromEntries(ENGINES.map((e) => [e.id, e])) as Record<EngineId, EngineDefinition>;

export function getEngine(id: EngineId): EngineDefinition {
  return ENGINE_BY_ID[id] ?? ENGINES[0];
}
