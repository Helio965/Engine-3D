import { create } from 'zustand';
import type { EngineId } from '../types/engine';

export type ViewMode = 'complete' | 'transparent' | 'cutaway' | 'internals' | 'pistons' | 'exploded';
export type Highlight = 'none' | 'turbos' | 'supercharger';
export type GraphicsQuality = 'low' | 'medium' | 'high' | 'ultra';
export type CutAxis = 'cross' | 'longitudinal';
export type FlowKind = 'air' | 'fuel' | 'exhaust' | 'coolant';
export type CameraPresetName =
  | 'front'
  | 'rear'
  | 'left'
  | 'right'
  | 'top'
  | 'intake'
  | 'exhaust'
  | 'pistons'
  | 'crankshaft'
  | 'induction'
  | 'fuel'
  | 'home';

export interface HoverInfo {
  id: string;
  kind: string;
  label?: string;
  x: number;
  y: number;
}

export interface LoadStep {
  key: string;
  label: string;
  done: boolean;
}

/** Slow-motion factors for the master clock (1 = real time). */
export const TIME_SCALES = [1, 0.25, 0.1, 0.04, 0.01] as const;
/** Fuel clock multipliers (consumption + refuelling only). */
export const FUEL_TIME_SCALES = [1, 10, 30, 60] as const;

interface AppState {
  phase: 'intro' | 'lab';
  engineId: EngineId;
  loading: { engineId: EngineId; steps: LoadStep[] } | null;

  viewMode: ViewMode;
  housingOpacity: number;
  explode: number;
  cutAxis: CutAxis;
  cutPosition: number;
  highlight: Highlight;
  showFuelSystem: boolean;
  flows: Record<FlowKind, boolean>;
  identify: boolean;
  hover: HoverInfo | null;
  pinnedPart: HoverInfo | null;
  combustionGlow: boolean;
  timeScale: number;
  fuelTimeScale: number;
  vibration: boolean;

  sound: boolean;
  volume: number;
  graphics: GraphicsQuality;
  reduceMotion: boolean;

  panel: 'none' | 'specs' | 'compare' | 'settings' | 'about';
  telemetryOpen: boolean;
  compare: [EngineId, EngineId];
  drawer: 'none' | 'engines' | 'dash' | 'controls' | 'flows';

  cameraRequest: { preset: CameraPresetName; nonce: number } | null;
  tour: { active: boolean; step: number };
  fps: number;

  set: (partial: Partial<AppState>) => void;
  setEngine: (id: EngineId) => void;
  setViewMode: (m: ViewMode) => void;
  toggleFlow: (f: FlowKind) => void;
  requestCamera: (preset: CameraPresetName) => void;
  markLoadStep: (key: string) => void;
}

const prefersReducedMotion =
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

function defaultQuality(): GraphicsQuality {
  if (typeof window === 'undefined') return 'medium';
  const small = Math.min(window.innerWidth, window.innerHeight) < 700;
  const lowCpu = (navigator.hardwareConcurrency ?? 8) <= 4;
  if (small || lowCpu) return 'low';
  return 'high';
}

export const LOAD_STEPS: Omit<LoadStep, 'done'>[] = [
  { key: 'data', label: 'Dados de simulação' },
  { key: 'model', label: 'Modelo do motor' },
  { key: 'textures', label: 'Materiais e texturas' },
  { key: 'dashboard', label: 'Painel' },
  { key: 'audio', label: 'Áudio' },
];

export const useApp = create<AppState>((set, get) => ({
  phase: 'intro',
  engineId: 'bugatti-chiron',
  loading: null,

  viewMode: 'complete',
  housingOpacity: 0.35,
  explode: 0.6,
  cutAxis: 'longitudinal',
  cutPosition: 0,
  highlight: 'none',
  showFuelSystem: false,
  flows: { air: false, fuel: false, exhaust: false, coolant: false },
  identify: false,
  hover: null,
  pinnedPart: null,
  combustionGlow: true,
  timeScale: 1,
  fuelTimeScale: 1,
  vibration: true,

  sound: true,
  volume: 0.6,
  graphics: defaultQuality(),
  reduceMotion: !!prefersReducedMotion,

  panel: 'none',
  telemetryOpen: true,
  compare: ['ferrari-812-superfast', 'bmw-m5-e60'],
  drawer: 'none',

  cameraRequest: null,
  tour: { active: false, step: 0 },
  fps: 60,

  set: (partial) => set(partial),
  setEngine: (id) => {
    if (id === get().engineId && !get().loading) return;
    set({
      engineId: id,
      loading: { engineId: id, steps: LOAD_STEPS.map((s) => ({ ...s, done: false })) },
      highlight: 'none',
      hover: null,
      pinnedPart: null,
      tour: { active: false, step: 0 },
    });
  },
  setViewMode: (m) => set({ viewMode: m, highlight: 'none' }),
  toggleFlow: (f) => set({ flows: { ...get().flows, [f]: !get().flows[f] } }),
  requestCamera: (preset) => set({ cameraRequest: { preset, nonce: (get().cameraRequest?.nonce ?? 0) + 1 } }),
  markLoadStep: (key) => {
    const l = get().loading;
    if (!l) return;
    const steps = l.steps.map((s) => (s.key === key ? { ...s, done: true } : s));
    if (steps.every((s) => s.done)) set({ loading: null });
    else set({ loading: { ...l, steps } });
  },
}));
