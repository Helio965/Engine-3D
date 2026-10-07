import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useEngine, type EngineModelContext } from './EngineContext';
import { Part } from './Part';
import { simRef } from '../state/simulationStore';
import type { ModelMeta } from './models/types';
import type { Vec3 } from './parts/Plumbing';
import { CONNECT_TIME_S, DISCONNECT_TIME_S } from '../simulation/fuel';

/**
 * Simplified fuel system shown beside the engine: transparent tank with a
 * live fuel level, in-tank pump, filter, feed line to the engine's fuel rail,
 * and the refuelling dispenser (hose + nozzle) animation.
 */

export function tankLayout(ctx: EngineModelContext) {
  const cap = ctx.def.fuel.capacityL;
  const k = Math.cbrt(cap / 80);
  const size: Vec3 = [0.62 * k, 0.24 * k, 0.42 * k];
  const lift = -ctx.dims.bottomY + 0.012;
  const engineHalfWidth = Math.max(0.32, ctx.dims.bankWidth * (ctx.def.engine.layout === 'inline' ? 0.9 : 1.4));
  const center: Vec3 = [-ctx.dims.blockLength * 0.1, -lift + size[1] / 2 + 0.05, -(engineHalfWidth + 0.38 + size[2] / 2)];
  const filler: Vec3 = [center[0] + size[0] * 0.38, center[1] + size[1] / 2 + 0.06, center[2] - size[2] * 0.22];
  const pump: Vec3 = [center[0] - size[0] * 0.25, center[1] - size[1] * 0.1, center[2]];
  return { size, center, filler, pump, lift };
}

export function fuelLinePath(ctx: EngineModelContext, meta: ModelMeta): Vec3[] {
  const t = tankLayout(ctx);
  const inlet = meta.fuelInlet(ctx);
  const start: Vec3 = [t.pump[0], t.center[1] + t.size[1] / 2 + 0.01, t.pump[2]];
  const floorY = -t.lift + 0.03;
  return [
    start,
    [start[0], start[1] + 0.06, start[2]],
    [start[0] + 0.05, floorY + 0.02, start[2] + t.size[2] / 2 + 0.08],
    [inlet[0] - 0.05, floorY + 0.02, (start[2] + t.size[2] / 2 + inlet[2]) / 2],
    [inlet[0], inlet[1] - 0.08, inlet[2]],
    inlet,
  ];
}

export function FuelSystem3D({ meta }: { meta: ModelMeta }) {
  const ctx = useEngine();
  const { lib, seg } = ctx;
  const layout = useMemo(() => tankLayout(ctx), [ctx]);
  const line = useMemo(() => fuelLinePath(ctx, meta), [ctx, meta]);
  const fuelMesh = useRef<THREE.Mesh>(null);
  const surface = useRef<THREE.Mesh>(null);
  const tankShell = lib.get('glass', 'fuel', '#c9d6df', 'tank');
  const fuelMat = lib.get('fuel', 'fuel');
  const pumpMat = lib.get('satin', 'fuel', '#2a2c30', 'pump');
  const lineMat = lib.get('polishedSteel', 'fuel', undefined, 'line');
  const filterMat = lib.get('gloss', 'fuel', '#2d5ca8', 'ffilter');
  const lineGeo = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(line.map((p) => new THREE.Vector3(...p)), false, 'centripetal');
    return new THREE.TubeGeometry(curve, 96, 0.0055, 8, false);
  }, [line]);
  useEffect(() => () => lineGeo.dispose(), [lineGeo]);
  const [w, h, d] = layout.size;

  useFrame(() => {
    const sim = simRef.current;
    if (!sim || !fuelMesh.current) return;
    const frac = Math.max(0.0001, sim.fuel.levelL / sim.fuel.capacityL);
    const fh = (h - 0.012) * frac;
    fuelMesh.current.scale.set(1, fh, 1);
    fuelMesh.current.position.y = -h / 2 + 0.006 + fh / 2;
    if (surface.current) {
      surface.current.position.y = -h / 2 + 0.006 + fh;
      surface.current.visible = frac > 0.001;
    }
  });

  return (
    <group>
      <Part kind="fuelTank" category="fuel" position={layout.center}>
        <mesh material={tankShell} renderOrder={4}>
          <boxGeometry args={[w, h, d]} />
        </mesh>
        <mesh ref={fuelMesh} material={fuelMat} renderOrder={3}>
          <boxGeometry args={[w - 0.012, 1, d - 0.012]} />
        </mesh>
        <mesh ref={surface} material={fuelMat} rotation={[-Math.PI / 2, 0, 0]} renderOrder={3}>
          <planeGeometry args={[w - 0.012, d - 0.012]} />
        </mesh>
        {/* filler neck */}
        <mesh material={lineMat} position={[w * 0.38, h / 2 + 0.03, -d * 0.22]}>
          <cylinderGeometry args={[0.022, 0.026, 0.06, seg(18)]} />
        </mesh>
        <mesh material={lineMat} position={[w * 0.38, h / 2 + 0.062, -d * 0.22]}>
          <torusGeometry args={[0.022, 0.004, 8, seg(18)]} />
        </mesh>
      </Part>
      <Part kind="fuelPump" category="fuel" position={layout.pump}>
        <mesh material={pumpMat}>
          <cylinderGeometry args={[0.03, 0.03, h * 0.75, seg(20)]} />
        </mesh>
        <mesh material={lineMat} position={[0, h * 0.45, 0]}>
          <cylinderGeometry args={[0.045, 0.045, 0.012, seg(24)]} />
        </mesh>
      </Part>
      <Part kind="fuelLine" category="fuel">
        <mesh geometry={lineGeo} material={lineMat} />
        <mesh material={filterMat} position={line[2]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.022, 0.022, 0.09, seg(18)]} />
        </mesh>
      </Part>
      <Dispenser filler={layout.filler} floorY={layout.center[1] - h / 2 - 0.05} />
    </group>
  );
}

