import { useMemo, type ReactNode } from 'react';
import * as THREE from 'three';
import { useEngine } from '../EngineContext';
import { Part } from '../Part';
import { DEG } from '../../simulation/kinematics';
import { axisPoint } from '../dims';
import { extrudeAlongX } from '../geometry';
import { createLabelTexture } from '../textures';
import type { Finish } from '../materials';

/**
 * Generic, parametric housings: cylinder block (inline / V / W), cylinder
 * heads, cam covers, sump and timing cover. Per-engine models choose finishes,
 * colours and inscriptions, and add their own unique parts on top.
 */

export interface Finishing {
  finish: Finish;
  color?: string;
}

/** Group whose local +Y is the axis of bank `bank` (local +Z = lateral). */
export function BankFrame({ bank, children }: { bank: number; children: ReactNode }) {
  const { dims } = useEngine();
  return <group rotation={[(dims.bankAxisDeg[bank] ?? 0) * DEG, 0, 0]}>{children}</group>;
}

function blockSection(kind: 'inline' | 'v' | 'w', dims: ReturnType<typeof useEngine>['dims'], skirtDepth: number) {
  const s = new THREE.Shape();
  const W = dims.bankWidth;
  const cc = dims.crankcaseRadius;
  if (kind === 'inline') {
    const deck = dims.deck;
    s.moveTo(-W / 2 - 0.018, -skirtDepth);
    s.lineTo(W / 2 + 0.018, -skirtDepth);
    s.lineTo(W / 2 + 0.018, -cc * 0.15);
    s.lineTo(W / 2, cc * 0.35);
    s.lineTo(W / 2, deck);
    s.lineTo(-W / 2, deck);
    s.lineTo(-W / 2, cc * 0.35);
    s.lineTo(-W / 2 - 0.018, -cc * 0.15);
    s.closePath();
    return s;
  }
  const [a, b] = dims.bankAxisDeg;
  const sa = Math.sign(a) || 1;
  const sb = Math.sign(b) || -1;
  // points as [y, z]
  const outerDeckA = axisPoint(a, dims.deck, sa * W / 2);
  const innerDeckA = axisPoint(a, dims.deck, -sa * W / 2);
  const outerDeckB = axisPoint(b, dims.deck, -sb * W / 2);
  const innerDeckB = axisPoint(b, dims.deck, sb * W / 2);
  const outerLowA = axisPoint(a, cc * 0.9, sa * W / 2);
  const outerLowB = axisPoint(b, cc * 0.9, -sb * W / 2);
  // valley floor: inner bank faces go down until they meet the crankcase top
  const valleyY = Math.max(cc + 0.012, dims.r * 2.2 + 0.03);
  const innerAt = (deg: number, side: number) => {
    // find along-distance where the inner face reaches y = valleyY
    const c = Math.cos(deg * DEG);
    const sn = Math.sin(deg * DEG);
    const lat = side * W / 2;
    const along = (valleyY + sn * lat) / c;
    return axisPoint(deg, Math.max(along, cc * 0.6), lat);
  };
  const valleyA = innerAt(a, -sa);
  const valleyB = innerAt(b, sb);
  const skirtZ = Math.max(Math.abs(outerLowA[1]), Math.abs(outerLowB[1]), cc + 0.02);
  const pts: [number, number][] = [
    [-skirtDepth, skirtZ * sa],
    [outerLowA[0], outerLowA[1]],
    [outerDeckA[0], outerDeckA[1]],
    [innerDeckA[0], innerDeckA[1]],
    [valleyA[0], valleyA[1]],
    [valleyB[0], valleyB[1]],
    [innerDeckB[0], innerDeckB[1]],
    [outerDeckB[0], outerDeckB[1]],
    [outerLowB[0], outerLowB[1]],
    [-skirtDepth, -skirtZ * sa],
  ];
  // shape.x = engine z, shape.y = engine y ; ensure counter-clockwise
  const area = pts.reduce((acc, p, i) => {
    const q = pts[(i + 1) % pts.length];
    return acc + (p[1] * q[0] - q[1] * p[0]);
  }, 0);
  const ordered = area < 0 ? [...pts].reverse() : pts;
  ordered.forEach(([y, z], i) => (i === 0 ? s.moveTo(z, y) : s.lineTo(z, y)));
  s.closePath();
  return s;
}

