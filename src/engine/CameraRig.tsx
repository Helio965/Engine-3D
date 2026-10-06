import { useEffect, useRef } from 'react';
import { CameraControls } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import type CameraControlsImpl from 'camera-controls';
import { useApp, type CameraPresetName } from '../state/appStore';
import type { EngineModelContext } from './EngineContext';
import type { EngineModelModule } from './models/types';
import type { Vec3 } from './parts/Plumbing';

/**
 * Orbit/zoom/pan camera (mouse, touch) with smooth transitions to named
 * presets and to the guided-tour anchors. Engine space is lifted by the
 * engine renderer, so anchors are converted with `lift`.
 */
export interface CameraTarget {
  position: Vec3;
  target: Vec3;
}

export function presetFor(name: CameraPresetName, ctx: EngineModelContext, mod: EngineModelModule): CameraTarget {
  const size = mod.meta.size(ctx);
  const lift = -ctx.dims.bottomY + 0.012;
  const a = mod.meta.anchors(ctx);
  const c: Vec3 = [0, lift + size[1] * 0.12, 0];
  const R = Math.max(size[0], size[2], size[1]) * 1.25 + 0.35;
  const up = (p: Vec3 | undefined, fallback: Vec3): Vec3 => (p ? [p[0], p[1] + lift, p[2]] : fallback);
  switch (name) {
    case 'front':
      return { position: [R, c[1] + 0.25, 0.001], target: c };
    case 'rear':
      return { position: [-R, c[1] + 0.25, 0.001], target: c };
    case 'left':
      return { position: [0.001, c[1] + 0.2, -R], target: c };
    case 'right':
      return { position: [0.001, c[1] + 0.2, R], target: c };
    case 'top':
      return { position: [0.001, c[1] + R * 1.1, 0.002], target: c };
    case 'intake': {
      const t = up(a.intake, c);
      return { position: [t[0] + 0.35, t[1] + 0.45, t[2] + 0.35], target: t };
    }
    case 'exhaust': {
      const t = up(a.exhaust, c);
      return { position: [t[0] - 0.3, t[1] + 0.15, t[2] + Math.sign(t[2] || 1) * 0.55], target: t };
    }
    case 'pistons': {
      const t = up(a.pistons, c);
      return { position: [t[0] + 0.25, t[1] + 0.2, t[2] + 0.42], target: t };
    }
    case 'crankshaft': {
      const t = up(a.crankshaft, c);
      return { position: [t[0] + 0.35, t[1] - 0.05, t[2] + 0.45], target: t };
    }
    case 'induction': {
      const t = up(a.induction ?? a.intake, c);
      return { position: [t[0] + 0.3, t[1] + 0.25, t[2] + Math.sign(t[2] || 1) * 0.45], target: t };
    }
    case 'fuel': {
      const t = up(a.fuel ?? a.intake, c);
      return { position: [t[0] + 0.6, t[1] + 0.6, t[2] - 1.1], target: [t[0], t[1] - 0.1, t[2] - 0.5] };
    }
    default:
      return { position: [R * 0.72, c[1] + R * 0.42, R * 0.72], target: c };
  }
}

export function CameraRig({ ctx, mod }: { ctx: EngineModelContext | null; mod: EngineModelModule | null }) {
  const ref = useRef<CameraControlsImpl>(null);
  const req = useApp((s) => s.cameraRequest);
  const reduceMotion = useApp((s) => s.reduceMotion);

  useEffect(() => {
    if (!ref.current || !ctx || !mod) return;
    const p = presetFor('home', ctx, mod);
    ref.current.setLookAt(...p.position, ...p.target, !reduceMotion);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx, mod]);

  useEffect(() => {
    if (!ref.current || !ctx || !mod || !req) return;
    const p = presetFor(req.preset, ctx, mod);
    ref.current.setLookAt(...p.position, ...p.target, !reduceMotion);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [req]);

  // expose for the guided tour
  useFrame(() => {
    (window as unknown as { __cam?: CameraControlsImpl | null }).__cam = ref.current;
  });

  return (
    <CameraControls
      ref={ref}
      makeDefault
      minDistance={0.12}
      maxDistance={6}
      dollySpeed={0.6}
      smoothTime={reduceMotion ? 0 : 0.35}
      draggingSmoothTime={0.08}
      maxPolarAngle={Math.PI * 0.62}
      dollyToCursor
    />
  );
}
