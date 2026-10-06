import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useEngine } from '../EngineContext';
import { Part } from '../Part';
import { simRef } from '../../state/simulationStore';
import { useApp } from '../../state/appStore';
import {
  DEG,
  VALVE_EVENTS,
  combustionGlow,
  exhaustValveLift,
  intakeValveLift,
  pistonPinDistance,
} from '../../simulation/kinematics';
import { cylinderCycleDeg, type CylinderGeometry } from '../../simulation/cylinderLayout';
import { camLobeShape, extrudeAlongX, placeBetween, springGeometry, webShape } from '../geometry';

/**
 * Moving internals generated from the engine layout:
 * crankshaft, connecting rods, pistons, liners, valves, springs, camshafts
 * (DOHC) or cam-in-block + lifters + pushrods + rockers (OHV), spark plugs,
 * injectors and the combustion flame kernel.
 *
 * Everything is positioned every frame from ONE value — the crank angle of the
 * simulation — through the slider-crank equations, so pistons, rods, valves
 * and cams can never desynchronise.
 */

export interface ValvetrainConfig {
  /** V/W engines: intake ports face the valley (true) or the outside (false). */
  intakeInside?: boolean;
  /** Inline engines: lateral side (+1 = +Z, −1 = −Z) of the intake ports. */
  inlineIntakeSide?: 1 | -1;
  injection?: 'port' | 'direct';
  /** Show coil-on-plug units above the plugs (inside the cam cover area). */
  coilOnPlug?: boolean;
}

interface ValveDef {
  cyl: CylinderGeometry;
  intake: boolean;
  seat: THREE.Vector3;
  dir: THREE.Vector3; // stem direction, seat → tip (unit)
  stemLen: number;
  headDia: number;
  /** DOHC: index of the cam line; OHV: rocker geometry. */
  camKey: string;
  peakCrankDeg: number;
}

interface CamLine {
  key: string;
  y: number;
  z: number;
  lobes: { x: number; gammaDeg: number; width: number }[];
}

const v3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

function axisVec(deg: number) {
  return v3(0, Math.cos(deg * DEG), Math.sin(deg * DEG));
}
function perpVec(deg: number) {
  return v3(0, -Math.sin(deg * DEG), Math.cos(deg * DEG));
}

export function Internals({ config = {} }: { config?: ValvetrainConfig }) {
  const { layout, dims, def } = useEngine();
  const ohv = def.engine.valvetrain === 'ohv';

  const valves = useMemo(() => buildValves(layout.cylinders, dims, def.engine.valvesPerCylinder, config, def.engine.layout, ohv), [layout, dims, def, config, ohv]);

  return (
    <group>
      <Crankshaft />
      <PistonsAndRods />
      <Liners />
      <CombustionKernels />
      {ohv ? <OhvValvetrain valves={valves.valves} /> : <DohcValvetrain valves={valves.valves} cams={valves.cams} />}
      <PlugsAndInjectors config={config} />
    </group>
  );
}

// --------------------------------------------------------------------------
// valve geometry

