import { useApp } from '../state/appStore';
import type { EngineDefinition } from '../types/engine';
import { tourStepsFor } from '../engine/TourDirector';

export function TourPanel({ def }: { def: EngineDefinition }) {
  const tour = useApp((s) => s.tour);
  const set = useApp((s) => s.set);
  const steps = tourStepsFor(def.engine.aspiration !== 'na');
  const step = steps[Math.min(tour.step, steps.length - 1)];
  const go = (i: number) => set({ tour: { active: true, step: Math.max(0, Math.min(steps.length - 1, i)) } });
  return (
    <section className="tour panel" aria-live="polite" aria-label="Explore Engine — tour guiado">
      <h3>{step.title}</h3>
      <p>{step.text}</p>
      <div className="btn-row" style={{ justifyContent: 'space-between' }}>
        <span className="mono" style={{ color: 'var(--text-3)', alignSelf: 'center' }}>
          {tour.step + 1} / {steps.length}
        </span>
        <div className="btn-row" style={{ marginTop: 0 }}>
          <button className="btn sm" onClick={() => go(tour.step - 1)} disabled={tour.step === 0}>
            ◀ Anterior
          </button>
          {tour.step < steps.length - 1 ? (
            <button className="btn sm primary" onClick={() => go(tour.step + 1)}>
              Próximo ▶
            </button>
          ) : (
            <button className="btn sm primary" onClick={() => set({ tour: { active: false, step: 0 }, timeScale: 1, viewMode: 'complete', highlight: 'none' })}>
              Concluir
            </button>
          )}
          <button className="btn sm" onClick={() => set({ tour: { active: false, step: 0 }, timeScale: 1 })} aria-label="Fechar tour">
            ✕
          </button>
        </div>
      </div>
    </section>
  );
}
