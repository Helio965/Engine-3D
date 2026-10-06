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

/**
 * Even-firing illustrative sequence used only when no firing order can be
 * confirmed (or mapped to the cylinder numbering). A deterministic search
 * picks, among many candidate permutations, one that keeps cylinders sharing
 * a crank slot on (nearly) the same throw and alternates banks/ends of the
 * crank between consecutive firings — i.e. a mechanically plausible order.
 * The UI always labels it as illustrative.
 */
export function illustrativeFiringOrder(spec: EngineSpec): number[] {
  if (spec.layout === 'w') {
    const w = wFiringOrder(spec);
    if (w) return w;
  }
  const nums = spec.cylinderMap.map((c) => c.number);
  const n = nums.length;
  const bySlot = new Map(spec.cylinderMap.map((c) => [c.number, c]));
  let seed = 0x9e3779b9 ^ (n * 2654435761);
  const rnd = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const intervals = spec.firingIntervalsDeg && spec.firingIntervalsDeg.length === n ? spec.firingIntervalsDeg : new Array(n).fill(720 / n);
  const score = (order: number[]) => {
    const tdc = new Map<number, number>();
    let acc = 0;
    order.forEach((c, k) => {
      tdc.set(c, acc);
      acc += intervals[k];
    });
    let best = Infinity;
    for (const sign of [1, -1] as const) {
      const angles = rowAngles(spec, sign);
      const pins = new Map<number, number[]>();
      spec.cylinderMap.forEach((c) => {
        const p = wrap360(angles[c.row] - (tdc.get(c.number) ?? 0));
        if (!pins.has(c.slot)) pins.set(c.slot, []);
        pins.get(c.slot)!.push(p);
      });
      let spread = 0;
      pins.forEach((p) => (spread = Math.max(spread, slotSpread(p))));
      best = Math.min(best, spread);
    }
    let penalty = 0;
    for (let k = 0; k < n; k++) {
      const a = bySlot.get(order[k])!;
      const b = bySlot.get(order[(k + 1) % n])!;
      if (spec.layout !== 'inline' && bankOfRow(spec, a.row) === bankOfRow(spec, b.row)) penalty += 6;
      if (Math.abs(a.slot - b.slot) < 2) penalty += 4;
    }
    return best * 2 + penalty;
  };
  let bestOrder = [...nums].sort((a, b) => a - b);
  let bestScore = score(bestOrder);
  for (let i = 0; i < 4000; i++) {
    const cand = [...nums];
    for (let k = cand.length - 1; k > 0; k--) {
      const j = Math.floor(rnd() * (k + 1));
      [cand[k], cand[j]] = [cand[j], cand[k]];
    }
    // cylinder 1 fires first by convention
    const i1 = cand.indexOf(Math.min(...nums));
    const rot = [...cand.slice(i1), ...cand.slice(0, i1)];
    const sc = score(rot);
    if (sc < bestScore) {
      bestScore = sc;
      bestOrder = rot;
    }
  }
  return bestOrder;
}

/**
 * Constructive even-firing order for W engines: in every crank slot the bank-B
 * cylinder fires m intervals before the bank-A cylinder, where m·interval is
 * the multiple of the firing interval closest to the angle between the banks.
 * The two rods of a slot then sit on (nearly) the same throw. Bank-A firings
 * hop along the crank to keep consecutive pulses far apart.
 */
function wFiringOrder(spec: EngineSpec): number[] | null {
  const n = spec.cylinders;
  const interval = 720 / n;
  const m = Math.max(1, Math.round(spec.bankAngleDeg / interval));
  if (n % (2 * m) !== 0) return null;
  const slots = [...new Set(spec.cylinderMap.map((c) => c.slot))].sort((a, b) => a - b);
  if (slots.length * 2 !== n) return null;
  const aTimes: number[] = [];
  for (let k = 0; k < n; k++) if (Math.floor(k / m) % 2 === 1) aTimes.push(k);
  // spread bank-A firings along the crank (greedy: farthest slot from the previous ones)
  const order: number[] = [slots[0]];
  while (order.length < slots.length) {
    let best = -1;
    let bestScore = -Infinity;
    for (const s of slots) {
      if (order.includes(s)) continue;
      const last = order[order.length - 1];
      const prev = order[order.length - 2];
      const score = Math.abs(s - last) * 2 + (prev === undefined ? 0 : Math.abs(s - prev)) - (Math.abs(s - last) > slots.length / 2 + 1 ? 1 : 0);
      if (score > bestScore) {
        bestScore = score;
        best = s;
      }
    }
    order.push(best);
  }
  const byTime = new Array<number>(n);
  aTimes.forEach((t, i) => {
    const slot = order[i];
    const a = spec.cylinderMap.find((c) => c.slot === slot && bankOfRow(spec, c.row) === 0);
    const b = spec.cylinderMap.find((c) => c.slot === slot && bankOfRow(spec, c.row) === 1);
    if (!a || !b) return;
    byTime[t] = a.number;
    byTime[(t - m + n) % n] = b.number;
  });
  if (byTime.some((v) => v === undefined)) return null;
  const first = byTime.indexOf(Math.min(...byTime));
  return [...byTime.slice(first), ...byTime.slice(0, first)];
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
  if (spec.slotPitchMm) return spec.slotPitchMm / 1000;
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
