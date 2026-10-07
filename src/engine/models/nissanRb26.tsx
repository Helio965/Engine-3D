import { useMemo } from 'react';
import { useEngine, type EngineModelContext } from '../EngineContext';
import { Bellhousing, Block, CamCovers, Heads, Sump, TimingCover } from '../parts/Housing';
import { FrontDrive, OilFilter } from '../parts/Accessories';
import { Box, FuelRail, Headers, Pipe, Runners, ThrottleBody, type Vec3 } from '../parts/Plumbing';
import { Turbo } from '../parts/ForcedInduction';
import { Part } from '../Part';
import { createLabelTexture } from '../textures';
import type { ModelMeta } from './types';
import { coolantPaths, cylinderPorts, defaultSize } from './shared';

/**
 * Nissan RB26DETT (Skyline GT-R R34): long inline-six with an iron block,
 * twin red wrinkle-finish cam covers with a black centre coil cover, six
 * individual throttle bodies feeding from a side plenum (intake on −Z), and
 * two parallel turbochargers on the exhaust side (+Z): front turbo fed by
 * cylinders 1–3, rear turbo by 4–6, joined to a front-mounted intercooler.
 */

const INTAKE_SIDE = -1 as const;

function geom(ctx: EngineModelContext) {
  const { dims } = ctx;
  const portY = dims.deck + dims.headHeight * 0.42;
  const plenum: Vec3 = [-0.01, portY + 0.07, -(dims.bankWidth / 2 + 0.2)];
  const itbZ = -(dims.bankWidth / 2 + 0.115);
  const turboY = dims.deck * 0.62;
  const turboZ = dims.bankWidth / 2 + 0.2;
  const turbos: { x: number; dir: 1 | -1 }[] = [
    { x: dims.frontX - 0.17, dir: 1 },
    { x: dims.rearX + 0.17, dir: -1 },
  ];
  const R = 0.055 * 0.86;
  const turbine = (i: number): Vec3 => [turbos[i].x - turbos[i].dir * R * 0.55, turboY, turboZ];
  const compressor = (i: number): Vec3 => [turbos[i].x + turbos[i].dir * R * 0.75, turboY, turboZ];
  const icFront: Vec3 = [dims.frontX + 0.2, dims.deck * 0.15, 0.28];
  const icReturn: Vec3 = [dims.frontX + 0.2, dims.deck * 0.15, -0.28];
  const plenumInlet: Vec3 = [dims.frontX + 0.02, plenum[1], plenum[2]];
  const airbox: Vec3 = [dims.frontX - 0.02, dims.deck + 0.1, turboZ + 0.12];
  return { portY, plenum, itbZ, turboY, turboZ, turbos, turbine, compressor, icFront, icReturn, plenumInlet, airbox, R };
}

