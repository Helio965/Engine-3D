import type { EngineDefinition } from '../types/engine';
import type { EngineSimulation } from '../simulation/EngineSimulation';
import { buildEngineLayout, type EngineLayout } from '../simulation/cylinderLayout';
import { ATM_BAR } from '../simulation/engineModel';
import { VALVE_EVENTS } from '../simulation/kinematics';
import { SOUND_PROFILES } from './soundProfiles';
import {
  EV_FIRE,
  EV_INTAKE,
  EV_VALVE,
  IGN_CRANKING,
  IGN_OFF,
  IGN_RUNNING,
  type CrankEventSpec,
  type SynthConfig,
  type SynthFrame,
} from './synthTypes';
import { wrapCycle } from './crankClock';

/**
 * Exhaust path of every cylinder (by cylinder number). V and W engines: one
 * path per bank. Inline engines whose turbos are fed by separate manifolds
 * (twin-turbo straight-six) get one path per manifold; otherwise one path.
 */
export function exhaustPaths(def: EngineDefinition, layout: EngineLayout): { pathOf: Map<number, number>; count: number } {
  const e = def.engine;
  const pathOf = new Map<number, number>();
  if (e.layout !== 'inline') {
    layout.cylinders.forEach((c) => pathOf.set(c.number, c.bank));
    return { pathOf, count: 2 };
  }
  const feeds = e.turbo?.feeds;
  if (feeds && feeds.length === 2 && feeds.every((f) => f.length > 0)) {
    feeds.forEach((group, i) => group.forEach((n) => pathOf.set(n, i)));
    layout.cylinders.forEach((c) => pathOf.has(c.number) || pathOf.set(c.number, 0));
    return { pathOf, count: 2 };
  }
  layout.cylinders.forEach((c) => pathOf.set(c.number, 0));
  return { pathOf, count: 1 };
}

/** Sound events of one four-stroke cycle: combustion at each firing TDC, intake flow, valve seating. */
export function crankEvents(layout: EngineLayout, pathOf: Map<number, number>): CrankEventSpec[] {
  const intakePeak = (VALVE_EVENTS.intakeOpen + VALVE_EVENTS.intakeClose) / 2;
  const out: CrankEventSpec[] = [];
  layout.cylinders.forEach((c, cyl) => {
    const path = pathOf.get(c.number) ?? 0;
    out.push({ deg: wrapCycle(c.tdcDeg), kind: EV_FIRE, cyl, path });
    out.push({ deg: wrapCycle(c.tdcDeg + intakePeak), kind: EV_INTAKE, cyl, path });
    out.push({ deg: wrapCycle(c.tdcDeg + VALVE_EVENTS.exhaustClose), kind: EV_VALVE, cyl, path });
    out.push({ deg: wrapCycle(c.tdcDeg + VALVE_EVENTS.intakeClose), kind: EV_VALVE, cyl, path });
  });
  return out;
}

/** Crank-degree gaps between consecutive combustions on one exhaust path (sum = 720). */
export function pathFiringIntervals(events: readonly CrankEventSpec[], path: number): number[] {
  const degs = events
    .filter((e) => e.kind === EV_FIRE && e.path === path)
    .map((e) => e.deg)
    .sort((a, b) => a - b);
  return degs.map((d, i) => (i + 1 < degs.length ? degs[i + 1] - d : degs[0] + 720 - d));
}

export function buildSynthConfig(def: EngineDefinition): SynthConfig {
  const e = def.engine;
  const layout = buildEngineLayout(e);
  const { pathOf, count } = exhaustPaths(def, layout);
  const params = SOUND_PROFILES[def.soundProfile];
  const pathPan = count === 2 ? [-params.pan, params.pan] : [0];
  // each turbo sits on the side of the cylinders that feed it
  const turboPan = (e.turbo?.feeds ?? []).map((feed) => {
    if (count < 2 || !feed.length) return 0;
    const mean = feed.reduce((s, n) => s + (pathOf.get(n) ?? 0), 0) / feed.length;
    return (mean * 2 - 1) * params.pan * 0.7;
  });
  return {
    type: 'config',
    params,
    events: crankEvents(layout, pathOf),
    cylinders: layout.cylinders.length,
    paths: count,
    pathPan,
    idleRpm: def.performance.idleRpm,
    redlineRpm: def.performance.redlineRpm,
    // pushrod valvetrains click lower and louder than overhead-cam ones
    tickHz: e.valvetrain === 'ohv' ? 2800 : 5200,
    turboPan,
    turboMaxRpm: e.turbo?.maxShaftRpm ?? 0,
    scMaxRpm: e.supercharger ? def.performance.revLimitRpm * e.supercharger.driveRatio : 0,
    seed: [...def.id].reduce((h, ch) => Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0, 2166136261),
  };
}

/**
 * Engine state for the synthesiser, read from the simulation.
 * @param at audio-context time at which this state must be heard
 * @param blowOff true on the frame a blow-off/diverter valve opened
 */
export function frameFromSim(sim: EngineSimulation, timeScale: number, at: number, blowOff: boolean): SynthFrame {
  const e = sim.def.engine;
  const maxBoost = e.turbo?.maxBoostBar ?? e.supercharger?.maxBoostBar ?? 0;
  const boost = maxBoost ? Math.max(0, sim.boost / maxBoost) : 0;
  return {
    type: 'frame',
    crankDeg: sim.crankDeg,
    at,
    rpm: sim.rpm * timeScale,
    timeScale,
    ignition: sim.ignition === 'running' ? IGN_RUNNING : sim.ignition === 'cranking' ? IGN_CRANKING : IGN_OFF,
    combusting: sim.combusting,
    charge: (sim.manifold + sim.boost / ATM_BAR) / (1 + maxBoost / ATM_BAR),
    plate: sim.plate,
    boost,
    turbo: e.turbo ? sim.turboShaft.map((r) => r / e.turbo!.maxShaftRpm) : [],
    turboOn: sim.activeTurbos(),
    scRpm: sim.scRotorRpm,
    blowOff: blowOff ? Math.min(1, 0.5 + 0.5 * boost) : 0,
  };
}
