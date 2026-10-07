import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useEngine } from '../EngineContext';
import { Part } from '../Part';
import type { Finish, PartCategory } from '../materials';
import { DEG } from '../../simulation/kinematics';
import type { CylinderGeometry } from '../../simulation/cylinderLayout';
import type { EngineDims } from '../dims';

/** Pipes, runners, headers, throttle bodies, filters, rails — the plumbing kit. */

export type Vec3 = [number, number, number];

export function Pipe({
  points,
  radius,
  finish,
  color,
  category,
  tubular = 48,
  radial = 14,
  closed = false,
  variant,
}: {
  points: Vec3[];
  radius: number;
  finish: Finish;
  color?: string;
  category: PartCategory;
  tubular?: number;
  radial?: number;
  closed?: boolean;
  variant?: string;
}) {
  const { lib, seg } = useEngine();
  const key = JSON.stringify(points.map((p) => p.map((v) => +v.toFixed(4)))) + radius;
  const g = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(
      points.map((p) => new THREE.Vector3(...p)),
      closed,
      'centripetal',
    );
    return new THREE.TubeGeometry(curve, Math.max(8, Math.round(seg(tubular))), radius, Math.max(6, seg(radial)), closed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, closed, seg]);
  useDispose(g);
  return <mesh geometry={g} material={lib.get(finish, category, color, variant)} castShadow />;
}

function useDispose(g: THREE.BufferGeometry) {
  useEffect(() => () => g.dispose(), [g]);
}

/** Port opening on the side of the head for a cylinder (engine space). */
export function portPoint(c: CylinderGeometry, dims: EngineDims, lateralSign: number, out = 0): THREE.Vector3 {
  const a = c.axisDeg * DEG;
  const bankDeg = (dims.bankAxisDeg[c.bank] ?? 0) * DEG;
  const along = dims.deck + dims.headHeight * 0.42;
  const lat = lateralSign * (dims.bankWidth / 2 + 0.012 + out);
  // lateral measured perpendicular to the BANK axis so all ports of a bank line up
  const y = Math.cos(a) * along * 0 + Math.cos(bankDeg) * along - Math.sin(bankDeg) * lat;
  const z = Math.sin(bankDeg) * along + Math.cos(bankDeg) * lat;
  return new THREE.Vector3(c.axialM, y, z);
}

/** Lateral sign (+1/−1) of the intake side of the bank holding `c`. */
export function intakeSideOf(c: CylinderGeometry, dims: EngineDims, layout: 'inline' | 'v' | 'w', intakeInside = true, inlineSide: 1 | -1 = 1) {
  if (layout === 'inline') return inlineSide;
  const inside = -Math.sign(dims.bankAxisDeg[c.bank] ?? 0) || 1;
  return intakeInside ? inside : -inside;
}

/**
 * Exhaust headers: one primary per cylinder from its port to a collector,
 * then a collector pipe to an outlet.
 */
export function Headers({
  groups,
  intakeInside = true,
  inlineIntakeSide = 1,
  radius,
  finish = 'heatTint',
  color,
  dropFrac = 0.55,
  label,
}: {
  groups: { cylinders: number[]; collector: Vec3; outlet?: Vec3[] }[];
  intakeInside?: boolean;
  inlineIntakeSide?: 1 | -1;
  radius?: number;
  finish?: Finish;
  color?: string;
  dropFrac?: number;
  label?: string;
}) {
  const { layout, dims, def, lib } = useEngine();
  const r = radius ?? dims.bore * 0.2;
  const collectorMat = lib.get(finish, 'exhaust', color);
  const paths = useMemo(() => {
    const out: { pts: Vec3[]; key: string }[] = [];
    groups.forEach((g, gi) => {
      g.cylinders.forEach((n) => {
        const c = layout.cylinders.find((k) => k.number === n);
        if (!c) return;
        const exSide = -intakeSideOf(c, dims, def.engine.layout, intakeInside, inlineIntakeSide);
        const p0 = portPoint(c, dims, exSide, -0.01);
        const p1 = portPoint(c, dims, exSide, 0.06);
        const col = new THREE.Vector3(...g.collector);
        const mid = p1.clone().lerp(col, dropFrac);
        mid.x = p1.x * 0.6 + col.x * 0.4;
        mid.y = Math.min(p1.y, col.y) + (p1.y - col.y) * 0.25;
        out.push({ key: `${gi}-${n}`, pts: [p0.toArray(), p1.toArray(), mid.toArray(), g.collector] as Vec3[] });
      });
    });
    return out;
  }, [groups, layout, dims, def, intakeInside, inlineIntakeSide, dropFrac]);
  return (
    <Part kind="headers" label={label} category="exhaust" explode={[0, -0.05, 0]}>
      {paths.map((p) => (
        <Pipe key={p.key} points={p.pts} radius={r} finish={finish} color={color} category="exhaust" tubular={40} radial={12} />
      ))}
      {groups.map(
        (g, i) =>
          g.outlet && (
            <Pipe key={`o${i}`} points={[g.collector, ...g.outlet]} radius={r * 1.7} finish={finish} color={color} category="exhaust" tubular={32} />
          ),
      )}
      {groups.map((g, i) => (
        <mesh key={`c${i}`} position={g.collector} material={collectorMat}>
          <sphereGeometry args={[r * 1.8, 16, 12]} />
        </mesh>
      ))}
    </Part>
  );
}

