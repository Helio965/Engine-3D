import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useEngine } from '../EngineContext';
import { Part } from '../Part';
import { simRef } from '../../state/simulationStore';
import { useApp } from '../../state/appStore';
import { bladedWheelGeometry, extrudeAlongX } from '../geometry';
import type { Vec3 } from './Plumbing';

/**
 * Turbocharger and twin-screw supercharger.
 *
 * Turbine shafts spin at 100–200 thousand rpm; drawn literally that would only
 * strobe at 60 fps. The wheel therefore turns at a capped visual rate and a
 * translucent motion-blur disc fades in with speed. The real shaft speed is
 * shown in the telemetry panel.
 */

const MAX_VISUAL_RAD_PER_FRAME = 0.42;

export function Turbo({
  index,
  position,
  rotation,
  size = 1,
  label,
  mirror = false,
}: {
  /** Index into the simulation's turbo array (shaft speed). */
  index: number;
  position: Vec3;
  /** Euler rotation; local +Y = shaft axis, compressor at +Y. */
  rotation?: Vec3;
  size?: number;
  label?: string;
  mirror?: boolean;
}) {
  const { lib, geo, seg } = useEngine();
  const wheel = useRef<THREE.Group>(null);
  const turbine = useRef<THREE.Group>(null);
  const blur = useRef<THREE.Mesh>(null);
  const R = 0.055 * size;

  const housing = lib.get('castAluminium', 'turbo', '#b9bdc1', 'comp');
  const hot = lib.get('heatTint', 'turbo', '#8e8273', 'turb');
  const core = lib.get('satin', 'turbo', '#3a3d42', 'chra');
  const wheelMat = lib.get('machinedAluminium', 'turbo', '#d7dade', 'wheel');
  const blurMat = useMemo(
    () => new THREE.MeshBasicMaterial({ color: '#d7dade', transparent: true, opacity: 0, depthWrite: false }),
    [],
  );
  useEffect(() => () => blurMat.dispose(), [blurMat]);

  const volute = geo(`volute-${size}`, () => new THREE.TorusGeometry(R * 1.05, R * 0.42, seg(14), seg(36), Math.PI * 1.75));
  const shell = geo(`shell-${size}`, () => new THREE.CylinderGeometry(R * 1.08, R * 1.08, R * 0.75, seg(32)));
  const inlet = geo(`inlet-${size}`, () => new THREE.CylinderGeometry(R * 0.62, R * 0.55, R * 0.7, seg(28), 1, true));
  const lip = geo(`lip-${size}`, () => new THREE.TorusGeometry(R * 0.62, R * 0.07, 8, seg(28)));
  const cWheel = geo(`cwheel-${size}`, () => bladedWheelGeometry(R * 0.54, R * 0.42, 12, 0.9));
  const tWheel = geo(`twheel-${size}`, () => bladedWheelGeometry(R * 0.5, R * 0.36, 10, -0.7));
  const blurGeo = geo(`blur-${size}`, () => new THREE.CircleGeometry(R * 0.55, seg(28)).rotateX(-Math.PI / 2));
  const outlet = geo(`outlet-${size}`, () => new THREE.CylinderGeometry(R * 0.4, R * 0.4, R * 1.1, seg(18)));

  useFrame((_, delta) => {
    const sim = simRef.current;
    if (!sim) return;
    const ts = useApp.getState().timeScale;
    const rpm = sim.turboShaft[index] ?? 0;
    const radPerFrame = (rpm / 60) * Math.PI * 2 * delta * ts;
    const visual = Math.min(radPerFrame, MAX_VISUAL_RAD_PER_FRAME);
    if (wheel.current) wheel.current.rotation.y += visual;
    if (turbine.current) turbine.current.rotation.y += visual;
    blurMat.opacity = Math.min(0.55, Math.max(0, (radPerFrame - 0.3) / 2));
    if (blur.current) blur.current.visible = blurMat.opacity > 0.01;
  });

  return (
    <Part kind="turbo" label={label} category="turbo" position={position} rotation={rotation} explode={[0, 0, mirror ? -0.22 : 0.22]}>
      <group scale={[mirror ? -1 : 1, 1, 1]}>
        {/* compressor side (+Y) */}
        <group position={[0, R * 0.55, 0]}>
          <mesh geometry={shell} material={housing} castShadow />
          <mesh geometry={volute} material={housing} rotation={[Math.PI / 2, 0, 0]} />
          <mesh geometry={inlet} material={housing} position={[0, R * 0.7, 0]} />
          <mesh geometry={lip} material={housing} position={[0, R * 1.05, 0]} rotation={[Math.PI / 2, 0, 0]} />
          <group ref={wheel} position={[0, R * 0.5, 0]}>
            <mesh geometry={cWheel} material={wheelMat} />
          </group>
          <mesh ref={blur} geometry={blurGeo} material={blurMat} position={[0, R * 0.74, 0]} />
          <mesh geometry={outlet} material={housing} position={[R * 1.05, 0, R * 0.45]} rotation={[0, 0, Math.PI / 2]} />
        </group>
        {/* centre housing */}
        <mesh material={core}>
          <cylinderGeometry args={[R * 0.42, R * 0.42, R * 0.5, seg(20)]} />
        </mesh>
        {/* turbine side (−Y) */}
        <group position={[0, -R * 0.55, 0]}>
          <mesh geometry={shell} material={hot} scale={[0.95, 1, 0.95]} castShadow />
          <mesh geometry={volute} material={hot} rotation={[Math.PI / 2, 0, Math.PI]} scale={0.92} />
          <group ref={turbine} position={[0, -R * 0.35, 0]}>
            <mesh geometry={tWheel} material={hot} />
          </group>
          <mesh geometry={outlet} material={hot} position={[0, -R * 0.75, 0]} scale={[1.25, 0.6, 1.25]} />
        </group>
        {/* wastegate actuator */}
        <mesh material={core} position={[-R * 1.25, R * 0.2, R * 0.6]}>
          <cylinderGeometry args={[R * 0.32, R * 0.32, R * 0.32, seg(18)]} />
        </mesh>
      </group>
    </Part>
  );
}