/** Fuel dispenser with hose and nozzle: drives in during refuelling. */
function Dispenser({ filler, floorY }: { filler: Vec3; floorY: number }) {
  const { lib, seg } = useEngine();
  const group = useRef<THREE.Group>(null);
  const nozzle = useRef<THREE.Group>(null);
  const hoseRef = useRef<THREE.Mesh>(null);
  const appear = useRef(0);
  const plug = useRef(0);
  const bodyMat = lib.get('gloss', 'fuel', '#d8dadc', 'dispenser');
  const accent = lib.get('gloss', 'fuel', '#ff5a1f', 'dispenser-accent');
  const dark = lib.get('satin', 'fuel', '#1b1c1f', 'dispenser-dark');
  const screen = lib.get('plastic', 'fuel', '#0f2a1e', 'dispenser-screen');
  const flowMat = useMemo(
    () => new THREE.MeshBasicMaterial({ color: '#f6b73c', transparent: true, opacity: 0.85, toneMapped: false }),
    [],
  );
  useEffect(() => () => flowMat.dispose(), [flowMat]);
  const dropRefs = useRef<(THREE.Mesh | null)[]>([]);
  const base = useMemo(() => new THREE.Vector3(filler[0] + 0.55, floorY, filler[2] - 0.1), [filler, floorY]);
  const holster = useMemo(() => new THREE.Vector3(base.x - 0.12, floorY + 0.95, base.z), [base, floorY]);
  const target = useMemo(() => new THREE.Vector3(filler[0], filler[1] + 0.07, filler[2]), [filler]);
  const hoseGeo = useRef<THREE.TubeGeometry | null>(null);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const curve = useMemo(() => new THREE.CatmullRomCurve3([new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]), []);
  useEffect(
    () => () => {
      hoseGeo.current?.dispose();
    },
    [],
  );

  useFrame((_, delta) => {
    const sim = simRef.current;
    const g = group.current;
    if (!sim || !g) return;
    const phase = sim.fuel.refuel;
    const want = phase === 'idle' ? 0 : 1;
    appear.current += (want - appear.current) * Math.min(1, delta * 5);
    g.visible = appear.current > 0.01;
    g.scale.setScalar(Math.max(0.001, appear.current));
    if (!g.visible) return;
    // nozzle travel
    let p = plug.current;
    if (phase === 'connecting') p = 1 - Math.max(0, sim.fuel.refuelTimer) / CONNECT_TIME_S;
    else if (phase === 'fueling') p = 1;
    else if (phase === 'disconnecting') p = Math.max(0, sim.fuel.refuelTimer) / DISCONNECT_TIME_S;
    else p = 0;
    plug.current = p;
    const e = p * p * (3 - 2 * p);
    const pos = tmp.copy(holster).lerp(target, e);
    pos.y += Math.sin(e * Math.PI) * 0.18;
    if (nozzle.current) {
      nozzle.current.position.copy(pos).sub(base);
      nozzle.current.rotation.z = -e * 1.0 + 0.2;
    }
    // hose from dispenser to nozzle
    const pts = curve.points;
    pts[0].set(0, 0.85, 0.05);
    pts[1].set(-0.05, 0.4, 0.1);
    pts[2].copy(pos).sub(base).add(new THREE.Vector3(0.12, -0.25, 0.06));
    pts[3].copy(pos).sub(base).add(new THREE.Vector3(0.04, 0.0, 0));
    hoseGeo.current?.dispose();
    hoseGeo.current = new THREE.TubeGeometry(curve, 40, 0.012, 8, false);
    if (hoseRef.current) hoseRef.current.geometry = hoseGeo.current;
    // flowing fuel droplets inside the hose
    const flowing = phase === 'fueling';
    dropRefs.current.forEach((m, i) => {
      if (!m) return;
      m.visible = flowing;
      if (!flowing) return;
      const u = (sim.time * 0.9 + i / dropRefs.current.length) % 1;
      curve.getPoint(u, m.position);
    });
  });

  return (
    <group ref={group} position={base.toArray()} visible={false}>
      <Part kind="fuelDispenser" category="fuel">
        <mesh material={bodyMat} position={[0, 0.6, 0]} castShadow>
          <boxGeometry args={[0.22, 1.2, 0.3]} />
        </mesh>
        <mesh material={accent} position={[0, 1.15, 0]}>
          <boxGeometry args={[0.23, 0.1, 0.31]} />
        </mesh>
        <mesh material={screen} position={[-0.112, 0.9, 0]}>
          <boxGeometry args={[0.004, 0.16, 0.2]} />
        </mesh>
        <mesh material={dark} position={[0, 0.02, 0]}>
          <boxGeometry args={[0.3, 0.04, 0.38]} />
        </mesh>
      </Part>
      <mesh ref={hoseRef} material={dark} />
      <group ref={nozzle}>
        <mesh material={dark} rotation={[0, 0, 0.3]}>
          <boxGeometry args={[0.03, 0.12, 0.04]} />
        </mesh>
        <mesh material={accent} position={[-0.03, -0.06, 0]} rotation={[0, 0, 1.2]}>
          <cylinderGeometry args={[0.009, 0.009, 0.11, seg(10)]} />
        </mesh>
      </group>
      {new Array(10).fill(0).map((_, i) => (
        <mesh key={i} ref={(m) => void (dropRefs.current[i] = m)} material={flowMat} visible={false}>
          <sphereGeometry args={[0.006, 8, 6]} />
        </mesh>
      ))}
    </group>
  );
}
