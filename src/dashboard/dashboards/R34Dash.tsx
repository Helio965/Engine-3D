import type { DashboardProps } from '../types';
import { Band, Bar, DashDefs, Lamp, Needle, Readout, Ticks, nativeSpeed, relativeManifold, scale, sweepFactor } from '../gauge';

/**
 * Nissan Skyline GT-R R34 — hooded binnacle: 180 km/h speedometer (JDM) on
 * the left, large central tachometer 0–10, boost gauge on the right, small
 * fuel and coolant gauges; black faces, white numerals, red-orange needles.
 * Plus the centre-console multi-function display (MFD) with boost, oil and
 * water temperature and throttle opening.
 */
const NEEDLE = '#ff4a1c';
const FACE = '#0a0a0a';

export default function R34Dash({ def, t, powered, sinceIgnition }: DashboardProps) {
  const d = def.dashboard;
  const sweep = sweepFactor(sinceIgnition);
  const rpm = Math.max(t.rpm, sweep * d.tachMaxRpm);
  const speed = Math.max(nativeSpeed(Math.abs(t.speedKmh), d.speedoUnit), sweep * d.speedoMaxNative);
  const boost = t.running ? relativeManifold(t.manifoldBar) : 0;
  const lit = powered ? 1 : 0.4;
  const mfd = powered ? 1 : 0.08;

  return (
    <svg className="dash-svg" viewBox="0 0 440 236" role="img" aria-label={`Painel Skyline GT-R: ${Math.round(t.rpm)} rpm, ${Math.round(Math.abs(t.speedKmh))} km/h, turbo ${boost.toFixed(2)} bar`}>
      <DashDefs id="R" />
      {/* hood */}
      <path d="M8,150 C8,40 60,14 220,14 C380,14 432,40 432,150 L432,168 L8,168 Z" fill="#111113" stroke="#26272b" />
      <g opacity={lit}>
        {/* small fuel / coolant gauges at the outer positions */}
        <Mini cx={34} cy={120} value={t.fuelFraction} min={0} max={1} labels={['E', 'F']} title="FUEL" warn={t.lowFuel} />
        <Mini cx={406} cy={120} value={t.coolantC} min={40} max={120} labels={['C', 'H']} title="TEMP" warn={t.coolantC > 110} />

        {/* speedometer 0–180 */}
        <circle cx="112" cy="96" r="62" fill={FACE} stroke="#2a2b2f" strokeWidth="2" />
        <Ticks cx={112} cy={96} s={{ min: 0, max: d.speedoMaxNative, major: 20, minor: 10, a0: -135, a1: 135, r: 58, majorLen: 7, minorLen: 3, width: 1.6, label: (v) => String(v), fontSize: 9, fontWeight: 500 }} />
        <Readout x={112} y={128} size={6.5} color="#b8b6b0" weight={600}>
          km/h
        </Readout>
        <Needle cx={112} cy={96} angle={scale(speed, 0, d.speedoMaxNative, -135, 135)} length={52} width={2.6} color={NEEDLE} hub={7} hubColor="#151515" />

        {/* tachometer 0–10, red from 8 */}
        <circle cx="220" cy="90" r="74" fill={FACE} stroke="#2a2b2f" strokeWidth="2" />
        <Band cx={220} cy={90} r={66} w={6} from={d.tachRedlineStartRpm} to={d.tachMaxRpm} min={0} max={d.tachMaxRpm} a0={-135} a1={135} color="#d6261c" />
        <Ticks cx={220} cy={90} s={{ min: 0, max: d.tachMaxRpm, major: 1000, minor: 500, a0: -135, a1: 135, r: 70, majorLen: 9, minorLen: 4, width: 2, label: (v) => String(v / 1000), fontSize: 13, fontWeight: 500, redFrom: d.tachRedlineStartRpm }} />
        <Readout x={220} y={124} size={6.5} color="#b8b6b0" weight={600}>
          ×1000 r/min
        </Readout>
        <Readout x={220} y={140} size={11} color="#e8e4da" mono>
          {t.gearLabel}
        </Readout>
        <Needle cx={220} cy={90} angle={scale(rpm, 0, d.tachMaxRpm, -135, 135)} length={64} width={3} color={NEEDLE} hub={8} hubColor="#151515" />

        {/* boost gauge (scale estimated) */}
        <circle cx="328" cy="96" r="52" fill={FACE} stroke="#2a2b2f" strokeWidth="2" />
        <Band cx={328} cy={96} r={44} w={3} from={0} to={1.2} min={-1} max={1.2} a0={-135} a1={135} color="#3a3a3a" />
        <Ticks cx={328} cy={96} s={{ min: -1, max: 1.2, major: 0.5, minor: 0.1, a0: -135, a1: 135, r: 48, majorLen: 6, minorLen: 2.5, width: 1.4, label: (v) => (Math.abs(v) < 1e-6 ? '0' : v.toFixed(1)), fontSize: 7.5 }} />
        <Readout x={328} y={134} size={6} color="#b8b6b0" weight={700}>
          BOOST ×100kPa
        </Readout>
        <Needle cx={328} cy={96} angle={scale(boost, -1, 1.2, -135, 135)} length={42} width={2.4} color={NEEDLE} hub={6} hubColor="#151515" />

        <Lamp x={160} y={160} on={t.lowFuel} color="#ffb21f" label="FUEL" />
        <Lamp x={280} y={160} on={t.limiter} color="#ff3b30" label="REV" blink />
      </g>

      {/* centre-console MFD */}
      <g opacity={mfd}>
        <rect x="126" y="176" width="188" height="54" rx="6" fill="#0b1220" stroke="#3b4656" />
        <Readout x={136} y={186} size={6} color="#7fa8d6" anchor="start" weight={700}>
          MULTI FUNCTION DISPLAY
        </Readout>
        <MfdBar x={136} y={198} label="BOOST" value={Math.max(0, boost)} max={1.2} text={`${boost.toFixed(2)} bar`} color="#4fd1ff" />
        <MfdBar x={136} y={210} label="THROTTLE" value={t.throttlePlate} max={1} text={`${Math.round(t.throttlePlate * 100)} %`} color="#78ff8a" />
        <MfdBar x={226} y={198} label="OIL" value={t.oilC - 40} max={110} text={`${Math.round(t.oilC)} °C`} color="#ffb84f" />
        <MfdBar x={226} y={210} label="WATER" value={t.coolantC - 40} max={80} text={`${Math.round(t.coolantC)} °C`} color="#ff7a59" />
        <Readout x={136} y={222} size={5.5} color="#5d7391" anchor="start" weight={600}>
          Escala do turbo no MFD: 1,2 bar · picos e telas extras do MFD não simulados
        </Readout>
      </g>
    </svg>
  );
}

