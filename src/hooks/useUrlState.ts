import { useEffect } from 'react';
import { useApp, type GraphicsQuality, type ViewMode } from '../state/appStore';
import { ENGINES } from '../data/engines';
import type { EngineId } from '../types/engine';

/**
 * Optional deep-link parameters (also used by the automated screenshot
 * checks): ?engine=<id>&view=<mode>&intro=0&q=<quality>&cam=<preset>
 */
export function useUrlState() {
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const s = useApp.getState();
    const engine = p.get('engine') as EngineId | null;
    if (engine && engine !== s.engineId && ENGINES.some((e) => e.id === engine)) s.setEngine(engine);
    const view = p.get('view') as ViewMode | null;
    if (view) s.set({ viewMode: view });
    if (p.get('intro') === '0') s.set({ phase: 'lab' });
    const q = p.get('q') as GraphicsQuality | null;
    if (q && ['low', 'medium', 'high', 'ultra'].includes(q)) s.set({ graphics: q });
    if (p.get('sound') === '0') s.set({ sound: false });
    const cam = p.get('cam');
    if (cam) setTimeout(() => useApp.getState().requestCamera(cam as never), 1500);
  }, []);
}
