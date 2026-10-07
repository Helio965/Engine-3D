import { describe, expect, it } from 'vitest';
import { ENGINES, ENGINE_BY_ID } from '../data/engines';
import { EngineSimulation } from '../simulation/EngineSimulation';
import { buildEngineLayout } from '../simulation/cylinderLayout';
import { CrankClock, cycleDiff, eventsBetween, wrapCycle } from './crankClock';
import { buildSynthConfig, crankEvents, exhaustPaths, frameFromSim, pathFiringIntervals } from './synthConfig';
import { EngineSynth } from './engineSynth';
import { EV_FIRE } from './synthTypes';

const round = (xs: number[]) => xs.map((x) => Math.round(x));

describe('crank clock', () => {
  it('wraps angles onto the 720° cycle', () => {
    expect(wrapCycle(730)).toBe(10);
    expect(wrapCycle(-10)).toBe(710);
    expect(cycleDiff(10, 700)).toBe(30);
    expect(cycleDiff(700, 10)).toBe(-30);
  });

  it('reports every event crossed, in order, across the wrap', () => {
    const degs = [0, 180, 360, 540];
    expect(eventsBetween(degs, 100, 400)).toEqual([1, 2]);
    expect(eventsBetween(degs, 600, 200)).toEqual([0, 1]);
  });

  it('emits one event per crossing when advanced in small steps', () => {
    const clock = new CrankClock([90, 450]);
    clock.reset(0);
    const out = new Int32Array(4);
    let fired: number[] = [];
    for (let i = 0; i < 1440; i++) {
      const n = clock.advance(1, out);
      fired = fired.concat(Array.from(out.subarray(0, n)));
    }
    expect(fired).toEqual([0, 1, 0, 1]);
  });
});

describe('synth configuration', () => {
  it('every engine has one combustion per cylinder per cycle', () => {
    ENGINES.forEach((def) => {
      const cfg = buildSynthConfig(def);
      expect(cfg.events.filter((e) => e.kind === EV_FIRE)).toHaveLength(def.engine.cylinders);
      for (let p = 0; p < cfg.paths; p++) {
        const iv = pathFiringIntervals(cfg.events, p);
        expect(iv.reduce((s, x) => s + x, 0)).toBeCloseTo(720, 6);
      }
    });
  });

  it('V and W engines get one exhaust path per bank, the twin-turbo six one per manifold', () => {
    ENGINES.forEach((def) => {
      const { count } = exhaustPaths(def, buildEngineLayout(def.engine));
      expect(count).toBe(2);
    });
  });

  it('cross-plane V8 banks fire unevenly (the burble), flat-plane banks evenly', () => {
    const cross = buildSynthConfig(ENGINE_BY_ID['dodge-challenger-hellcat']);
    const flat = buildSynthConfig(ENGINE_BY_ID['ferrari-458-italia']);
    const crossBank = round(pathFiringIntervals(cross.events, 0));
    expect(new Set(crossBank).size).toBeGreaterThan(1);
    expect(round(pathFiringIntervals(flat.events, 0))).toEqual([180, 180, 180, 180]);
  });

  it('the S85 V10 fires every 144° on each bank (90/54° overall)', () => {
    const def = ENGINE_BY_ID['bmw-m5-e60'];
    const cfg = buildSynthConfig(def);
    expect(round(pathFiringIntervals(cfg.events, 0))).toEqual([144, 144, 144, 144, 144]);
    const layout = buildEngineLayout(def.engine);
    const all = crankEvents(layout, new Map(layout.cylinders.map((c) => [c.number, 0])));
    expect(new Set(round(pathFiringIntervals(all, 0)))).toEqual(new Set([90, 54]));
  });

  it('forced induction only where the engine has it', () => {
    ENGINES.forEach((def) => {
      const cfg = buildSynthConfig(def);
      expect(cfg.turboPan).toHaveLength(def.engine.turbo?.count ?? 0);
      expect(cfg.scMaxRpm > 0).toBe(!!def.engine.supercharger);
    });
  });

  it('each engine has its own noise seed', () => {
    expect(new Set(ENGINES.map((d) => buildSynthConfig(d).seed)).size).toBe(ENGINES.length);
  });
});

describe('engine synthesiser', () => {
  const SR = 48000;
  const BLOCK = 128;

  function render(running: boolean, seconds: number) {
    const def = ENGINE_BY_ID['nissan-skyline-r34'];
    const sim = new EngineSimulation(def);
    const synth = new EngineSynth(SR);
    synth.handle(buildSynthConfig(def), 0);
    if (running) {
      sim.start();
      for (let t = 0; t < 2; t += 1 / 120) sim.step(1 / 120);
    }
    const l = new Float32Array(BLOCK);
    const r = new Float32Array(BLOCK);
    let sum = 0;
    let finite = true;
    let now = 0;
    for (let b = 0; b < (seconds * SR) / BLOCK; b++) {
      if (b % 16 === 0) {
        if (running) sim.step((16 * BLOCK) / SR);
        synth.handle(frameFromSim(sim, 1, now, false), now);
      }
      synth.process(l, r, now);
      for (let i = 0; i < BLOCK; i++) {
        finite &&= Number.isFinite(l[i]) && Number.isFinite(r[i]);
        sum += l[i] * l[i] + r[i] * r[i];
      }
      now += BLOCK / SR;
    }
    return { rms: Math.sqrt(sum / ((seconds * SR) * 2)), finite };
  }

  it('produces a finite, audible signal while running', () => {
    const { rms, finite } = render(true, 0.5);
    expect(finite).toBe(true);
    expect(rms).toBeGreaterThan(1e-3);
  });

  it('is silent with the ignition off', () => {
    const { rms, finite } = render(false, 0.3);
    expect(finite).toBe(true);
    expect(rms).toBeLessThan(1e-4);
  });
});
