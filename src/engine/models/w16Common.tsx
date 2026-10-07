import { useMemo } from 'react';
import { useEngine, type EngineModelContext } from '../EngineContext';
import { Bellhousing, Block, CamCovers, Heads, Sump, TimingCover, BankFrame } from '../parts/Housing';
import { FrontDrive } from '../parts/Accessories';
import { AirFilter, Box, Headers, Intercooler, Pipe, type Vec3 } from '../parts/Plumbing';
import { Turbo } from '../parts/ForcedInduction';
import { Part } from '../Part';
import { createLabelTexture } from '../textures';
import type { ModelMeta } from './types';
import { coolantPaths, cylinderPorts, defaultSize } from './shared';

/**
 * Bugatti W16 (two VR8 blocks at 90°). Shared exterior for the Veyron 16.4 and
 * the Chiron; the two variants differ where the real engines differ:
 *  - Veyron: four smaller turbos in parallel, two dark charge-air plenum tubes
 *    in the valley, silver head covers with dark mesh panels ('EB' / '16.4');
 *  - Chiron: four 69 % larger turbos in two sequential stages, a large silver
 *    charge-air housing on top (two water-to-air intercoolers) fed by a carbon
 *    intake duct, polished charge pipes.
 * Turbos sit low on the flanks, two per side, compressors facing outward
 * along the crank axis so the turbine outlets meet in the middle.
 */

export type W16Variant = 'veyron' | 'chiron';

interface TurboPos {
  index: number;
  x: number;
  side: number;
  dir: 1 | -1;
}

export function w16Geometry(ctx: EngineModelContext, variant: W16Variant) {
  const { dims, def } = ctx;
  const sideA = Math.sign(dims.bankAxisDeg[0]) || 1;
  const size = variant === 'chiron' ? 1.3 : 1.0;
  const R = 0.055 * size;
  const turboY = -0.035;
  const turboZ = 0.255 + R * 0.4;
  const span = dims.blockLength * 0.26;
  const feeds = def.engine.turbo?.feeds ?? [];
  // which side (bank) each turbo serves, from the cylinders it is fed by
  const bankSideOf = (i: number) => {
    const first = feeds[i]?.[0] ?? 1;
    const c = ctx.layout.cylinders.find((k) => k.number === first);
    return c && c.bank === 1 ? -sideA : sideA;
  };
  const turbos: TurboPos[] = [];
  const seen = new Map<number, number>();
  for (let i = 0; i < (def.engine.turbo?.count ?? 0); i++) {
    const side = bankSideOf(i);
    const n = seen.get(side) ?? 0;
    seen.set(side, n + 1);
    turbos.push({ index: i, x: n === 0 ? span : -span, side, dir: n === 0 ? 1 : -1 });
  }
  const turbine = (t: TurboPos): Vec3 => [t.x - t.dir * R * 0.55, turboY + R * 0.2, t.side * turboZ];
  const compressor = (t: TurboPos): Vec3 => [t.x + t.dir * R * 0.75, turboY, t.side * turboZ];
  const topY = dims.deck * 0.75 + dims.headHeight * 1.25;
  const plenumY = dims.deck * 0.95 + dims.headHeight * 0.45;
  const housing = { y: topY + 0.02, h: 0.11, w: 0.36, len: dims.blockLength * 0.82 };
  return { sideA, size, R, turboY, turboZ, turbos, turbine, compressor, topY, plenumY, housing };
}

