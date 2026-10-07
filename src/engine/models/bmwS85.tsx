import { useMemo } from 'react';
import { useEngine, type EngineModelContext } from '../EngineContext';
import { Bellhousing, Block, CamCovers, Heads, Sump, TimingCover } from '../parts/Housing';
import { FrontDrive, OilFilter } from '../parts/Accessories';
import { Headers, Pipe, Runners, ThrottleBody, roundedBox, type Vec3 } from '../parts/Plumbing';
import { Part } from '../Part';
import { createLabelTexture } from '../textures';
import type { ModelMeta } from './types';
import { coolantPaths, cylinderPorts, defaultSize } from './shared';
import { valleyGeometry } from './pushrodCommon';

/**
 * BMW S85B50 (M5 E60): long, narrow 90° V10, naturally aspirated (no turbo),
 * ten individual throttle bodies in the valley feeding from airboxes, hidden
 * under a large two-piece black plastic cover with 'M' and 'V10' badges;
 * intake snorkels on both front corners; 5-into-1 exhausts outside each bank.
 */
function geom(ctx: EngineModelContext) {
  const v = valleyGeometry(ctx);
  const coverY = v.valleyY + 0.035;
  const coverW = v.innerZ * 2 + ctx.dims.bankWidth * 0.55;
  return { ...v, coverY, coverW, itbY: v.valleyY - 0.01 };
}

export default function BmwS85() {
  const ctx = useEngine();
  const { dims, layout, lib, geo } = ctx;
  const g = useMemo(() => geom(ctx), [ctx]);
  const len = dims.blockLength * 0.9;
  const half = geo('s85-cover-half', () => roundedBox([len, 0.07, g.coverW / 2 - 0.006], 0.032));
  const coverMat = lib.get('plastic', 'cover', '#151619', 's85-cover');
  const targets = useMemo(() => {
    const t: Record<number, Vec3> = {};
    layout.cylinders.forEach((c) => (t[c.number] = [c.axialM, g.itbY, (Math.sign(c.axisDeg) || 1) * g.innerZ * 0.35]));
    return t;
  }, [layout, g]);
  const badges = useMemo(
    () => ({
      m: lib.decal(createLabelTexture('M', { color: '#e8e8e8', width: 256, height: 256, font: 'italic 900 190px Arial, sans-serif' }), 'cover', 's85-m'),
      v10: lib.decal(createLabelTexture('V10', { color: '#cfd2d6', width: 512, height: 220, font: '800 150px Arial, sans-serif' }), 'cover', 's85-v10'),
    }),
    [lib],
  );
  return (
    <group>
      <Block finish="castAluminium" color="#a6aaaf" />
      <Heads finish="castAluminium" color="#b2b5b9" />
      <CamCovers finish="castAluminium" color="#5b5e63" fins={3} finFinish="machinedAluminium" heightFrac={0.85} />
      <Sump finish="castAluminium" color="#9a9ea3" finned />
      <TimingCover finish="castAluminium" color="#a3a7ac" />
      <Bellhousing finish="castAluminium" />
      <FrontDrive />
      <OilFilter position={[dims.frontX - 0.05, dims.deck * 0.9, 0]} rotation={[0, 0, 0]} color="#1a1b1e" />

      {/* ten individual throttle bodies (visible in the transparent/cutaway views) */}
      <Runners targets={targets} intakeInside finish="castAluminium" color="#b9bcc0" radius={dims.bore * 0.19} rise={0.015} bend={0.65} />
      {layout.cylinders.map((c) => (
        <ThrottleBody key={c.number} position={[c.axialM, g.itbY + 0.03, (Math.sign(c.axisDeg) || 1) * g.innerZ * 0.35]} radius={0.022} />
      ))}

      {/* two-piece black engine cover with badges */}
      <Part kind="camCover" label="Cobertura do motor (duas peças)" category="cover" position={[0, g.coverY, 0]} explode={[0, 0.4, 0]}>
        {[1, -1].map((s) => (
          <mesh key={s} geometry={half} material={coverMat} position={[0, 0, s * (g.coverW / 4)]} castShadow />
        ))}
        <mesh material={badges.m} position={[len * 0.32, 0.0365, g.coverW / 4]} rotation={[-Math.PI / 2, 0, -Math.PI / 2]}>
          <planeGeometry args={[0.05, 0.05]} />
        </mesh>
        <mesh material={badges.v10} position={[len * 0.32, 0.0365, -g.coverW / 4]} rotation={[-Math.PI / 2, 0, -Math.PI / 2]}>
          <planeGeometry args={[0.07, 0.03]} />
        </mesh>
      </Part>
      {/* intake snorkels on both front corners */}
      <Part kind="airFilter" label="Tomadas de ar (snorkels)" category="induction" explode={[0.2, 0.2, 0]}>
        {[1, -1].map((s) => (
          <Pipe
            key={s}
            points={[[len / 2 - 0.05, g.coverY, s * g.coverW * 0.32], [len / 2 + 0.04, g.coverY + 0.01, s * g.coverW * 0.45], [len / 2 + 0.1, g.coverY - 0.02, s * g.coverW * 0.62]]}
            radius={0.035}
            finish="plastic"
            color="#151619"
            category="induction"
          />
        ))}
      </Part>
      <Headers
        groups={dims.bankAxisDeg.map((deg, b) => {
          const s = Math.sign(deg) || 1;
          return {
            cylinders: layout.cylinders.filter((c) => c.bank === b).map((c) => c.number),
            collector: [dims.rearX + 0.04, -0.03, s * (dims.bankWidth * 1.3 + 0.04)] as Vec3,
            outlet: [[dims.rearX - 0.22, -0.08, s * dims.bankWidth * 1.05]] as Vec3[],
          };
        })}
        intakeInside
        finish="heatTint"
        radius={dims.bore * 0.17}
        dropFrac={0.45}
        label="Coletores 5-em-1"
      />
    </group>
  );
}

