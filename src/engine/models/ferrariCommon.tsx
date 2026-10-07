import { useMemo } from 'react';
import { useEngine, type EngineModelContext } from '../EngineContext';
import { BankFrame, Bellhousing, Block, CamCovers, Heads, Sump, TimingCover } from '../parts/Housing';
import { FrontDrive } from '../parts/Accessories';
import { Box, Headers, Pipe, ThrottleBody, roundedBox, type Vec3 } from '../parts/Plumbing';
import { Part } from '../Part';
import { createLabelTexture } from '../textures';
import type { ModelMeta } from './types';
import { coolantPaths, cylinderPorts, defaultSize } from './shared';

/**
 * Ferrari naturally aspirated engines (no turbo, no supercharger):
 *  - 458 Italia F136 FB: 90° flat-plane V8; two long red wrinkle-finish
 *    intake plenums with 'Ferrari' lettering, a ribbed bare-aluminium centre
 *    manifold and two throttle bodies at the front;
 *  - 812 Superfast F140 GA: 65° V12; red plenums, a white/silver centre cover
 *    reading 'V12 6.5', large front throttle bodies, polished headers.
 * Intake in the valley, exhausts on the outside of each bank, dry sump.
 */

export type FerrariVariant = '458' | '812';

export function ferrariGeometry(ctx: EngineModelContext) {
  const { dims } = ctx;
  const coverTop = dims.deck + dims.headHeight + dims.coverHeight;
  const plenumLen = dims.blockLength * 0.86;
  const plenumH = 0.07;
  const plenumW = dims.bankWidth * 0.62;
  // plenum centre in bank-local coordinates (lateral offset towards the valley)
  const plenumLocal = (bankDeg: number): Vec3 => [0, coverTop + plenumH * 0.35, -(Math.sign(bankDeg) || 1) * dims.bankWidth * 0.26];
  const toEngine = (bankDeg: number, p: Vec3): Vec3 => {
    const a = (bankDeg * Math.PI) / 180;
    return [p[0], Math.cos(a) * p[1] - Math.sin(a) * p[2], Math.sin(a) * p[1] + Math.cos(a) * p[2]];
  };
  const plenumWorld = dims.bankAxisDeg.map((d) => toEngine(d, plenumLocal(d)));
  const valleyTop: Vec3 = [0, Math.max(...plenumWorld.map((p) => p[1])) + 0.01, 0];
  return { coverTop, plenumLen, plenumH, plenumW, plenumLocal, plenumWorld, valleyTop };
}

