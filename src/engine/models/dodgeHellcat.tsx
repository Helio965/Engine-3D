import { useMemo } from 'react';
import { useEngine, type EngineModelContext } from '../EngineContext';
import { Bellhousing, Block, CamCovers, Heads, Sump, TimingCover } from '../parts/Housing';
import { FrontDrive, OilFilter, type PulleySpec } from '../parts/Accessories';
import { Box, Headers, Pipe, ThrottleBody, type Vec3 } from '../parts/Plumbing';
import { TwinScrewSupercharger } from '../parts/ForcedInduction';
import { Part } from '../Part';
import type { ModelMeta } from './types';
import { coolantPaths, cylinderPorts, defaultSize } from './shared';
import { valleyGeometry } from './pushrodCommon';

/**
 * Supercharged 6.2 L HEMI (Challenger SRT Hellcat): orange-painted block,
 * black coil covers reading 'SUPERCHARGED HEMI', a dominant black 2.4 L
 * twin-screw supercharger in the valley with the throttle body at its front
 * and its own belt-driven pulley. No turbochargers.
 */
function geom(ctx: EngineModelContext) {
  const { dims } = ctx;
  const v = valleyGeometry(ctx);
  const sc = { len: dims.blockLength * 0.86, width: v.innerZ * 2 + 0.07, height: 0.15, y: v.valleyY - 0.075 };
  const pulleyY = sc.y + sc.height * 0.48;
  return { ...v, sc, pulleyY };
}

export default function DodgeHellcat() {
  const ctx = useEngine();
  const { dims, layout } = ctx;
  const g = useMemo(() => geom(ctx), [ctx]);
  const pulleys = useMemo<PulleySpec[]>(
    () => [
      { kind: 'crankPulley', y: 0, z: 0, radius: 0.095 },
      { kind: 'superchargerPulley', y: g.pulleyY, z: 0, radius: 0.046 },
      { kind: 'idler', y: g.pulleyY - 0.08, z: 0.1, radius: 0.034 },
      { kind: 'tensioner', y: g.pulleyY - 0.1, z: -0.11, radius: 0.034 },
      { kind: 'waterPump', y: dims.deck * 0.45, z: 0.0, radius: 0.06, body: true },
      { kind: 'alternator', y: dims.deck * 0.55, z: 0.21, radius: 0.04, body: true },
      { kind: 'acCompressor', y: -0.03, z: -0.2, radius: 0.058, body: true },
    ],
    [dims, g],
  );
  const scFront = g.sc.len / 2;
  const tb: Vec3 = [scFront + 0.075, g.sc.y + g.sc.height * 0.62, 0.075];
  return (
    <group>
      <Block finish="gloss" color="#d4511c" />
      <Heads finish="castAluminium" color="#aeb1b5" />
      <CamCovers finish="satin" color="#141518" labels={['SUPERCHARGED HEMI']} labelColor="#cfd2d6" fins={2} finFinish="machinedAluminium" heightFrac={0.8} />
      <Sump finish="satin" color="#1c1d20" />
      <TimingCover finish="castAluminium" color="#9fa3a8" />
      <Bellhousing finish="castAluminium" />
      <FrontDrive pulleys={pulleys} />
      <OilFilter position={[dims.rearX + 0.2, -0.06, -0.2]} rotation={[Math.PI / 2.2, 0, 0]} color="#e5e5e5" />
      <TwinScrewSupercharger position={[-0.01, g.sc.y, 0]} length={g.sc.len} width={g.sc.width} height={g.sc.height} lidLabel="SUPERCHARGED" pulleyX={scFront + 0.075} />
      <ThrottleBody position={tb} rotation={[0, 0, Math.PI / 2]} radius={0.046} />
      <Part kind="airFilter" label="Duto de admissão (para a caixa do filtro)" category="induction" explode={[0.25, 0.2, 0]}>
        <Pipe points={[[tb[0] + 0.04, tb[1], tb[2]], [tb[0] + 0.15, tb[1] + 0.02, tb[2] + 0.04], [tb[0] + 0.25, tb[1] + 0.1, 0.2]]} radius={0.055} finish="rubber" category="induction" />
        <Box position={[tb[0] + 0.27, tb[1] + 0.14, 0.26]} size={[0.16, 0.1, 0.16]} finish="plastic" color="#151619" category="induction" radius={0.03} />
      </Part>
      <Headers
        groups={dims.bankAxisDeg.map((deg, b) => {
          const s = Math.sign(deg) || 1;
          return {
            cylinders: layout.cylinders.filter((c) => c.bank === b).map((c) => c.number),
            collector: [dims.rearX + 0.06, -0.06, s * (dims.bankWidth * 1.45 + 0.03)] as Vec3,
            outlet: [[dims.rearX - 0.2, -0.12, s * dims.bankWidth * 1.2]] as Vec3[],
          };
        })}
        intakeInside
        finish="castIron"
        color="#4b4845"
        radius={dims.bore * 0.18}
        dropFrac={0.4}
        label="Coletores de escape em ferro fundido"
      />
    </group>
  );
}

export const meta: ModelMeta = {
  valvetrain: { intakeInside: true, injection: 'port', coilOnPlug: false },
  anchors: (ctx) => {
    const g = geom(ctx);
    return {
      intake: [0, g.sc.y + g.sc.height, 0],
      exhaust: [ctx.dims.rearX + 0.06, -0.06, ctx.dims.bankWidth * 1.45],
      induction: [0, g.sc.y + g.sc.height * 0.6, 0],
      pistons: [0, ctx.dims.deck * 0.6, 0],
      crankshaft: [0, 0, 0],
      valvetrain: [0, ctx.dims.deck + ctx.dims.headHeight * 0.6, 0],
      front: [ctx.dims.frontX + 0.08, 0.1, 0],
      fuel: [ctx.dims.frontX - 0.05, g.portY + 0.03, 0.1],
    };
  },
  flows: (ctx) => {
    const g = geom(ctx);
    const ports = cylinderPorts(ctx, true);
    const front = g.sc.len / 2;
    const air = ports.map((p) => [[front + 0.3, g.sc.y + 0.25, 0.25], [front + 0.075, g.sc.y + g.sc.height * 0.62, 0.075], [p.c.axialM, g.sc.y + g.sc.height * 0.6, 0], [p.c.axialM, g.sc.y + 0.02, p.intake[2] * 0.5], p.intake, p.chamber] as Vec3[]);
    const exhaust = ports.map((p) => {
      const s = Math.sign(p.exhaust[2]) || 1;
      return [p.chamber, p.exhaust, [ctx.dims.rearX + 0.06, -0.06, s * ctx.dims.bankWidth * 1.45], [ctx.dims.rearX - 0.2, -0.12, s * ctx.dims.bankWidth * 1.2]] as Vec3[];
    });
    const rail: Vec3 = [ctx.dims.frontX - 0.05, g.portY + 0.03, 0.1];
    const fuel = ports.map((p) => [rail, [p.c.axialM, p.intake[1] + 0.02, p.intake[2] * 0.85], p.intake, p.chamber] as Vec3[]);
    return { air, exhaust, fuel, coolant: coolantPaths(ctx) };
  },
  fuelInlet: (ctx) => [ctx.dims.frontX - 0.05, geom(ctx).portY + 0.03, 0.1],
  size: (ctx) => {
    const s = defaultSize(ctx);
    return [s[0] + 0.3, s[1] + 0.08, s[2]];
  },
};