export function Block({
  finish,
  color,
  ribs = true,
  skirt = 0.6,
}: Finishing & { ribs?: boolean; skirt?: number }) {
  const { def, dims, lib, geo } = useEngine();
  const skirtDepth = dims.crankcaseRadius * skirt;
  const g = geo('block', () => extrudeAlongX(blockSection(def.engine.layout, dims, skirtDepth), dims.blockLength, 0.004, 6));
  const mat = lib.get(finish, 'block', color);
  const ribGeo = geo('block-rib', () => new THREE.BoxGeometry(0.008, 1, 0.012));
  const ribXs = useMemo(() => {
    const n = Math.max(2, Math.round(dims.blockLength / 0.11));
    return new Array(n + 1).fill(0).map((_, i) => dims.rearX + 0.03 + (i / n) * (dims.blockLength - 0.06));
  }, [dims]);
  return (
    <Part kind="block" category="block">
      <mesh geometry={g} material={mat} castShadow receiveShadow />
      {ribs &&
        dims.bankAxisDeg.map((deg, bi) => {
          const side = def.engine.layout === 'inline' ? [1, -1] : [Math.sign(deg) || 1];
          return side.map((sd) =>
            ribXs.map((x, i) => {
              const along = dims.deck * 0.55;
              const [y, z] = axisPoint(deg, along, sd * (dims.bankWidth / 2 + 0.004));
              return (
                <mesh
                  key={`${bi}-${sd}-${i}`}
                  geometry={ribGeo}
                  material={mat}
                  position={[x, y, z]}
                  rotation={[deg * DEG, 0, 0]}
                  scale={[1, dims.deck * 0.7, 1]}
                />
              );
            }),
          );
        })}
    </Part>
  );
}

export function Heads({
  finish,
  color,
  bolts = true,
  boltFinish = 'polishedSteel',
}: Finishing & { bolts?: boolean; boltFinish?: Finish }) {
  const { dims, lib, geo, def } = useEngine();
  const W = dims.bankWidth + 0.014;
  const len = dims.blockLength - 0.004;
  const headGeo = geo('head', () => {
    const s = new THREE.Shape();
    const h = dims.headHeight;
    s.moveTo(-W / 2, 0);
    s.lineTo(W / 2, 0);
    s.lineTo(W / 2, h * 0.8);
    s.lineTo(W / 2 - 0.01, h);
    s.lineTo(-W / 2 + 0.01, h);
    s.lineTo(-W / 2, h * 0.8);
    s.closePath();
    return extrudeAlongX(s, len, 0.003, 4);
  });
  const boltGeo = geo('head-bolt', () => new THREE.CylinderGeometry(0.0055, 0.0055, 0.008, 6));
  const mat = lib.get(finish, 'head', color);
  const boltMat = lib.get(boltFinish, 'head');
  const boltXs = useMemo(() => {
    const n = def.engine.cylinders / Math.max(1, dims.bankAxisDeg.length) + 1;
    return new Array(Math.round(n)).fill(0).map((_, i) => dims.rearX + 0.03 + (i / (Math.round(n) - 1)) * (len - 0.06));
  }, [def, dims, len]);
  return (
    <>
      {dims.bankAxisDeg.map((_, bi) => (
        <BankFrame key={bi} bank={bi}>
          <Part kind="head" category="head" position={[0, dims.deck, 0]} explode={[0, 0.16, 0]}>
            <mesh geometry={headGeo} material={mat} castShadow receiveShadow />
            {bolts &&
              boltXs.map((x, i) =>
                [1, -1].map((sd) => (
                  <mesh key={`${i}${sd}`} geometry={boltGeo} material={boltMat} position={[x, dims.headHeight * 0.82, sd * (W / 2 - 0.006)]} rotation={[0, 0, 0]} />
                )),
              )}
          </Part>
        </BankFrame>
      ))}
    </>
  );
}

export interface CoverStyle extends Finishing {
  /** Text inscriptions, one per bank (or a single one repeated). */
  labels?: string[];
  labelColor?: string;
  labelFont?: string;
  /** Raised longitudinal fins on the cover. */
  fins?: number;
  finFinish?: Finish;
  finColor?: string;
  /** Cover width as a fraction of the head. */
  widthFrac?: number;
  heightFrac?: number;
  /** Separate the cover into per-cam "twin" humps (e.g. RB26). */
  twinHumps?: boolean;
  coilPacks?: boolean;
  boltFinish?: Finish;
}