export function FerrariExterior({ variant }: { variant: FerrariVariant }) {
  const ctx = useEngine();
  const { dims, lib, geo, layout } = ctx;
  const g = useMemo(() => ferrariGeometry(ctx), [ctx]);
  const is812 = variant === '812';
  const red = '#b5121b';

  const script = useMemo(
    () => lib.decal(createLabelTexture('Ferrari', { color: '#e8c9a0', width: 1024, height: 220, italic: true, font: `italic 700 150px Georgia, "Times New Roman", serif` }), 'induction', 'ferrari-script'),
    [lib],
  );
  const v12 = useMemo(
    () => lib.decal(createLabelTexture('V12 6.5', { color: '#3a3c40', width: 512, height: 160, letterSpacing: 10 }), 'induction', 'ferrari-v12'),
    [lib],
  );
  const plenumGeo = geo(`ferrari-plenum-${variant}`, () => roundedBox([g.plenumLen, g.plenumH, g.plenumW], 0.03));

  const headerCollectors = dims.bankAxisDeg.map((deg): Vec3 => {
    const s = Math.sign(deg) || 1;
    return [dims.rearX + 0.02, -0.02, s * (dims.bankWidth * (is812 ? 1.25 : 1.35) + 0.04)];
  });

  return (
    <group>
      <Block finish="castAluminium" color="#a8acb1" />
      <Heads finish="castAluminium" color="#b2b5b9" />
      <CamCovers finish="crinkle" color={red} widthFrac={0.92} heightFrac={0.85} />
      <Sump finish="castAluminium" color="#9fa3a8" finned />
      <TimingCover finish="castAluminium" color="#a3a7ac" />
      <Bellhousing finish="castAluminium" color="#b8bbbf" />
      <FrontDrive />

      {/* red wrinkle-finish intake plenums along each bank, with 'Ferrari' lettering */}
      {dims.bankAxisDeg.map((deg, b) => (
        <BankFrame key={b} bank={b}>
          <Part kind="plenum" label="Plenum de admissão (pintura enrugada vermelha)" category="induction" position={g.plenumLocal(deg)} explode={[0, 0.3, 0]}>
            <mesh geometry={plenumGeo} material={lib.get('crinkle', 'induction', red, 'ferrari-plenum')} castShadow />
            <mesh material={script} position={[0, g.plenumH / 2 + 0.002, 0]} rotation={[-Math.PI / 2, 0, deg < 0 ? Math.PI : 0]}>
              <planeGeometry args={[g.plenumLen * 0.4, g.plenumLen * 0.4 * 0.215]} />
            </mesh>
          </Part>
        </BankFrame>
      ))}

      {/* valley: ribbed aluminium manifold (458) or white 'V12 6.5' cover (812) */}
      <Part kind="plenum" label={is812 ? 'Cobertura central V12 6.5' : 'Coletor central nervurado'} category="induction" explode={[0, 0.36, 0]}>
        {is812 ? (
          <>
            <Box position={[0, g.valleyTop[1] - 0.012, 0]} size={[g.plenumLen * 0.94, 0.03, 0.11]} finish="gloss" color="#e9e9e6" category="induction" radius={0.012} />
            <mesh material={v12} position={[-g.plenumLen * 0.3, g.valleyTop[1] + 0.0042, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.13, 0.04]} />
            </mesh>
          </>
        ) : (
          <>
            <Box position={[0, g.valleyTop[1] - 0.03, 0]} size={[g.plenumLen * 0.9, 0.04, 0.085]} finish="castAluminium" color="#b9bcc0" category="induction" radius={0.01} />
            {new Array(14).fill(0).map((_, i) => (
              <mesh key={i} material={lib.get('machinedAluminium', 'induction', '#cfd2d5', 'ferrari-rib')} position={[-g.plenumLen * 0.42 + (i * g.plenumLen * 0.84) / 13, g.valleyTop[1] - 0.006, 0]}>
                <boxGeometry args={[0.008, 0.012, 0.09]} />
              </mesh>
            ))}
          </>
        )}
      </Part>

      {/* throttle bodies at the front of each plenum, black rubber ducts forward */}
      {g.plenumWorld.map((p, b) => {
        const tb: Vec3 = [dims.frontX - 0.02 + (is812 ? 0.02 : 0), p[1] + 0.005, p[2] * 0.85];
        return (
          <group key={b}>
            <ThrottleBody position={tb} rotation={[0, 0, Math.PI / 2]} radius={is812 ? 0.04 : 0.034} />
            <Part kind="airFilter" label="Duto de admissão" category="induction" explode={[0.2, 0.2, 0]}>
              <Pipe points={[[tb[0] + 0.03, tb[1], tb[2]], [tb[0] + 0.12, tb[1] + 0.02, tb[2] * 1.1], [tb[0] + 0.22, tb[1] + 0.06, tb[2] * 1.6]]} radius={is812 ? 0.045 : 0.04} finish="rubber" category="induction" />
            </Part>
          </group>
        );
      })}

      {/* exhaust headers on the outside of each bank */}
      <Headers
        groups={dims.bankAxisDeg.map((_, b) => ({
          cylinders: layout.cylinders.filter((c) => c.bank === b).map((c) => c.number),
          collector: headerCollectors[b],
          outlet: [[dims.rearX - 0.22, -0.06, headerCollectors[b][2] * 0.8]] as Vec3[],
        }))}
        intakeInside
        finish={is812 ? 'polishedSteel' : 'heatTint'}
        radius={dims.bore * 0.19}
        dropFrac={0.45}
        label={is812 ? 'Coletores 6-em-1 (aço polido)' : 'Coletores 4-em-1'}
      />
    </group>
  );
}

export function ferrariMeta(_variant: FerrariVariant): ModelMeta {
  return {
    valvetrain: { intakeInside: true, injection: 'direct', coilOnPlug: true },
    anchors: (ctx) => {
      const g = ferrariGeometry(ctx);
      return {
        intake: g.valleyTop,
        exhaust: [ctx.dims.rearX + 0.02, 0, ctx.dims.bankWidth * 1.3],
        induction: g.plenumWorld[0],
        pistons: [0, ctx.dims.deck * 0.6, 0],
        crankshaft: [0, 0, 0],
        valvetrain: [0, ctx.dims.deck + ctx.dims.headHeight * 0.6, 0],
        front: [ctx.dims.frontX + 0.08, 0.1, 0],
        fuel: [ctx.dims.frontX - 0.06, g.valleyTop[1] - 0.04, 0],
      };
    },
    flows: (ctx) => {
      const g = ferrariGeometry(ctx);
      const ports = cylinderPorts(ctx, true);
      const air = ports.map((p) => {
        const pl = g.plenumWorld[p.c.bank];
        return [[ctx.dims.frontX + 0.2, pl[1] + 0.06, pl[2] * 1.6], [ctx.dims.frontX - 0.02, pl[1], pl[2] * 0.85], [p.c.axialM, pl[1], pl[2]], p.intake, p.chamber] as Vec3[];
      });
      const exhaust = ports.map((p) => {
        const s = Math.sign(ctx.dims.bankAxisDeg[p.c.bank]) || 1;
        return [p.chamber, p.exhaust, [ctx.dims.rearX + 0.02, -0.02, s * ctx.dims.bankWidth * 1.3], [ctx.dims.rearX - 0.22, -0.06, s * ctx.dims.bankWidth]] as Vec3[];
      });
      const rail: Vec3 = [ctx.dims.frontX - 0.06, g.valleyTop[1] - 0.04, 0];
      const fuel = ports.map((p) => [rail, [p.c.axialM, p.intake[1] + 0.03, p.intake[2] * 0.8], p.intake, p.chamber] as Vec3[]);
      return { air, exhaust, fuel, coolant: coolantPaths(ctx) };
    },
    fuelInlet: (ctx) => [ctx.dims.frontX - 0.06, ferrariGeometry(ctx).valleyTop[1] - 0.04, 0],
    size: (ctx) => {
      const s = defaultSize(ctx);
      return [s[0] + 0.15, s[1], s[2] + 0.1];
    },
  };
}
