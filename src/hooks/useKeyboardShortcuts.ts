import { useEffect } from 'react';
import { useApp, type ViewMode } from '../state/appStore';
import { simRef } from '../state/simulationStore';
import { audioEngine } from '../audio/AudioEngine';

const VIEW_KEYS: Record<string, ViewMode> = {
  '1': 'complete',
  '2': 'transparent',
  '3': 'cutaway',
  '4': 'internals',
  '5': 'pistons',
  '6': 'exploded',
};

/** Keyboard control of the lab (ignored while typing in inputs). */
export function useKeyboardShortcuts() {
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA')) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const s = useApp.getState();
      if (s.phase !== 'lab') return;
      const sim = simRef.current;
      const k = e.key.toLowerCase();
      if (k === 's' && sim) {
        void audioEngine.init();
        if (sim.ignition === 'off') sim.start();
        else sim.stop();
      } else if (k === 'arrowup' && sim) {
        sim.pedal = Math.min(1, sim.pedal + 0.05);
        e.preventDefault();
      } else if (k === 'arrowdown' && sim) {
        sim.pedal = Math.max(0, sim.pedal - 0.05);
        e.preventDefault();
      } else if (k === 'e' && sim) sim.shiftUp();
      else if (k === 'q' && sim) sim.shiftDown();
      else if (k === 'c') s.requestCamera('home');
      else if (VIEW_KEYS[k]) s.setViewMode(VIEW_KEYS[k]);
    };
    window.addEventListener('keydown', down);
    return () => window.removeEventListener('keydown', down);
  }, []);
}