function buildValves(
  cyls: CylinderGeometry[],
  dims: ReturnType<typeof useEngine>['dims'],
  valvesPerCyl: number,
  config: ValvetrainConfig,
  layoutKind: string,
  ohv: boolean,
) {
  const bore = dims.bore;
  const four = valvesPerCyl >= 4;
  const valves: ValveDef[] = [];
  const cams = new Map<string, CamLine>();

  const bankAxis = (c: CylinderGeometry) => dims.bankAxisDeg[c.bank] ?? 0;
  const intakeSign = (c: CylinderGeometry) => {
    if (layoutKind === 'inline') return config.inlineIntakeSide ?? 1;
    const a = bankAxis(c);
    const inside = -Math.sign(a) || 1;
    return (config.intakeInside ?? true) ? inside : -inside;
  };

  for (const c of cyls) {
    const d = axisVec(c.axisDeg);
    const p = perpVec(c.axisDeg);
    const chamber = v3(c.axialM, 0, 0).addScaledVector(d, dims.deck + 0.004);
    const s = intakeSign(c);
    const xOffsets = four ? [-0.2 * bore, 0.2 * bore] : [0];
    const bankDeg = bankAxis(c);
    const bd = axisVec(bankDeg);
    const bp = perpVec(bankDeg);
    const wExtra = layoutKind === 'w' ? Math.abs(dims.rowLateral[0]) : 0;
    for (const intake of [true, false]) {
      const side = intake ? s : -s;
      const camKey = `${c.bank}:${intake ? 'in' : 'ex'}`;
      const camAlong = dims.deck + dims.headHeight * 0.74;
      const camLat = side * (0.36 * bore + wExtra * 0.6);
      const camY = bd.y * camAlong + bp.y * camLat;
      const camZ = bd.z * camAlong + bp.z * camLat;
      if (!ohv && !cams.has(camKey)) cams.set(camKey, { key: camKey, y: camY, z: camZ, lobes: [] });
      for (const xo of xOffsets) {
        const twoValveX = four ? 0 : (intake ? 1 : -1) * 0.13 * bore;
        const seat = chamber
          .clone()
          .addScaledVector(p, side * (four ? 0.21 : 0.2) * bore)
          .add(v3(xo + twoValveX, 0, 0));
        let dir: THREE.Vector3;
        let stemLen: number;
        const headDia = intake ? dims.valveHeadDia.intake : dims.valveHeadDia.exhaust;
        const camBaseR = bore * 0.17;
        if (!ohv) {
          const camPt = v3(seat.x, camY, camZ);
          const toCam = camPt.clone().sub(seat);
          const dist = toCam.length();
          dir = toCam.divideScalar(dist);
          stemLen = dist - camBaseR - bore * 0.06;
        } else {
          // OHV: canted valves, stems inclined away from the cylinder axis
          const cant = (four ? 12 : 20) * DEG * side;
          dir = d.clone().multiplyScalar(Math.cos(cant)).addScaledVector(p, Math.sin(cant)).normalize();
          stemLen = dims.headHeight * 0.92;
        }
        const peakCycle = intake
          ? (VALVE_EVENTS.intakeOpen + VALVE_EVENTS.intakeClose) / 2
          : (VALVE_EVENTS.exhaustOpen + VALVE_EVENTS.exhaustClose) / 2;
        const peakCrank = c.tdcDeg + peakCycle;
        valves.push({ cyl: c, intake, seat, dir, stemLen, headDia, camKey, peakCrankDeg: peakCrank });
        if (!ohv) {
          // lobe nose must point from the cam towards the valve tip at peak lift
          const toValve = dir.clone().negate();
          const phiT = Math.atan2(toValve.z, toValve.y) / DEG;
          cams.get(camKey)!.lobes.push({ x: seat.x, gammaDeg: phiT - peakCrank / 2, width: bore * 0.16 });
        }
      }
    }
  }
  return { valves, cams: [...cams.values()] };
}

// --------------------------------------------------------------------------
// crankshaft

