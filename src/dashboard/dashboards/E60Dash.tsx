import type { DashboardProps } from '../types';
import { Band, DashDefs, Lamp, Needle, Readout, Ticks, nativeSpeed, scale, sweepFactor } from '../gauge';

/**
 * BMW M5 E60 — two large round dials with black faces, white numerals,
 * permanently white illumination with a white "corona" ring and M-red
 * needles. Speedometer (330 km/h, estimated) with the fuel gauge at the
 * bottom; rev counter (9,000 rpm, estimated) with the oil-temperature-
 * dependent yellow/red pre-warning field and the oil-temperature gauge at the
 * bottom; centre LCD with the SMG gear and Drivelogic programme.
 */
const M_RED = '#ff2a1a';
const WHITE = '#f1f2f4';

/**
 * Recommended maximum engine speed as a function of oil temperature. BMW
 * documents the behaviour (the field moves as the oil warms) but not the
 * calibration: the values here are illustrative.
 */
export function e60WarningRpm(oilC: number, governed: number): number {
  const k = Math.min(1, Math.max(0, (oilC - 30) / 50));
  return 4500 + (governed - 4500) * k;
}

export default function E60Dash({ def, t, powered, sinceIgnition }: DashboardProps) {
  const d = def.dashboard;
  const sweep = sweepFactor(sinceIgnition);
  const rpm = Math.max(t.rpm, sweep * d.tachMaxRpm);
  const speed = Math.max(nativeSpeed(Math.abs(t.speedKmh), d.speedoUnit), sweep * d.speedoMaxNative);
  const lit = powered ? 1 : 0.35;
  const warn = e60WarningRpm(t.oilC, def.performance.revLimitRpm);
  const a0 = -130;
  const a1 = 130;
  const programme = t.mode !== 'drive' ? 'N' : t.gearMode === 'manual' ? 'S' : 'D';

  return (
    <svg className="dash-svg" viewBox="0 0 440 210" role="img" aria-label={`Painel M5: ${Math.round(Math.abs(t.speedKmh))} km/h, ${Math.round(t.rpm)} rpm, marcha ${t.gearLabel}, rotação recomendada ${Math.round(warn)} rpm`}>
      <DashDefs id="E" />
      <rect width="440" height="210" rx="16" fill="#0b0b0c" />
      <g opacity={lit}>
        {/* speedometer */}
        <circle cx="112" cy="104" r="90" fill="none" stroke={powered ? 'rgba(235,240,255,0.55)' : '#2b2c2f'} strokeWidth="1.6" />
        <circle cx="112" cy="104" r="86" fill="#050505" />
        <Ticks cx={112} cy={104} s={{ min: 0, max: d.speedoMaxNative, major: 20, minor: 10, a0, a1, r: 82, majorLen: 8, minorLen: 4, width: 1.6, label: (v) => (v % 40 === 0 ? String(v) : null), fontSize: 9.5, fontWeight: 500, color: WHITE }} />
        <Readout x={112} y={76} size={6.5} color="#c8cacd" weight={500}>
          km/h
        </Readout>
        {/* fuel gauge at the bottom */}
        <Ticks cx={112} cy={104} s={{ min: 0, max: 1, major: 0.5, minor: 0.25, a0: 205, a1: 155, r: 52, majorLen: 4, minorLen: 2, width: 1.2, color: WHITE }} />
        <Needle cx={112} cy={104} angle={scale(t.fuelFraction, 0, 1, 205, 155)} length={50} tail={-0.75} width={1.6} color={t.lowFuel ? '#ffb21f' : M_RED} hub={0} />
        <Readout x={112} y={142} size={5.5} color="#8d8f93" weight={700}>
          FUEL
        </Readout>
        <Needle cx={112} cy={104} angle={scale(speed, 0, d.speedoMaxNative, a0, a1)} length={78} width={2.6} color={M_RED} hub={9} hubColor="#121212" glow={powered ? M_RED : undefined} />

        {/* rev counter with variable pre-warning field */}
        <circle cx="328" cy="104" r="90" fill="none" stroke={powered ? 'rgba(235,240,255,0.55)' : '#2b2c2f'} strokeWidth="1.6" />
        <circle cx="328" cy="104" r="86" fill="#050505" />
        <Band cx={328} cy={104} r={74} w={5} from={Math.max(0, warn - 750)} to={warn} min={0} max={d.tachMaxRpm} a0={a0} a1={a1} color="#f2c21b" />
        <Band cx={328} cy={104} r={74} w={5} from={warn} to={d.tachMaxRpm} min={0} max={d.tachMaxRpm} a0={a0} a1={a1} color="#e0261b" />
        <Ticks cx={328} cy={104} s={{ min: 0, max: d.tachMaxRpm, major: 1000, minor: 500, a0, a1, r: 82, majorLen: 8, minorLen: 4, width: 1.8, label: (v) => String(v / 1000), fontSize: 12, fontWeight: 500, color: WHITE }} />
        <Readout x={328} y={76} size={6.5} color="#c8cacd" weight={500}>
          1/min ×1000
        </Readout>
        {/* oil-temperature gauge at the bottom */}
        <Ticks cx={328} cy={104} s={{ min: 50, max: 150, major: 50, minor: 25, a0: 205, a1: 155, r: 52, majorLen: 4, minorLen: 2, width: 1.2, color: WHITE }} />
        <Needle cx={328} cy={104} angle={scale(t.oilC, 50, 150, 205, 155)} length={50} tail={-0.75} width={1.6} color={M_RED} hub={0} />
        <Readout x={328} y={142} size={5.5} color="#8d8f93" weight={700}>
          OIL °C
        </Readout>
        <Needle cx={328} cy={104} angle={scale(rpm, 0, d.tachMaxRpm, a0, a1)} length={78} width={2.6} color={M_RED} hub={9} hubColor="#121212" glow={powered ? M_RED : undefined} />

        {/* centre: lamps, LCD with SMG gear + Drivelogic */}
        <rect x="196" y="120" width="48" height="56" rx="4" fill="#120c06" stroke="#2c241b" />
        <Readout x={220} y={140} size={20} color="#ff9b30" mono>
          {t.gearLabel}
        </Readout>
        <Readout x={220} y={160} size={7} color="#ff9b30" weight={700} mono>
          {programme}
        </Readout>
        <Readout x={220} y={170} size={5} color="#9b7a52" weight={600}>
          SMG · DRIVELOGIC
        </Readout>
        <Lamp x={220} y={40} on={t.lowFuel} color="#ffb21f" label="FUEL" />
        <Lamp x={220} y={54} on={t.limiter} color="#ff2a1a" label="8250" blink />
        <Readout x={220} y={100} size={10} color="#e8e8ea" weight={900}>
          M
        </Readout>
      </g>
    </svg>
  );
}
