import type { EngineSpec } from '../types/engine';
import { wrap360 } from './kinematics';

/**
 * Resolves the geometric and timing layout of every cylinder from the engine
 * data (cylinder map + firing order + bank angles).
 *
 * The crank throw angles are DERIVED, not hand-animated: for each cylinder the
 * throw must point along the cylinder axis exactly when that cylinder reaches
 * combustion TDC in the firing sequence. Pistons, valves, combustion and the
 * sound are all driven from this single table, so they cannot drift apart.
 *
 * Because the published cylinder numbering does not say which bank sits on
 * which side of the rotation direction, the solver evaluates both mirror
 * assignments and keeps the one in which cylinders sharing a crankpin slot
 * have (nearly) the same throw angle — which is how real V and W crankshafts
 * are built (shared pins, or split pins with a small offset). The tests check
 * that classic layouts (cross-plane V8, flat-plane V8, 120° inline-6) emerge.
 */

export interface CylinderGeometry {
  number: number;
  row: number;
  slot: number;
  /** Bank index: 0 for inline; 0/1 for V and W engines. */
  bank: number;
  /** Cylinder axis angle about the crank axis (deg). 0 = straight up. */
  axisDeg: number;
  /** Position along the crank axis (m), +X = front of the engine. */
  axialM: number;
  /** Crank angle (0..720) at which this cylinder is at combustion TDC. */
  tdcDeg: number;
  /** Crank throw angle in the crankshaft frame (deg, 0..360). */
  pinDeg: number;
  /** Index of this cylinder in the firing order. */
  firingIndex: number;
}

export interface CrankThrow {
  slot: number;
  axialM: number;
  /** Throw angles (deg) of the pins in this slot (1 for shared, 2 for split). */
  pinDegs: number[];
  cylinders: number[];
}

export interface EngineLayout {
  cylinders: CylinderGeometry[];
  throws: CrankThrow[];
  /** Ordered by firing sequence. */
  firingSequence: number[];
  firingOrderIsIllustrative: boolean;
  rowAnglesDeg: number[];
  slotPitchM: number;
  bankOffsetM: number;
  crankRadiusM: number;
  rodLengthM: number;
  boreM: number;
  /** Total length of the crank between the first and last slot (m). */
  crankSpanM: number;
  /** Max pin-angle mismatch inside a slot, after solving (deg). */
  maxSlotSpreadDeg: number;
}

export function rowAngles(spec: EngineSpec, sign: 1 | -1): number[] {
  if (spec.layout === 'inline') return [0];
  const h = spec.bankAngleDeg / 2;
  if (spec.layout === 'v') return [sign * h, -sign * h];
  const v = (spec.vrAngleDeg ?? 15) / 2;
  return [sign * (h + v), sign * (h - v), -sign * (h - v), -sign * (h + v)];
}

export function bankOfRow(spec: EngineSpec, row: number): number {
  if (spec.layout === 'inline') return 0;
  if (spec.layout === 'v') return row;
  return row < 2 ? 0 : 1;
}

/** Even-firing illustrative sequence used only when no firing order is confirmed. */
export function illustrativeFiringOrder(spec: EngineSpec): number[] {
  const n = spec.cylinders;
  const bySlot = [...spec.cylinderMap].sort((a, b) => a.slot - b.slot || a.row - b.row);
  // Interleave front/back halves so consecutive firings are spread along the crank.
  const nums = bySlot.map((c) => c.number);
  const out: number[] = [];
  const half = Math.ceil(nums.length / 2);
  for (let i = 0; i < half; i++) {
    out.push(nums[i]);
    if (i + half < nums.length) out.push(nums[nums.length - 1 - i]);
  }
  return out.slice(0, n);
}

function slotSpread(degs: number[]): number {
  if (degs.length < 2) return 0;
  let worst = 0;
  for (let i = 0; i < degs.length; i++) {
    for (let j = i + 1; j < degs.length; j++) {
      const d = Math.abs(wrap360(degs[i] - degs[j] + 180) - 180);
      worst = Math.max(worst, d);
    }
  }
  return worst;
}

