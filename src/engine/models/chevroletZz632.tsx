import { useMemo } from 'react';
import { useEngine, type EngineModelContext } from '../EngineContext';
import { Bellhousing, Block, CamCovers, Heads, Sump, TimingCover } from '../parts/Housing';
import { FrontDrive, OilFilter, type PulleySpec } from '../parts/Accessories';
import { Box, FuelRail, Headers, Runners, ThrottleBody, type Vec3 } from '../parts/Plumbing';
import { Part } from '../Part';
import type { ModelMeta } from './types';
import { coolantPaths, cylinderPorts, defaultSize } from './shared';
import { valleyGeometry } from './pushrodCommon';

/**
 * Chevrolet Performance ZZ632/1000 crate engine: 10.4 L big-block V8,
 * naturally aspirated (no turbo, no supercharger). Orange block and orange
 * valve covers with '632', tall aluminium intake manifold with individual
 * runners and fuel rails, a single throttle body under a large round air
 * cleaner with an orange lid, simple front drive, short headers, and an
 * engine stand because it is not installed in a production car.
 */
function geom(ctx: EngineModelContext) {
  const v = valleyGeometry(ctx);
  const manifoldTop = v.valleyY + 0.08;
  return { ...v, manifoldTop, cleanerY: manifoldTop + 0.12 };
}

const ORANGE = '#e0601a';

export default function ChevroletZz632() {
  const ctx = useEngine();
  const { dims, layout, lib } = ctx;
  const g = useMemo(() => geom(ctx), [ctx]);
  const targets = useMemo(() => {
    const t: Record<number, Vec3> = {};
    layout.cylinders.forEach((c) => (t[c.number] = [c.axialM * 0.8, g.manifoldTop - 0.03, (Math.sign(c.axisDeg) || 1) * 0.02]));
    return t;
  }, [layout, g]);
  const pulleys = useMemo<PulleySpec[]>(
    () => [
      { kind: 'crankPulley', y: 0, z: 0, radius: 0.1 },
      { kind: 'waterPump', y: dims.deck * 0.6, z: 0, radius: 0.075, body: true },
      { kind: 'alternator', y: dims.deck * 0.75, z: 0.24, radius: 0.042, body: true },
      { kind: 'idler', y: dims.deck * 0.3, z: -0.16, radius: 0.036 },
    ],
    [dims],
  );
  const len = dims.blockLength * 0.62;
  return (
    <group>
      <Block finish="gloss" color={ORANGE} />
      <Heads finish="castAluminium" color="#b9bcc0" />
      <CamCovers finish="gloss" color={ORANGE} labels={['632']} labelColor="#f4efe6" fins={0} heightFrac={0.9} />
      <Sump finish="gloss" color={ORANGE} />
      <TimingCover finish="gloss" color={ORANGE} />
      <Bellhousing finish="castAluminium" />
      <FrontDrive pulleys={pulleys} />
      <OilFilter position={[dims.rearX + 0.22, -0.08, -0.22]} rotation={[Math.PI / 2.2, 0, 0]} color="#e8e6e0" />

      {/* tall aluminium intake manifold: plenum + individual runners + fuel rails */}
      <Runners targets={targets} intakeInside finish="castAluminium" color="#c3c6ca" radius={dims.bore * 0.19} rise={0.04} bend={0.55} />
      <Part kind="plenum" label="Coletor de admissão alto em alumínio" category="induction" explode={[0, 0.3, 0]}>
        <Box position={[0, g.manifoldTop, 0]} size={[len, 0.07, 0.17]} finish="castAluminium" color="#c3c6ca" category="induction" radius={0.025} />
      </Part>
      {[1, -1].map((s) => (
        <FuelRail key={s} from={[dims.frontX - 0.06, g.manifoldTop - 0.06, s * 0.1]} to={[dims.rearX + 0.06, g.manifoldTop - 0.06, s * 0.1]} radius={0.008} />
      ))}
      <ThrottleBody position={[0, g.manifoldTop + 0.06, 0]} radius={0.05} />
      {/* round air cleaner: chrome element ring and orange lid */}
      <Part kind="airFilter" label="Filtro de ar redondo" category="induction" explode={[0, 0.45, 0]}>
        <mesh position={[0, g.cleanerY, 0]} material={lib.get('plastic', 'induction', '#cfc8b4', 'zz-element')}>
          <cylinderGeometry args={[0.15, 0.15, 0.07, 48, 3, true]} />
        </mesh>
        <mesh position={[0, g.cleanerY - 0.04, 0]} material={lib.get('chrome', 'induction')}>
          <cylinderGeometry args={[0.16, 0.16, 0.012, 48]} />
        </mesh>
        <mesh position={[0, g.cleanerY + 0.042, 0]} material={lib.get('gloss', 'induction', ORANGE, 'zz-lid')}>
          <cylinderGeometry args={[0.158, 0.162, 0.018, 48]} />
        </mesh>
        <mesh position={[0, g.cleanerY + 0.058, 0]} material={lib.get('chrome', 'induction')}>
          <cylinderGeometry args={[0.02, 0.025, 0.02, 16]} />
        </mesh>
      </Part>
      <Headers
        groups={dims.bankAxisDeg.map((deg, b) => {
          const s = Math.sign(deg) || 1;
          return {
            cylinders: layout.cylinders.filter((c) => c.bank === b).map((c) => c.number),
            collector: [dims.rearX + 0.1, -0.1, s * (dims.bankWidth * 1.5 + 0.04)] as Vec3,
            outlet: [[dims.rearX - 0.05, -0.2, s * dims.bankWidth * 1.5]] as Vec3[],
          };
        })}
        intakeInside
        finish="heatTint"
        radius={dims.bore * 0.17}
        dropFrac={0.5}
        label="Coletores tubulares curtos"
      />
      {/* engine stand: the ZZ632 is a crate engine, not a production-car powertrain */}
      <Part kind="bellhousing" label="Suporte de motor (bancada)" category="accessory" explode={[0, -0.1, 0]}>
        {[dims.frontX - 0.05, dims.rearX + 0.05].map((x) =>
          [1, -1].map((s) => (
            <mesh key={`${x}${s}`} position={[x, dims.bottomY * 0.55, s * 0.22]} material={lib.get('satin', 'accessory', '#2f3238', 'stand')}>
              <boxGeometry args={[0.04, Math.abs(dims.bottomY) * 1.1, 0.04]} />
            </mesh>
          )),
        )}
        <mesh position={[0, dims.bottomY - 0.005, 0]} material={lib.get('satin', 'accessory', '#2f3238', 'stand')}>
          <boxGeometry args={[dims.blockLength * 0.95, 0.03, 0.5]} />
        </mesh>
      </Part>
    </group>
  );
}