function Crankshaft() {
  const { layout, dims, lib, geo, seg, def } = useEngine();
  const ref = useRef<THREE.Group>(null);
  const r = dims.r;
  const bore = dims.bore;
  const pinR = bore * 0.27;
  const mainR = bore * 0.33;
  const webT = Math.min(0.018, layout.slotPitchM * 0.18);
  const steel = lib.get('forgedSteel', 'rotating');
  const polished = lib.get('polishedSteel', 'rotating');

  const webGeo = geo('crank-web', () => extrudeAlongX(webShape(r, pinR, r * 1.75, seg(40)), webT, 0.002, 4));
  const mainGeo = geo('crank-main', () => new THREE.CylinderGeometry(mainR, mainR, 1, seg(28)).rotateZ(Math.PI / 2));
  const pinGeo = geo('crank-pin', () => new THREE.CylinderGeometry(pinR, pinR, 1, seg(24)).rotateZ(Math.PI / 2));

  const throws = layout.throws;
  const rodW = def.engine.layout === 'w' ? layout.slotPitchM * 0.38 : Math.min(0.024, bore * 0.24);

  const pieces = useMemo(() => {
    const out: { kind: 'web' | 'pin' | 'main'; x: number; len?: number; angle: number }[] = [];
    throws.forEach((t, i) => {
      const xs = layout.cylinders.filter((c) => c.slot === t.slot).map((c) => c.axialM);
      const xMax = Math.max(...xs) + rodW / 2;
      const xMin = Math.min(...xs) - rodW / 2;
      if (t.pinDegs.length === 1) {
        out.push({ kind: 'pin', x: (xMax + xMin) / 2, len: xMax - xMin, angle: t.pinDegs[0] });
      } else {
        const mid = (xMax + xMin) / 2;
        // split pins: each cylinder of the slot gets its own offset journal
        const sorted = layout.cylinders.filter((c) => c.slot === t.slot).sort((a, b) => b.axialM - a.axialM);
        sorted.forEach((c) => out.push({ kind: 'pin', x: c.axialM, len: rodW, angle: c.pinDeg }));
        out.push({ kind: 'web', x: mid, angle: (t.pinDegs[0] + t.pinDegs[1]) / 2 });
      }
      out.push({ kind: 'web', x: xMax + webT / 2, angle: t.pinDegs[0] });
      out.push({ kind: 'web', x: xMin - webT / 2, angle: t.pinDegs[t.pinDegs.length - 1] });
      // main journal between this throw and the next
      const next = throws[i + 1];
      if (next) {
        const nxs = layout.cylinders.filter((c) => c.slot === next.slot).map((c) => c.axialM);
        const nMax = Math.max(...nxs) + rodW / 2 + webT;
        const a = xMin - webT;
        out.push({ kind: 'main', x: (a + nMax) / 2, len: Math.max(0.004, a - nMax), angle: 0 });
      }
    });
    return out;
  }, [throws, layout, rodW, webT]);

  const front = Math.max(...layout.cylinders.map((c) => c.axialM)) + rodW / 2 + webT;
  const rear = Math.min(...layout.cylinders.map((c) => c.axialM)) - rodW / 2 - webT;
  const snout = dims.frontX + 0.035 - front;

  useFrame(() => {
    const sim = simRef.current;
    if (ref.current && sim) ref.current.rotation.x = sim.crankDeg * DEG;
  });

  return (
    <Part kind="crankshaft" category="rotating" explode={[0, -0.28, 0]}>
      <group ref={ref}>
        {pieces.map((p, i) => {
          if (p.kind === 'web')
            return <mesh key={i} geometry={webGeo} material={steel} position={[p.x, 0, 0]} rotation={[p.angle * DEG, 0, 0]} castShadow />;
          if (p.kind === 'pin')
            return (
              <mesh
                key={i}
                geometry={pinGeo}
                material={polished}
                position={[p.x, Math.cos(p.angle * DEG) * r, Math.sin(p.angle * DEG) * r]}
                scale={[p.len ?? 0.02, 1, 1]}
              />
            );
          return <mesh key={i} geometry={mainGeo} material={polished} position={[p.x, 0, 0]} scale={[p.len ?? 0.02, 1, 1]} />;
        })}
        {/* front snout and rear flange */}
        <mesh geometry={mainGeo} material={polished} position={[front + snout / 2, 0, 0]} scale={[snout, 0.75, 0.75]} />
        <mesh geometry={mainGeo} material={polished} position={[rear - 0.012, 0, 0]} scale={[0.024, 1.25, 1.25]} />
        <Flywheel x={dims.rearX - 0.02} radius={Math.max(0.13, r * 3.4)} />
      </group>
    </Part>
  );
}

function Flywheel({ x, radius }: { x: number; radius: number }) {
  const { lib, geo, seg } = useEngine();
  const g = geo('flywheel', () => new THREE.CylinderGeometry(radius, radius, 0.022, seg(48)).rotateZ(Math.PI / 2));
  const ring = geo('flywheel-ring', () => new THREE.TorusGeometry(radius * 0.99, 0.007, 6, seg(64)).rotateY(Math.PI / 2));
  const holes = useMemo(() => new Array(6).fill(0).map((_, i) => (i / 6) * Math.PI * 2), []);
  const hole = geo('flywheel-hole', () => new THREE.CylinderGeometry(radius * 0.09, radius * 0.09, 0.024, 16).rotateZ(Math.PI / 2));
  return (
    <group position={[x, 0, 0]}>
      <mesh geometry={g} material={lib.get('machinedAluminium', 'rotating', '#9fa3a8')} castShadow />
      <mesh geometry={ring} material={lib.get('forgedSteel', 'rotating')} />
      {holes.map((a, i) => (
        <mesh key={i} geometry={hole} material={lib.get('satin', 'rotating')} position={[0.001, Math.cos(a) * radius * 0.6, Math.sin(a) * radius * 0.6]} />
      ))}
    </group>
  );
}

// --------------------------------------------------------------------------
// pistons + rods