export function CamCovers(style: CoverStyle) {
  const { dims, lib, geo, def } = useEngine();
  const W = (dims.bankWidth + 0.01) * (style.widthFrac ?? 0.94);
  const H = dims.coverHeight * (style.heightFrac ?? 1);
  const len = dims.blockLength - 0.03;
  const coverGeo = geo(`cover-${W.toFixed(3)}-${H.toFixed(3)}-${style.twinHumps ? 't' : 's'}`, () => {
    const s = new THREE.Shape();
    if (style.twinHumps) {
      s.moveTo(-W / 2, 0);
      s.lineTo(W / 2, 0);
      s.bezierCurveTo(W / 2, H * 1.05, W * 0.04, H * 1.05, 0, H * 0.72);
      s.bezierCurveTo(-W * 0.04, H * 1.05, -W / 2, H * 1.05, -W / 2, 0);
    } else {
      s.moveTo(-W / 2, 0);
      s.lineTo(W / 2, 0);
      s.bezierCurveTo(W / 2, H * 0.9, W * 0.38, H, 0, H);
      s.bezierCurveTo(-W * 0.38, H, -W / 2, H * 0.9, -W / 2, 0);
    }
    return extrudeAlongX(s, len, 0.006, 10);
  });
  const finGeo = geo('cover-fin', () => new THREE.BoxGeometry(1, 0.006, 0.006));
  const mat = lib.get(style.finish, 'cover', style.color);
  const finMat = lib.get(style.finFinish ?? 'machinedAluminium', 'cover', style.finColor);
  const boltGeo = geo('cover-bolt', () => new THREE.CylinderGeometry(0.0048, 0.0048, 0.01, 6));
  const boltMat = lib.get(style.boltFinish ?? 'polishedSteel', 'cover');
  const labels = style.labels ?? [];
  const labelMats = useMemo(
    () =>
      labels.map((t) =>
        lib.decal(
          createLabelTexture(t, { color: style.labelColor ?? '#e9e6df', font: style.labelFont, width: 1024, height: 160 }),
          'cover',
          `label-${t}-${style.labelColor}`,
        ),
      ),
    [labels.join('|'), style.labelColor, style.labelFont, lib],
  );
  const nBolts = Math.max(3, Math.round(def.engine.cylinders / Math.max(1, dims.bankAxisDeg.length)) + 1);
  return (
    <>
      {dims.bankAxisDeg.map((deg, bi) => {
        const labelMat = labelMats[bi % Math.max(1, labelMats.length)];
        // the label reads along the engine, on the cover's top face
        const flip = deg < 0;
        return (
          <BankFrame key={bi} bank={bi}>
            <Part kind="camCover" category="cover" position={[0, dims.deck + dims.headHeight, 0]} explode={[0, 0.3, 0]}>
              <mesh geometry={coverGeo} material={mat} castShadow />
              {style.fins &&
                new Array(style.fins).fill(0).map((_, i) => {
                  const z = ((i + 0.5) / style.fins! - 0.5) * W * 0.62;
                  const y = H * (1 - Math.pow((2 * z) / W, 2) * 0.85) + 0.002;
                  return <mesh key={i} geometry={finGeo} material={finMat} position={[0, y, z]} scale={[len * 0.8, 1, 1]} />;
                })}
              {labelMat && (
                <mesh material={labelMat} position={[0, H + 0.0035, 0]} rotation={[-Math.PI / 2, 0, flip ? Math.PI : 0]}>
                  <planeGeometry args={[Math.min(len * 0.7, 0.42), Math.min(len * 0.7, 0.42) * 0.156]} />
                </mesh>
              )}
              {new Array(nBolts).fill(0).map((_, i) =>
                [1, -1].map((sd) => (
                  <mesh
                    key={`${i}${sd}`}
                    geometry={boltGeo}
                    material={boltMat}
                    position={[-len / 2 + 0.02 + (i / (nBolts - 1)) * (len - 0.04), 0.012, sd * (W / 2 - 0.004)]}
                  />
                )),
              )}
            </Part>
          </BankFrame>
        );
      })}
    </>
  );
}