export function W16Exterior({ variant }: { variant: W16Variant }) {
  const ctx = useEngine();
  const { dims, lib, def } = ctx;
  const g = useMemo(() => w16Geometry(ctx, variant), [ctx, variant]);
  const chiron = variant === 'chiron';
  const feeds = def.engine.turbo?.feeds ?? [];

  const badges = useMemo(
    () =>
      ['EB', '16.4'].map((t) =>
        lib.decal(createLabelTexture(t, { color: '#2b2d31', background: '#d7d9dc', width: 512, height: 256 }), 'cover', `w16-badge-${t}`),
      ),
    [lib],
  );
  const topLabel = useMemo(
    () => lib.decal(createLabelTexture('W16', { color: '#d9dce0', width: 512, height: 160, letterSpacing: 14 }), 'induction', 'w16-top'),
    [lib],
  );

  return (
    <group>
      <Block finish="castAluminium" color="#a3a7ac" />
      <Heads finish="castAluminium" color="#b3b6ba" />
      <CamCovers
        finish={chiron ? 'carbon' : 'castAluminium'}
        color={chiron ? undefined : '#c4c7cb'}
        fins={chiron ? 0 : 5}
        finFinish="satin"
        finColor="#2a2c31"
        widthFrac={0.96}
      />
      {/* Veyron: dark diamond-mesh insert panels and the 'EB' / '16.4' badges */}
      {!chiron &&
        dims.bankAxisDeg.map((_, b) => (
          <BankFrame key={b} bank={b}>
            <Part kind="camCover" category="cover" position={[0, dims.deck + dims.headHeight + dims.coverHeight * 0.98, 0]} explode={[0, 0.3, 0]}>
              <Box position={[0.02, 0.002, 0]} size={[dims.blockLength * 0.62, 0.006, dims.bankWidth * 0.52]} finish="satin" color="#2b2d31" category="cover" radius={0.003} />
              <mesh material={badges[b % 2]} position={[-dims.blockLength * 0.36, 0.0062, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[0.07, 0.035]} />
              </mesh>
            </Part>
          </BankFrame>
        ))}
      <Sump finish="castAluminium" color="#9a9ea3" />
      <TimingCover finish={chiron ? 'carbon' : 'castAluminium'} color={chiron ? undefined : '#a9adb2'} />
      <Bellhousing finish="castAluminium" color="#b9bcc0" />
      <FrontDrive />

      {/* exhaust: each turbo is fed by the cylinders listed in the data (turbo.feeds) */}
      <Headers
        groups={g.turbos.map((t) => ({ cylinders: feeds[t.index] ?? [], collector: g.turbine(t) }))}
        intakeInside
        finish={chiron ? 'heatShield' : 'heatTint'}
        radius={dims.bore * 0.17}
        dropFrac={0.6}
        label="Coletores de escape (um por turbo)"
      />
      {g.turbos.map((t) => (
        <Turbo
          key={t.index}
          index={t.index}
          position={[t.x, g.turboY, t.side * g.turboZ]}
          rotation={[0, 0, t.dir > 0 ? -Math.PI / 2 : Math.PI / 2]}
          size={g.size}
          mirror={t.side < 0}
          label={
            chiron
              ? `Turbo ${t.index + 1} (${t.index < 2 ? 'estágio 1 — ativo desde a lenta' : '2º estágio — entra a ≈ 3.800 rpm'})`
              : `Turbo ${t.index + 1} (paralelo)`
          }
        />
      ))}
      <Part kind="heatShield" label="Downpipes com proteção térmica" category="exhaust" explode={[0, -0.15, 0]}>
        {[g.sideA, -g.sideA].map((side) => {
          const ts = g.turbos.filter((t) => t.side === side);
          return ts.map((t) => {
            const tb = g.turbine(t);
            return (
              <Pipe
                key={t.index}
                points={[tb, [t.x * 0.35, g.turboY - 0.08, side * (g.turboZ - 0.02)], [dims.rearX * 0.5, dims.bottomY + 0.05, side * 0.16], [dims.rearX - 0.2, dims.bottomY + 0.06, side * 0.08]]}
                radius={0.034 * g.size}
                finish="heatShield"
                category="exhaust"
              />
            );
          });
        })}
      </Part>

      {chiron ? <ChironInduction g={g} topLabel={topLabel} /> : <VeyronInduction g={g} />}
      <Part kind="oilFilter" label="Tanque de óleo do cárter seco (remoto no carro)" category="accessory" explode={[0, -0.1, 0.1]}>
        <mesh position={[dims.rearX + 0.12, dims.bottomY + 0.07, -g.sideA * 0.2]} material={lib.get('castAluminium', 'accessory', '#8f9398', 'w16-scavenge')} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.035, 0.035, 0.16, 20]} />
        </mesh>
      </Part>
    </group>
  );
}

type Geo = ReturnType<typeof w16Geometry>;