function PistonsAndRods() {
  const { layout, dims, lib, geo, seg, def } = useEngine();
  const bore = dims.bore;
  const pistonGroups = useRef<(THREE.Group | null)[]>([]);
  const rodGroups = useRef<(THREE.Group | null)[]>([]);
  const r = dims.r;
  const l = dims.l;
  const rodW = def.engine.layout === 'w' ? layout.slotPitchM * 0.38 : Math.min(0.024, bore * 0.24);

  const pistonGeo = geo('piston', () => {
    const h = dims.pistonHeight;
    const rad = bore / 2 - 0.0006;
    // lathe profile: crown with slight dish + ring lands + skirt
    const pts = [
      new THREE.Vector2(0, dims.compressionHeight - 0.002),
      new THREE.Vector2(rad * 0.7, dims.compressionHeight - 0.001),
      new THREE.Vector2(rad * 0.98, dims.compressionHeight),
      new THREE.Vector2(rad, dims.compressionHeight - 0.002),
      new THREE.Vector2(rad, dims.compressionHeight - h),
      new THREE.Vector2(rad * 0.9, dims.compressionHeight - h),
      new THREE.Vector2(rad * 0.9, dims.compressionHeight - h + 0.004),
      new THREE.Vector2(0.002, dims.compressionHeight - h * 0.55),
    ];
    return new THREE.LatheGeometry(pts, seg(32));
  });
  const ringGeo = geo('piston-ring', () => new THREE.CylinderGeometry(bore / 2 - 0.0002, bore / 2 - 0.0002, 0.0018, seg(32), 1, true));
  const pinGeo = geo('wrist-pin', () => new THREE.CylinderGeometry(bore * 0.12, bore * 0.12, bore * 0.72, 16).rotateZ(Math.PI / 2));
  const rodGeo = geo('rod-beam', () => {
    // tapered I-beam along +Y from big end (0) to small end (1); unit length
    const g = new THREE.BoxGeometry(1, 1, 1);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i) + 0.5;
      const w = 0.075 * l * (1 - 0.45 * y) + bore * 0.05;
      pos.setXYZ(i, pos.getX(i) * rodW * 0.62, y, pos.getZ(i) * w);
    }
    g.computeVertexNormals();
    return g;
  });
  const bigEndGeo = geo('rod-bigend', () => new THREE.CylinderGeometry(bore * 0.36, bore * 0.36, rodW, seg(24)).rotateZ(Math.PI / 2));
  const smallEndGeo = geo('rod-smallend', () => new THREE.CylinderGeometry(bore * 0.17, bore * 0.17, rodW * 0.8, 16).rotateZ(Math.PI / 2));

  const pistonMat = lib.get('machinedAluminium', 'rotating', '#c4c7cb', 'piston');
  const ringMat = lib.get('forgedSteel', 'rotating', '#6d7176', 'ring');
  const rodMat = lib.get('forgedSteel', 'rotating', '#878b91', 'rod');
  const pinMat = lib.get('polishedSteel', 'rotating');

  const pTmp = useMemo(() => v3(), []);
  const wTmp = useMemo(() => v3(), []);

  useFrame(() => {
    const sim = simRef.current;
    if (!sim) return;
    const crank = sim.crankDeg;
    layout.cylinders.forEach((c, i) => {
      const phi = (crank + c.pinDeg) * DEG;
      const local = crank + c.pinDeg - c.axisDeg;
      const s = pistonPinDistance(local, r, l);
      const pg = pistonGroups.current[i];
      if (pg) pg.position.set(c.axialM, Math.cos(c.axisDeg * DEG) * s, Math.sin(c.axisDeg * DEG) * s);
      const rg = rodGroups.current[i];
      if (rg) {
        pTmp.set(c.axialM, Math.cos(phi) * r, Math.sin(phi) * r);
        wTmp.set(c.axialM, Math.cos(c.axisDeg * DEG) * s, Math.sin(c.axisDeg * DEG) * s);
        placeBetween(rg, pTmp, wTmp, false);
        rg.position.copy(pTmp);
        rg.scale.set(1, 1, 1);
      }
    });
  });

  return (
    <Part kind="piston" category="rotating" explode={[0, -0.28, 0]}>
      {layout.cylinders.map((c, i) => (
        <group key={c.number}>
          <group ref={(g) => void (pistonGroups.current[i] = g)} rotation={[c.axisDeg * DEG, 0, 0]}>
            <mesh geometry={pistonGeo} material={pistonMat} castShadow />
            {[0.006, 0.012, 0.019].map((y, k) => (
              <mesh key={k} geometry={ringGeo} material={ringMat} position={[0, dims.compressionHeight - y, 0]} />
            ))}
            <mesh geometry={pinGeo} material={pinMat} />
          </group>
          <group ref={(g) => void (rodGroups.current[i] = g)}>
            <mesh geometry={rodGeo} material={rodMat} scale={[1, l, 1]} castShadow />
            <mesh geometry={bigEndGeo} material={rodMat} />
            <mesh geometry={smallEndGeo} material={rodMat} position={[0, l, 0]} />
          </group>
        </group>
      ))}
    </Part>
  );
}

// --------------------------------------------------------------------------
// liners (shown as glass in the internal views)