export default function NissanRb26() {
  const ctx = useEngine();
  const { dims, layout, lib } = ctx;
  const g = useMemo(() => geom(ctx), [ctx]);
  const lenP = dims.blockLength * 0.86;

  const runnerTargets = useMemo(() => {
    const t: Record<number, Vec3> = {};
    layout.cylinders.forEach((c) => (t[c.number] = [c.axialM, g.portY + 0.045, g.itbZ]));
    return t;
  }, [layout, g]);

  const centreLabel = useMemo(
    () => lib.decal(createLabelTexture('SKYLINE GT-R', { color: '#d9d4c8', width: 1024, height: 128, letterSpacing: 12 }), 'cover', 'rb26-centre'),
    [lib],
  );
  const plenumLabel = useMemo(
    () => lib.decal(createLabelTexture('TWIN CAM 24 VALVE', { color: '#2b2b2b', width: 1024, height: 128, letterSpacing: 6 }), 'induction', 'rb26-plenum'),
    [lib],
  );
  const coverTop = dims.deck + dims.headHeight + dims.coverHeight * 0.8;
  const blue = 'blue';

  return (
    <group>
      <Block finish="castIron" color="#3d4044" />
      <Heads finish="castAluminium" color="#b5b8bb" />
      <CamCovers finish="crinkle" color="#b0121c" twinHumps widthFrac={1.02} heightFrac={1.15} labels={['RB26DETT']} labelColor="#e9e3d6" />
      {/* black centre coil-pack cover with lettering */}
      <Part kind="coilPack" category="cover" position={[0, coverTop, 0]} explode={[0, 0.34, 0]}>
        <Box position={[0, 0, 0]} size={[dims.blockLength * 0.78, 0.018, 0.05]} finish="satin" color="#121316" category="cover" radius={0.006} />
        <mesh material={centreLabel} position={[0, 0.0095, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.3, 0.0375]} />
        </mesh>
      </Part>
      <Sump finish="castAluminium" color="#9fa2a6" finned />
      <TimingCover finish="plastic" color="#141518" />
      <Bellhousing finish="castAluminium" />
      <FrontDrive />
      <OilFilter position={[dims.rearX + 0.16, -0.02, -(dims.bankWidth / 2 + 0.07)]} rotation={[Math.PI / 2.4, 0, 0]} color="#1c3f7a" />

      {/* intake: runners → six individual throttle bodies → plenum */}
      <Runners targets={runnerTargets} inlineIntakeSide={INTAKE_SIDE} finish="castAluminium" color="#a6a9ad" radius={dims.bore * 0.2} rise={0.01} bend={0.6} />
      {layout.cylinders.map((c) => (
        <ThrottleBody key={c.number} position={[c.axialM, g.portY + 0.045, g.itbZ - 0.012]} rotation={[0, 0, Math.PI / 2]} radius={0.021} />
      ))}
      <Part kind="plenum" category="induction" explode={[0, 0.12, -0.2]}>
        <Box position={g.plenum} size={[lenP, 0.085, 0.11]} finish="castAluminium" color="#b3b6ba" category="induction" radius={0.03} />
        <mesh material={plenumLabel} position={[g.plenum[0], g.plenum[1] + 0.0431, g.plenum[2]]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.36, 0.045]} />
        </mesh>
        <Pipe points={[g.plenum, [g.plenumInlet[0] - 0.05, g.plenum[1], g.plenum[2]], g.plenumInlet]} radius={0.034} finish="castAluminium" color="#b3b6ba" category="induction" />
      </Part>
      <FuelRail from={[dims.frontX - 0.05, g.portY + 0.075, g.itbZ + 0.05]} to={[dims.rearX + 0.05, g.portY + 0.075, g.itbZ + 0.05]} />

      {/* exhaust side: two cast manifolds → two parallel turbos → dump pipes */}
      <Headers
        groups={[
          { cylinders: [1, 2, 3], collector: g.turbine(0) },
          { cylinders: [4, 5, 6], collector: g.turbine(1) },
        ]}
        inlineIntakeSide={INTAKE_SIDE}
        finish="castIron"
        color="#4a4744"
        radius={dims.bore * 0.21}
        dropFrac={0.5}
        label="Coletores de escape (2 × 3 cilindros)"
      />
      {g.turbos.map((t, i) => (
        <Turbo
          key={i}
          index={i}
          position={[t.x, g.turboY, g.turboZ]}
          rotation={[0, 0, t.dir > 0 ? -Math.PI / 2 : Math.PI / 2]}
          size={0.86}
          label={i === 0 ? 'Turbo dianteiro (cil. 1–3)' : 'Turbo traseiro (cil. 4–6)'}
        />
      ))}
      <Part kind="exhaustManifold" label="Dump pipes / downpipe" category="exhaust" explode={[0, -0.12, 0.12]}>
        {g.turbos.map((_, i) => {
          const tb = g.turbine(i);
          return (
            <Pipe
              key={i}
              points={[tb, [tb[0], tb[1] - 0.09, tb[2] + 0.03], [tb[0] * 0.5, dims.bottomY + 0.08, tb[2] - 0.02], [dims.rearX - 0.18, dims.bottomY + 0.07, 0.12]]}
              radius={0.03}
              finish="heatTint"
              category="exhaust"
            />
          );
        })}
      </Part>

      {/* charge air: compressors → front-mounted intercooler (off-engine) → plenum */}
      <Part kind="intercooler" label="Tubulação do intercooler (intercooler frontal fora do motor)" category="induction" explode={[0.18, 0.05, 0]}>
        <Pipe points={[g.compressor(0), [g.compressor(0)[0] + 0.06, g.turboY + 0.05, g.turboZ + 0.04], [dims.frontX + 0.12, dims.deck * 0.4, 0.3], g.icFront]} radius={0.027} finish="polishedSteel" category="induction" />
        <Pipe
          points={[g.compressor(1), [g.compressor(1)[0] - 0.05, g.turboY + 0.1, g.turboZ + 0.05], [0, dims.deck * 0.95, g.turboZ + 0.09], [dims.frontX + 0.05, dims.deck * 0.75, 0.3], [dims.frontX + 0.18, dims.deck * 0.35, 0.29]]}
          radius={0.027}
          finish="polishedSteel"
          category="induction"
        />
        <Pipe points={[g.icReturn, [dims.frontX + 0.18, g.plenum[1] - 0.05, -0.27], [dims.frontX + 0.08, g.plenum[1], g.plenum[2] - 0.02], g.plenumInlet]} radius={0.034} finish="polishedSteel" category="induction" />
        {[g.icFront, g.icReturn, [dims.frontX + 0.08, g.plenum[1], g.plenum[2] - 0.02] as Vec3].map((p, i) => (
          <mesh key={i} position={p} material={lib.get('gloss', 'induction', '#1f5fbf', blue)} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.037, 0.037, 0.05, 20]} />
          </mesh>
        ))}
      </Part>
      {/* air box + suction pipes to the compressor inlets */}
      <Part kind="airFilter" label="Caixa do filtro de ar" category="induction" explode={[0.1, 0.25, 0.15]}>
        <Box position={g.airbox} size={[0.2, 0.12, 0.17]} finish="plastic" color="#17181b" category="induction" radius={0.03} />
        {g.turbos.map((t, i) => {
          const c = g.compressor(i);
          const inlet: Vec3 = [c[0] + t.dir * g.R * 0.9, c[1], c[2]];
          return (
            <Pipe
              key={i}
              points={[inlet, [inlet[0] + t.dir * 0.05, inlet[1] + 0.04, inlet[2] + 0.02], [g.airbox[0] - 0.05 * (i + 1), g.airbox[1] - 0.02, g.airbox[2] - 0.02], g.airbox]}
              radius={0.032}
              finish="rubber"
              category="induction"
            />
          );
        })}
      </Part>
    </group>
  );
}