function VeyronInduction({ g }: { g: Geo }) {
  const { dims, lib } = useEngine();
  const len = dims.blockLength * 0.86;
  const tubeZ = 0.06;
  const dark = lib.get('satin', 'induction', '#33363b', 'veyron-plenum');
  return (
    <>
      <Part kind="plenum" label="Coletores de admissão (um por bloco VR8)" category="induction" explode={[0, 0.28, 0]}>
        {[1, -1].map((s) => (
          <group key={s}>
            <mesh material={dark} position={[0.02, g.plenumY + 0.02, s * tubeZ]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.046, 0.046, len, 32]} />
            </mesh>
            {/* rounded front caps and silver throttle housings turning down at the rear */}
            <mesh material={dark} position={[0.02 + len / 2, g.plenumY + 0.02, s * tubeZ]}>
              <sphereGeometry args={[0.046, 24, 12]} />
            </mesh>
            <mesh material={lib.get('machinedAluminium', 'induction', '#c8cbcf', 'veyron-tb')} position={[0.02 - len / 2 - 0.02, g.plenumY - 0.01, s * tubeZ]} rotation={[0, 0, Math.PI / 2.4]}>
              <cylinderGeometry args={[0.05, 0.044, 0.09, 28]} />
            </mesh>
          </group>
        ))}
        {/* zig-zag row of fasteners between the tubes */}
        {new Array(10).fill(0).map((_, i) => (
          <mesh key={i} material={lib.get('polishedSteel', 'induction')} position={[-len / 2 + 0.06 + (i * (len - 0.1)) / 9, g.plenumY - 0.012, (i % 2 ? 1 : -1) * 0.012]}>
            <cylinderGeometry args={[0.006, 0.006, 0.01, 6]} />
          </mesh>
        ))}
      </Part>
      {/* two engine-mounted air-to-liquid intercoolers at the rear of the valley */}
      {[1, -1].map((s) => (
        <Intercooler key={s} position={[dims.rearX + 0.04, g.plenumY - 0.02, s * 0.13]} size={[0.1, 0.1, 0.12]} label="Intercooler ar-água" />
      ))}
      {/* charge pipes: compressor → intercooler, and two air filters feeding two turbos each */}
      <Part kind="intercooler" label="Tubulação de ar comprimido" category="induction" explode={[0, 0.1, 0]}>
        {g.turbos.map((t) => {
          const c = g.compressor(t);
          return (
            <Pipe
              key={t.index}
              points={[c, [c[0] + t.dir * 0.03, c[1] + 0.12, c[2] + t.side * 0.04], [dims.rearX + 0.1, g.plenumY - 0.04, t.side * 0.24], [dims.rearX + 0.04, g.plenumY - 0.02, t.side * 0.13]]}
              radius={0.026}
              finish="satin"
              color="#2c2e33"
              category="induction"
            />
          );
        })}
      </Part>
      {[1, -1].map((s) => (
        <AirFilter key={s} position={[dims.rearX + 0.18, g.topY + 0.02, s * 0.22]} rotation={[0, 0, -Math.PI / 2.6]} radius={0.06} length={0.14} finish="satin" color="#1c1d20" />
      ))}
    </>
  );
}

function ChironInduction({ g, topLabel }: { g: Geo; topLabel: ReturnType<ReturnType<typeof useEngine>['lib']['decal']> }) {
  const { dims, lib } = useEngine();
  const h = g.housing;
  return (
    <>
      <Part kind="intercooler" label="Carcaça de ar de admissão com 2 intercoolers ar-água" category="induction" explode={[0, 0.32, 0]}>
        <Box position={[0, h.y, 0]} size={[h.len, h.h, h.w]} finish="castAluminium" color="#c3c6ca" category="induction" radius={0.025} />
        {/* dark ribbed crown */}
        {new Array(9).fill(0).map((_, i) => (
          <mesh key={i} material={lib.get('satin', 'induction', '#2a2c30', 'chiron-crown')} position={[-h.len * 0.4 + (i * h.len * 0.8) / 8, h.y + h.h / 2 + 0.008, 0]}>
            <boxGeometry args={[0.022, 0.016, h.w * 0.78]} />
          </mesh>
        ))}
        <mesh material={topLabel} position={[h.len * 0.32, h.y + h.h / 2 + 0.0015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.12, 0.0375]} />
        </mesh>
        {/* sensor plugs along the flank */}
        {new Array(6).fill(0).map((_, i) => (
          <mesh key={`p${i}`} material={lib.get('plastic', 'induction', '#121316', 'plug')} position={[-h.len * 0.35 + i * 0.1, h.y, h.w / 2 + 0.008]}>
            <boxGeometry args={[0.03, 0.022, 0.016]} />
          </mesh>
        ))}
      </Part>
      {/* carbon-fibre intake duct entering the top housing */}
      <Part kind="airFilter" label="Duto de admissão em fibra de carbono" category="induction" explode={[0.15, 0.3, 0]}>
        <Pipe points={[[h.len / 2 - 0.02, h.y + 0.02, 0], [h.len / 2 + 0.08, h.y + 0.06, 0], [h.len / 2 + 0.16, h.y + 0.14, 0.04], [h.len / 2 + 0.2, h.y + 0.22, 0.08]]} radius={0.055} finish="carbon" category="induction" />
      </Part>
      {/* polished charge-air pipes from each compressor up into the housing */}
      <Part kind="intercooler" label="Tubos de ar comprimido (polidos)" category="induction" explode={[0, 0.12, 0]}>
        {g.turbos.map((t) => {
          const c = g.compressor(t);
          const end: Vec3 = [t.x * 0.6, h.y - h.h * 0.1, t.side * (h.w / 2 - 0.01)];
          return (
            <group key={t.index}>
              <Pipe points={[c, [c[0] + t.dir * 0.05, c[1] + 0.05, c[2] + t.side * 0.05], [t.x * 0.8, dims.deck * 0.9, t.side * 0.33], [end[0], end[1], end[2] + t.side * 0.05], end]} radius={0.03 * g.size} finish="chrome" category="induction" />
              <mesh material={lib.get('rubber', 'induction')} position={[t.x * 0.8, dims.deck * 0.9, t.side * 0.33]}>
                <sphereGeometry args={[0.04 * g.size, 16, 10]} />
              </mesh>
            </group>
          );
        })}
      </Part>
    </>
  );
}

