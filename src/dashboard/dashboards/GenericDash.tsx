import type { DashboardProps } from '../types';
import { Bar, Needle, Ticks, nativeSpeed, scale, sweepFactor } from '../gauge';

/** Neutral two-dial cluster (fallback). */
export default function GenericDash({ def, t, powered, sinceIgnition }: DashboardProps) {
  const d = def.dashboard;
  const sweep = sweepFactor(sinceIgnition);
  const rpm = Math.max(t.rpm, sweep * d.tachMaxRpm);
  const spd = Math.max(nativeSpeed(Math.abs(t.speedKmh), d.speedoUnit), sweep * d.speedoMaxNative);
  const a0 = -135;
  const a1 = 135;
  const lit = powered ? 1 : 0.35;
  return (
    <svg viewBox="0 0 340 200" width="100%" role="img" aria-label={`Conta-giros ${Math.round(t.rpm)} rpm, velocidade ${Math.round(Math.abs(t.speedKmh))} km/h`}>
      <rect x="0" y="0" width="340" height="200" rx="14" fill="#0a0b0d" />
      <g opacity={lit}>
        <circle cx="90" cy="100" r="80" fill="#121317" stroke="#2a2c31" />
        <Ticks cx={90} cy={100} s={{ min: 0, max: d.tachMaxRpm, major: 1000, minor: 500, a0, a1, r: 74, label: (v) => String(v / 1000), redFrom: d.tachRedlineStartRpm, fontSize: 11 }} />
        <text x="90" y="140" textAnchor="middle" fill="#8b8a86" fontSize="9">
          ×1000 rpm
        </text>
        <Needle cx={90} cy={100} angle={scale(rpm, 0, d.tachMaxRpm, a0, a1)} length={66} color="#ff5a1f" />
        <circle cx="250" cy="100" r="80" fill="#121317" stroke="#2a2c31" />
        <Ticks cx={250} cy={100} s={{ min: 0, max: d.speedoMaxNative, major: d.speedoMaxNative > 300 ? 50 : 20, minor: 10, a0, a1, r: 74, label: (v) => String(v), fontSize: 9.5 }} />
        <text x="250" y="140" textAnchor="middle" fill="#8b8a86" fontSize="9">
          {d.speedoUnit === 'mph' ? 'mph' : 'km/h'}
        </text>
        <Needle cx={250} cy={100} angle={scale(spd, 0, d.speedoMaxNative, a0, a1)} length={66} color="#ff5a1f" />
        <text x="170" y="96" textAnchor="middle" fill="#e9e6df" fontSize="20" fontWeight="700" fontFamily="monospace">
          {t.gearLabel}
        </text>
        <Bar x={150} y={150} w={40} h={6} frac={t.fuelFraction} color={t.lowFuel ? '#ff4d4d' : '#e9e6df'} />
        <text x="170" y="170" textAnchor="middle" fill="#8b8a86" fontSize="8">
          FUEL
        </text>
      </g>
    </svg>
  );
}
