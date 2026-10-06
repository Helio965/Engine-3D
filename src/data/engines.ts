import type { EngineDefinition, EngineId } from '../types/engine';
import { bugattiVeyron } from './engines/bugattiVeyron';
import { bugattiChiron } from './engines/bugattiChiron';

/**
 * Engine catalogue. To add an engine: create a data file in ./engines/
 * (verified specs + sources), a 3D exterior in src/engine/models/, a
 * dashboard style, then register it here and in src/engine/models/index.ts.
 */
export const ENGINES: EngineDefinition[] = [bugattiVeyron, bugattiChiron];

export const ENGINE_BY_ID = Object.fromEntries(ENGINES.map((e) => [e.id, e])) as Record<EngineId, EngineDefinition>;

export function getEngine(id: EngineId): EngineDefinition {
  return ENGINE_BY_ID[id] ?? ENGINES[0];
}