export function w16Meta(variant: W16Variant): ModelMeta {
  return {
    valvetrain: { intakeInside: true, injection: 'port', coilOnPlug: true },
    anchors: (ctx) => {
      const g = w16Geometry(ctx, variant);
      const t0 = g.turbos[0];
      return {
        intake: [0, variant === 'chiron' ? g.housing.y : g.plenumY, 0],
        exhaust: t0 ? g.turbine(t0) : [ctx.dims.rearX, 0, 0.25],
        induction: t0 ? [t0.x, g.turboY, t0.side * g.turboZ] : [0, 0, 0.25],
        pistons: [0, ctx.dims.deck * 0.6, 0],
        crankshaft: [0, 0, 0],
        valvetrain: [0, ctx.dims.deck + ctx.dims.headHeight * 0.6, 0],
        front: [ctx.dims.frontX + 0.08, 0.1, 0],
        fuel: [0, g.plenumY, 0.1],
      };
    },
    flows: (ctx) => {
      const g = w16Geometry(ctx, variant);
      const feeds = ctx.def.engine.turbo?.feeds ?? [];
      const turboOf = (n: number) => g.turbos.find((t) => feeds[t.index]?.includes(n)) ?? g.turbos[0];
      const ports = cylinderPorts(ctx, true);
      const top: Vec3 = [0, variant === 'chiron' ? g.housing.y : g.plenumY, 0];
      const air = ports.map((p) => {
        const t = turboOf(p.c.number);
        const c = g.compressor(t);
        return [[c[0] + t.dir * 0.1, c[1] + 0.05, c[2]], c, [t.x * 0.8, ctx.dims.deck * 0.9, t.side * 0.33], top, [p.c.axialM, top[1], top[2]], p.intake, p.chamber] as Vec3[];
      });
      const exhaust = ports.map((p) => {
        const t = turboOf(p.c.number);
        const tb = g.turbine(t);
        return [p.chamber, p.exhaust, tb, [t.x * 0.35, g.turboY - 0.08, t.side * (g.turboZ - 0.02)], [ctx.dims.rearX - 0.2, ctx.dims.bottomY + 0.06, t.side * 0.08]] as Vec3[];
      });
      const inlet: Vec3 = [ctx.dims.frontX - 0.04, g.plenumY, 0.1];
      const fuel = ports.map((p) => [inlet, [p.c.axialM, g.plenumY - 0.03, p.intake[2] * 0.6], p.intake, p.chamber] as Vec3[]);
      return { air, exhaust, fuel, coolant: coolantPaths(ctx) };
    },
    fuelInlet: (ctx) => [ctx.dims.frontX - 0.04, w16Geometry(ctx, variant).plenumY, 0.1],
    size: (ctx) => {
      const s = defaultSize(ctx);
      return [s[0] + 0.2, s[1] + 0.05, 0.75];
    },
  };
}