export function slotPitch(spec: EngineSpec): number {
  const bore = spec.boreMm / 1000;
  if (spec.layout === 'w') {
    // VR banks: consecutive cylinders are staggered in two rows, so the axial
    // pitch is roughly half a bore spacing plus room for two rod big-ends.
    return bore * 0.62 + 0.012;
  }
  if (spec.layout === 'v') return bore + 0.014;
  return bore + 0.012;
}

export function buildEngineLayout(spec: EngineSpec): EngineLayout {
  const n = spec.cylinders;
  const confirmed = !!spec.firingOrder && spec.firingOrder.length === n;
  const order = confirmed ? (spec.firingOrder as number[]) : illustrativeFiringOrder(spec);
  const intervals =
    spec.firingIntervalsDeg && spec.firingIntervalsDeg.length === n
      ? spec.firingIntervalsDeg
      : new Array(n).fill(720 / n);

  const tdc = new Map<number, number>();
  const idx = new Map<number, number>();
  let acc = 0;
  order.forEach((cyl, k) => {
    tdc.set(cyl, acc);
    idx.set(cyl, k);
    acc += intervals[k];
  });

  const bore = spec.boreMm / 1000;
  const pitch = slotPitch(spec);
  const bankOffset = spec.layout === 'inline' ? 0 : Math.min(0.03, bore * 0.26);
  const maxSlot = Math.max(...spec.cylinderMap.map((c) => c.slot));
  const span = maxSlot * pitch + bankOffset;

  const solve = (sign: 1 | -1) => {
    const angles = rowAngles(spec, sign);
    const cyls: CylinderGeometry[] = spec.cylinderMap.map((c) => {
      const bank = bankOfRow(spec, c.row);
      const axisDeg = angles[c.row];
      const t = tdc.get(c.number) ?? 0;
      return {
        number: c.number,
        row: c.row,
        slot: c.slot,
        bank,
        axisDeg,
        // front of the engine is +X; slot 0 is the front-most
        axialM: span / 2 - (c.slot * pitch + bank * bankOffset),
        tdcDeg: t,
        pinDeg: wrap360(axisDeg - t),
        firingIndex: idx.get(c.number) ?? 0,
      };
    });
    let spread = 0;
    for (let s = 0; s <= maxSlot; s++) {
      spread = Math.max(spread, slotSpread(cyls.filter((c) => c.slot === s).map((c) => c.pinDeg)));
    }
    return { cyls, spread, angles };
  };

  const a = solve(1);
  const b = spec.layout === 'inline' ? a : solve(-1);
  const best = b.spread < a.spread ? b : a;

  const throws: CrankThrow[] = [];
  for (let s = 0; s <= maxSlot; s++) {
    const inSlot = best.cyls.filter((c) => c.slot === s).sort((x, y) => x.bank - y.bank);
    if (!inSlot.length) continue;
    const degs = inSlot.map((c) => c.pinDeg);
    const shared = slotSpread(degs) < 1;
    throws.push({
      slot: s,
      axialM: inSlot.reduce((m, c) => m + c.axialM, 0) / inSlot.length,
      pinDegs: shared ? [degs[0]] : degs,
      cylinders: inSlot.map((c) => c.number),
    });
  }

  return {
    cylinders: best.cyls.sort((x, y) => x.number - y.number),
    throws,
    firingSequence: order,
    firingOrderIsIllustrative: !confirmed,
    rowAnglesDeg: best.angles,
    slotPitchM: pitch,
    bankOffsetM: bankOffset,
    crankRadiusM: spec.strokeMm / 2000,
    rodLengthM: spec.rodLengthMm / 1000,
    boreM: bore,
    crankSpanM: span,
    maxSlotSpreadDeg: best.spread,
  };
}

/** Cycle angle (0..720) of a cylinder for a given accumulated crank angle. */
export function cylinderCycleDeg(crankDeg: number, cyl: CylinderGeometry): number {
  const c = (crankDeg - cyl.tdcDeg) % 720;
  return c < 0 ? c + 720 : c;
}

/** Angle between the crank throw and the cylinder axis (0 = TDC). */
export function cylinderLocalDeg(crankDeg: number, cyl: CylinderGeometry): number {
  return wrap360(crankDeg + cyl.pinDeg - cyl.axisDeg);
}