function Liners() {
  const { layout, dims, lib, geo, seg } = useEngine();
  const len = dims.deck - dims.linerBottom;
  const g = geo('liner', () => new THREE.CylinderGeometry(dims.bore / 2 + 0.0015, dims.bore / 2 + 0.0015, len, seg(32), 1, true));
  const rim = geo('liner-rim', () => new THREE.TorusGeometry(dims.bore / 2 + 0.002, 0.0014, 6, seg(32)).rotateX(Math.PI / 2));
  const glass = lib.get('glass', 'liner');
  const edge = lib.get('machinedAluminium', 'liner', '#9fb6c8', 'liner-rim');
  return (
    <Part kind="liner" category="liner">
      {layout.cylinders.map((c) => {
        const mid = (dims.deck + dims.linerBottom) / 2;
        return (
          <group key={c.number} position={[c.axialM, 0, 0]} rotation={[c.axisDeg * DEG, 0, 0]}>
            <mesh geometry={g} material={glass} position={[0, mid, 0]} renderOrder={2} />
            <mesh geometry={rim} material={edge} position={[0, dims.deck, 0]} />
            <mesh geometry={rim} material={edge} position={[0, dims.linerBottom, 0]} />
          </group>
        );
      })}
    </Part>
  );
}

// --------------------------------------------------------------------------
// combustion flame kernels

function CombustionKernels() {
  const { layout, dims, geo } = useEngine();
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const g = geo('flame', () => new THREE.SphereGeometry(dims.bore * 0.42, 20, 10).scale(1, 0.32, 1));
  const mats = useMemo(
    () =>
      layout.cylinders.map(
        () =>
          new THREE.MeshBasicMaterial({
            color: new THREE.Color('#ff7a1c'),
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            toneMapped: false,
          }),
      ),
    [layout],
  );
  useEffect(() => () => mats.forEach((m) => m.dispose()), [mats]);
  const tmpColor = useMemo(() => new THREE.Color(), []);

  useFrame(() => {
    const sim = simRef.current;
    const show = useApp.getState().combustionGlow;
    if (!sim) return;
    const load = Math.min(1.4, 0.35 + sim.manifold + sim.boost * 0.6);
    layout.cylinders.forEach((c, i) => {
      const m = mats[i];
      const glow = sim.combusting && show ? combustionGlow(cylinderCycleDeg(sim.crankDeg, c)) * load : 0;
      m.opacity = Math.min(1, glow * 1.6);
      tmpColor.setRGB(1.0 * (1 + glow * 1.6), 0.45 + glow * 0.25, 0.08 + glow * 0.18);
      m.color.copy(tmpColor);
      const mesh = refs.current[i];
      if (mesh) mesh.visible = glow > 0.01;
    });
  });

  return (
    <Part kind="combustion" category="combustion">
      {layout.cylinders.map((c, i) => (
        <group key={c.number} position={[c.axialM, 0, 0]} rotation={[c.axisDeg * DEG, 0, 0]}>
          <mesh ref={(m) => void (refs.current[i] = m)} geometry={g} material={mats[i]} position={[0, dims.deck - 0.002, 0]} renderOrder={3} />
        </group>
      ))}
    </Part>
  );
}

// --------------------------------------------------------------------------
// DOHC valvetrain

