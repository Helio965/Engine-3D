import { describe, expect, it } from 'vitest';
import {
  combustionGlow,
  exhaustValveLift,
  intakeValveLift,
  pistonPinDistance,
  pistonTravelFromTdc,
  strokePhase,
  wrap720,
} from './kinematics';
import { buildEngineLayout, cylinderCycleDeg, cylinderLocalDeg } from './cylinderLayout';
import { testEngine } from './__fixtures__/testEngine';
import type { EngineSpec } from '../types/engine';

describe('slider-crank kinematics', () => {
  const r = 0.045;
  const l = 0.155;
  it('is at TDC (r + l) at 0° and BDC (l - r) at 180°', () => {
    expect(pistonPinDistance(0, r, l)).toBeCloseTo(r + l, 9);
    expect(pistonPinDistance(180, r, l)).toBeCloseTo(l - r, 9);
  });
  it('travel equals the stroke at BDC', () => {
    expect(pistonTravelFromTdc(180, r, l)).toBeCloseTo(2 * r, 9);
  });
  it('piston is past mid-stroke at 90° because of rod obliquity', () => {
    expect(pistonTravelFromTdc(90, r, l)).toBeGreaterThan(r);
  });
});

describe('four-stroke cycle', () => {
  it('orders the strokes power → exhaust → intake → compression', () => {
    expect(strokePhase(10)).toBe('power');
    expect(strokePhase(200)).toBe('exhaust');
    expect(strokePhase(400)).toBe('intake');
    expect(strokePhase(600)).toBe('compression');
  });
  it('keeps both valves closed during compression and early power', () => {
    for (const c of [600, 650, 700, 0, 40, 100]) {
      expect(intakeValveLift(c)).toBe(0);
      expect(exhaustValveLift(c)).toBe(0);
    }
  });
  it('opens intake during the intake stroke and exhaust during the exhaust stroke', () => {
    expect(intakeValveLift(470)).toBeGreaterThan(0.9);
    expect(exhaustValveLift(250)).toBeGreaterThan(0.9);
    expect(intakeValveLift(250)).toBe(0);
    expect(exhaustValveLift(470)).toBe(0);
  });
  it('has valve overlap around exhaust TDC', () => {
    expect(intakeValveLift(362)).toBeGreaterThan(0);
    expect(exhaustValveLift(362)).toBeGreaterThan(0);
  });
  it('shows combustion only right after firing TDC', () => {
    expect(combustionGlow(5)).toBeGreaterThan(0.4);
    expect(combustionGlow(360)).toBe(0);
    expect(combustionGlow(600)).toBe(0);
  });
});

const spec = (over: Partial<EngineSpec>): EngineSpec => ({ ...testEngine.engine, ...over });

function pinsBySlot(s: EngineSpec) {
  const lay = buildEngineLayout(s);
  return { lay, pins: lay.throws.map((t) => t.pinDegs) };
}

describe('crank layout solver', () => {
  it('derives a cross-plane crank (0/90/270/180) for a Chevrolet-numbered V8', () => {
    const { lay, pins } = pinsBySlot(testEngine.engine);
    expect(lay.maxSlotSpreadDeg).toBeLessThan(0.5);
    expect(pins.every((p) => p.length === 1)).toBe(true);
    const rel = pins.map((p) => Math.round((((p[0] - pins[0][0]) % 360) + 360) % 360));
    expect(new Set(rel)).toEqual(new Set([0, 90, 180, 270]));
  });

  it('derives a flat-plane crank for a Ferrari-numbered V8 (1-5-3-7-4-8-2-6)', () => {
    const s = spec({
      firingOrder: [1, 5, 3, 7, 4, 8, 2, 6],
      cylinderMap: [1, 2, 3, 4].map((n, i) => ({ number: n, row: 0, slot: i })).concat([5, 6, 7, 8].map((n, i) => ({ number: n, row: 1, slot: i }))),
    });
    const { lay, pins } = pinsBySlot(s);
    expect(lay.maxSlotSpreadDeg).toBeLessThan(0.5);
    const rel = pins.map((p) => Math.round((((p[0] - pins[0][0]) % 360) + 360) % 360));
    expect(rel).toEqual([0, 180, 180, 0]);
  });

  it('derives the 120° inline-6 crank from 1-5-3-6-2-4', () => {
    const s = spec({
      layout: 'inline',
      cylinders: 6,
      bankAngleDeg: 0,
      firingOrder: [1, 5, 3, 6, 2, 4],
      cylinderMap: [1, 2, 3, 4, 5, 6].map((n, i) => ({ number: n, row: 0, slot: i })),
    });
    const { pins } = pinsBySlot(s);
    const rel = pins.map((p) => Math.round((((p[0] - pins[0][0]) % 360) + 360) % 360));
    expect(rel).toEqual([0, 240, 120, 120, 240, 0]);
  });

  it('derives 18° split pins for an even-firing 90° V10 (1-6-5-10-2-7-3-8-4-9)', () => {
    const s = spec({
      cylinders: 10,
      firingOrder: [1, 6, 5, 10, 2, 7, 3, 8, 4, 9],
      cylinderMap: [1, 2, 3, 4, 5].map((n, i) => ({ number: n, row: 0, slot: i })).concat([6, 7, 8, 9, 10].map((n, i) => ({ number: n, row: 1, slot: i }))),
    });
    const { lay } = pinsBySlot(s);
    expect(lay.maxSlotSpreadDeg).toBeCloseTo(18, 5);
    expect(lay.throws.every((t) => t.pinDegs.length === 2)).toBe(true);
  });

  it('puts every cylinder at TDC exactly when its firing slot comes up', () => {
    const lay = buildEngineLayout(testEngine.engine);
    for (const c of lay.cylinders) {
      expect(cylinderLocalDeg(c.tdcDeg, c)).toBeCloseTo(0, 9);
      expect(cylinderCycleDeg(c.tdcDeg, c)).toBeCloseTo(0, 9);
      expect(cylinderCycleDeg(c.tdcDeg + 360, c)).toBeCloseTo(360, 9);
    }
  });

  it('fires the cylinders in the published order at even intervals', () => {
    const lay = buildEngineLayout(testEngine.engine);
    const byTdc = [...lay.cylinders].sort((a, b) => a.tdcDeg - b.tdcDeg);
    expect(byTdc.map((c) => c.number)).toEqual([1, 8, 4, 3, 6, 5, 7, 2]);
    byTdc.forEach((c, i) => expect(c.tdcDeg).toBeCloseTo(i * 90, 9));
  });

  it('never has two cylinders in combustion at the same instant for an even-firing engine', () => {
    const lay = buildEngineLayout(testEngine.engine);
    for (let crank = 0; crank < 720; crank += 1) {
      const burning = lay.cylinders.filter((c) => wrap720(cylinderCycleDeg(crank, c)) < 60);
      expect(burning.length).toBeLessThanOrEqual(1);
    }
  });

  it('marks the firing order as illustrative when none is confirmed', () => {
    const lay = buildEngineLayout(spec({ firingOrder: null, firingOrderStatus: 'unconfirmed' }));
    expect(lay.firingOrderIsIllustrative).toBe(true);
    expect(new Set(lay.firingSequence).size).toBe(8);
  });
});
