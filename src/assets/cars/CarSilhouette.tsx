import { useId } from 'react';
import type { EngineId } from '../../types/engine';
import { CAR_PROFILES, GROUND, bodyPath, type Wheel } from './profiles';
import { CrateEngineStand } from './CrateEngineStand';

const CRATE_LABEL = 'Crate engine em suporte — não é um veículo';
/** Five-spoke rim: unit vectors scaled to 60 % of the tyre radius. */
const SPOKES = [0, 72, 144, 216, 288].map((deg) => {
  const a = ((deg - 90) * Math.PI) / 180;
  return [0.6 * Math.cos(a), 0.6 * Math.sin(a)];
});

function WheelShape({ w }: { w: Wheel }) {
  const cy = GROUND - w.r;
  return (
    <g>
      <circle cx={w.x} cy={cy} r={w.r} fill="#0a0a0c" stroke="#2c2e34" strokeWidth={0.6} />
      <circle cx={w.x} cy={cy} r={w.r * 0.66} fill="#1d1f24" stroke="#7a808a" strokeWidth={0.7} />
      <path d={SPOKES.map(([dx, dy]) => `M${w.x} ${cy} l${dx * w.r} ${dy * w.r}`).join(' ')} stroke="#454950" strokeWidth={1.3} />
      <circle cx={w.x} cy={cy} r={1.6} fill="#9aa0a8" />
    </g>
  );
}

/**
 * Original side-profile silhouettes (hand-drawn SVG, no photos or logos) so the
 * user can tell which car each engine belongs to. The ZZ632 is a crate engine,
 * so it is drawn on an engine stand instead of in a car.
 */
export function CarSilhouette({ id, accent = '#ff6a1f' }: { id: EngineId; accent?: string }) {
  const uid = useId().replace(/[^\w-]/g, '');
  const paint = `paint-${uid}`;
  const glass = `glass-${uid}`;
  const p = id === 'chevrolet-zz632' ? undefined : CAR_PROFILES[id];
  const label = p?.name ?? CRATE_LABEL;
  return (
    <svg viewBox="0 0 240 70" role="img" aria-label={label}>
      <title>{label}</title>
      <defs>
        <linearGradient id={paint} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#40444d" />
          <stop offset="0.45" stopColor="#2a2d33" />
          <stop offset="1" stopColor="#141518" />
        </linearGradient>
        <linearGradient id={glass} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1c2027" />
          <stop offset="1" stopColor="#060708" />
        </linearGradient>
      </defs>
      {p ? (
        <g>
          <ellipse cx={(p.front.x + p.rear.x) / 2} cy={GROUND + 0.6} rx={(p.rear.x - p.front.x) / 2 + 40} ry={2.4} fill="#000" opacity={0.55} />
          <g fill={`url(#${paint})`} stroke={accent} strokeWidth={0.9} strokeLinejoin="round">
            <path d={bodyPath(p)} />
            {p.extras && <path d={p.extras} />}
          </g>
          <path d={p.glass} fill={`url(#${glass})`} stroke="#050506" strokeWidth={0.5} />
          {p.vents && <path d={p.vents} fill="#07080a" />}
          {p.seams && <path d={p.seams} fill="none" stroke="#0b0c0e" strokeWidth={0.6} />}
          {p.metal && <path d={p.metal} fill="#8a9099" />}
          <path d={p.highlight} fill="none" stroke="#fff" strokeOpacity={0.28} strokeWidth={1} strokeLinecap="round" />
          <path d={p.feature} fill="none" stroke={accent} strokeOpacity={0.8} strokeWidth={p.featureWidth ?? 0.8} strokeLinecap="round" />
          <WheelShape w={p.front} />
          <WheelShape w={p.rear} />
        </g>
      ) : (
        <CrateEngineStand accent={accent} metal={paint} />
      )}
    </svg>
  );
}