// --------------------------------------------------------------------------
// twin-screw supercharger

function rotorGeometry(radius: number, length: number, lobes: number, twistTurns: number, segments: number) {
  const s = new THREE.Shape();
  const n = segments * 4;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const r = radius * (0.72 + 0.28 * Math.pow(Math.abs(Math.cos((a * lobes) / 2)), 0.6));
    const x = Math.sin(a) * r;
    const y = Math.cos(a) * r;
    if (i === 0) s.moveTo(x, y);
    else s.lineTo(x, y);
  }
  const g = new THREE.ExtrudeGeometry(s, { depth: length, bevelEnabled: false, steps: 24, curveSegments: 4 });
  g.translate(0, 0, -length / 2);
  // helical twist along the length
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const z = pos.getZ(i);
    const t = (z / length + 0.5) * twistTurns * Math.PI * 2;
    const x = pos.getX(i);
    const y = pos.getY(i);
    pos.setXY(i, x * Math.cos(t) - y * Math.sin(t), x * Math.sin(t) + y * Math.cos(t));
  }
  g.rotateY(-Math.PI / 2);
  g.computeVertexNormals();
  return g;
}

export function TwinScrewSupercharger({
  position,
  length,
  width,
  height,
  lidLabel,
  lidColor = '#121315',
  bodyColor = '#1a1b1e',
  pulleyX,
}: {
  position: Vec3;
  length: number;
  width: number;
  height: number;
  lidLabel?: string;
  lidColor?: string;
  bodyColor?: string;
  pulleyX?: number;
}) {
  const { lib, geo, seg } = useEngine();
  const male = useRef<THREE.Group>(null);
  const female = useRef<THREE.Group>(null);
  const pulley = useRef<THREE.Group>(null);
  const angle = useRef(0);
  const housingMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: bodyColor,
        metalness: 0.35,
        roughness: 0.48,
        transparent: true,
        opacity: 1,
        clearcoat: 0.2,
      }),
    [bodyColor],
  );
  useEffect(() => () => housingMat.dispose(), [housingMat]);
  const lid = lib.get('satin', 'supercharger', lidColor, 'sc-lid');
  const rotorMat = lib.get('polishedSteel', 'supercharger', '#b8bcc0', 'rotor');
  const pulleyMat = lib.get('machinedAluminium', 'supercharger', '#b0b4b9', 'sc-pulley');
  const rotorR = Math.min(width, height) * 0.2;
  const maleG = geo('sc-male', () => rotorGeometry(rotorR, length * 0.86, 4, 0.55, seg(16)));
  const femaleG = geo('sc-female', () => rotorGeometry(rotorR * 0.93, length * 0.86, 6, -0.37, seg(16)));
  const bodyG = geo('sc-body', () => {
    const s = new THREE.Shape();
    const w = width;
    const h = height;
    s.moveTo(-w / 2, 0);
    s.lineTo(w / 2, 0);
    s.lineTo(w / 2, h * 0.75);
    s.quadraticCurveTo(w / 2, h, w / 2 - 0.03, h);
    s.lineTo(-w / 2 + 0.03, h);
    s.quadraticCurveTo(-w / 2, h, -w / 2, h * 0.75);
    s.closePath();
    return extrudeAlongX(s, length, 0.006, 8);
  });
  const ribs = 6;

  useFrame((_, delta) => {
    const sim = simRef.current;
    if (!sim) return;
    const s = useApp.getState();
    const target = s.highlight === 'supercharger' ? 0.22 : 1;
    housingMat.opacity += (target - housingMat.opacity) * Math.min(1, delta * 6);
    housingMat.transparent = housingMat.opacity < 0.999;
    housingMat.depthWrite = housingMat.opacity > 0.6;
    const rpm = sim.scRotorRpm;
    const rad = Math.min((rpm / 60) * Math.PI * 2 * delta * s.timeScale, MAX_VISUAL_RAD_PER_FRAME * 1.5);
    angle.current += rad;
    if (male.current) male.current.rotation.x = angle.current;
    if (female.current) female.current.rotation.x = (-angle.current * 4) / 6;
    if (pulley.current && sim.def.engine.supercharger) pulley.current.rotation.x = angle.current;
  });

  return (
    <Part kind="supercharger" category="supercharger" position={position} explode={[0, 0.3, 0]}>
      <mesh geometry={bodyG} material={housingMat} castShadow />
      {/* ribbed lid */}
      {new Array(ribs).fill(0).map((_, i) => (
        <mesh key={i} material={lid} position={[(i / (ribs - 1) - 0.5) * length * 0.78, height + 0.012, 0]}>
          <boxGeometry args={[length * 0.08, 0.024, width * 0.8]} />
        </mesh>
      ))}
      <mesh material={lid} position={[0, height + 0.004, 0]}>
        <boxGeometry args={[length * 0.9, 0.008, width * 0.92]} />
      </mesh>
      {lidLabel && (
        <LidLabel text={lidLabel} length={length} height={height} width={width} />
      )}
      <group position={[0, height * 0.48, rotorR * 0.95]} ref={male}>
        <mesh geometry={maleG} material={rotorMat} />
      </group>
      <group position={[0, height * 0.48, -rotorR * 0.95]} ref={female}>
        <mesh geometry={femaleG} material={rotorMat} />
      </group>
      {/* drive snout + pulley */}
      <mesh material={lid} position={[length / 2 + 0.03, height * 0.48, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.04, 0.05, 0.06, seg(20)]} />
      </mesh>
      <group ref={pulley} position={[pulleyX ?? length / 2 + 0.075, height * 0.48, 0]}>
        <mesh material={pulleyMat} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.042, 0.042, 0.045, seg(24)]} />
        </mesh>
        {[0, 1, 2].map((k) => (
          <mesh key={k} material={lid} position={[0.024, Math.cos((k * 2 * Math.PI) / 3) * 0.024, Math.sin((k * 2 * Math.PI) / 3) * 0.024]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.006, 0.006, 0.004, 8]} />
          </mesh>
        ))}
      </group>
    </Part>
  );
}

function LidLabel({ text, length, height, width }: { text: string; length: number; height: number; width: number }) {
  const { lib } = useEngine();
  const mat = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 128;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#c9cdd2';
    ctx.font = '700 64px "Helvetica Neue", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 256, 68);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return lib.decal(t, 'supercharger', `lid-${text}`);
  }, [lib, text]);
  return (
    <mesh material={mat} position={[0, height + 0.0095, width * 0.25]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[length * 0.45, length * 0.11]} />
    </mesh>
  );
}
