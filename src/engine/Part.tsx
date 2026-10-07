import { useId, useRef, type ReactNode } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Select } from '@react-three/postprocessing';
import type * as THREE from 'three';
import { useApp } from '../state/appStore';
import type { PartCategory } from './materials';
import { categoryStates } from './viewRules';

export interface PartProps {
  /** Key into the component dictionary (identify tooltips, highlight). */
  kind: string;
  /** Optional specific label, e.g. "Turbo 3 (2º estágio)". */
  label?: string;
  category: PartCategory;
  /** Displacement (m, engine space) at 100 % exploded view. */
  explode?: [number, number, number];
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
  children: ReactNode;
}

/**
 * Wrapper for every identifiable engine part. Handles:
 *  - category visibility for the current view mode;
 *  - exploded-view displacement (smoothly animated);
 *  - hover/click identification with an outline highlight.
 */
export function Part({ kind, label, category, explode, position, rotation, scale, children }: PartProps) {
  const id = useId();
  const ref = useRef<THREE.Group>(null);
  const offset = useRef(0);
  const visible = useApp((s) => categoryStates(s.viewMode, s.housingOpacity, s.highlight, s.showFuelSystem)[category].visible);
  const identify = useApp((s) => s.identify);
  const hovered = useApp((s) => s.hover?.id === id || s.pinnedPart?.id === id);
  const highlighted = useApp(
    (s) => (s.highlight === 'turbos' && category === 'turbo') || (s.highlight === 'supercharger' && category === 'supercharger'),
  );

  useFrame((_, delta) => {
    if (!explode || !ref.current) return;
    const s = useApp.getState();
    const target = s.viewMode === 'exploded' ? s.explode : 0;
    const k = s.reduceMotion ? 1 : 1 - Math.exp(-delta * 6);
    offset.current += (target - offset.current) * k;
    const base = position ?? [0, 0, 0];
    ref.current.position.set(
      base[0] + explode[0] * offset.current,
      base[1] + explode[1] * offset.current,
      base[2] + explode[2] * offset.current,
    );
  });

  const over = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    useApp.getState().set({ hover: { id, kind, label, x: e.nativeEvent.clientX, y: e.nativeEvent.clientY } });
  };
  const move = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const h = useApp.getState().hover;
    if (h?.id === id) useApp.getState().set({ hover: { ...h, x: e.nativeEvent.clientX, y: e.nativeEvent.clientY } });
  };
  const out = () => {
    if (useApp.getState().hover?.id === id) useApp.getState().set({ hover: null });
  };
  const click = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    useApp.getState().set({ pinnedPart: { id, kind, label, x: e.nativeEvent.clientX, y: e.nativeEvent.clientY } });
  };

  return (
    <group
      ref={ref}
      position={position}
      rotation={rotation}
      scale={scale}
      visible={visible}
      userData={{ kind, label, category }}
      onPointerOver={identify ? over : undefined}
      onPointerMove={identify ? move : undefined}
      onPointerOut={identify ? out : undefined}
      onClick={identify ? click : undefined}
    >
      <Select enabled={visible && (hovered || highlighted)}>{children}</Select>
    </group>
  );
}
