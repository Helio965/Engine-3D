import type { EngineDefinition } from '../types/engine';
import type { EngineLayout } from '../simulation/cylinderLayout';
import { DEG } from '../simulation/kinematics';

/**
 * Derived engine dimensions (metres) computed from bore, stroke, rod length
 * and layout. Proportions of the parts that are not published (piston
 * compression height, head height…) use typical engineering ratios.
 */
export interface EngineDims {
  r: number;
  l: number;
  bore: number;
  compressionHeight: number;
  pistonHeight: number;
  /** Crank axis → deck face, along the cylinder axis. */
  deck: number;
  /** Crank axis → bottom of the cylinder liner, along the axis. */
  linerBottom: number;
  headHeight: number;
  coverHeight: number;
  /** Width of each bank perpendicular to its axis. */
  bankWidth: number;
  /** Centre axis angle of each bank (deg). */
  bankAxisDeg: number[];
  /** Lateral offset (perpendicular to the bank axis, at deck height) of each row centre relative to its bank axis. */
  rowLateral: number[];
  blockLength: number;
  frontX: number;
  rearX: number;
  crankcaseRadius: number;
  sumpDepth: number;
  /** Lowest point of the engine (sump bottom), y in engine space. */
  bottomY: number;
  valveLift: number;
  valveHeadDia: { intake: number; exhaust: number };
}

export function computeDims(def: EngineDefinition, layout: EngineLayout): EngineDims {
  const e = def.engine;
  const bore = layout.boreM;
  const r = layout.crankRadiusM;
  const l = layout.rodLengthM;
  const compressionHeight = bore * 0.32;
  const pistonHeight = bore * 0.58;
  const deck = r + l + compressionHeight + 0.0008;
  const linerBottom = deck - (2 * r + pistonHeight + bore * 0.08);
  const ohv = e.valvetrain === 'ohv';
  const headHeight = ohv ? bore * 1.05 : bore * 1.18;
  const coverHeight = ohv ? bore * 0.62 : bore * 0.48;

  let bankAxisDeg: number[];
  let rowLateral: number[];
  let bankWidth = bore + 0.034;
  if (e.layout === 'inline') {
    bankAxisDeg = [0];
    rowLateral = [0];
  } else if (e.layout === 'v') {
    bankAxisDeg = [layout.rowAnglesDeg[0], layout.rowAnglesDeg[1]];
    rowLateral = [0, 0];
  } else {
    const a = (layout.rowAnglesDeg[0] + layout.rowAnglesDeg[1]) / 2;
    const b = (layout.rowAnglesDeg[2] + layout.rowAnglesDeg[3]) / 2;
    bankAxisDeg = [a, b];
    const half = (Math.abs(layout.rowAnglesDeg[0] - layout.rowAnglesDeg[1]) / 2) * DEG;
    const lat = Math.sin(half) * deck;
    // rows ordered outer→inner for bank A, inner→outer for bank B
    rowLateral = [Math.sign(a) * lat, -Math.sign(a) * lat, Math.sign(b) * -lat, Math.sign(b) * lat];
    bankWidth = bore + 2 * lat + 0.03;
  }

  const blockLength = layout.crankSpanM + bore + 0.07;
  const crankcaseRadius = r * 2.05 + 0.03;
  const sumpDepth = e.lubrication === 'dry' ? r + 0.075 : r + 0.15;
  return {
    r,
    l,
    bore,
    compressionHeight,
    pistonHeight,
    deck,
    linerBottom,
    headHeight,
    coverHeight,
    bankWidth,
    bankAxisDeg,
    rowLateral,
    blockLength,
    frontX: blockLength / 2,
    rearX: -blockLength / 2,
    crankcaseRadius,
    sumpDepth,
    bottomY: -(crankcaseRadius + sumpDepth),
    valveLift: Math.min(0.0135, bore * 0.125),
    valveHeadDia: {
      intake: e.valvesPerCylinder >= 4 ? bore * 0.37 : bore * 0.5,
      exhaust: e.valvesPerCylinder >= 4 ? bore * 0.31 : bore * 0.41,
    },
  };
}

/** Unit direction (in the YZ plane) of an axis at `deg` from vertical. */
export function axisDir(deg: number): [number, number] {
  return [Math.cos(deg * DEG), Math.sin(deg * DEG)];
}

/** Point at distance `along` on an axis at `deg`, shifted `lateral` perpendicular to it (YZ plane). */
export function axisPoint(deg: number, along: number, lateral = 0): [number, number] {
  const [cy, sz] = axisDir(deg);
  // perpendicular (rotated +90°): (-sin, cos)
  return [cy * along - sz * lateral, sz * along + cy * lateral];
}
