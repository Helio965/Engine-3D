import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useEngine } from '../EngineContext';
import { Part } from '../Part';
import { simRef } from '../../state/simulationStore';
import { DEG } from '../../simulation/kinematics';
import { beltPath, pulleyGeometry } from '../geometry';
import type { Finish } from '../materials';

/**
 * Front-end accessory drive: crank damper/pulley, water pump, alternator,
 * A/C compressor, idlers and a serpentine belt. Every pulley turns at
 * crank speed × (crank pulley radius / its radius) — same master clock.
 */

export interface PulleySpec {
  kind: 'crankPulley' | 'waterPump' | 'alternator' | 'acCompressor' | 'idler' | 'tensioner' | 'powerSteering' | 'superchargerPulley';
  y: number;
  z: number;
  radius: number;
  /** Draw the accessory body behind the pulley. */
  body?: boolean;
}

export function defaultPulleys(dims: ReturnType<typeof useEngine>['dims'], layout: 'inline' | 'v' | 'w'): PulleySpec[] {
  const top = dims.deck * 0.72;
  const wide = layout === 'inline' ? 0.13 : Math.max(0.17, dims.bankWidth * 0.95);
  return [
    { kind: 'crankPulley', y: 0, z: 0, radius: 0.085 },
    { kind: 'waterPump', y: top * 0.62, z: 0, radius: 0.062, body: true },
    { kind: 'alternator', y: top * 0.95, z: wide, radius: 0.04, body: true },
    { kind: 'acCompressor', y: -0.02, z: -wide * 0.9, radius: 0.058, body: true },
    { kind: 'tensioner', y: top * 0.55, z: -wide * 0.55, radius: 0.034 },
    { kind: 'idler', y: top * 0.35, z: wide * 0.55, radius: 0.032 },
  ];
}

export function FrontDrive({
  pulleys,
  x,
  pulleyFinish = 'machinedAluminium',
  bodyFinish = 'castAluminium',
}: {
  pulleys?: PulleySpec[];
  x?: number;
  pulleyFinish?: Finish;
  bodyFinish?: Finish;
}) {
  const { dims, lib, geo, seg, def } = useEngine();
  const list = useMemo(() => pulleys ?? defaultPulleys(dims, def.engine.layout), [pulleys, dims, def]);
  const px = x ?? dims.frontX + 0.06;
  const refs = useRef<(THREE.Group | null)[]>([]);
  const crankR = list.find((p) => p.kind === 'crankPulley')?.radius ?? 0.085;
  const pulleyMat = lib.get(pulleyFinish, 'accessory');
  const bodyMat = lib.get(bodyFinish, 'accessory', undefined, 'acc-body');
  const darkMat = lib.get('satin', 'accessory', '#232428', 'acc-dark');
  const beltMat = lib.get('rubber', 'accessory');
  const belt = useMemo(() => {
    const pts = beltPath(
      list.map((p) => [p.z, p.y]),
      list.map((p) => p.radius + 0.003),
    );
    const curve = new THREE.CatmullRomCurve3(pts, true, 'centripetal');
    const g = new THREE.TubeGeometry(curve, 160, 0.004, 6, true);
    g.scale(2.6, 1, 1);
    return g;
  }, [list]);

  useFrame(() => {
    const sim = simRef.current;
    if (!sim) return;
    const crank = sim.crankDeg * DEG;
    list.forEach((p, i) => {
      const g = refs.current[i];
      if (g) g.rotation.x = (crank * crankR) / p.radius;
    });
  });

  return (
    <Part kind="beltDrive" category="accessory" position={[px, 0, 0]} explode={[0.25, 0, 0]}>
      <mesh geometry={belt} material={beltMat} />
      {list.map((p, i) => {
        const pg = geo(`pulley-${p.radius.toFixed(3)}`, () => pulleyGeometry(p.radius, 0.024, p.kind === 'idler' || p.kind === 'tensioner' ? 0 : 6, seg(40)).rotateZ(-Math.PI / 2));
        return (
          <group key={i} position={[0, p.y, p.z]}>
            <Part kind={p.kind} category="accessory">
              <group ref={(g) => void (refs.current[i] = g)}>
                <mesh geometry={pg} material={pulleyMat} castShadow />
                {p.kind === 'crankPulley' && (
                  <mesh material={darkMat} position={[-0.02, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[p.radius * 1.05, p.radius * 1.05, 0.03, seg(36)]} />
                  </mesh>
                )}
                {[0, 1, 2, 3, 4].map((k) => (
                  <mesh key={k} material={darkMat} position={[0.014, Math.cos((k / 5) * Math.PI * 2) * p.radius * 0.55, Math.sin((k / 5) * Math.PI * 2) * p.radius * 0.55]} rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[p.radius * 0.12, p.radius * 0.12, 0.004, 10]} />
                  </mesh>
                ))}
              </group>
              {p.body && p.kind === 'alternator' && (
                <group position={[-0.07, 0, 0]}>
                  <mesh material={bodyMat} rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[p.radius * 1.9, p.radius * 1.9, 0.1, seg(28)]} />
                  </mesh>
                  {new Array(10).fill(0).map((_, k) => (
                    <mesh key={k} material={darkMat} position={[0.02, Math.cos((k / 10) * Math.PI * 2) * p.radius * 1.9, Math.sin((k / 10) * Math.PI * 2) * p.radius * 1.9]}>
                      <boxGeometry args={[0.06, 0.006, 0.006]} />
                    </mesh>
                  ))}
                </group>
              )}
              {p.body && p.kind === 'acCompressor' && (
                <mesh material={bodyMat} position={[-0.08, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[p.radius * 1.15, p.radius * 1.15, 0.13, seg(28)]} />
                </mesh>
              )}
              {p.body && p.kind === 'waterPump' && (
                <mesh material={bodyMat} position={[-0.04, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[p.radius * 0.8, p.radius * 1.1, 0.05, seg(28)]} />
                </mesh>
              )}
            </Part>
          </group>
        );
      })}
    </Part>
  );
}

export function OilFilter({ position, rotation, color = '#1d4e89' }: { position: [number, number, number]; rotation?: [number, number, number]; color?: string }) {
  const { lib, seg } = useEngine();
  return (
    <Part kind="oilFilter" category="accessory" position={position} rotation={rotation} explode={[0, 0, 0.15]}>
      <mesh material={lib.get('gloss', 'accessory', color, 'filter')}>
        <cylinderGeometry args={[0.042, 0.042, 0.1, seg(28)]} />
      </mesh>
      <mesh material={lib.get('satin', 'accessory')} position={[0, 0.052, 0]}>
        <cylinderGeometry args={[0.038, 0.042, 0.008, seg(28)]} />
      </mesh>
    </Part>
  );
}