export const meta: ModelMeta = {
  valvetrain: { inlineIntakeSide: INTAKE_SIDE, injection: 'port', coilOnPlug: true },
  anchors: (ctx) => {
    const g = geom(ctx);
    return {
      intake: g.plenum,
      exhaust: g.turbine(0),
      induction: [0, g.turboY, g.turboZ],
      pistons: [0, ctx.dims.deck * 0.6, 0],
      crankshaft: [0, 0, 0],
      valvetrain: [0, ctx.dims.deck + ctx.dims.headHeight * 0.7, 0],
      front: [ctx.dims.frontX + 0.08, 0.1, 0],
      fuel: [ctx.dims.frontX - 0.05, g.portY + 0.075, g.itbZ + 0.05],
    };
  },
  flows: (ctx) => {
    const g = geom(ctx);
    const ports = cylinderPorts(ctx, true, INTAKE_SIDE);
    const air = ports.map((p) => {
      const ti = p.c.number <= 3 ? 0 : 1;
      const c = g.compressor(ti);
      return [g.airbox, [c[0] + g.turbos[ti].dir * 0.06, c[1] + 0.03, c[2]], c, g.icFront, g.icReturn, g.plenumInlet, [p.c.axialM, g.plenum[1], g.plenum[2]], [p.c.axialM, g.portY + 0.045, g.itbZ], p.intake, p.chamber] as Vec3[];
    });
    const exhaust = ports.map((p) => {
      const ti = p.c.number <= 3 ? 0 : 1;
      const tb = g.turbine(ti);
      return [p.chamber, p.exhaust, tb, [tb[0], tb[1] - 0.09, tb[2] + 0.03], [ctx.dims.rearX - 0.18, ctx.dims.bottomY + 0.07, 0.12]] as Vec3[];
    });
    const railY = g.portY + 0.075;
    const fuel = ports.map((p) => [[ctx.dims.frontX - 0.05, railY, g.itbZ + 0.05], [p.c.axialM, railY, g.itbZ + 0.05], p.intake, p.chamber] as Vec3[]);
    return { air, exhaust, fuel, coolant: coolantPaths(ctx) };
  },
  fuelInlet: (ctx) => {
    const g = geom(ctx);
    return [ctx.dims.frontX - 0.05, g.portY + 0.075, g.itbZ + 0.05];
  },
  size: (ctx) => {
    const s = defaultSize(ctx);
    return [s[0] + 0.15, s[1], ctx.dims.bankWidth + 0.75];
  },
};