function DohcValvetrain({ valves, cams }: { valves: ValveDef[]; cams: CamLine[] }) {
  const { lib, geo, dims, seg, layout } = useEngine();
  const bore = dims.bore;
  const valveRefs = useRef<(THREE.Group | null)[]>([]);
  const springRefs = useRef<(THREE.Mesh | null)[]>([]);
  const camRefs = useRef<(THREE.Group | null)[]>([]);
  const lift = dims.valveLift;
  const camBaseR = bore * 0.17;

  const stemGeo = geo('valve-stem', () => new THREE.CylinderGeometry(0.0029, 0.0029, 1, 8).translate(0, 0.5, 0));
  const headIn = geo('valve-head-in', () => valveHead(dims.valveHeadDia.intake, seg(24)));
  const headEx = geo('valve-head-ex', () => valveHead(dims.valveHeadDia.exhaust, seg(24)));
  const springGeo = geo('valve-spring', () => springGeometry(bore * 0.085, 0.0014, 6, seg(10)));
  const bucketGeo = geo('bucket', () => new THREE.CylinderGeometry(bore * 0.13, bore * 0.13, bore * 0.09, seg(20)));
  const lobeGeo = geo('cam-lobe', () => extrudeAlongX(camLobeShape(camBaseR, lift, seg(40)), bore * 0.16, 0, 2));
  const shaftGeo = geo('cam-shaft', () => new THREE.CylinderGeometry(camBaseR * 0.72, camBaseR * 0.72, 1, seg(16)).rotateZ(Math.PI / 2));

  const inMat = lib.get('polishedSteel', 'valvetrain', '#c8b98e', 'valve-in');
  const exMat = lib.get('polishedSteel', 'valvetrain', '#8f8a88', 'valve-ex');
  const springMat = lib.get('forgedSteel', 'valvetrain', '#3f6d9c', 'spring');
  const camMat = lib.get('polishedSteel', 'valvetrain', '#b9bdc2', 'cam');
  const bucketMat = lib.get('machinedAluminium', 'valvetrain', '#8e9297', 'bucket');

  const camSpan = layout.crankSpanM + bore * 0.9;

  useFrame(() => {
    const sim = simRef.current;
    if (!sim) return;
    const crank = sim.crankDeg;
    valves.forEach((v, i) => {
      const cyc = cylinderCycleDeg(crank, v.cyl);
      const L = (v.intake ? intakeValveLift(cyc) : exhaustValveLift(cyc)) * lift;
      const g = valveRefs.current[i];
      if (g) g.position.y = -L;
      const sp = springRefs.current[i];
      if (sp) {
        const free = v.stemLen * 0.42;
        sp.scale.y = free - L;
      }
    });
    camRefs.current.forEach((g) => {
      if (g) g.rotation.x = (crank / 2) * DEG;
    });
  });

  return (
    <Part kind="valve" category="valvetrain" explode={[0, 0.22, 0]}>
      {valves.map((v, i) => {
        const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.dir);
        const e = new THREE.Euler().setFromQuaternion(q);
        return (
          <group key={i} position={v.seat.toArray()} rotation={e}>
            <group ref={(g) => void (valveRefs.current[i] = g)}>
              <mesh geometry={v.intake ? headIn : headEx} material={v.intake ? inMat : exMat} />
              <mesh geometry={stemGeo} material={v.intake ? inMat : exMat} scale={[1, v.stemLen, 1]} />
              <mesh geometry={bucketGeo} material={bucketMat} position={[0, v.stemLen + bore * 0.015, 0]} />
            </group>
            <mesh
              ref={(m) => void (springRefs.current[i] = m)}
              geometry={springGeo}
              material={springMat}
              position={[0, v.stemLen * 0.5, 0]}
              scale={[1, v.stemLen * 0.42, 1]}
            />
          </group>
        );
      })}
      {cams.map((c, i) => (
        <group key={c.key} position={[0, c.y, c.z]} ref={(g) => void (camRefs.current[i] = g)}>
          <mesh geometry={shaftGeo} material={camMat} scale={[camSpan, 1, 1]} />
          {c.lobes.map((lb, k) => (
            <mesh key={k} geometry={lobeGeo} material={camMat} position={[lb.x, 0, 0]} rotation={[lb.gammaDeg * DEG, 0, 0]} />
          ))}
          <mesh geometry={shaftGeo} material={camMat} position={[camSpan / 2 + 0.01, 0, 0]} scale={[0.012, 2.6, 2.6]} />
        </group>
      ))}
    </Part>
  );
}

function valveHead(dia: number, segments: number) {
  const r = dia / 2;
  const pts = [
    new THREE.Vector2(0, -0.0015),
    new THREE.Vector2(r, -0.0012),
    new THREE.Vector2(r, 0.0006),
    new THREE.Vector2(r * 0.55, r * 0.35),
    new THREE.Vector2(0.0034, r * 0.9),
    new THREE.Vector2(0.0029, r * 1.1),
  ];
  return new THREE.LatheGeometry(pts, segments);
}

// --------------------------------------------------------------------------
// OHV valvetrain: cam in block, lifters, pushrods, rockers