export function Sump({ finish, color, finned = false }: Finishing & { finned?: boolean }) {
  const { dims, lib, geo, def } = useEngine();
  const dry = def.engine.lubrication === 'dry';
  const top = -dims.crankcaseRadius * 0.6;
  const depth = dims.sumpDepth;
  const W = def.engine.layout === 'inline' ? dims.bankWidth + 0.04 : Math.max(dims.bankWidth * 1.4, dims.crankcaseRadius * 2.3);
  const g = geo('sump', () => {
    const s = new THREE.Shape();
    s.moveTo(-W / 2, 0);
    s.lineTo(W / 2, 0);
    s.lineTo(W / 2 - 0.02, -depth * 0.85);
    s.quadraticCurveTo(W / 2 - 0.03, -depth, W / 2 - 0.07, -depth);
    s.lineTo(-W / 2 + 0.07, -depth);
    s.quadraticCurveTo(-W / 2 + 0.03, -depth, -W / 2 + 0.02, -depth * 0.85);
    s.closePath();
    return extrudeAlongX(s, dims.blockLength * (dry ? 0.96 : 0.9), 0.004, 6);
  });
  const finGeo = geo('sump-fin', () => new THREE.BoxGeometry(0.004, depth * 0.7, W * 0.8));
  const mat = lib.get(finish, 'block', color, 'sump');
  return (
    <Part kind={dry ? 'drySump' : 'oilPan'} category="block" position={[0, top, 0]} explode={[0, -0.2, 0]}>
      <mesh geometry={g} material={mat} castShadow receiveShadow />
      {finned &&
        new Array(8).fill(0).map((_, i) => (
          <mesh key={i} geometry={finGeo} material={mat} position={[(i / 7 - 0.5) * dims.blockLength * 0.8, -depth * 0.55, 0]} />
        ))}
    </Part>
  );
}

/** Timing cover on the front face (covers chain/belt drive). */
export function TimingCover({ finish, color, height }: Finishing & { height?: number }) {
  const { dims, lib, geo, def } = useEngine();
  const isInline = def.engine.layout === 'inline';
  const W = isInline ? dims.bankWidth + 0.02 : Math.max(dims.bankWidth * 1.9, dims.crankcaseRadius * 2.4);
  const H = height ?? dims.deck + dims.headHeight * 0.9 + dims.crankcaseRadius * 0.5;
  const g = geo('timing-cover', () => {
    const s = new THREE.Shape();
    const r = 0.03;
    s.moveTo(-W / 2 + r, 0);
    s.lineTo(W / 2 - r, 0);
    s.quadraticCurveTo(W / 2, 0, W / 2, r);
    s.lineTo(W / 2, H * 0.7);
    s.quadraticCurveTo(W * 0.3, H, 0, H);
    s.quadraticCurveTo(-W * 0.3, H, -W / 2, H * 0.7);
    s.lineTo(-W / 2, r);
    s.quadraticCurveTo(-W / 2, 0, -W / 2 + r, 0);
    return extrudeAlongX(s, 0.03, 0.004, 6);
  });
  const mat = lib.get(finish, 'block', color, 'timing');
  return (
    <Part kind="timingCover" category="block" position={[dims.frontX + 0.012, -dims.crankcaseRadius * 0.55, 0]} explode={[0.18, 0, 0]}>
      <mesh geometry={g} material={mat} castShadow />
    </Part>
  );
}

export function Bellhousing({ finish, color }: Finishing) {
  const { dims, lib, geo, seg } = useEngine();
  const R = Math.max(0.17, dims.r * 4.2);
  const g = geo('bellhousing', () => new THREE.CylinderGeometry(R * 0.9, R, 0.09, seg(48), 1, true).rotateZ(Math.PI / 2));
  const plate = geo('adapter', () => new THREE.CylinderGeometry(R * 1.02, R * 1.02, 0.012, seg(48)).rotateZ(Math.PI / 2));
  const mat = lib.get(finish, 'block', color, 'bell');
  return (
    <Part kind="bellhousing" category="block" position={[dims.rearX - 0.06, 0, 0]} explode={[-0.2, 0, 0]}>
      <mesh geometry={plate} material={mat} position={[0.04, 0, 0]} />
      <mesh geometry={g} material={mat} />
    </Part>
  );
}