function Mini({ cx, cy, value, min, max, labels, title, warn }: { cx: number; cy: number; value: number; min: number; max: number; labels: [string, string]; title: string; warn: boolean }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={24} fill={FACE} stroke="#2a2b2f" />
      <Ticks cx={cx} cy={cy} s={{ min, max, major: (max - min) / 2, minor: (max - min) / 8, a0: -60, a1: 60, r: 20, majorLen: 4, minorLen: 2, width: 1.2 }} />
      <Readout x={cx - 14} y={cy - 2} size={6.5} color="#d7d3cb">
        {labels[0]}
      </Readout>
      <Readout x={cx + 14} y={cy - 2} size={6.5} color={labels[1] === 'H' ? '#ff4a3a' : '#d7d3cb'}>
        {labels[1]}
      </Readout>
      <Readout x={cx} y={cy + 13} size={5.5} color={warn ? '#ff8a3a' : '#9b9890'} weight={700}>
        {title}
      </Readout>
      <Needle cx={cx} cy={cy + 4} angle={scale(value, min, max, -60, 60)} length={18} width={1.8} color={NEEDLE} hub={3.5} hubColor="#151515" />
    </g>
  );
}

function MfdBar({ x, y, label, value, max, text, color }: { x: number; y: number; label: string; value: number; max: number; text: string; color: string }) {
  return (
    <g>
      <Readout x={x} y={y} size={5.5} color="#9db6d6" anchor="start" weight={700}>
        {label}
      </Readout>
      <Bar x={x + 32} y={y - 2.5} w={28} h={5} frac={value / max} color={color} bg="rgba(120,160,220,0.15)" />
      <Readout x={x + 86} y={y} size={6} color="#e6f0ff" anchor="end" mono>
        {text}
      </Readout>
    </g>
  );
}
