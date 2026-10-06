import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useEngine } from './EngineContext';
import { useApp, type FlowKind } from '../state/appStore';
import { simRef } from '../state/simulationStore';
import type { ModelMeta } from './models/types';
import { fuelLinePath } from './FuelSystem3D';

/**
 * Educational flow visualisation: small glowing particles travel along the
 * air, fuel, exhaust and coolant paths. Their speed follows the simulated
 * flow (air/exhaust ∝ rpm × manifold pressure, fuel ∝ fuel flow, coolant ∝
 * water-pump speed). Kept sparse on purpose so the engine stays readable.
 */

const COLORS: Record<FlowKind, string> = {
  air: '#5cc8ff',
  fuel: '#ffc23d',
  exhaust: '#ff6a3d',
  coolant: '#3ddc97',
};

export function Flows({ meta }: { meta: ModelMeta }) {
  const ctx = useEngine();
  const flows = useApp((s) => s.flows);
  const paths = useMemo(() => {
    const p = meta.flows(ctx);
    return { ...p, fuel: [fuelLinePath(ctx, meta), ...p.fuel] };
  }, [ctx, meta]);
  return (
    <group>
      {(Object.keys(COLORS) as FlowKind[]).map((k) =>
        flows[k] && paths[k].length ? <FlowParticles key={k} kind={k} paths={paths[k]} /> : null,
      )}
    </group>
  );
}

function FlowParticles({ kind, paths }: { kind: FlowKind; paths: [number, number, number][][] }) {
  const { quality } = useEngine();
  const per = quality === 'low' ? 6 : quality === 'medium' ? 9 : 14;
  const curves = useMemo(
    () => paths.filter((p) => p.length >= 2).map((p) => new THREE.CatmullRomCurve3(p.map((v) => new THREE.Vector3(...v)), false, 'centripetal')),
    [paths],
  );
  const lengths = useMemo(() => curves.map((c) => c.getLength()), [curves]);
  const count = curves.length * per;
  const mesh = useRef<THREE.InstancedMesh>(null);
  const phase = useRef(0);
  const geo = useMemo(() => new THREE.SphereGeometry(kind === 'exhaust' ? 0.0065 : 0.005, 8, 6), [kind]);
  const mat = useMemo(
    () => new THREE.MeshBasicMaterial({ color: COLORS[kind], transparent: true, opacity: 0.9, depthWrite: false, toneMapped: false }),
    [kind],
  );
  useEffect(
    () => () => {
      geo.dispose();
      mat.dispose();
    },
    [geo, mat],
  );
  const m4 = useMemo(() => new THREE.Matrix4(), []);
  const p = useMemo(() => new THREE.Vector3(), []);
  const sc = useMemo(() => new THREE.Vector3(), []);
  const q = useMemo(() => new THREE.Quaternion(), []);

  useFrame((_, delta) => {
    const sim = simRef.current;
    const im = mesh.current;
    if (!sim || !im) return;
    const ts = useApp.getState().timeScale;
    let speed = 0; // metres per second along the path
    const rpmF = sim.rpm / 1000;
    if (kind === 'air') speed = rpmF * 0.35 * (sim.manifold + sim.boost);
    else if (kind === 'exhaust') speed = sim.combusting ? rpmF * 0.45 * (sim.manifold + sim.boost) : rpmF * 0.1;
    else if (kind === 'fuel') speed = Math.min(1.2, sim.fuelFlowLps * 60 + (sim.running ? 0.03 : 0));
    else speed = rpmF * 0.12 + (sim.running ? 0.02 : 0);
    phase.current += Math.min(delta, 0.05) * ts * speed;
    let i = 0;
    curves.forEach((c, ci) => {
      const len = lengths[ci] || 1;
      for (let k = 0; k < per; k++) {
        const u = (((phase.current / len + k / per) % 1) + 1) % 1;
        c.getPointAt(u, p);
        const fade = Math.sin(u * Math.PI);
        sc.setScalar(0.6 + 0.6 * fade);
        m4.compose(p, q, sc);
        im.setMatrixAt(i++, m4);
      }
    });
    im.instanceMatrix.needsUpdate = true;
    im.visible = speed > 0.0005;
  });

  return <instancedMesh ref={mesh} args={[geo, mat, count]} frustumCulled={false} renderOrder={5} />;
}