export const meta: ModelMeta = {
  valvetrain: { intakeInside: true, injection: 'port', coilOnPlug: false },
  anchors: (ctx) => {
    const g = geom(ctx);
    return {
      intake: [0, g.manifoldTop, 0],
      exhaust: [ctx.dims.rearX + 0.1, -0.1, ctx.dims.bankWidth * 1.5],
      pistons: [0, ctx.dims.deck * 0.6, 0],
      crankshaft: [0, 0, 0],
      valvetrain: [0, ctx.dims.deck + ctx.dims.headHeight * 0.6, 0],
      front: [ctx.dims.frontX + 0.08, 0.1, 0],
      fuel: [ctx.dims.frontX - 0.06, g.manifoldTop - 0.06, 0.1],
    };
  },
  flows: (ctx) => {
    const g = geom(ctx);
    const ports = cylinderPorts(ctx, true);
    const air = ports.map((p) => [[0.18, g.cleanerY, 0.0], [0, g.cleanerY, 0], [0, g.manifoldTop + 0.04, 0], [p.c.axialM * 0.8, g.manifoldTop - 0.03, 0], p.intake, p.chamber] as Vec3[]);
    const exhaust = ports.map((p) => {
      const s = Math.sign(p.exhaust[2]) || 1;
      return [p.chamber, p.exhaust, [ctx.dims.rearX + 0.1, -0.1, s * ctx.dims.bankWidth * 1.5], [ctx.dims.rearX - 0.05, -0.2, s * ctx.dims.bankWidth * 1.5]] as Vec3[];
    });
    const fuel = ports.map((p) => {
      const s = Math.sign(p.intake[2]) || 1;
      return [[ctx.dims.frontX - 0.06, g.manifoldTop - 0.06, s * 0.1], [p.c.axialM, g.manifoldTop - 0.06, s * 0.1], p.intake, p.chamber] as Vec3[];
    });
    return { air, exhaust, fuel, coolant: coolantPaths(ctx) };
  },
  fuelInlet: (ctx) => [ctx.dims.frontX - 0.06, geom(ctx).manifoldTop - 0.06, 0.1],
  size: (ctx) => {
    const s = defaultSize(ctx);
    return [s[0] + 0.2, s[1] + 0.2, s[2] + 0.1];
  },
};
