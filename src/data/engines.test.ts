import { describe, expect, it } from 'vitest';
import { ENGINES, getEngine } from './engines';
import { buildEngineLayout } from '../simulation/cylinderLayout';
import { rpmFromSpeed } from '../simulation/transmission';
import { buildTorqueCurve, powerFromTorque } from '../simulation/curves';
import { EngineSimulation } from '../simulation/EngineSimulation';

/**
 * Data-integrity checks for every engine in the catalogue: internal
 * consistency of the published figures, architecture vs cylinder map,
 * absence of invented forced induction, sources for every non-estimated
 * spec, and engine-specific limits in the simulation.
 */
describe.each(ENGINES.map((e) => [e.id, e] as const))('%s', (_id, def) => {
  const e = def.engine;
  const p = def.performance;

  it('cylinder map matches the architecture', () => {
    expect(e.cylinderMap).toHaveLength(e.cylinders);
    expect(new Set(e.cylinderMap.map((c) => c.number)).size).toBe(e.cylinders);
    const rows = new Set(e.cylinderMap.map((c) => c.row));
    if (e.layout === 'inline') expect([...rows]).toEqual([0]);
    if (e.layout === 'v') expect(rows.size).toBe(2);
    if (e.layout === 'w') expect(rows.size).toBe(4);
  });

  it('firing order (when confirmed) is a permutation of the cylinders', () => {
    if (!e.firingOrder) return;
    expect([...e.firingOrder].sort((a, b) => a - b)).toEqual(e.cylinderMap.map((c) => c.number).sort((a, b) => a - b));
  });

  it('bore × stroke × cylinders reproduces the displacement (±1.5 %)', () => {
    const cc = (Math.PI / 4) * (e.boreMm / 10) ** 2 * (e.strokeMm / 10) * e.cylinders;
    expect(Math.abs(cc - e.displacementCc) / e.displacementCc).toBeLessThan(0.015);
  });

  it('power figures are consistent (PS = kW × 1.35962, hp = kW / 0.7457) ±1.5 %', () => {
    expect(Math.abs(p.powerKw * 1.35962 - p.powerPs) / p.powerPs).toBeLessThan(0.015);
    expect(Math.abs(p.powerKw / 0.7457 - p.powerHp) / p.powerHp).toBeLessThan(0.015);
  });

  it('rpm limits are ordered', () => {
    expect(p.idleRpm).toBeLessThan(p.redlineRpm);
    expect(p.redlineRpm).toBeLessThanOrEqual(p.revLimitRpm);
    expect(def.dashboard.tachMaxRpm).toBeGreaterThanOrEqual(p.revLimitRpm);
  });

  it('never invents forced induction', () => {
    if (e.aspiration === 'na') {
      expect(e.turbo).toBeUndefined();
      expect(e.supercharger).toBeUndefined();
    }
    if (e.aspiration === 'turbo') {
      expect(e.turbo).toBeDefined();
      expect(e.supercharger).toBeUndefined();
      const fed = e.turbo!.feeds.flat().sort((a, b) => a - b);
      expect(fed).toEqual(e.cylinderMap.map((c) => c.number).sort((a, b) => a - b));
      expect(e.turbo!.feeds).toHaveLength(e.turbo!.count);
    }
    if (e.aspiration === 'supercharged') {
      expect(e.supercharger).toBeDefined();
      expect(e.turbo).toBeUndefined();
    }
  });

  it('the solved crank puts pins of a slot together (shared or split ≤ 45°)', () => {
    const lay = buildEngineLayout(e);
    expect(lay.maxSlotSpreadDeg).toBeLessThanOrEqual(45.01);
  });

  it('the torque curve reproduces the published peaks', () => {
    const curve = buildTorqueCurve(def);
    const tRpm = Array.isArray(p.torqueRpm) ? p.torqueRpm[0] : p.torqueRpm;
    expect(curve(tRpm)).toBeCloseTo(p.torqueNm, 0);
    expect(powerFromTorque(curve(p.powerRpm), p.powerRpm)).toBeCloseTo(Math.min(p.powerKw, powerFromTorque(p.torqueNm, p.powerRpm)), 0);
  });

  it('gearing reaches the top speed within the rev limit', () => {
    const dt = def.drivetrain;
    const vs = def.vehicleSpec;
    if (!dt || !vs) {
      expect(def.isCrateEngine).toBe(true);
      return;
    }
    for (let i = 1; i < dt.ratios.length; i++) expect(dt.ratios[i]).toBeLessThan(dt.ratios[i - 1]);
    const top = dt.ratios.length;
    expect(rpmFromSpeed(dt, top, vs.topSpeedKmh)).toBeLessThanOrEqual(p.revLimitRpm * 1.02);
    expect(def.dashboard.speedoMaxKmh).toBeGreaterThanOrEqual(Math.min(vs.topSpeedKmh, def.dashboard.speedoMaxKmh));
  });

  it('every non-estimated spec cites an existing source', () => {
    const ids = new Set(def.sources.map((s) => s.id));
    for (const r of def.specs) {
      if (r.status === 'official' || r.status === 'reputable') expect(r.sources?.length, r.label).toBeGreaterThan(0);
      r.sources?.forEach((s) => expect(ids.has(s), `${r.label} → ${s}`).toBe(true));
    }
    expect(def.sources.some((s) => s.official)).toBe(true);
  });

  it('simulation respects this engine’s idle and limiter', () => {
    const sim = new EngineSimulation(def);
    sim.start();
    for (let i = 0; i < 360; i++) sim.step(1 / 60);
    expect(sim.rpm).toBeGreaterThan(p.idleRpm * 0.85);
    expect(sim.rpm).toBeLessThan(p.idleRpm * 1.2);
    sim.pedal = 1;
    let peak = 0;
    for (let i = 0; i < 300; i++) {
      sim.step(1 / 60);
      peak = Math.max(peak, sim.rpm);
    }
    expect(peak).toBeLessThan(p.revLimitRpm + 300);
    expect(sim.snapshot().fuelCapacityL).toBe(def.fuel.capacityL);
  });
});

describe('catalogue', () => {
  it('ids are unique and resolvable', () => {
    expect(new Set(ENGINES.map((e) => e.id)).size).toBe(ENGINES.length);
    ENGINES.forEach((e) => expect(getEngine(e.id)).toBe(e));
  });
  it('crate engines are flagged and have no invented vehicle', () => {
    ENGINES.filter((e) => e.isCrateEngine).forEach((e) => {
      expect(e.drivetrain).toBeNull();
      expect(e.vehicleSpec).toBeNull();
    });
  });
});
