import type { DashboardProps } from '../types';
import { DashDefs, Lamp, Needle, Readout, Ticks, arcPath, nativeSpeed, psFromKw, scale, sweepFactor } from '../gauge';

/**
 * Bugatti Chiron — adaptive cluster: central mechanical speedometer to
 * 500 km/h (250 at 12 o'clock, "Swiss watch" look, EB logo), a left TFT with
 * a blue-arc digital tachometer and big rpm read-out, a right TFT with the
 * real-time power meter, and a small IPS display under the speedometer.
 */
const BLUE = '#2f8cff';
const CYAN = '#7fd3ff';

export default function ChironDash({ def, t, powered, sinceIgnition }: DashboardProps) {
  const d = def.dashboard;
  const sweep = sweepFactor(sinceIgnition);
  const rpm = Math.max(t.rpm, sweep * d.tachMaxRpm);
  const speed = Math.max(nativeSpeed(Math.abs(t.speedKmh), d.speedoUnit), sweep * d.speedoMaxNative);
  const ps = psFromKw(t.powerKw);
  const maxPs = def.performance.powerPs;
  const lit = powered ? 1 : 0.35;
  const screens = powered ? 1 : 0.08;
  const aT0 = -130;
  const aT1 = 130;
  const tachA = scale(rpm, 0, d.tachMaxRpm, aT0, aT1);
  const psA = scale(Math.max(ps, sweep * maxPs), 0, maxPs, aT0, aT1);
  const modeLabel = t.mode === 'dyno' ? 'DYNO' : t.mode === 'drive' ? (t.gearMode === 'manual' ? 'M' : 'A') : 'N';

  return (
    <svg className="dash-svg" viewBox="0 0 440 220" role="img" aria-label={`Painel Chiron: ${Math.round(Math.abs(t.speedKmh))} km/h, ${Math.round(t.rpm)} rpm, ${Math.round(ps)} PS`}>
      <DashDefs id="C" />
      <rect width="440" height="220" rx="24" fill="#1a1c1f" />
      <rect x="5" y="5" width="430" height="210" rx="20" fill="#08090b" stroke="#3a3e44" />

      {/* left TFT: digital tachometer */}
      <g opacity={screens}>
        <rect x="14" y="40" width="122" height="140" rx="10" fill="#05070b" stroke="url(#chromeC)" strokeWidth="2" />
        <path d={arcPath(75, 112, 46, aT0, aT1)} stroke="#11243a" strokeWidth="7" fill="none" />
        <path d={arcPath(75, 112, 46, aT0, Math.max(aT0 + 0.5, tachA))} stroke={t.limiter ? '#ff4040' : BLUE} strokeWidth="7" fill="none" strokeLinecap="round" />
        <path d={arcPath(75, 112, 46, scale(d.tachRedlineStartRpm, 0, d.tachMaxRpm, aT0, aT1), aT1)} stroke="#ff4040" strokeWidth="2" fill="none" opacity={0.8} />
        <Ticks cx={75} cy={112} s={{ min: 0, max: d.tachMaxRpm, major: 2000, minor: 1000, a0: aT0, a1: aT1, r: 38, majorLen: 4, minorLen: 2, width: 1.2, color: CYAN, label: (v) => String(v / 1000), fontSize: 8, labelColor: '#cfe9ff' }} />
        <Readout x={75} y={110} size={18} color="#ffffff" mono>
          {Math.round(rpm / 10) * 10}
        </Readout>
        <Readout x={75} y={126} size={6.5} color={CYAN} weight={600}>
          RPM
        </Readout>
        <Readout x={75} y={168} size={7} color="#8fb6d9" weight={600}>
          {t.fuelL.toFixed(0)} L · {Math.round(t.oilC)} °C óleo
        </Readout>
      </g>

      {/* central mechanical speedometer */}
      <g opacity={lit}>
        <circle cx="220" cy="104" r="92" fill="none" stroke="url(#chromeC)" strokeWidth="5" />
        <circle cx="220" cy="104" r="89" fill="#050506" />
        <Ticks cx={220} cy={104} s={{ min: 0, max: d.speedoMaxNative, major: 50, minor: 10, a0: -150, a1: 150, r: 85, majorLen: 9, minorLen: 3.5, width: 1.4, label: (v) => String(v), fontSize: 10.5, fontWeight: 400 }} />
        <Readout x={220} y={150} size={7} color="#a9a7a2" weight={500}>
          km/h
        </Readout>
        <Readout x={220} y={78} size={13} color="#d9d7d2" weight={300}>
          EB
        </Readout>
        <Needle cx={220} cy={104} angle={scale(speed, 0, d.speedoMaxNative, -150, 150)} length={80} width={2.2} color="#f3f4f6" hub={10} hubColor="url(#chromeC)" />
      </g>
      {/* small IPS display under the speedometer */}
      <g opacity={screens}>
        <rect x="186" y="172" width="68" height="30" rx="5" fill="#05070b" stroke="#2a3038" />
        <Readout x={208} y={187} size={15} color="#ffffff" mono>
          {t.gearLabel}
        </Readout>
        <Readout x={238} y={182} size={6.5} color={CYAN} weight={700}>
          {modeLabel}
        </Readout>
        <Readout x={238} y={193} size={6} color="#8fb6d9" weight={600}>
          {t.boostBar > 0.05 ? `${t.boostBar.toFixed(2)} bar` : 'EB'}
        </Readout>
      </g>

      {/* right TFT: real-time power meter */}
      <g opacity={screens}>
        <rect x="304" y="40" width="122" height="140" rx="10" fill="#05070b" stroke="url(#chromeC)" strokeWidth="2" />
        <path d={arcPath(365, 112, 46, aT0, aT1)} stroke="#11243a" strokeWidth="7" fill="none" />
        <path d={arcPath(365, 112, 46, aT0, Math.max(aT0 + 0.5, psA))} stroke={BLUE} strokeWidth="7" fill="none" strokeLinecap="round" />
        <Ticks cx={365} cy={112} s={{ min: 0, max: maxPs, major: 500, minor: 100, a0: aT0, a1: aT1, r: 38, majorLen: 4, minorLen: 2, width: 1.2, color: CYAN, label: (v) => String(v), fontSize: 6.5, labelColor: '#cfe9ff' }} />
        <Readout x={365} y={110} size={18} color="#ffffff" mono>
          {Math.round(ps)}
        </Readout>
        <Readout x={365} y={126} size={6.5} color={CYAN} weight={600}>
          PS
        </Readout>
        <Readout x={365} y={168} size={7} color="#8fb6d9" weight={600}>
          {Math.round(t.torqueNm)} N·m
        </Readout>
      </g>
      <Lamp x={300} y={204} on={t.lowFuel} color="#ffb21f" label="RESERVA" />
      <Lamp x={140} y={204} on={t.limiter} color="#ff4040" label="LIMITE" blink />
      <rect x="5" y="5" width="430" height="210" rx="20" fill="url(#glareC)" pointerEvents="none" />
    </svg>
  );
}