/** Intake runners from each intake port to a target point (plenum / throttle body). */
export function Runners({
  targets,
  intakeInside = true,
  inlineIntakeSide = 1,
  radius,
  finish,
  color,
  category = 'induction',
  rise = 0.05,
  bend = 0.5,
}: {
  /** Destination for each cylinder number. */
  targets: Record<number, Vec3>;
  intakeInside?: boolean;
  inlineIntakeSide?: 1 | -1;
  radius?: number;
  finish: Finish;
  color?: string;
  category?: PartCategory;
  rise?: number;
  bend?: number;
}) {
  const { layout, dims, def } = useEngine();
  const r = radius ?? dims.bore * 0.21;
  const paths = useMemo(
    () =>
      layout.cylinders
        .filter((c) => targets[c.number])
        .map((c) => {
          const side = intakeSideOf(c, dims, def.engine.layout, intakeInside, inlineIntakeSide);
          const p0 = portPoint(c, dims, side, -0.012);
          const p1 = portPoint(c, dims, side, 0.035);
          const t = new THREE.Vector3(...targets[c.number]);
          const mid = p1.clone().lerp(t, bend);
          mid.y += rise;
          return { n: c.number, pts: [p0.toArray(), p1.toArray(), mid.toArray(), t.toArray()] as Vec3[] };
        }),
    [layout, dims, def, targets, intakeInside, inlineIntakeSide, rise, bend],
  );
  return (
    <Part kind="runner" category={category} explode={[0, 0.2, 0]}>
      {paths.map((p) => (
        <Pipe key={p.n} points={p.pts} radius={r} finish={finish} color={color} category={category} tubular={28} radial={14} />
      ))}
    </Part>
  );
}

export function ThrottleBody({
  position,
  rotation,
  radius = 0.035,
  finish = 'machinedAluminium',
  category = 'induction',
}: {
  position: Vec3;
  rotation?: Vec3;
  radius?: number;
  finish?: Finish;
  category?: PartCategory;
}) {
  const { lib, seg } = useEngine();
  const body = lib.get(finish, category);
  const dark = lib.get('satin', category);
  return (
    <Part kind="throttleBody" category={category} position={position} rotation={rotation} explode={[0, 0.25, 0]}>
      <mesh material={body}>
        <cylinderGeometry args={[radius * 1.18, radius * 1.18, radius * 1.3, seg(24), 1, true]} />
      </mesh>
      <mesh material={body} position={[0, radius * 0.66, 0]}>
        <torusGeometry args={[radius * 1.18, radius * 0.12, 8, seg(24)]} />
      </mesh>
      <mesh material={dark} rotation={[0, 0, 0.35]}>
        <cylinderGeometry args={[radius, radius, 0.002, seg(20)]} />
      </mesh>
      <mesh material={dark} position={[radius * 1.35, 0, 0]}>
        <boxGeometry args={[radius * 0.6, radius * 0.9, radius * 0.9]} />
      </mesh>
    </Part>
  );
}

export function AirFilter({
  position,
  rotation,
  radius = 0.07,
  length = 0.14,
  finish = 'satin',
  color,
  mesh = true,
}: {
  position: Vec3;
  rotation?: Vec3;
  radius?: number;
  length?: number;
  finish?: Finish;
  color?: string;
  mesh?: boolean;
}) {
  const { lib, seg } = useEngine();
  const body = lib.get(finish, 'induction', color, 'filter');
  const pleat = lib.get('plastic', 'induction', '#c9c2ae', 'pleat');
  return (
    <Part kind="airFilter" category="induction" position={position} rotation={rotation} explode={[0, 0.3, 0]}>
      <mesh material={body}>
        <cylinderGeometry args={[radius * 0.55, radius, length * 0.25, seg(28)]} />
      </mesh>
      <mesh material={mesh ? pleat : body} position={[0, length * 0.5, 0]}>
        <cylinderGeometry args={[radius, radius, length * 0.75, seg(32), 4]} />
      </mesh>
      <mesh material={body} position={[0, length * 0.9, 0]}>
        <cylinderGeometry args={[radius * 1.02, radius * 1.02, length * 0.06, seg(32)]} />
      </mesh>
    </Part>
  );
}

