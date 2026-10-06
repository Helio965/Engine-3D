import { useEffect, useState } from 'react';
import type { EngineDefinition } from '../types/engine';
import { useApp, FUEL_TIME_SCALES } from '../state/appStore';
import { simRef, useTelemetry } from '../state/simulationStore';
import { audioEngine } from '../audio/AudioEngine';
import type { SimMode } from '../simulation/EngineSimulation';
import { fmt } from '../data/helpers';

export function ControlsBar({ def }: { def: EngineDefinition }) {
  const t = useTelemetry((x) => x.t);
  const fuelTimeScale = useApp((s) => s.fuelTimeScale);
  const sound = useApp((s) => s.sound);
  const set = useApp((s) => s.set);
  const [pedal, setPedal] = useState(0);
  const [target, setTarget] = useState(0);
  const [dynoRpm, setDynoRpm] = useState(3000);

  useEffect(() => {
    setPedal(0);
    setTarget(0);
    const s = simRef.current;
    if (s) setDynoRpm(s.dynoTargetRpm);
  }, [def]);

  const sim = simRef.current;
  const mode = t?.mode ?? 'neutral';
  const running = t?.ignition !== 'off' && !!t;
  const refueling = t ? t.refuel !== 'idle' : false;
  const dt = def.drivetrain;
  const vmax = def.vehicleSpec?.topSpeedKmh ?? 0;

  const toggleEngine = async () => {
    await audioEngine.init();
    const s = simRef.current;
    if (!s) return;
    if (s.ignition === 'off') s.start();
    else s.stop();
  };
  const setMode = (m: SimMode) => {
    simRef.current?.setMode(m);
    setPedal(0);
    if (simRef.current) simRef.current.pedal = 0;
  };
  const changePedal = (v: number) => {
    setPedal(v);
    if (simRef.current) simRef.current.pedal = v;
  };

  const cruise = mode === 'drive' && t?.driveControl === 'cruise';
  const sweep = mode === 'dyno' && t?.dynoPhase !== 'idle';
  const shownPedal = cruise || sweep ? (t?.pedal ?? 0) : pedal;

  return (
    <section className="controls" aria-label="Controles da simulação">
      <div className="ctl">
        <button
          className={`start-btn ${running ? 'on' : ''}`}
          onClick={toggleEngine}
          disabled={refueling}
          aria-pressed={running}
          title={refueling ? 'Motor permanece desligado durante o abastecimento' : 'Ligar/desligar (tecla S)'}
        >
          {t?.ignition === 'cranking' ? 'CRANKING…' : running ? 'STOP ENGINE' : 'START ENGINE'}
        </button>
      </div>

      <div className="ctl throttle">
        <span className="lbl">
          Throttle {cruise && '· automático (velocidade alvo)'} {sweep && '· dinamômetro'}
        </span>
        <input
          className="big-range"
          type="range"
          min={0}
          max={1}
          step={0.005}
          value={shownPedal}
          disabled={cruise || sweep}
          aria-label="Acelerador"
          onChange={(e) => changePedal(+e.target.value)}
          onPointerUp={() => void 0}
        />
        <span className="val">
          {Math.round(shownPedal * 100)}% pedal · borboleta {Math.round((t?.throttlePlate ?? 0) * 100)}%
          {t?.outOfFuel && <b style={{ color: 'var(--danger)' }}> · SEM COMBUSTÍVEL</b>}
        </span>
      </div>

      <div className="sep" />

      <div className="ctl">
        <span className="lbl">Modo</span>
        <div className="seg" role="radiogroup" aria-label="Modo de simulação">
          {(
            [
              ['neutral', 'Neutro'],
              ['drive', 'Condução'],
              ['dyno', 'Dyno'],
            ] as [SimMode, string][]
          ).map(([m, label]) => (
            <button
              key={m}
              role="radio"
              aria-checked={mode === m}
              className={`btn sm ${mode === m ? 'active' : ''}`}
              onClick={() => setMode(m)}
              disabled={m === 'drive' && !dt}
              title={m === 'drive' && !dt ? 'Crate engine: sem veículo documentado' : undefined}
            >
              {label}
            </button>
          ))}
        </div>
        <span className="val">{mode === 'neutral' ? '0 km/h — acelere livremente' : mode === 'dyno' ? 'Banco de provas' : `${fmt(Math.abs(t?.speedKmh ?? 0))} km/h`}</span>
      </div>

      {mode === 'drive' && dt && sim && (
        <>
          <div className="ctl">
            <span className="lbl">Câmbio · {dt.transmission}</span>
            <div className="seg">
              <button className={`btn sm ${t?.gearMode === 'auto' ? 'active' : ''}`} onClick={() => sim.setGearMode('auto')}>
                Automático
              </button>
              <button className={`btn sm ${t?.gearMode === 'manual' ? 'active' : ''}`} onClick={() => sim.setGearMode('manual')}>
                Manual
              </button>
            </div>
            <div className="gearbox" role="group" aria-label="Seleção de marcha">
              <button className={`btn sm ${t?.gear === -1 ? 'active' : ''}`} onClick={() => sim.requestGear(-1)}>
                R
              </button>
              <button className={`btn sm ${t?.gear === 0 ? 'active' : ''}`} onClick={() => sim.requestGear(0)}>
                N
              </button>
              {dt.ratios.map((_, i) => (
                <button
                  key={i}
                  className={`btn sm ${t?.gear === i + 1 ? 'active' : ''}`}
                  onClick={() => {
                    sim.setGearMode('manual');
                    sim.requestGear(i + 1);
                  }}
                >
                  {i + 1}
                </button>
              ))}
              {dt.paddleShift && (
                <>
                  <button className="btn sm" onClick={() => sim.shiftDown()} title="Aleta − (reduzir) — tecla Q">
                    − aleta
                  </button>
                  <button className="btn sm" onClick={() => sim.shiftUp()} title="Aleta + (subir) — tecla E">
                    aleta +
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="ctl" style={{ minWidth: 220 }}>
            <span className="lbl">
              <span className="seg" style={{ marginRight: 6 }}>
                <button className={`btn sm ${t?.driveControl === 'cruise' ? 'active' : ''}`} onClick={() => (sim.driveControl = 'cruise')}>
                  Velocidade alvo
                </button>
                <button
                  className={`btn sm ${t?.driveControl === 'pedal' ? 'active' : ''}`}
                  onClick={() => {
                    sim.driveControl = 'pedal';
                    sim.pedal = pedal;
                  }}
                >
                  Pedal
                </button>
              </span>
            </span>
            {t?.driveControl === 'cruise' ? (
              <>
                <input
                  type="range"
                  min={0}
                  max={vmax}
                  step={1}
                  value={target}
                  aria-label="Velocidade alvo"
                  onChange={(e) => {
                    setTarget(+e.target.value);
                    sim.targetSpeedKmh = +e.target.value;
                  }}
                />
                <span className="val">
                  alvo {fmt(target)} km/h (0 — {fmt(vmax)})
                </span>
              </>
            ) : (
              <button className="btn sm" onPointerDown={() => (sim.brake = 1)} onPointerUp={() => (sim.brake = 0)} onPointerLeave={() => (sim.brake = 0)}>
                Freio (segure)
              </button>
            )}
          </div>
        </>
      )}

      {mode === 'dyno' && sim && (
        <div className="ctl" style={{ minWidth: 260 }}>
          <span className="lbl">Dinamômetro</span>
          <label className="val">
            Segurar rotação: {fmt(dynoRpm)} rpm
            <input
              type="range"
              min={Math.round(def.performance.idleRpm / 100) * 100}
              max={def.performance.revLimitRpm}
              step={50}
              value={dynoRpm}
              aria-label="Rotação mantida pelo dinamômetro"
              disabled={sweep}
              onChange={(e) => {
                setDynoRpm(+e.target.value);
                sim.dynoMode = 'hold';
                sim.dynoTargetRpm = +e.target.value;
              }}
              style={{ width: '100%' }}
            />
          </label>
          <div className="btn-row" style={{ marginTop: 0 }}>
            {!sweep ? (
              <button className="btn sm primary" onClick={() => sim.startDynoSweep()} disabled={!running}>
                Medir curva (WOT)
              </button>
            ) : (
              <button className="btn sm danger" onClick={() => sim.abortDynoSweep()}>
                Abortar
              </button>
            )}
          </div>
        </div>
      )}

      <div className="sep" />

      <div className="ctl extra">
        <span className="lbl">Simulation speed (combustível)</span>
        <div className="seg">
          {FUEL_TIME_SCALES.map((k) => (
            <button key={k} className={`btn sm ${fuelTimeScale === k ? 'active' : ''}`} onClick={() => set({ fuelTimeScale: k })}>
              {k}×
            </button>
          ))}
        </div>
        <span className="val" style={{ fontSize: 10.5, color: 'var(--text-3)', maxWidth: 220 }}>
          Acelera só o relógio do consumo e do abastecimento.
        </span>
      </div>

      <div className="ctl extra">
        <span className="lbl">Sound</span>
        <div className="seg">
          <button
            className={`btn sm ${sound ? 'active' : ''}`}
            onClick={async () => {
              await audioEngine.init();
              set({ sound: true });
            }}
          >
            On
          </button>
          <button className={`btn sm ${!sound ? 'active' : ''}`} onClick={() => set({ sound: false })}>
            Off
          </button>
        </div>
        <VolumeSlider />
      </div>
    </section>
  );
}

function VolumeSlider() {
  const volume = useApp((s) => s.volume);
  const set = useApp((s) => s.set);
  return <input type="range" min={0} max={1} step={0.01} value={volume} aria-label="Volume" onChange={(e) => set({ volume: +e.target.value })} />;
}
