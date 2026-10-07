import { useEngine, type EngineModelContext } from '../EngineContext';
import { Bellhousing, Block, CamCovers, Heads, Sump, TimingCover } from '../parts/Housing';
import { FrontDrive } from '../parts/Accessories';
import { Box, Headers, Runners, type Vec3 } from '../parts/Plumbing';
import { Turbo, TwinScrewSupercharger } from '../parts/ForcedInduction';
import { Part } from '../Part';
import type { ModelMeta } from './types';
import { coolantPaths, defaultSize, exhaustPaths, fuelRailPaths, intakePaths } from './shared';

/**
 * Generic fallback exterior built only from the engine layout. Used while a
 * dedicated model is loading and as the reference for new engines.
 */
function plenumPoint(ctx: EngineModelContext): Vec3 {
  const { dims, def } = ctx;
  if (def.engine.layout === 'inline') return [0, dims.deck + dims.headHeight * 0.6, dims.bankWidth / 2 + 0.16];
  return [0, dims.deck * Math.cos((dims.bankAxisDeg[0] * Math.PI) / 180) + dims.headHeight * 0.9, 0];
}

export default function GenericModel() {
  const ctx = useEngine();
  const { def, dims, layout } = ctx;
  const plenum = plenumPoint(ctx);
  const targets: Record<number, Vec3> = {};
  layout.cylinders.forEach((c) => (targets[c.number] = [c.axialM * 0.9, plenum[1], plenum[2] * 0.9]));
  const banks = dims.bankAxisDeg.length;
  const collectorFor = (bank: number): Vec3 => {
    const deg = dims.bankAxisDeg[bank] ?? 0;
    const side = def.engine.layout === 'inline' ? -1 : Math.sign(deg) || 1;
    return [dims.rearX + 0.05, -0.02, side * (dims.bankWidth * (banks > 1 ? 1.25 : 0.75) + 0.08)];
  };
  return (
    <group>
      <Block finish="castAluminium" />
      <Heads finish="castAluminium" />
      <CamCovers finish="satin" labels={[def.engine.code]} />
      <Sump finish="castAluminium" />
      <TimingCover finish="castAluminium" />
      <Bellhousing finish="castAluminium" />
      <FrontDrive />
      <Runners targets={targets} finish="castAluminium" />
      <Part kind="plenum" category="induction" explode={[0, 0.3, 0]}>
        <Box position={plenum} size={[dims.blockLength * 0.85, 0.07, 0.12]} finish="castAluminium" category="induction" />
      </Part>
      <Headers
        groups={dims.bankAxisDeg.map((_, b) => ({
          cylinders: layout.cylinders.filter((c) => c.bank === b).map((c) => c.number),
          collector: collectorFor(b),
          outlet: [[dims.rearX - 0.15, -0.05, collectorFor(b)[2]]] as Vec3[],
        }))}
      />
      {def.engine.turbo &&
        new Array(def.engine.turbo.count).fill(0).map((_, i) => {
          const bank = i % banks;
          const c = collectorFor(bank);
          return <Turbo key={i} index={i} position={[c[0] + 0.12 + Math.floor(i / banks) * 0.18, c[1] + 0.1, c[2]]} rotation={[0, 0, Math.PI / 2]} />;
        })}
      {def.engine.supercharger && (
        <TwinScrewSupercharger position={[0, plenum[1] + 0.02, 0]} length={dims.blockLength * 0.8} width={0.24} height={0.13} />
      )}
    </group>
  );
}

export const meta: ModelMeta = {
  valvetrain: { intakeInside: true, inlineIntakeSide: 1, injection: 'port', coilOnPlug: true },
  anchors: (ctx) => ({
    intake: plenumPoint(ctx),
    exhaust: [ctx.dims.rearX, 0, ctx.dims.bankWidth],
    pistons: [0, ctx.dims.deck * 0.6, 0],
    crankshaft: [0, 0, 0],
    valvetrain: [0, ctx.dims.deck + ctx.dims.headHeight * 0.6, 0],
    front: [ctx.dims.frontX + 0.06, 0, 0],
  }),
  flows: (ctx) => ({
    air: intakePaths(ctx, () => [[ctx.dims.frontX + 0.1, plenumPoint(ctx)[1] + 0.05, plenumPoint(ctx)[2]], plenumPoint(ctx)]),
    exhaust: exhaustPaths(ctx, () => [[ctx.dims.rearX - 0.15, -0.05, ctx.dims.bankWidth]]),
    fuel: fuelRailPaths(ctx, [ctx.dims.frontX - 0.02, plenumPoint(ctx)[1], plenumPoint(ctx)[2]]),
    coolant: coolantPaths(ctx),
  }),
  fuelInlet: (ctx) => [ctx.dims.frontX - 0.02, plenumPoint(ctx)[1], plenumPoint(ctx)[2]],
  size: defaultSize,
};