export const meta: ModelMeta = {
  valvetrain: { intakeInside: true, injection: 'port', coilOnPlug: true },
  anchors: (ctx) => {
    const g = geom(ctx);
    return {
      intake: [0, g.coverY, 0],
      exhaust: [ctx.dims.rearX + 0.04, -0.03, ctx.dims.bankWidth * 1.3],
      pistons: [0, ctx.dims.deck * 0.6, 0],
      crankshaft: [0, 0, 0],
      valvetrain: [0, ctx.dims.deck + ctx.dims.headHeight * 0.6, 0],
      front: [ctx.dims.frontX + 0.08, 0.1, 0],
      fuel: [ctx.dims.frontX - 0.06, g.itbY, 0],
    };
  },
  flows: (ctx) => {
    const g = geom(ctx);
    const ports = cylinderPorts(ctx, true);
    const len = ctx.dims.blockLength * 0.9;
    const air = ports.map((p) => {
      const s = Math.sign(p.intake[2]) || 1;
      return [[len / 2 + 0.1, g.coverY - 0.02, s * g.coverW * 0.62], [len / 2 - 0.05, g.coverY, s * g.coverW * 0.32], [p.c.axialM, g.itbY + 0.04, s * g.innerZ * 0.35], p.intake, p.chamber] as Vec3[];
    });
    const exhaust = ports.map((p) => {
      const s = Math.sign(p.exhaust[2]) || 1;
      return [p.chamber, p.exhaust, [ctx.dims.rearX + 0.04, -0.03, s * ctx.dims.bankWidth * 1.3], [ctx.dims.rearX - 0.22, -0.08, s * ctx.dims.bankWidth * 1.05]] as Vec3[];
    });
    const inlet: Vec3 = [ctx.dims.frontX - 0.06, g.itbY, 0];
    const fuel = ports.map((p) => [inlet, [p.c.axialM, g.itbY - 0.01, p.intake[2] * 0.7], p.intake, p.chamber] as Vec3[]);
    return { air, exhaust, fuel, coolant: coolantPaths(ctx) };
  },
  fuelInlet: (ctx) => [ctx.dims.frontX - 0.06, geom(ctx).itbY, 0],
  size: defaultSize,
};
