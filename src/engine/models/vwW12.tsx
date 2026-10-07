import { useMemo } from 'react';
import { useEngine, type EngineModelContext } from '../EngineContext';
import { BankFrame, Bellhousing, Block, CamCovers, Heads, Sump, TimingCover } from '../parts/Housing';
import { FrontDrive, type PulleySpec } from '../parts/Accessories';
import { Box, Headers, Pipe, ThrottleBody, type Vec3 } from '../parts/Plumbing';
import { Part } from '../Part';
import { createLabelTexture } from '../textures';
import type { ModelMeta } from './types';
import { coolantPaths, cylinderPorts, defaultSize } from './shared';
import { valleyGeometry } from './pushrodCommon';

/**
 * Volkswagen W12 (1997 W12 Syncro study): two narrow VR6 banks (15°) at 72°,
 * a short and very wide engine, naturally aspirated (no turbo). Black upper
 * covers with raised silver slatted sections and 'W12' lettering, central
 * intake manifold, front drive with many pulleys and a viscous-fan hub.
 * The reference photo appears to show a production-style VW W12 cover; the
 * exterior here is inspired by it, not a reproduction of the 1997 study.
 */
function geom(ctx: EngineModelContext) {
  const v = valleyGeometry(ctx);
  return { ...v, manifoldY: v.valleyY + 0.02 };
}

export default function VwW12() {
  const ctx = useEngine();
  const { dims, layout, lib } = ctx;
  const g = useMemo(() => geom(ctx), [ctx]);
  const label = useMemo(() => lib.decal(createLabelTexture('W12', { color: '#e3e5e8', width: 512, height: 200, font: '800 140px Arial, sans-serif' }), 'cover', 'w12-label'), [lib]);
  const pulleys = useMemo<PulleySpec[]>(
    () => [
      { kind: 'crankPulley', y: 0, z: 0, radius: 0.09 },
      { kind: 'waterPump', y: dims.deck * 0.7, z: 0, radius: 0.07, body: true },
      { kind: 'alternator', y: dims.deck * 0.85, z: 0.23, radius: 0.042, body: true },
      { kind: 'powerSteering', y: dims.deck * 0.75, z: -0.23, radius: 0.05 },
      { kind: 'acCompressor', y: -0.02, z: -0.24, radius: 0.058, body: true },
      { kind: 'idler', y: dims.deck * 0.35, z: 0.17, radius: 0.034 },
      { kind: 'tensioner', y: dims.deck * 0.4, z: -0.15, radius: 0.034 },
    ],
    [dims],
  );
  const len = dims.blockLength * 0.82;
  return (
    <group>
      <Block finish="castAluminium" color="#a3a7ac" />
      <Heads finish="castAluminium" color="#b0b3b7" />
      <CamCovers finish="satin" color="#17181b" widthFrac={0.98} />
      {/* raised silver slatted sections with 'W12' lettering on each bank cover */}
      {dims.bankAxisDeg.map((deg, b) => (
        <BankFrame key={b} bank={b}>
          <Part kind="camCover" label="Cobertura com lâminas prateadas" category="cover" position={[0, dims.deck + dims.headHeight + dims.coverHeight * 1.02, 0]} explode={[0, 0.32, 0]}>
            {new Array(6).fill(0).map((_, i) => (
              <Box key={i} position={[-len * 0.3 + i * len * 0.11, 0.004, 0]} size={[0.045, 0.012, dims.bankWidth * 0.62]} finish="machinedAluminium" color="#c9ccd0" category="cover" radius={0.004} />
            ))}
            <mesh material={label} position={[len * 0.36, 0.006, 0]} rotation={[-Math.PI / 2, 0, deg < 0 ? Math.PI : 0]}>
              <planeGeometry args={[0.09, 0.035]} />
            </mesh>
          </Part>
        </BankFrame>
      ))}
      <Sump finish="castAluminium" color="#9b9fa4" />
      <TimingCover finish="satin" color="#1c1d20" />
      <Bellhousing finish="castAluminium" />
      <FrontDrive pulleys={pulleys} />
      {/* viscous fan hub on the water-pump pulley */}
      <Part kind="waterPump" label="Acoplamento viscoso do ventilador" category="accessory" position={[dims.frontX + 0.1, dims.deck * 0.7, 0]} explode={[0.3, 0, 0]}>
        <mesh material={lib.get('castAluminium', 'accessory', '#8e9297', 'w12-visc')} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.07, 0.07, 0.05, 32]} />
        </mesh>
        {new Array(12).fill(0).map((_, i) => (
          <mesh key={i} material={lib.get('satin', 'accessory', '#2a2c30', 'w12-fins')} position={[0.01, Math.cos((i / 12) * Math.PI * 2) * 0.06, Math.sin((i / 12) * Math.PI * 2) * 0.06]} rotation={[(i / 12) * Math.PI * 2, 0, 0]}>
            <boxGeometry args={[0.04, 0.03, 0.004]} />
          </mesh>
        ))}
      </Part>
      {/* central intake manifold with a front throttle body */}
      <Part kind="plenum" label="Coletor de admissão central" category="induction" explode={[0, 0.3, 0]}>
        <Box position={[0, g.manifoldY, 0]} size={[len, 0.06, g.innerZ * 1.6]} finish="castAluminium" color="#b7babe" category="induction" radius={0.02} />
        <Pipe points={[[len / 2, g.manifoldY, 0], [len / 2 + 0.08, g.manifoldY + 0.01, 0], [len / 2 + 0.16, g.manifoldY + 0.05, 0.05]]} radius={0.042} finish="rubber" category="induction" />
      </Part>
      <ThrottleBody position={[len / 2 + 0.02, g.manifoldY, 0]} rotation={[0, 0, Math.PI / 2]} radius={0.04} />
      <Headers
        groups={dims.bankAxisDeg.map((deg, b) => {
          const s = Math.sign(deg) || 1;
          return {
            cylinders: layout.cylinders.filter((c) => c.bank === b).map((c) => c.number),
            collector: [dims.rearX + 0.02, -0.04, s * (dims.bankWidth * 1.2 + 0.05)] as Vec3,
            outlet: [[dims.rearX - 0.2, -0.09, s * dims.bankWidth]] as Vec3[],
          };
        })}
        intakeInside
        finish="heatTint"
        radius={dims.bore * 0.16}
        dropFrac={0.45}
        label="Coletores 6-em-1"
      />
    </group>
  );
}

