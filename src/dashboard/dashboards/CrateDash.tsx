import type { DashboardProps } from '../types';
import { Bar, DashDefs, Lamp, Readout, ShiftLeds, relativeManifold } from '../gauge';
import { enrichment } from '../../simulation/engineModel';

/**
 * Chevrolet Performance ZZ632/1000 — NON-OFFICIAL. A crate engine has no
 * factory instrument cluster, so this is a generic race / dyno-cell digital
 * dash: sweep bar tachometer to 8,000 rpm with the red zone from the
 * official 7,000 rpm maximum, shift LEDs, gear, lambda, MAP, temperatures,
 * oil and fuel pressure, TPS. Chevrolet Performance orange accents.
 */
const ORANGE = '#ff7a1a';
const FUEL_PRESSURE_PSI = 58; // official constant fuel pressure

export default function CrateDash({ def, t, powered, sinceIgnition }: DashboardProps) {
  const d = def.dashboard;
  const test = sinceIgnition >= 0 && sinceIgnition < 1.2;
  const rpm = test ? d.tachMaxRpm * Math.min(1, sinceIgnition / 0.6) : t.rpm;
  const on = powered ? 1 : 0.12;
  const segs = 40;
  const lit = Math.round((Math.min(rpm, d.tachMaxRpm) / d.tachMaxRpm) * segs);
  const redSeg = Math.round((d.tachRedlineStartRpm / d.tachMaxRpm) * segs);
  const lambda = t.running && t.combusting ? 1 / enrichment(t.loadFraction, 0) : null;
  const mapKpa = t.running ? Math.max(0, t.manifoldBar * 100) : 101.3;
  const vac = relativeManifold(t.manifoldBar) * 29.53; // inHg (negative = vacuum)

  return (
    <svg className="dash-svg" viewBox="0 0 440 200" role="img" aria-label={`Painel de bancada não oficial: ${Math.round(t.rpm)} rpm, lambda ${lambda ? lambda.toFixed(2) : 'corte'}, pressão de óleo ${t.oilBar.toFixed(1)} bar`}>
      <DashDefs id="Z" />
      <rect width="440" height="200" rx="12" fill="#0d0d0e" />
      <rect x="5" y="5" width="430" height="190" rx="9" fill="#030303" stroke="#2a2a2c" />
      <Readout x={14} y={16} size={6.5} color={ORANGE} anchor="start" weight={800}>
        PAINEL NÃO OFICIAL · BANCADA / DINAMÔMETRO
      </Readout>
      <g opacity={on}>
        <ShiftLeds x={236} y={16} w={190} n={10} frac={t.shiftLight} limiter={t.limiter} r={4} />
        {/* bar tachometer */}
        {new Array(segs).fill(0).map((_, i) => (
          <rect key={i} x={14 + i * 10.3} y={30} width={8.3} height={i >= redSeg ? 30 : 18 + (i / segs) * 12} rx={1.2} transform={`translate(0 ${i >= redSeg ? 0 : 30 - (18 + (i / segs) * 12)})`} fill={i < lit ? (i >= redSeg ? '#ff2d2d' : ORANGE) : '#1a1a1c'} />
        ))}
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((k) => (
          <Readout key={k} x={14 + (k * 1000 * segs * 10.3) / d.tachMaxRpm} y={68} size={7} color={k * 1000 >= d.tachRedlineStartRpm ? '#ff4d4d' : '#9b9893'} weight={700} mono>
            {k}
          </Readout>
        ))}
        <Readout x={426} y={78} size={5.5} color="#6d6b67" anchor="end" weight={600}>
          ×1000
        </Readout>

        {/* big rpm + gear */}
        <Readout x={120} y={102} size={30} color="#ffffff" mono>
          {Math.round(t.rpm)}
        </Readout>
        <Readout x={120} y={124} size={7} color={ORANGE} weight={800}>
          RPM
        </Readout>
        <rect x="190" y="80" width="60" height="56" rx="6" fill="#0a0a0b" stroke={ORANGE} strokeWidth="1.5" />
        <Readout x={220} y={104} size={30} color={ORANGE} mono>
          {t.mode === 'dyno' ? 'D' : t.gearLabel}
        </Readout>
        <Readout x={220} y={128} size={5.5} color="#9b9893" weight={700}>
          {t.mode === 'dyno' ? 'DINAMÔMETRO' : 'MARCHA'}
        </Readout>
        <Readout x={330} y={98} size={20} color="#ffffff" mono>
          {lambda ? lambda.toFixed(2) : '--.--'}
        </Readout>
        <Readout x={330} y={116} size={6.5} color={ORANGE} weight={800}>
          LAMBDA (WIDEBAND)
        </Readout>

        {/* data strip */}
        <Cell x={14} label="MAP" value={`${mapKpa.toFixed(0)} kPa`} />
        <Cell x={84} label="VÁCUO" value={`${Math.max(0, -vac).toFixed(1)} inHg`} />
        <Cell x={154} label="ÁGUA" value={`${Math.round(t.coolantC)} °C`} warn={t.coolantC > 105} />
        <Cell x={224} label="ÓLEO" value={`${(t.oilBar * 14.5038).toFixed(0)} psi`} warn={t.running && t.oilBar * 14.5038 < 11} />
        <Cell x={294} label="COMBUST." value={powered ? `${FUEL_PRESSURE_PSI} psi` : '0 psi'} />
        <Cell x={364} label="TPS" value={`${Math.round(t.throttlePlate * 100)} %`} />
        <Readout x={14} y={186} size={6} color="#9b9893" anchor="start" weight={700}>
          CÉLULA
        </Readout>
        <Bar x={50} y={183} w={110} h={6} frac={t.fuelFraction} color={t.lowFuel ? '#ffb21f' : ORANGE} />
        <Readout x={166} y={186} size={6} color="#cfccc6" anchor="start" mono>
          {t.fuelL.toFixed(1)} L
        </Readout>
        <Lamp x={300} y={188} on={t.limiter} color="#ff2d2d" label="CORTE 7000" blink />
        <Lamp x={380} y={188} on={t.lowFuel} color="#ffb21f" label="COMBUSTÍVEL" />
      </g>
    </svg>
  );
}

function Cell({ x, label, value, warn = false }: { x: number; label: string; value: string; warn?: boolean }) {
  return (
    <g>
      <rect x={x} y={142} width={64} height={30} rx={4} fill="#0b0b0c" stroke="#232325" />
      <Readout x={x + 32} y={151} size={5.5} color={warn ? '#ff4d4d' : '#ff9a4f'} weight={800}>
        {label}
      </Readout>
      <Readout x={x + 32} y={164} size={9} color={warn ? '#ff4d4d' : '#f1efe9'} mono>
        {value}
      </Readout>
    </g>
  );
}