function OhvValvetrain({ valves }: { valves: ValveDef[] }) {
  const { lib, geo, dims, seg, layout } = useEngine();
  const bore = dims.bore;
  const lift = dims.valveLift;
  const ratio = 1.7;
  const camY = dims.r * 2.2 + 0.05;
  const camBaseR = bore * 0.2;
  const camLift = lift / ratio;

  const data = useMemo(() => {
    return valves.map((v) => {
      const tip = v.seat.clone().addScaledVector(v.dir, v.stemLen);
      const bankDeg = dims.bankAxisDeg[v.cyl.bank] ?? 0;
      const bp = perpVec(bankDeg);
      // pushrod cup sits towards the valley, slightly above the valve tip
      const inward = -Math.sign(bankDeg) || 1;
      const cup = tip.clone().addScaledVector(bp, inward * bore * 0.42).addScaledVector(axisVec(bankDeg), -bore * 0.05);
      const lobePt = v3(v.seat.x, camY, 0);
      const pushDir = cup.clone().sub(lobePt).normalize();
      const lifterBase = lobePt.clone().addScaledVector(pushDir, camBaseR);
      const pivot = tip.clone().lerp(cup, ratio / (1 + ratio));
      const phiT = Math.atan2(pushDir.z, pushDir.y) / DEG;
      return { v, tip, cup, lifterBase, pushDir, pivot, gammaDeg: phiT - v.peakCrankDeg / 2 };
    });
  }, [valves, dims, bore, camY, camBaseR]);

  const valveRefs = useRef<(THREE.Group | null)[]>([]);
  const springRefs = useRef<(THREE.Mesh | null)[]>([]);
  const pushRefs = useRef<(THREE.Object3D | null)[]>([]);
  const lifterRefs = useRef<(THREE.Object3D | null)[]>([]);
  const rockerRefs = useRef<(THREE.Object3D | null)[]>([]);
  const camRef = useRef<THREE.Group>(null);

  const stemGeo = geo('valve-stem', () => new THREE.CylinderGeometry(0.0034, 0.0034, 1, 8).translate(0, 0.5, 0));
  const headIn = geo('valve-head-in', () => valveHead(dims.valveHeadDia.intake, seg(24)));
  const headEx = geo('valve-head-ex', () => valveHead(dims.valveHeadDia.exhaust, seg(24)));
  const springGeo = geo('valve-spring', () => springGeometry(bore * 0.11, 0.0019, 6, seg(10)));
  const pushGeo = geo('pushrod', () => new THREE.CylinderGeometry(0.0039, 0.0039, 1, 8));
  const lifterGeo = geo('lifter', () => new THREE.CylinderGeometry(bore * 0.09, bore * 0.09, bore * 0.4, 14));
  const rockerGeo = geo('rocker', () => new THREE.BoxGeometry(0.011, 1, 0.016));
  const lobeGeo = geo('ohv-lobe', () => extrudeAlongX(camLobeShape(camBaseR, camLift, seg(40)), bore * 0.13, 0, 2));
  const shaftGeo = geo('ohv-cam', () => new THREE.CylinderGeometry(camBaseR * 0.8, camBaseR * 0.8, 1, seg(18)).rotateZ(Math.PI / 2));

  const inMat = lib.get('polishedSteel', 'valvetrain', '#c8b98e', 'valve-in');
  const exMat = lib.get('polishedSteel', 'valvetrain', '#8f8a88', 'valve-ex');
  const springMat = lib.get('forgedSteel', 'valvetrain', '#3f6d9c', 'spring');
  const rodMat = lib.get('chrome', 'valvetrain');
  const rockerMat = lib.get('machinedAluminium', 'valvetrain', '#b8bcc2', 'rocker');
  const camMat = lib.get('polishedSteel', 'valvetrain', '#b9bdc2', 'cam');

  const a = useMemo(() => v3(), []);
  const b = useMemo(() => v3(), []);

  useFrame(() => {
    const sim = simRef.current;
    if (!sim) return;
    const crank = sim.crankDeg;
    if (camRef.current) camRef.current.rotation.x = (crank / 2) * DEG;
    data.forEach((d, i) => {
      const cyc = cylinderCycleDeg(crank, d.v.cyl);
      const L = (d.v.intake ? intakeValveLift(cyc) : exhaustValveLift(cyc)) * lift;
      const g = valveRefs.current[i];
      if (g) g.position.y = -L;
      const sp = springRefs.current[i];
      if (sp) sp.scale.y = d.v.stemLen * 0.42 - L;
      const up = L / ratio;
      // lifter + pushrod rise along the pushrod axis
      a.copy(d.lifterBase).addScaledVector(d.pushDir, up);
      b.copy(d.cup).addScaledVector(d.pushDir, up);
      const pr = pushRefs.current[i];
      if (pr) placeBetween(pr, a, b);
      const lf = lifterRefs.current[i];
      if (lf) {
        lf.position.copy(a).addScaledVector(d.pushDir, bore * 0.2);
      }
      // rocker spans pushrod cup → valve tip
      const rk = rockerRefs.current[i];
      if (rk) {
        a.copy(d.tip).addScaledVector(d.v.dir, -L + 0.004);
        placeBetween(rk, b, a);
      }
    });
  });

  const span = layout.crankSpanM + bore * 1.1;
  return (
    <Part kind="valve" category="valvetrain" explode={[0, 0.22, 0]}>
      {data.map((d, i) => {
        const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.v.dir);
        const e = new THREE.Euler().setFromQuaternion(q);
        const lq = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.pushDir);
        const le = new THREE.Euler().setFromQuaternion(lq);
        return (
          <group key={i}>
            <group position={d.v.seat.toArray()} rotation={e}>
              <group ref={(g) => void (valveRefs.current[i] = g)}>
                <mesh geometry={d.v.intake ? headIn : headEx} material={d.v.intake ? inMat : exMat} />
                <mesh geometry={stemGeo} material={d.v.intake ? inMat : exMat} scale={[1, d.v.stemLen, 1]} />
              </group>
              <mesh
                ref={(m) => void (springRefs.current[i] = m)}
                geometry={springGeo}
                material={springMat}
                position={[0, d.v.stemLen * 0.5, 0]}
                scale={[1, d.v.stemLen * 0.42, 1]}
              />
            </group>
            <mesh ref={(m) => void (pushRefs.current[i] = m)} geometry={pushGeo} material={rodMat} />
            <mesh ref={(m) => void (lifterRefs.current[i] = m)} geometry={lifterGeo} material={rockerMat} rotation={le} />
            <mesh ref={(m) => void (rockerRefs.current[i] = m)} geometry={rockerGeo} material={rockerMat} />
          </group>
        );
      })}
      <group ref={camRef} position={[0, camY, 0]}>
        <mesh geometry={shaftGeo} material={camMat} scale={[span, 1, 1]} />
        {data.map((d, i) => (
          <mesh key={i} geometry={lobeGeo} material={camMat} position={[d.v.seat.x, 0, 0]} rotation={[d.gammaDeg * DEG, 0, 0]} />
        ))}
      </group>
    </Part>
  );
}

