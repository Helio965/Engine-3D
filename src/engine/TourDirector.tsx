import { useEffect } from 'react';
import { useApp } from '../state/appStore';
import { simRef } from '../state/simulationStore';
import { TOUR_STEPS } from '../data/tour';
import type { EngineModelContext } from './EngineContext';
import type { EngineModelModule } from './models/types';

export function tourStepsFor(forced: boolean) {
  return TOUR_STEPS.filter((s) => !s.forcedOnly || forced);
}

/** Applies the view, camera, clock and flows of the active tour step. */
export function TourDirector({ ctx, mod }: { ctx: EngineModelContext | null; mod: EngineModelModule | null }) {
  const tour = useApp((s) => s.tour);
  useEffect(() => {
    if (!tour.active || !ctx || !mod) return;
    const forced = ctx.def.engine.aspiration !== 'na';
    const steps = tourStepsFor(forced);
    const step = steps[Math.min(tour.step, steps.length - 1)];
    if (!step) return;
    const s = useApp.getState();
    const flows = { air: false, fuel: false, exhaust: false, coolant: false };
    step.flows?.forEach((f) => (flows[f] = true));
    s.set({
      viewMode: step.view,
      highlight: step.forcedOnly ? (ctx.def.engine.supercharger ? 'supercharger' : 'turbos') : 'none',
      timeScale: step.timeScale,
      flows,
      combustionGlow: true,
    });
    s.requestCamera(step.camera);
    const sim = simRef.current;
    if (sim && sim.ignition === 'off' && sim.fuel.levelL > 0 && sim.fuel.refuel === 'idle') sim.start();
  }, [tour, ctx, mod]);
  return null;
}
