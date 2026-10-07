import type { DashboardProps } from '../types';
import { Bar, DashDefs, Lamp, Readout, ShiftLeds, arcPath, nativeSpeed, scale, sweepFactor } from '../gauge';
import { FerrariTach } from './ferrariTach';

/**
 * Ferrari 458 Italia — central analogue rev counter (0–10, red from 9,000,
 * digital gear) flanked by two TFT screens: the left one with virtual fuel,
 * water/oil temperature and oil-pressure gauges, the right one with the
 * digital speedometer (its default page). Shift LEDs on the steering-wheel
 * rim were optional and are drawn above the cluster.
 */
const TFT_BG = '#06070a';
const TXT = '#e8e9ec';
const ACC = '#ffcc1a';

export default function F458Dash({ def, t, powered, sinceIgnition }: DashboardProps) {
  const d = def.dashboard;
  const sweep = sweepFactor(sinceIgnition);
  const rpm = Math.max(t.rpm, sweep * d.tachMaxRpm);
  const kmh = nativeSpeed(Math.abs(t.speedKmh), 'kmh');
  const screens = powered ? 1 : 0.08;
  return (
    <svg className="dash-svg" viewBox="0 0 440 220" role="img" aria-label={`Painel 458 Italia: ${Math.round(t.rpm)} rpm, ${Math.round(kmh)} km/h, marcha ${t.gearLabel}`}>
      <DashDefs id="F4" />
      <rect width="440" height="220" rx="20" fill="#121213" />
      <path d="M14,46 Q14,26 34,26 L406,26 Q426,26 426,46 L426,206 L14,206 Z" fill="#0a0a0b" stroke="#2b2c2f" />
      {/* optional steering-wheel rim LEDs */}
      <g opacity={powered ? 1 : 0.3}>
        <ShiftLeds x={160} y={14} w={120} n={10} frac={t.shiftLight} limiter={t.limiter} r={3.2} colors={(i, n) => (i < n * 0.4 ? '#39d353' : i < n * 0.8 ? '#ff2a2a' : '#3d7bff')} />
        <Readout x={290} y={14} size={5} color="#6d6f73" anchor="start" weight={600}>
          LEDs no volante (opcional)
        </Readout>
      </g>

      {/* left TFT: virtual gauges */}
      <g opacity={screens}>
        <rect x="24" y="52" width="122" height="134" rx="8" fill={TFT_BG} stroke="#33353a" />
        <VirtualGauge cx={58} cy={92} label="ÓLEO °C" value={t.oilC} min={40} max={160} warn={t.oilC > 135} />
        <VirtualGauge cx={112} cy={92} label="ÁGUA °C" value={t.coolantC} min={40} max={130} warn={t.coolantC > 115} />
        <Readout x={34} y={134} size={6} color="#9a9ca1" anchor="start" weight={700}>
          PRESSÃO ÓLEO
        </Readout>
        <Bar x={34} y={140} w={70} h={5} frac={t.oilBar / 7} color={ACC} />
        <Readout x={136} y={142} size={7.5} color={TXT} anchor="end" mono>
          {t.oilBar.toFixed(1)} bar
        </Readout>
        <Readout x={34} y={158} size={6} color="#9a9ca1" anchor="start" weight={700}>
          COMBUSTÍVEL
        </Readout>
        <Bar x={34} y={164} w={70} h={5} frac={t.fuelFraction} color={t.lowFuel ? '#ff9a1a' : TXT} />
        <Readout x={136} y={166} size={7.5} color={TXT} anchor="end" mono>
          {t.fuelL.toFixed(0)} L
        </Readout>
      </g>

      <FerrariTach cx={220} cy={118} r={78} rpm={rpm} max={d.tachMaxRpm} redFrom={d.tachRedlineStartRpm} gear={t.gearLabel} sub={t.mode === 'drive' ? (t.gearMode === 'manual' ? 'MANUAL' : 'AUTO') : undefined} powered={powered} limiter={t.limiter} />

      {/* right TFT: digital speedometer */}
      <g opacity={screens}>
        <rect x="294" y="52" width="122" height="134" rx="8" fill={TFT_BG} stroke="#33353a" />
        <path d={arcPath(355, 122, 46, -120, 120)} stroke="#1c1e22" strokeWidth="6" fill="none" />
        <path d={arcPath(355, 122, 46, -120, Math.max(-119.5, scale(kmh, 0, d.speedoMaxNative, -120, 120)))} stroke={ACC} strokeWidth="6" fill="none" strokeLinecap="round" />
        <Readout x={355} y={118} size={24} color="#ffffff" mono>
          {Math.round(kmh)}
        </Readout>
        <Readout x={355} y={138} size={7} color="#9a9ca1" weight={700}>
          km/h
        </Readout>
        <Readout x={355} y={174} size={6} color="#6d6f73" weight={600}>
          {t.consumptionL100 !== null ? `${t.consumptionL100.toFixed(1)} L/100 km` : `${t.fuelFlowLph.toFixed(1)} L/h`}
        </Readout>
      </g>
      <Lamp x={355} y={198} on={t.lowFuel} color="#ffb21f" label="RISERVA" />
      <rect x="14" y="26" width="412" height="180" rx="20" fill="url(#glareF4)" pointerEvents="none" />
    </svg>
  );
}

function VirtualGauge({ cx, cy, label, value, min, max, warn }: { cx: number; cy: number; label: string; value: number; min: number; max: number; warn: boolean }) {
  const a = scale(value, min, max, -120, 120);
  return (
    <g>
      <path d={arcPath(cx, cy, 20, -120, 120)} stroke="#1c1e22" strokeWidth="4" fill="none" />
      <path d={arcPath(cx, cy, 20, -120, Math.max(-119.5, a))} stroke={warn ? '#ff3b30' : ACC} strokeWidth="4" fill="none" />
      <Readout x={cx} y={cy} size={9} color={TXT} mono>
        {Math.round(value)}
      </Readout>
      <Readout x={cx} y={cy + 27} size={5.5} color="#9a9ca1" weight={700}>
        {label}
      </Readout>
    </g>
  );
}
