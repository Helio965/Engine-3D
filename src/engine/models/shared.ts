import type { EngineModelContext } from '../EngineContext';
import type { Vec3 } from '../parts/Plumbing';
import { portPoint, intakeSideOf } from '../parts/Plumbing';
import type { FlowPaths } from './types';

/** Helpers shared by the per-engine models (flow paths, anchors, sizes). */

export function cylinderPorts(ctx: EngineModelContext, intakeInside = true, inlineSide: 1 | -1 = 1) {
  const { layout, dims, def } = ctx;
  return layout.cylinders.map((c) => {
    const s = intakeSideOf(c, dims, def.engine.layout, intakeInside, inlineSide);
    return {
      c,
      intake: portPoint(c, dims, s, 0).toArray() as Vec3,
      exhaust: portPoint(c, dims, -s, 0).toArray() as Vec3,
      chamber: [c.axialM, Math.cos((c.axisDeg * Math.PI) / 180) * dims.deck, Math.sin((c.axisDeg * Math.PI) / 180) * dims.deck] as Vec3,
    };
  });
}

/** Default size estimate (length, height, width) of an engine in metres. */
export function defaultSize(ctx: EngineModelContext): Vec3 {
  const { dims, def } = ctx;
  const width = def.engine.layout === 'inline' ? dims.bankWidth + 0.35 : dims.bankWidth * 2.6 + 0.2;
  return [dims.blockLength + 0.25, dims.deck + dims.headHeight + dims.coverHeight + dims.sumpDepth + dims.crankcaseRadius + 0.1, width];
}

export function coolantPaths(ctx: EngineModelContext): Vec3[][] {
  const { dims, layout } = ctx;
  const front = dims.frontX + 0.04;
  const rear = dims.rearX + 0.04;
  return dims.bankAxisDeg.map((deg) => {
    const a = (deg * Math.PI) / 180;
    const along = dims.deck * 0.75;
    const p = (x: number, k = along): Vec3 => [x, Math.cos(a) * k, Math.sin(a) * k];
    void layout;
    return [[front, dims.deck * 0.45, 0], p(front - 0.04), p(rear), p(rear, dims.deck + dims.headHeight * 0.4), p(front - 0.02, dims.deck + dims.headHeight * 0.4), [front + 0.02, dims.deck + dims.headHeight * 0.3, 0]];
  });
}

/** Exhaust flow from each chamber through its port to the given outlets. */
export function exhaustPaths(ctx: EngineModelContext, outletFor: (cyl: number) => Vec3[], intakeInside = true, inlineSide: 1 | -1 = 1): Vec3[][] {
  return cylinderPorts(ctx, intakeInside, inlineSide).map((p) => [p.chamber, p.exhaust, ...outletFor(p.c.number)]);
}

/** Intake flow: upstream path (filter → … → plenum) then into each cylinder. */
export function intakePaths(ctx: EngineModelContext, upstreamFor: (cyl: number) => Vec3[], intakeInside = true, inlineSide: 1 | -1 = 1): Vec3[][] {
  return cylinderPorts(ctx, intakeInside, inlineSide).map((p) => [...upstreamFor(p.c.number), p.intake, p.chamber]);
}

export function fuelRailPaths(ctx: EngineModelContext, inlet: Vec3, intakeInside = true, inlineSide: 1 | -1 = 1): Vec3[][] {
  const ports = cylinderPorts(ctx, intakeInside, inlineSide);
  return ports.map((p) => [inlet, [p.intake[0], p.intake[1] + 0.04, p.intake[2]], p.intake, p.chamber]);
}

export function emptyFlows(): FlowPaths {
  return { air: [], fuel: [], exhaust: [], coolant: [] };
}
