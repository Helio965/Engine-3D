import type { EngineId } from '../../types/engine';
import type { EngineModelModule } from './types';

/**
 * Exterior model per engine, code-split: only the selected engine's module is
 * downloaded and built.
 */
export const modelLoaders: Record<EngineId, () => Promise<EngineModelModule>> = {
  'bugatti-veyron': () => import('./bugattiVeyron'),
  'bugatti-chiron': () => import('./bugattiChiron'),
  'nissan-skyline-r34': () => import('./nissanRb26'),
  'bmw-m5-e60': () => import('./bmwS85'),
  'dodge-challenger-hellcat': () => import('./dodgeHellcat'),
  'chevrolet-zz632': () => import('./chevroletZz632'),
  'ferrari-458-italia': () => import('./ferrari458'),
  'ferrari-812-superfast': () => import('./ferrari812'),
  'vw-w12-concept': () => import('./vwW12'),
};