export function FuelRail({ from, to, radius = 0.007 }: { from: Vec3; to: Vec3; radius?: number }) {
  const { lib } = useEngine();
  const a = new THREE.Vector3(...from);
  const b = new THREE.Vector3(...to);
  const len = a.distanceTo(b);
  const mid = a.clone().lerp(b, 0.5);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
  return (
    <Part kind="fuelRail" category="induction">
      <mesh position={mid.toArray()} quaternion={q} material={lib.get('machinedAluminium', 'induction', '#b6babf', 'rail')}>
        <cylinderGeometry args={[radius, radius, len, 10]} />
      </mesh>
    </Part>
  );
}

/** Air-to-air or air-to-liquid charge cooler core (box with fins). */
export function Intercooler({
  position,
  size,
  rotation,
  finish = 'castAluminium',
  label,
}: {
  position: Vec3;
  size: Vec3;
  rotation?: Vec3;
  finish?: Finish;
  label?: string;
}) {
  const { lib } = useEngine();
  const body = lib.get(finish, 'induction', undefined, 'ic');
  const fin = lib.get('satin', 'induction', '#2b2d31', 'ic-fin');
  const n = Math.max(6, Math.round(size[0] / 0.012));
  return (
    <Part kind="intercooler" label={label} category="induction" position={position} rotation={rotation} explode={[0, 0.32, 0]}>
      <mesh material={fin}>
        <boxGeometry args={[size[0] * 0.92, size[1] * 0.86, size[2] * 0.98]} />
      </mesh>
      {new Array(n).fill(0).map((_, i) => (
        <mesh key={i} material={body} position={[(i / (n - 1) - 0.5) * size[0] * 0.9, 0, 0]}>
          <boxGeometry args={[0.0016, size[1] * 0.9, size[2]]} />
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <mesh key={s} material={body} position={[(s * size[0]) / 2, 0, 0]}>
          <boxGeometry args={[size[0] * 0.08, size[1], size[2] * 1.04]} />
        </mesh>
      ))}
    </Part>
  );
}

/** Rounded box helper oriented with explicit size. */
export function Box({
  position,
  size,
  rotation,
  finish,
  color,
  category,
  variant,
  radius = 0.01,
}: {
  position: Vec3;
  size: Vec3;
  rotation?: Vec3;
  finish: Finish;
  color?: string;
  category: PartCategory;
  variant?: string;
  radius?: number;
}) {
  const { lib, geo } = useEngine();
  const g = geo(`rbox-${size.map((v) => v.toFixed(3)).join('x')}-${radius}`, () => roundedBox(size, radius));
  return <mesh geometry={g} material={lib.get(finish, category, color, variant)} position={position} rotation={rotation} castShadow receiveShadow />;
}

export function roundedBox(size: Vec3, radius: number): THREE.BufferGeometry {
  const [w, h, d] = size;
  const b = Math.max(0, Math.min(radius, w / 2, h / 2, d / 2) * 0.6);
  const sw = w - 2 * b;
  const sh = h - 2 * b;
  const r = Math.max(0, Math.min(radius - b, sw / 2 - 1e-5, sh / 2 - 1e-5));
  const s = new THREE.Shape();
  s.moveTo(-sw / 2 + r, -sh / 2);
  s.lineTo(sw / 2 - r, -sh / 2);
  if (r > 0) s.quadraticCurveTo(sw / 2, -sh / 2, sw / 2, -sh / 2 + r);
  s.lineTo(sw / 2, sh / 2 - r);
  if (r > 0) s.quadraticCurveTo(sw / 2, sh / 2, sw / 2 - r, sh / 2);
  s.lineTo(-sw / 2 + r, sh / 2);
  if (r > 0) s.quadraticCurveTo(-sw / 2, sh / 2, -sw / 2, sh / 2 - r);
  s.lineTo(-sw / 2, -sh / 2 + r);
  if (r > 0) s.quadraticCurveTo(-sw / 2, -sh / 2, -sw / 2 + r, -sh / 2);
  const g = new THREE.ExtrudeGeometry(s, {
    depth: Math.max(1e-4, d - 2 * b),
    bevelEnabled: b > 0,
    bevelSize: b,
    bevelThickness: b,
    bevelSegments: 3,
    curveSegments: 6,
  });
  g.translate(0, 0, -(d - 2 * b) / 2);
  g.computeVertexNormals();
  return g;
}
