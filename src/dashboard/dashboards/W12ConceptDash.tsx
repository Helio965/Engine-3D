import type { DashboardProps } from '../types';
import { DashDefs, Lamp, Needle, Readout, Ticks, nativeSpeed, scale, sweepFactor } from '../gauge';

/**
 * Volkswagen W12 Syncro (1997) — GENERIC. No legible photo or description of
 * the study's cluster exists, so this is a neutral late-1990s VW-style
 * placeholder: black dials, white numerals, red needles; tachometer,
 * speedometer and small fuel/temperature gauges. It is not a reproduction.
 */
const NEEDLE = '#ff3a1f';

export default function W12ConceptDash({ def, t, powered, sinceIgnition }: DashboardProps) {
  const d = def.dashboard;
  const sweep = sweepFactor(sinceIgnition);
  const rpm = Math.max(t.rpm, sweep * d.tachMaxRpm);
  const speed = Math.max(nativeSpeed(Math.abs(t.speedKmh), d.speedoUnit), sweep * d.speedoMaxNative);
  const lit = powered ? 1 : 0.4;
  const a0 = -125;
  const a1 = 125;
  return (
    <svg className="dash-svg" viewBox="0 0 440 210" role="img" aria-label={`Painel genérico W12: ${Math.round(t.rpm)} rpm, ${Math.round(Math.abs(t.speedKmh))} km/h`}>
      <DashDefs id="W" />
      <rect width="440" height="210" rx="26" fill="#17181a" />
      <rect x="8" y="8" width="424" height="194" rx="22" fill="#0b0b0c" stroke="#2c2d30" />
      <Readout x={220} y={22} size={6} color="#c9a700" weight={800}>
        PAINEL GENÉRICO · SEM REFERÊNCIA DO ESTUDO DE 1997
      </Readout>
      <g opacity={lit}>
        <circle cx="132" cy="112" r="78" fill="#050505" stroke="#2f3034" strokeWidth="2" />
        <Ticks cx={132} cy={112} s={{ min: 0, max: d.tachMaxRpm, major: 1000, minor: 500, a0, a1, r: 72, majorLen: 9, minorLen: 4, width: 2, label: (v) => String(v / 1000), fontSize: 13, fontWeight: 500, redFrom: d.tachRedlineStartRpm }} />
        <Readout x={132} y={146} size={6.5} color="#a9aaad" weight={600}>
          1/min ×1000
        </Readout>
        <Needle cx={132} cy={112} angle={scale(rpm, 0, d.tachMaxRpm, a0, a1)} length={66} width={2.8} color={NEEDLE} hub={8} hubColor="#151515" />

        <circle cx="308" cy="112" r="78" fill="#050505" stroke="#2f3034" strokeWidth="2" />
        <Ticks cx={308} cy={112} s={{ min: 0, max: d.speedoMaxNative, major: 20, minor: 10, a0, a1, r: 72, majorLen: 8, minorLen: 4, width: 1.6, label: (v) => (v % 40 === 0 ? String(v) : null), fontSize: 10, fontWeight: 500 }} />
        <Readout x={308} y={146} size={6.5} color="#a9aaad" weight={600}>
          km/h
        </Readout>
        <Readout x={308} y={160} size={9} color="#e8e8ea" mono>
          {t.gearLabel}
        </Readout>
        <Needle cx={308} cy={112} angle={scale(speed, 0, d.speedoMaxNative, a0, a1)} length={66} width={2.8} color={NEEDLE} hub={8} hubColor="#151515" />

        <Small cx={220} cy={72} value={t.coolantC} min={50} max={130} label="°C" />
        <Small cx={220} cy={142} value={t.fuelFraction} min={0} max={1} label="FUEL" />
        <Lamp x={220} y={185} on={t.lowFuel} color="#ffb21f" label="RESERVA" />
        <Lamp x={60} y={190} on={t.limiter} color="#ff3a1f" label="LIMITE" blink />
      </g>
    </svg>
  );
}

function Small({ cx, cy, value, min, max, label }: { cx: number; cy: number; value: number; min: number; max: number; label: string }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={24} fill="#050505" stroke="#2f3034" />
      <Ticks cx={cx} cy={cy} s={{ min, max, major: (max - min) / 2, minor: (max - min) / 8, a0: -100, a1: 100, r: 20, majorLen: 4, minorLen: 2, width: 1.2 }} />
      <Readout x={cx} y={cy + 12} size={5.5} color="#a9aaad" weight={700}>
        {label}
      </Readout>
      <Needle cx={cx} cy={cy} angle={scale(value, min, max, -100, 100)} length={18} width={1.8} color={NEEDLE} hub={3} hubColor="#151515" />
    </g>
  );
}
