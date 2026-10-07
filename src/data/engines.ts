import type { EngineDefinition, EngineId } from '../types/engine';
import { bugattiVeyron } from './engines/bugattiVeyron';
import { bugattiChiron } from './engines/bugattiChiron';
import { nissanSkylineR34 } from './engines/nissanSkylineR34';
import { bmwM5E60 } from './engines/bmwM5E60';
import { provisional458, provisional812, provisionalHellcat, provisionalW12, provisionalZz632 } from './engines/provisional';

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
  provisionalHellcat,
  provisionalZz632,
  provisional458,
  provisional812,
  provisionalW12,
];

export const ENGINE_BY_ID = Object.fromEntries(ENGINES.map((e) => [e.id, e])) as Record<EngineId, EngineDefinition>;

export function getEngine(id: EngineId): EngineDefinition {
  return ENGINE_BY_ID[id] ?? ENGINES[0];
}
