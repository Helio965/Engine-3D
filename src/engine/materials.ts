import * as THREE from 'three';
import type { TextureSet } from './textures';

/**
 * PBR material library.
 *
 * Every material belongs to a CATEGORY. View modes (transparent, cutaway,
 * internals, pistons, highlight) act on categories, so all parts of a kind
 * fade, clip or hide together without per-mesh bookkeeping.
 */

export type Finish =
  | 'castAluminium'
  | 'machinedAluminium'
  | 'castIron'
  | 'forgedSteel'
  | 'chrome'
  | 'polishedSteel'
  | 'titanium'
  | 'heatTint'
  | 'carbon'
  | 'crinkle'
  | 'satin'
  | 'gloss'
  | 'plastic'
  | 'rubber'
  | 'brass'
  | 'copper'
  | 'heatShield'
  | 'ceramic'
  | 'glass'
  | 'fuel'
  | 'glow'
  | 'decal';

export type PartCategory =
  | 'block'
  | 'head'
  | 'cover'
  | 'induction'
  | 'exhaust'
  | 'accessory'
  | 'rotating'
  | 'valvetrain'
  | 'liner'
  | 'fuel'
  | 'turbo'
  | 'supercharger'
  | 'combustion'
  | 'flow';

interface FinishDef {
  color: string;
  metalness: number;
  roughness: number;
  extra?: (m: THREE.MeshPhysicalMaterial, t: TextureSet) => void;
  physical?: boolean;
}

const FINISHES: Record<Finish, FinishDef> = {
  castAluminium: {
    color: '#a9adb2',
    metalness: 0.85,
    roughness: 0.55,
    extra: (m, t) => {
      m.normalMap = t.castNormal;
      m.normalScale.set(0.12, 0.12);
      m.roughnessMap = t.castRough;
    },
  },
  machinedAluminium: { color: '#c9ccd1', metalness: 0.95, roughness: 0.28, extra: (m, t) => (m.roughnessMap = t.brushedRough) },
  castIron: {
    color: '#55585c',
    metalness: 0.75,
    roughness: 0.68,
    extra: (m, t) => {
      m.normalMap = t.castNormal;
      m.normalScale.set(0.2, 0.2);
    },
  },
  forgedSteel: { color: '#8c9096', metalness: 0.95, roughness: 0.32 },
  chrome: { color: '#e8ebef', metalness: 1, roughness: 0.06 },
  polishedSteel: { color: '#cfd3d8', metalness: 1, roughness: 0.14 },
  titanium: { color: '#9a9488', metalness: 0.95, roughness: 0.3 },
  heatTint: { color: '#a08a6c', metalness: 0.95, roughness: 0.3 },
  carbon: {
    color: '#ffffff',
    metalness: 0.15,
    roughness: 0.32,
    physical: true,
    extra: (m, t) => {
      m.map = t.carbonMap;
      m.normalMap = t.carbonNormal;
      m.normalScale.set(0.5, 0.5);
      m.clearcoat = 1;
      m.clearcoatRoughness = 0.08;
    },
  },
  crinkle: {
    color: '#b3101a',
    metalness: 0.1,
    roughness: 0.62,
    physical: true,
    extra: (m, t) => {
      m.normalMap = t.crinkleNormal;
      m.normalScale.set(0.45, 0.45);
      m.clearcoat = 0.25;
      m.clearcoatRoughness = 0.5;
    },
  },
  satin: { color: '#1b1c1f', metalness: 0.3, roughness: 0.52 },
  gloss: { color: '#c0392b', metalness: 0.2, roughness: 0.25, physical: true, extra: (m) => ((m.clearcoat = 1), (m.clearcoatRoughness = 0.06)) },
  plastic: { color: '#141518', metalness: 0.0, roughness: 0.6 },
  rubber: { color: '#0c0c0d', metalness: 0, roughness: 0.85 },
  brass: { color: '#b48c3c', metalness: 1, roughness: 0.3 },
  copper: { color: '#b8734a', metalness: 1, roughness: 0.32 },
  heatShield: {
    color: '#c7c2b6',
    metalness: 0.9,
    roughness: 0.36,
    extra: (m, t) => {
      m.normalMap = t.dimpleNormal;
      m.normalScale.set(0.8, 0.8);
    },
  },
  ceramic: { color: '#eeeae0', metalness: 0, roughness: 0.35 },
  glass: { color: '#a9c4d8', metalness: 0, roughness: 0.08 },
  fuel: { color: '#d8a227', metalness: 0, roughness: 0.15 },
  glow: { color: '#ff8a2a', metalness: 0, roughness: 1 },
  decal: { color: '#ffffff', metalness: 0.2, roughness: 0.5 },
};

export interface CategoryState {
  visible: boolean;
  opacity: number;
  clip: boolean;
  /** Draw as faint ghost (no depth write). */
  ghost: boolean;
}

