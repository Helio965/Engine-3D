import { create } from 'zustand';
import { EngineSimulation, type Telemetry } from '../simulation/EngineSimulation';
import type { EngineDefinition } from '../types/engine';

/**
 * The live simulation object is deliberately kept OUTSIDE React state: it is
 * mutated every frame by the master clock (SimulationDriver) and read directly
 * by the 3D parts. React UI reads a throttled snapshot (`useTelemetry`).
 */
export const simRef: { current: EngineSimulation | null } = { current: null };

export function createSimulation(def: EngineDefinition, carry?: EngineSimulation | null): EngineSimulation {
  const sim = new EngineSimulation(def);
  if (carry) {
    sim.fuelTimeScale = carry.fuelTimeScale;
    if (carry.mode !== 'drive' || sim.hasVehicle) sim.setMode(carry.mode);
    sim.gearMode = carry.gearMode;
    sim.driveControl = carry.driveControl;
  }
  simRef.current = sim;
  return sim;
}

export const useTelemetry = create<{ t: Telemetry | null }>(() => ({ t: null }));

export function publishTelemetry() {
  const sim = simRef.current;
  if (sim) useTelemetry.setState({ t: sim.snapshot() });
}

/** Imperative commands used by the UI. */
export const sim = {
  get: () => simRef.current,
  start: () => simRef.current?.start(),
  stop: () => simRef.current?.stop(),
  toggle: () => {
    const s = simRef.current;
    if (!s) return;
    if (s.ignition === 'off') s.start();
    else s.stop();
  },
};
