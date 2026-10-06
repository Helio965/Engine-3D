import type { CategoryState, PartCategory } from './materials';
import type { Highlight, ViewMode } from '../state/appStore';

const ALL: PartCategory[] = [
  'block',
  'head',
  'cover',
  'induction',
  'exhaust',
  'accessory',
  'rotating',
  'valvetrain',
  'liner',
  'fuel',
  'turbo',
  'supercharger',
  'combustion',
  'flow',
];

const S = (visible: boolean, opacity = 1, clip = false, ghost = false): CategoryState => ({ visible, opacity, clip, ghost });

/**
 * Visibility/opacity/clipping of every part category for a view mode.
 * This single table defines what each visualisation button shows.
 */
export function categoryStates(
  mode: ViewMode,
  housingOpacity: number,
  highlight: Highlight,
  showFuel: boolean,
): Record<PartCategory, CategoryState> {
  const out = {} as Record<PartCategory, CategoryState>;
  for (const c of ALL) out[c] = S(true);
  out.liner = S(false);
  out.fuel = S(showFuel);
  out.flow = S(true);
  out.combustion = S(true);

  switch (mode) {
    case 'transparent': {
      const o = Math.max(0.02, housingOpacity);
      for (const c of ['block', 'head', 'cover', 'induction', 'exhaust', 'accessory', 'turbo', 'supercharger'] as PartCategory[]) {
        out[c] = S(o > 0.021, o, false, o < 0.5);
      }
      out.liner = S(o < 0.95);
      break;
    }
    case 'cutaway':
      for (const c of ['block', 'head', 'cover', 'induction', 'exhaust', 'accessory', 'turbo', 'supercharger', 'liner'] as PartCategory[]) {
        out[c] = S(true, 1, true);
      }
      out.liner = S(true, 1, true);
      break;
    case 'internals':
      out.block = S(true, 0.07, false, true);
      out.head = S(true, 0.07, false, true);
      out.cover = S(false);
      out.induction = S(false);
      out.exhaust = S(false);
      out.accessory = S(false);
      out.turbo = S(false);
      out.supercharger = S(false);
      out.liner = S(true);
      break;
    case 'pistons':
      for (const c of ['block', 'head', 'cover', 'induction', 'exhaust', 'accessory', 'turbo', 'supercharger'] as PartCategory[]) {
        out[c] = S(false);
      }
      out.liner = S(true);
      break;
    default:
      break;
  }

  if (highlight === 'turbos' || highlight === 'supercharger') {
    const keep: PartCategory = highlight === 'turbos' ? 'turbo' : 'supercharger';
    for (const c of ['block', 'head', 'cover', 'induction', 'exhaust', 'accessory'] as PartCategory[]) {
      out[c] = S(true, 0.1, false, true);
    }
    out[highlight === 'turbos' ? 'supercharger' : 'turbo'] = S(true, 0.1, false, true);
    out[keep] = S(true, 1);
    out.liner = S(false);
  }
  return out;
}
