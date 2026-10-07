import type { DashboardProps } from '../types';
import { Bar, DashDefs, Lamp, Readout, ShiftLeds, nativeSpeed, sweepFactor } from '../gauge';
import { FerrariTach } from './ferrariTach';

/**
 * Ferrari 812 Superfast — new HMI: central analogue rev counter (0–10
 * estimated, red near the top, digital gear), a left TFT with speed and
 * vehicle information and a right TFT with engine data (oil, water) and
 * infotainment. Optional carbon steering-wheel rim with shift LEDs.
 */
const TXT = '#eef0f3';
const RED = '#e3001b';

export default function F812Dash({ def, t, powered, sinceIgnition }: DashboardProps) {
  const d = def.dashboard;
  const sweep = sweepFactor(sinceIgnition);
  const rpm = Math.max(t.rpm, sweep * d.tachMaxRpm);
  const kmh = nativeSpeed(Math.abs(t.speedKmh), 'kmh');
  const screens = powered ? 1 : 0.08;
  return (
    <svg className="dash-svg" viewBox="0 0 440 220" role="img" aria-label={`Painel 812 Superfast: ${Math.round(t.rpm)} rpm, ${Math.round(kmh)} km/h, marcha ${t.gearLabel}`}>
      <DashDefs id="F8" />
      <defs>
        <pattern id="carbon812" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="6" height="6" fill="#141517" />
          <rect width="3" height="3" fill="#1d1f22" />
          <rect x="3" y="3" width="3" height="3" fill="#1d1f22" />
        </pattern>
      </defs>
      <rect width="440" height="220" rx="20" fill="url(#carbon812)" />
      {/* carbon rim with LEDs (optional) */}
      <path d="M120,24 Q220,0 320,24" stroke="#2a2c30" strokeWidth="10" fill="none" strokeLinecap="round" />
      <g opacity={powered ? 1 : 0.3}>
        <ShiftLeds x={150} y={16} w={140} n={10} frac={t.shiftLight} limiter={t.limiter} r={3} colors={(i, n) => (i < n * 0.5 ? '#39d353' : i < n * 0.8 ? '#ff2a2a' : '#3d7bff')} />
      </g>

      {/* left TFT, angled towards the driver */}
      <g opacity={screens} transform="skewY(-4) translate(0 14)">
        <rect x="18" y="48" width="128" height="128" rx="6" fill="#050507" stroke="#3a3c41" />
        <Readout x={82} y={86} size={30} color="#ffffff" mono>
          {Math.round(kmh)}
        </Readout>
        <Readout x={82} y={108} size={7} color="#a3a5aa" weight={700}>
          km/h
        </Readout>
        <Readout x={30} y={130} size={6} color="#a3a5aa" anchor="start" weight={700}>
          COMBUSTÍVEL
        </Readout>
        <Bar x={30} y={136} w={104} h={5} frac={t.fuelFraction} color={t.lowFuel ? '#ff9a1a' : TXT} />
        <Readout x={30} y={156} size={6.5} color={TXT} anchor="start" mono>
          {t.fuelL.toFixed(0)} L · {t.rangeKm !== null ? `${Math.round(t.rangeKm)} km` : '—'}
        </Readout>
      </g>

      <FerrariTach cx={220} cy={120} r={80} rpm={rpm} max={d.tachMaxRpm} redFrom={d.tachRedlineStartRpm} gear={t.gearLabel} sub={t.mode === 'drive' ? (t.gearMode === 'manual' ? 'MANUAL' : 'AUTO') : undefined} powered={powered} limiter={t.limiter} />

      {/* right TFT: engine data */}
      <g opacity={screens} transform="skewY(4) translate(0 -14)">
        <rect x="294" y="62" width="128" height="128" rx="6" fill="#050507" stroke="#3a3c41" />
        <Readout x={306} y={78} size={6.5} color={RED} anchor="start" weight={800}>
          MOTOR
        </Readout>
        <Row y={98} label="ÓLEO" value={`${Math.round(t.oilC)} °C`} />
        <Row y={116} label="ÁGUA" value={`${Math.round(t.coolantC)} °C`} />
        <Row y={134} label="PRESSÃO" value={`${t.oilBar.toFixed(1)} bar`} />
        <Row y={152} label="POTÊNCIA" value={`${Math.round(Math.max(0, t.powerKw) * 1.35962)} cv`} />
        <Row y={170} label="TORQUE" value={`${Math.round(t.torqueNm)} N·m`} />
      </g>
      <Lamp x={82} y={206} on={t.lowFuel} color="#ffb21f" label="RISERVA" />
    </svg>
  );
}

function Row({ y, label, value }: { y: number; label: string; value: string }) {
  return (
    <g>
      <Readout x={306} y={y} size={6} color="#a3a5aa" anchor="start" weight={700}>
        {label}
      </Readout>
      <Readout x={410} y={y} size={8} color={TXT} anchor="end" mono>
        {value}
      </Readout>
    </g>
  );
}
