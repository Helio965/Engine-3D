import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { EngineDefinition } from '../types/engine';
import { buildEngineLayout } from '../simulation/cylinderLayout';
import { computeDims } from './dims';
import { MaterialLibrary } from './materials';
import { createTextures } from './textures';
import { EngineCtx, type EngineModelContext } from './EngineContext';
import { Internals } from './parts/Internals';
import { categoryStates } from './viewRules';
import { useApp } from '../state/appStore';
import { simRef } from '../state/simulationStore';
import { modelLoaders } from './models';
import type { EngineModelModule } from './models/types';
import { FuelSystem3D } from './FuelSystem3D';
import { Flows } from './Flows';

/**
 * Builds the procedural engine for one definition and keeps the view mode,
 * cut plane and vibration in sync with the UI state. The exterior model of
 * each engine is code-split and loaded on demand; resources (geometry,
 * materials, textures) are disposed when switching engines.
 */
export function EngineRenderer({ def, onReady }: { def: EngineDefinition; onReady?: (ctx: EngineModelContext, mod: EngineModelModule) => void }) {
  const quality = useApp((s) => s.graphics);
  const markLoadStep = useApp((s) => s.markLoadStep);
  const [mod, setMod] = useState<EngineModelModule | null>(null);
  const { gl } = useThree();

  const ctx = useMemo<EngineModelContext>(() => {
    const layout = buildEngineLayout(def.engine);
    const dims = computeDims(def, layout);
    const textures = createTextures(quality);
    const lib = new MaterialLibrary(textures);
    const cache = new Map<string, THREE.BufferGeometry>();
    const factor = quality === 'low' ? 0.5 : quality === 'medium' ? 0.75 : quality === 'high' ? 1 : 1.35;
    return {
      def,
      layout,
      dims,
      lib,
      quality,
      seg: (base: number) => Math.max(6, Math.round(base * factor)),
      geo: <T extends THREE.BufferGeometry>(key: string, make: () => T): T => {
        const hit = cache.get(key);
        if (hit) return hit as T;
        const g = make();
        cache.set(key, g);
        return g;
      },
      __cache: cache,
    } as EngineModelContext & { __cache: Map<string, THREE.BufferGeometry> };
  }, [def, quality]);

  useEffect(() => {
    markLoadStep('data');
    markLoadStep('textures');
    return () => {
      ctx.lib.dispose();
      (ctx as unknown as { __cache: Map<string, THREE.BufferGeometry> }).__cache.forEach((g) => g.dispose());
    };
  }, [ctx, markLoadStep]);

  useEffect(() => {
    let alive = true;
    setMod(null);
    modelLoaders[def.id]().then((m) => {
      if (!alive) return;
      setMod(m);
    });
    return () => {
      alive = false;
    };
  }, [def.id]);

  useEffect(() => {
    if (mod) {
      markLoadStep('model');
      onReady?.(ctx, mod);
    }
  }, [mod, ctx, markLoadStep, onReady]);

  // view-mode → material categories
  useEffect(() => {
    const apply = () => {
      const s = useApp.getState();
      ctx.lib.setState(categoryStates(s.viewMode, s.housingOpacity, s.highlight, s.showFuelSystem));
    };
    apply();
    return useApp.subscribe(apply);
  }, [ctx]);

  useEffect(() => {
    gl.localClippingEnabled = true;
  }, [gl]);

  // cut plane follows the cutaway controls
  useFrame(() => {
    const s = useApp.getState();
    const plane = ctx.lib.clipPlanes[0];
    if (s.cutAxis === 'cross') {
      plane.normal.set(-1, 0, 0);
      plane.constant = s.cutPosition * ctx.dims.blockLength * 0.5;
    } else {
      plane.normal.set(0, 0, -1);
      plane.constant = s.cutPosition * ctx.dims.bankWidth * 1.4;
    }
  });

  const lift = -ctx.dims.bottomY + 0.012;
  return (
    <EngineCtx.Provider value={ctx}>
      <group position={[0, lift, 0]}>
        <EngineMount>
          {mod && (
            <Suspense fallback={null}>
              <Internals config={mod.meta.valvetrain} />
              <mod.default />
            </Suspense>
          )}
        </EngineMount>
        {mod && <FuelSystem3D meta={mod.meta} />}
        {mod && <Flows meta={mod.meta} />}
      </group>
    </EngineCtx.Provider>
  );
}

/**
 * Engine mounts: discreet vibration that grows with rpm plus the torque
 * reaction roll (the engine rocks on its mounts when revved), modelled as a
 * damped spring. Amplitudes are a fraction of a millimetre / degree so parts
 * stay easy to observe.
 */
function EngineMount({ children }: { children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  const roll = useRef({ a: 0, v: 0 });
  const t = useRef(0);
  useFrame((_, delta) => {
    const sim = simRef.current;
    const g = ref.current;
    if (!sim || !g) return;
    const s = useApp.getState();
    if (!s.vibration || s.reduceMotion) {
      g.position.set(0, 0, 0);
      g.rotation.x = 0;
      return;
    }
    const dt = Math.min(delta, 0.05) * s.timeScale;
    t.current += dt;
    // torque reaction roll about the crank axis
    const target = -sim.torqueBrake * 9e-6;
    const k = 140;
    const c = 14;
    const r = roll.current;
    const acc = k * (target - r.a) - c * r.v;
    r.v += acc * dt;
    r.a += r.v * dt;
    g.rotation.x = r.a;
    // firing-frequency vibration (small, random-phase to avoid strobing)
    const running = sim.ignition !== 'off' || sim.rpm > 30;
    const amp = running ? 0.00012 + Math.min(1, sim.rpm / 8000) * 0.00028 + (sim.ignition === 'cranking' ? 0.00025 : 0) : 0;
    const f = (sim.rpm / 60) * (sim.def.engine.cylinders / 2);
    const ph = t.current * f * Math.PI * 2;
    g.position.set(0, Math.sin(ph) * amp, Math.sin(ph * 0.5 + 1.3) * amp * 0.6);
  });
  return <group ref={ref}>{children}</group>;
}
