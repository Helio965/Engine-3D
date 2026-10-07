import type { DashboardProps } from '../types';
import { Bezel, DashDefs, Lamp, Needle, Readout, Ticks, nativeSpeed, psFromKw, scale, sweepFactor } from '../gauge';

/**
 * Bugatti Veyron 16.4 — five analogue dials with black faces and chrome
 * bezels: POWER meter in PS (ends at 1001) on the left, large central
 * tachometer 0–8 with an LCD (digital speed, P R N D S strip, gear), km/h
 * speedometer with numerals every 30 on the right, and two small dials
 * above (oil temperature, fuel). White/silver needles, no shift light.
 */
const NEEDLE = '#eef0f2';
const HUB = 'url(#chromeV)';

export default function VeyronDash({ def, t, powered, sinceIgnition }: DashboardProps) {
  const d = def.dashboard;
  const sweep = sweepFactor(sinceIgnition);
  const rpm = Math.max(t.rpm, sweep * d.tachMaxRpm);
  const speed = Math.max(nativeSpeed(Math.abs(t.speedKmh), d.speedoUnit), sweep * d.speedoMaxNative);
  const ps = Math.max(psFromKw(t.powerKw), sweep * 1001);
  const lit = powered ? 1 : 0.4;
  const strip = ['P', 'R', 'N', 'D', 'S'];
  const active = t.gearLabel === 'R' ? 'R' : t.gearLabel === 'N' || t.mode !== 'drive' ? (t.running ? 'N' : 'P') : t.gearMode === 'manual' ? 'S' : 'D';

  return (
    <svg className="dash-svg" viewBox="0 0 440 220" role="img" aria-label={`Painel Veyron: ${Math.round(t.rpm)} rpm, ${Math.round(Math.abs(t.speedKmh))} km/h, ${Math.round(psFromKw(t.powerKw))} PS em uso, marcha ${t.gearLabel}`}>
      <DashDefs id="V" />
      <rect width="440" height="220" rx="22" fill="#141210" />
      <rect x="6" y="6" width="428" height="208" rx="18" fill="#0a0a0b" stroke="#2d2924" />
      <g opacity={lit}>
        {/* POWER meter (PS) */}
        <Bezel cx={80} cy={134} r={56} ring="url(#chromeV)" />
        <Ticks cx={80} cy={134} s={{ min: 0, max: 1001, major: 100, minor: 50, a0: -140, a1: 128, r: 52, majorLen: 7, minorLen: 2.5, width: 1.6, label: (v) => (v >= 600 ? String(v) : v === 0 ? '0' : null), fontSize: 8.5 }} />
        <Readout x={80} y={160} size={6.5} color="#bdbab3" weight={600}>
          POWER / PS
        </Readout>
        <Readout x={80} y={171} size={6} color="#8c8a85" weight={500} mono>
          1001
        </Readout>
        <Needle cx={80} cy={134} angle={scale(ps, 0, 1001, -140, 128)} length={47} width={2.6} color={NEEDLE} hub={9} hubColor={HUB} />

        {/* central tachometer 0–8 */}
        <Bezel cx={220} cy={112} r={80} ring="url(#chromeV)" ringW={5} />
        <Ticks cx={220} cy={112} s={{ min: 0, max: 8000, major: 1000, minor: 250, a0: -135, a1: 130, r: 76, majorLen: 9, minorLen: 3, width: 2.2, label: (v) => String(v / 1000), fontSize: 14, fontWeight: 500, redFrom: d.tachRedlineStartRpm, redColor: '#d23a2e' }} />
        <Readout x={220} y={74} size={6.5} color="#8c8a85" weight={500}>
          1/min × 1000
        </Readout>
        {/* LCD under the hub */}
        <rect x={186} y={136} width={68} height={34} rx={4} fill="#1d2630" stroke="#323c47" />
        <Readout x={220} y={146} size={11} color="#dce6ee" mono>
          {Math.round(Math.abs(t.speedKmh))} km/h
        </Readout>
        {strip.map((g, i) => (
          <Readout key={g} x={196 + i * 12} y={161} size={7.5} color={g === active ? '#ffffff' : '#5a6672'} weight={g === active ? 800 : 500} mono>
            {g}
          </Readout>
        ))}
        {t.mode === 'drive' && /^\d$/.test(t.gearLabel) && (
          <Readout x={248} y={146} size={7} color="#9fb2c3" mono>
            {t.gearLabel}
          </Readout>
        )}
        <Needle cx={220} cy={112} angle={scale(rpm, 0, d.tachMaxRpm, -135, 130)} length={68} width={3.2} color={NEEDLE} hub={13} hubColor={HUB} />

        {/* speedometer, numerals every 30 km/h */}
        <Bezel cx={360} cy={134} r={56} ring="url(#chromeV)" />
        <Ticks cx={360} cy={134} s={{ min: 0, max: d.speedoMaxNative, major: 30, minor: 10, a0: -140, a1: 128, r: 52, majorLen: 6, minorLen: 2.5, width: 1.4, label: (v) => String(v), fontSize: 5.4, fontWeight: 500 }} />
        <Readout x={360} y={162} size={6.5} color="#bdbab3" weight={600}>
          km/h
        </Readout>
        <Needle cx={360} cy={134} angle={scale(speed, 0, d.speedoMaxNative, -140, 128)} length={47} width={2.6} color={NEEDLE} hub={9} hubColor={HUB} />

        {/* small dials above: oil temperature (left), fuel (right) */}
        <SmallDial cx={58} cy={46} value={t.oilC} min={50} max={150} label="OIL °C" warn={t.oilC > 130} />
        <SmallDial cx={382} cy={46} value={t.fuelFraction} min={0} max={1} label="FUEL" warn={t.lowFuel} />
        <Lamp x={140} y={24} on={t.limiter} color="#ff8a1f" label="EPC" blink />
        <Lamp x={300} y={24} on={t.lowFuel} color="#ffb21f" label="RESERVA" />
      </g>
      <rect x="6" y="6" width="428" height="208" rx="18" fill="url(#glareV)" pointerEvents="none" />
    </svg>
  );
}

function SmallDial({ cx, cy, value, min, max, label, warn }: { cx: number; cy: number; value: number; min: number; max: number; label: string; warn: boolean }) {
  return (
    <g>
      <Bezel cx={cx} cy={cy} r={26} ring="url(#chromeV)" ringW={3} />
      <Ticks cx={cx} cy={cy} s={{ min, max, major: (max - min) / 2, minor: (max - min) / 8, a0: -120, a1: 120, r: 23, majorLen: 5, minorLen: 2, width: 1.2 }} />
      <Readout x={cx} y={cy + 13} size={5.5} color={warn ? '#ff6a3a' : '#9b9890'} weight={700}>
        {label}
      </Readout>
      <Needle cx={cx} cy={cy} angle={scale(value, min, max, -120, 120)} length={20} width={1.8} color={NEEDLE} hub={4} hubColor={HUB} />
    </g>
  );
}
