import type { EngineDefinition } from '../types/engine';
import { useApp } from '../state/appStore';
import { simRef, useTelemetry } from '../state/simulationStore';
import { DashboardHost } from '../dashboard/DashboardHost';
import { DynoChart } from './DynoChart';
import { fmt } from '../data/helpers';

export function RightPanel({ def }: { def: EngineDefinition }) {
  const t = useTelemetry((x) => x.t);
  const telemetryOpen = useApp((s) => s.telemetryOpen);
  const set = useApp((s) => s.set);
  return (
    <>
      <DashboardHost def={def} />
      {t?.mode === 'dyno' && <DynoChart def={def} />}
      <FuelPanel def={def} />
      <section className="telemetry panel" aria-label="Telemetria">
        <button className="btn sm" style={{ float: 'right' }} onClick={() => set({ telemetryOpen: !telemetryOpen })} aria-expanded={telemetryOpen}>
          {telemetryOpen ? 'ocultar' : 'mostrar'}
        </button>
        <p className="panel-title">Telemetria</p>
        {telemetryOpen && t && <TelemetryTable def={def} />}
      </section>
    </>
  );
}

function TelemetryTable({ def }: { def: EngineDefinition }) {
  const t = useTelemetry((x) => x.t)!;
  const forced = def.engine.aspiration !== 'na';
  const rows: [string, string][] = [
    ['RPM', fmt(t.rpm)],
    ['SPEED', `${fmt(Math.abs(t.speedKmh))} km/h`],
    ['GEAR', t.gearLabel],
    ['THROTTLE', `${Math.round(t.pedal * 100)}% (borb. ${Math.round(t.throttlePlate * 100)}%)`],
    ['FUEL', `${fmt(t.fuelL, 1)} L`],
    ['FUEL FLOW', `${fmt(t.fuelFlowLph, 1)} L/h`],
    ['MAP', `${fmt(t.manifoldBar + t.boostBar, 2)} bar abs`],
  ];
  if (forced) rows.push(['BOOST', `${fmt(Math.max(0, t.boostBar), 2)} bar`]);
  else rows.push(['ASPIRAÇÃO', 'Naturalmente aspirado']);
  if (def.engine.turbo) {
    const active = t.turboActive.filter(Boolean).length;
    rows.push(['TURBOS', `${active}/${def.engine.turbo.count} ativos · ${fmt(Math.max(...t.turboShaftRpm) / 1000)}k rpm`]);
  }
  if (def.engine.supercharger) rows.push(['ROTOR SC', `${fmt(t.superchargerRpm)} rpm`]);
  rows.push(
    ['POWER', `${fmt(t.powerKw * 1.35962)} PS · ${fmt(t.powerKw)} kW`],
    ['TORQUE', `${fmt(t.torqueNm)} N·m`],
    ['COOLANT', `${fmt(t.coolantC)} °C`],
    ['OIL', `${fmt(t.oilC)} °C · ${fmt(t.oilBar, 1)} bar`],
  );
  if (t.consumptionL100 != null) rows.push(['CONSUMO', `${fmt(t.consumptionL100, 1)} L/100 km`]);
  return (
    <table>
      <tbody>
        {rows.map(([k, v]) => (
          <tr key={k}>
            <td>{k}</td>
            <td>{v}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function FuelPanel({ def }: { def: EngineDefinition }) {
  const t = useTelemetry((x) => x.t);
  const set = useApp((s) => s.set);
  if (!t) return null;
  const pct = Math.round(t.fuelFraction * 100);
  const refueling = t.refuel !== 'idle';
  return (
    <section className="fuel-panel panel" aria-label="Combustível">
      <p className="panel-title">
        {def.fuel.label} · {def.fuel.fuelType}
      </p>
      <div className="kv">
        <span>Combustível</span>
        <b>
          {fmt(t.fuelL, 1)} L / {fmt(t.fuelCapacityL, 1)} L
        </b>
      </div>
      <div className={`fuelbar ${t.lowFuel ? 'low' : ''}`} role="meter" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Nível do tanque">
        <div style={{ width: `${pct}%` }} />
      </div>
      <div className="kv">
        <span>{pct}%</span>
        <span>
          {t.rangeKm != null ? `Autonomia ≈ ${fmt(t.rangeKm)} km` : t.enduranceMin != null && t.running ? `Duração ≈ ${t.enduranceMin > 120 ? `${fmt(t.enduranceMin / 60, 1)} h` : `${fmt(t.enduranceMin)} min`} neste regime` : '—'}
        </span>
      </div>
      {t.outOfFuel && <div style={{ color: 'var(--danger)', fontWeight: 700, marginTop: 6 }}>SEM COMBUSTÍVEL</div>}
      {refueling && (
        <div style={{ marginTop: 6 }}>
          <b style={{ color: 'var(--accent-2)' }}>{t.refuel === 'connecting' ? 'CONECTANDO BICO…' : t.refuel === 'fueling' ? 'ABASTECENDO' : 'FINALIZANDO…'}</b>
          <div className="kv">
            <span>Abastecido</span>
            <b>
              {fmt(t.refuelPumpedL, 1)} L → {fmt(t.fuelL, 1)} L / {fmt(t.fuelCapacityL)} L
            </b>
          </div>
        </div>
      )}
      <div className="btn-row">
        {!refueling ? (
          <button
            className={`btn sm ${t.outOfFuel ? 'primary' : ''}`}
            onClick={() => {
              simRef.current?.startRefuel();
              set({ showFuelSystem: true });
            }}
            disabled={t.fuelFraction > 0.999}
          >
            Abastecer
          </button>
        ) : (
          <button className="btn sm" onClick={() => simRef.current?.stopRefuel()}>
            Parar abastecimento
          </button>
        )}
        <button
          className="btn sm"
          onClick={() => {
            simRef.current?.completeRefuel();
            set({ showFuelSystem: true });
          }}
          disabled={t.fuelFraction > 0.999 && !refueling}
        >
          Completar tanque
        </button>
      </div>
      <p className="note">
        {def.fuel.capacityStatus === 'official' ? 'Capacidade oficial do veículo.' : 'Capacidade de bancada (parâmetro da simulação, não especificação do fabricante).'} Consumo calculado a partir da potência indicada, rotação e carga — não é medição certificada.
      </p>
    </section>
  );
}
