import type { DashboardProps } from '../types';
import { Band, Bar, DashDefs, Lamp, Needle, Readout, Ticks, nativeSpeed, relativeManifold, scale, sweepFactor } from '../gauge';

/**
 * Dodge Challenger SRT Hellcat (2015) — two concave round dials with
 * hub-covered needles in a stamped-aluminium bezel (heritage "tic-toc-tach"
 * look), Hellcat "Dark Radar Red" graphics, 7,000 rpm tachometer and 200 mph
 * speedometer, and a 7-inch TFT in the middle showing SRT performance pages.
 * Left/right placement of the dials was not verified.
 */
const RADAR = '#c22a1e';
const RADAR_GLOW = '#ff5040';
const NUM = '#f0d8d2';

export default function HellcatDash({ def, t, powered, sinceIgnition }: DashboardProps) {
  const d = def.dashboard;
  const sweep = sweepFactor(sinceIgnition);
  const rpm = Math.max(t.rpm, sweep * d.tachMaxRpm);
  const mph = Math.max(nativeSpeed(Math.abs(t.speedKmh), 'mph'), sweep * d.speedoMaxNative);
  const boostPsi = Math.max(0, t.running ? relativeManifold(t.manifoldBar) : 0) * 14.5038;
  const lit = powered ? 1 : 0.35;
  const tft = powered ? 1 : 0.08;
  const a0 = -140;
  const a1 = 140;

  return (
    <svg className="dash-svg" viewBox="0 0 440 210" role="img" aria-label={`Painel Challenger Hellcat: ${Math.round(mph)} mph, ${Math.round(t.rpm)} rpm, compressor ${boostPsi.toFixed(1)} psi`}>
      <DashDefs id="H" />
      <defs>
        <radialGradient id="concaveH" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#140504" />
          <stop offset="0.75" stopColor="#0a0303" />
          <stop offset="1" stopColor="#2a0d0a" />
        </radialGradient>
      </defs>
      <rect width="440" height="210" rx="18" fill="#141416" />
      <rect x="6" y="6" width="428" height="198" rx="14" fill="#08080a" stroke="url(#chromeH)" strokeWidth="2" />
      <g opacity={lit}>
        {/* tachometer 0–7 */}
        <circle cx="104" cy="104" r="88" fill="none" stroke="url(#chromeH)" strokeWidth="5" />
        <circle cx="104" cy="104" r="85" fill="url(#concaveH)" />
        <Band cx={104} cy={104} r={74} w={5} from={d.tachRedlineStartRpm} to={d.tachMaxRpm} min={0} max={d.tachMaxRpm} a0={a0} a1={a1} color={RADAR_GLOW} />
        <Ticks cx={104} cy={104} s={{ min: 0, max: d.tachMaxRpm, major: 1000, minor: 250, a0, a1, r: 80, majorLen: 10, minorLen: 4, width: 2, color: RADAR, label: (v) => String(v / 1000), fontSize: 15, fontWeight: 700, labelColor: NUM, redFrom: d.tachRedlineStartRpm, redColor: RADAR_GLOW }} />
        <Readout x={104} y={150} size={7} color={NUM} weight={700}>
          RPM ×1000
        </Readout>
        <Needle cx={104} cy={104} angle={scale(rpm, 0, d.tachMaxRpm, a0, a1)} length={74} width={3.4} color={RADAR_GLOW} hub={16} hubColor="#1b1b1d" glow={powered ? RADAR_GLOW : undefined} />

        {/* speedometer 0–200 mph */}
        <circle cx="336" cy="104" r="88" fill="none" stroke="url(#chromeH)" strokeWidth="5" />
        <circle cx="336" cy="104" r="85" fill="url(#concaveH)" />
        <Ticks cx={336} cy={104} s={{ min: 0, max: d.speedoMaxNative, major: 20, minor: 5, a0, a1, r: 80, majorLen: 9, minorLen: 3.5, width: 1.8, color: RADAR, label: (v) => String(v), fontSize: 11, fontWeight: 700, labelColor: NUM }} />
        <Readout x={336} y={150} size={7} color={NUM} weight={700}>
          MPH
        </Readout>
        <Readout x={336} y={162} size={6} color="#9a6a62" weight={600}>
          {Math.round(Math.abs(t.speedKmh))} km/h
        </Readout>
        <Needle cx={336} cy={104} angle={scale(mph, 0, d.speedoMaxNative, a0, a1)} length={74} width={3.4} color={RADAR_GLOW} hub={16} hubColor="#1b1b1d" glow={powered ? RADAR_GLOW : undefined} />
      </g>

      {/* 7-inch TFT: SRT performance page */}
      <g opacity={tft}>
        <rect x="196" y="34" width="48" height="142" rx="5" fill="#0b0607" stroke="#3a1a16" />
        <Readout x={220} y={46} size={7} color={RADAR_GLOW} weight={900}>
          SRT
        </Readout>
        <Readout x={220} y={70} size={22} color="#ffffff" mono>
          {t.gearLabel}
        </Readout>
        <Readout x={220} y={90} size={5.5} color={NUM} weight={700}>
          BOOST psi
        </Readout>
        <Bar x={204} y={96} w={32} h={5} frac={boostPsi / 11.6} color={RADAR_GLOW} bg="rgba(255,80,64,0.15)" />
        <Readout x={220} y={110} size={9} color="#ffffff" mono>
          {boostPsi.toFixed(1)}
        </Readout>
        <Readout x={220} y={126} size={5.5} color={NUM} weight={700}>
          OIL · WATER
        </Readout>
        <Readout x={220} y={137} size={7} color="#ffffff" mono>
          {Math.round(t.oilC)}°/{Math.round(t.coolantC)}°
        </Readout>
        <Readout x={220} y={152} size={5.5} color={NUM} weight={700}>
          FUEL
        </Readout>
        <Bar x={204} y={158} w={32} h={5} frac={t.fuelFraction} color={t.lowFuel ? '#ffb21f' : '#e9e6df'} bg="rgba(255,255,255,0.1)" />
        <Readout x={220} y={170} size={5} color="#8c5a52" weight={700}>
          RED KEY · 707 HP
        </Readout>
      </g>
      <Lamp x={220} y={22} on={t.limiter} color={RADAR_GLOW} label="REV LIMIT" blink />
      <Lamp x={220} y={194} on={t.lowFuel} color="#ffb21f" label="LOW FUEL" />
      <rect x="6" y="6" width="428" height="198" rx="14" fill="url(#glareH)" pointerEvents="none" />
    </svg>
  );
}
