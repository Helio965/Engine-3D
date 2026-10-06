import type { ReactNode } from 'react';

/**
 * Vector instrument toolkit shared by all dashboards (SVG, no photos).
 * Angles are in degrees, 0 = 12 o'clock, clockwise positive.
 */

export const polar = (cx: number, cy: number, r: number, deg: number): [number, number] => {
  const a = ((deg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
};

export function arcPath(cx: number, cy: number, r: number, a0: number, a1: number): string {
  const [x0, y0] = polar(cx, cy, r, a0);
  const [x1, y1] = polar(cx, cy, r, a1);
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
  const sweep = a1 > a0 ? 1 : 0;
  return `M${x0.toFixed(2)},${y0.toFixed(2)} A${r},${r} 0 ${large} ${sweep} ${x1.toFixed(2)},${y1.toFixed(2)}`;
}

/** Linear value → angle mapping. */
export const scale = (v: number, min: number, max: number, a0: number, a1: number) => a0 + ((Math.min(max, Math.max(min, v)) - min) / (max - min)) * (a1 - a0);

export interface TickSpec {
  min: number;
  max: number;
  major: number;
  minor?: number;
  a0: number;
  a1: number;
  r: number;
  majorLen?: number;
  minorLen?: number;
  color?: string;
  width?: number;
  label?: (v: number) => string | null;
  labelR?: number;
  fontSize?: number;
  fontWeight?: number;
  fontFamily?: string;
  labelColor?: string;
  /** Values from which ticks are coloured `redColor`. */
  redFrom?: number;
  redColor?: string;
}

export function Ticks({ cx, cy, s }: { cx: number; cy: number; s: TickSpec }) {
  const out: ReactNode[] = [];
  const minor = s.minor ?? s.major / 5;
  const n = Math.round((s.max - s.min) / minor);
  for (let i = 0; i <= n; i++) {
    const v = s.min + i * minor;
    const isMajor = Math.abs((v - s.min) / s.major - Math.round((v - s.min) / s.major)) < 1e-6;
    const a = scale(v, s.min, s.max, s.a0, s.a1);
    const len = isMajor ? s.majorLen ?? 10 : s.minorLen ?? 5;
    const [x0, y0] = polar(cx, cy, s.r, a);
    const [x1, y1] = polar(cx, cy, s.r - len, a);
    const red = s.redFrom !== undefined && v >= s.redFrom;
    out.push(
      <line
        key={`t${i}`}
        x1={x0}
        y1={y0}
        x2={x1}
        y2={y1}
        stroke={red ? s.redColor ?? '#ff3b30' : s.color ?? '#e9e6df'}
        strokeWidth={isMajor ? s.width ?? 2 : (s.width ?? 2) * 0.55}
        strokeLinecap="butt"
      />,
    );
    if (isMajor && s.label) {
      const text = s.label(v);
      if (text !== null) {
        const [lx, ly] = polar(cx, cy, s.labelR ?? s.r - len - (s.fontSize ?? 12) * 0.95, a);
        out.push(
          <text
            key={`l${i}`}
            x={lx}
            y={ly}
            fill={red ? s.redColor ?? '#ff3b30' : s.labelColor ?? s.color ?? '#e9e6df'}
            fontSize={s.fontSize ?? 12}
            fontWeight={s.fontWeight ?? 600}
            fontFamily={s.fontFamily ?? '"Helvetica Neue", Arial, sans-serif'}
            textAnchor="middle"
            dominantBaseline="central"
          >
            {text}
          </text>,
        );
      }
    }
  }
  return <g>{out}</g>;
}

export function Needle({
  cx,
  cy,
  angle,
  length,
  tail = 0.18,
  width = 3,
  color = '#ff5a1f',
  hub = 8,
  hubColor = '#1a1a1a',
  glow,
}: {
  cx: number;
  cy: number;
  angle: number;
  length: number;
  tail?: number;
  width?: number;
  color?: string;
  hub?: number;
  hubColor?: string;
  glow?: string;
}) {
  return (
    <g transform={`rotate(${angle} ${cx} ${cy})`}>
      {glow && <line x1={cx} y1={cy + length * tail} x2={cx} y2={cy - length} stroke={glow} strokeWidth={width * 3} strokeLinecap="round" opacity={0.25} />}
      <path d={`M${cx - width / 2},${cy + length * tail} L${cx - width * 0.25},${cy - length} L${cx + width * 0.25},${cy - length} L${cx + width / 2},${cy + length * tail} Z`} fill={color} />
      <circle cx={cx} cy={cy} r={hub} fill={hubColor} stroke="rgba(255,255,255,0.15)" />
    </g>
  );
}

/** Smoothly animated value hook-less helper: dashboards receive 30 Hz telemetry and use CSS transitions. */
export const needleStyle = { transition: 'transform 60ms linear' } as const;

/** Needle-sweep self-test on ignition (common on modern clusters): returns 0→1→0 in ~1.6 s. */
export function sweepFactor(sinceIgnition: number): number {
  if (sinceIgnition < 0 || sinceIgnition > 1.6) return 0;
  return sinceIgnition < 0.8 ? sinceIgnition / 0.8 : 1 - (sinceIgnition - 0.8) / 0.8;
}

export function Bar({ x, y, w, h, frac, color, bg = 'rgba(255,255,255,0.08)', vertical = false }: { x: number; y: number; w: number; h: number; frac: number; color: string; bg?: string; vertical?: boolean }) {
  const f = Math.max(0, Math.min(1, frac));
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={Math.min(w, h) / 2} fill={bg} />
      {vertical ? (
        <rect x={x} y={y + h * (1 - f)} width={w} height={h * f} rx={Math.min(w, h) / 2} fill={color} />
      ) : (
        <rect x={x} y={y} width={w * f} height={h} rx={Math.min(w, h) / 2} fill={color} />
      )}
    </g>
  );
}

/** Speed in the dashboard's native unit. */
export const nativeSpeed = (kmh: number, unit: 'kmh' | 'mph') => (unit === 'mph' ? kmh / 1.609344 : kmh);