// --------------------------------------------------------------------------
// spark plugs + injectors

function PlugsAndInjectors({ config }: { config: ValvetrainConfig }) {
  const { layout, dims, lib, geo, def } = useEngine();
  const bore = dims.bore;
  const plugGeo = geo('plug', () => new THREE.CylinderGeometry(0.006, 0.006, 1, 10).translate(0, 0.5, 0));
  const insulator = geo('plug-ins', () => new THREE.CylinderGeometry(0.0055, 0.008, 0.028, 12));
  const hexGeo = geo('plug-hex', () => new THREE.CylinderGeometry(0.0095, 0.0095, 0.009, 6));
  const injGeo = geo('injector', () => new THREE.CylinderGeometry(0.0045, 0.0035, 0.05, 10).translate(0, 0.025, 0));
  const ceramic = lib.get('ceramic', 'valvetrain');
  const steel = lib.get('polishedSteel', 'valvetrain');
  const injMat = lib.get('plastic', 'valvetrain', '#2a4f86', 'injector');
  const coilMat = lib.get('plastic', 'valvetrain', '#16171a', 'coil');
  const plugLen = dims.headHeight * 0.55;
  const direct = config.injection === 'direct';
  const intakeSign = (c: CylinderGeometry) => {
    if (def.engine.layout === 'inline') return config.inlineIntakeSide ?? 1;
    const inside = -Math.sign(dims.bankAxisDeg[c.bank] ?? 0) || 1;
    return (config.intakeInside ?? true) ? inside : -inside;
  };

  return (
    <Part kind={direct ? 'sparkPlug' : 'sparkPlug'} category="valvetrain" explode={[0, 0.3, 0]}>
      {layout.cylinders.map((c) => {
        const s = intakeSign(c);
        const injLat = direct ? s * bore * 0.44 : s * bore * 0.66;
        const injAlong = direct ? dims.deck + 0.014 : dims.deck + dims.headHeight * 0.42;
        const injTilt = direct ? -s * 1.0 : -s * 0.55;
        return (
          <group key={c.number} position={[c.axialM, 0, 0]} rotation={[c.axisDeg * DEG, 0, 0]}>
            <group position={[0, dims.deck + 0.002, 0]}>
              <mesh geometry={plugGeo} material={steel} scale={[1, plugLen * 0.5, 1]} />
              <mesh geometry={hexGeo} material={steel} position={[0, plugLen * 0.5, 0]} />
              <mesh geometry={insulator} material={ceramic} position={[0, plugLen * 0.5 + 0.018, 0]} />
              {config.coilOnPlug && (
                <mesh material={coilMat} position={[0, plugLen + 0.03, 0]}>
                  <boxGeometry args={[0.03, 0.05, 0.034]} />
                </mesh>
              )}
            </group>
            <Part kind="injector" category="valvetrain">
              <mesh geometry={injGeo} material={injMat} position={[0, injAlong, injLat]} rotation={[injTilt, 0, 0]} />
            </Part>
          </group>
        );
      })}
    </Part>
  );
}
