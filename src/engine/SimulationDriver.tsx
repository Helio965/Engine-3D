import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { simRef, publishTelemetry } from '../state/simulationStore';
import { useApp } from '../state/appStore';
import { audioEngine } from '../audio/AudioEngine';

/**
 * The master clock. Runs before every other frame callback (priority −1):
 *   real dt × slow-motion factor → EngineSimulation.step()
 * then feeds the audio engine from the same state and publishes a throttled
 * telemetry snapshot (30 Hz) for the React UI.
 */
export function SimulationDriver() {
  const acc = useRef(0);
  const fpsAcc = useRef({ t: 0, n: 0 });
  useFrame((_, delta) => {
    const sim = simRef.current;
    const s = useApp.getState();
    const real = Math.min(delta, 0.1);
    if (sim) {
      sim.fuelTimeScale = s.fuelTimeScale;
      sim.step(real * s.timeScale);
      audioEngine.update(sim, s.timeScale, s.sound ? s.volume : 0);
    }
    acc.current += real;
    if (acc.current >= 1 / 30) {
      acc.current = 0;
      publishTelemetry();
    }
    const f = fpsAcc.current;
    f.t += real;
    f.n += 1;
    if (f.t >= 1) {
      const fps = Math.round(f.n / f.t);
      if (Math.abs(fps - s.fps) >= 2) s.set({ fps });
      f.t = 0;
      f.n = 0;
    }
  }, -1);
  return null;
}