export const meta: ModelMeta = {
  valvetrain: { intakeInside: true, injection: 'port', coilOnPlug: true },
  anchors: (ctx) => {
    const g = geom(ctx);
    return {
      intake: [0, g.manifoldY, 0],
      exhaust: [ctx.dims.rearX + 0.02, -0.04, ctx.dims.bankWidth * 1.2],
      pistons: [0, ctx.dims.deck * 0.6, 0],
      crankshaft: [0, 0, 0],
      valvetrain: [0, ctx.dims.deck + ctx.dims.headHeight * 0.6, 0],
      front: [ctx.dims.frontX + 0.1, 0.12, 0],
      fuel: [ctx.dims.frontX - 0.05, g.manifoldY - 0.02, 0.06],
    };
  },
  flows: (ctx) => {
    const g = geom(ctx);
    const len = ctx.dims.blockLength * 0.82;
    const ports = cylinderPorts(ctx, true);
    const air = ports.map((p) => [[len / 2 + 0.16, g.manifoldY + 0.05, 0.05], [len / 2 + 0.02, g.manifoldY, 0], [p.c.axialM, g.manifoldY, 0], p.intake, p.chamber] as Vec3[]);
    const exhaust = ports.map((p) => {
      const s = Math.sign(p.exhaust[2]) || 1;
      return [p.chamber, p.exhaust, [ctx.dims.rearX + 0.02, -0.04, s * ctx.dims.bankWidth * 1.2], [ctx.dims.rearX - 0.2, -0.09, s * ctx.dims.bankWidth]] as Vec3[];
    });
    const inlet: Vec3 = [ctx.dims.frontX - 0.05, g.manifoldY - 0.02, 0.06];
    const fuel = ports.map((p) => [inlet, [p.c.axialM, g.manifoldY - 0.03, p.intake[2] * 0.7], p.intake, p.chamber] as Vec3[]);
    return { air, exhaust, fuel, coolant: coolantPaths(ctx) };
  },
  fuelInlet: (ctx) => [ctx.dims.frontX - 0.05, geom(ctx).manifoldY - 0.02, 0.06],
  size: (ctx) => {
    const s = defaultSize(ctx);
    return [s[0] + 0.1, s[1], s[2] + 0.1];
  },
};