export class MaterialLibrary {
  private cache = new Map<string, THREE.MeshPhysicalMaterial | THREE.MeshStandardMaterial>();
  private byCategory = new Map<PartCategory, Set<THREE.Material>>();
  private baseOpacity = new WeakMap<THREE.Material, number>();
  private baseSide = new WeakMap<THREE.Material, THREE.Side>();
  /** Materials whose texture alpha must always be honoured (lettering decals). */
  private alpha = new WeakSet<THREE.Material>();
  readonly textures: TextureSet;
  readonly clipPlanes: THREE.Plane[] = [new THREE.Plane(new THREE.Vector3(0, 0, -1), 0)];
  state: Partial<Record<PartCategory, CategoryState>> = {};

  constructor(textures: TextureSet) {
    this.textures = textures;
  }

  /**
   * Returns a shared material.
   * @param finish surface finish
   * @param category view-mode category
   * @param color optional override colour (paint)
   */
  get(finish: Finish, category: PartCategory, color?: string, variant = ''): THREE.MeshStandardMaterial {
    const key = `${finish}|${category}|${color ?? ''}|${variant}`;
    const hit = this.cache.get(key);
    if (hit) return hit;
    const def = FINISHES[finish];
    const m = new THREE.MeshPhysicalMaterial({
      color: color ?? def.color,
      metalness: def.metalness,
      roughness: def.roughness,
    });
    def.extra?.(m, this.textures);
    if (finish === 'glass') {
      m.transparent = true;
      m.opacity = 0.16;
      m.depthWrite = false;
      m.side = THREE.DoubleSide;
      m.envMapIntensity = 1.4;
    }
    if (finish === 'fuel') {
      m.transparent = true;
      m.opacity = 0.82;
      m.emissive = new THREE.Color('#5a3a00');
    }
    if (finish === 'glow') {
      m.emissive = new THREE.Color(color ?? def.color);
      m.emissiveIntensity = 0;
      m.transparent = true;
      m.opacity = 0.9;
      m.depthWrite = false;
      m.blending = THREE.AdditiveBlending;
      m.toneMapped = false;
    }
    if (category === 'flow') {
      m.emissive = new THREE.Color(color ?? def.color);
      m.emissiveIntensity = 1.6;
      m.toneMapped = false;
    }
    m.name = key;
    this.baseOpacity.set(m, m.opacity);
    this.baseSide.set(m, m.side);
    this.cache.set(key, m);
    if (!this.byCategory.has(category)) this.byCategory.set(category, new Set());
    this.byCategory.get(category)!.add(m);
    this.applyCategory(category, m);
    return m;
  }

  /** Material with a canvas texture (labels/inscriptions). */
  decal(texture: THREE.Texture, category: PartCategory, key: string): THREE.MeshStandardMaterial {
    const k = `decal|${category}|${key}`;
    const hit = this.cache.get(k);
    if (hit) return hit;
    const m = new THREE.MeshStandardMaterial({ map: texture, transparent: true, metalness: 0.3, roughness: 0.45, polygonOffset: true, polygonOffsetFactor: -2 });
    this.alpha.add(m);
    m.alphaTest = 0.04;
    m.depthWrite = false;
    this.baseOpacity.set(m, 1);
    this.baseSide.set(m, m.side);
    this.cache.set(k, m);
    if (!this.byCategory.has(category)) this.byCategory.set(category, new Set());
    this.byCategory.get(category)!.add(m);
    this.applyCategory(category, m);
    return m;
  }

  setState(state: Partial<Record<PartCategory, CategoryState>>) {
    this.state = state;
    this.byCategory.forEach((mats, cat) => mats.forEach((m) => this.applyCategory(cat, m)));
  }

  private applyCategory(cat: PartCategory, m: THREE.Material) {
    const s = this.state[cat];
    const base = this.baseOpacity.get(m) ?? 1;
    const naturallyTransparent = base < 1 || cat === 'combustion' || cat === 'flow' || this.alpha.has(m);
    if (!s) return;
    const opacity = Math.min(base, s.opacity * base);
    const transparent = naturallyTransparent || opacity < 0.999 || s.ghost;
    if (m.transparent !== transparent) m.needsUpdate = true;
    m.transparent = transparent;
    m.opacity = opacity;
    if (!naturallyTransparent) m.depthWrite = !s.ghost && opacity > 0.6;
    const clip = s.clip ? this.clipPlanes : null;
    if ((m.clippingPlanes?.length ?? 0) !== (clip?.length ?? 0)) m.needsUpdate = true;
    m.clippingPlanes = clip;
    const side = s.clip || opacity < 0.999 ? THREE.DoubleSide : (this.baseSide.get(m) ?? THREE.FrontSide);
    if (m.side !== side) {
      m.side = side;
      m.needsUpdate = true;
    }
  }

  forEachInCategory(cat: PartCategory, fn: (m: THREE.Material) => void) {
    this.byCategory.get(cat)?.forEach(fn);
  }

  dispose() {
    this.cache.forEach((m) => m.dispose());
    this.cache.clear();
    this.textures.dispose();
  }
}
