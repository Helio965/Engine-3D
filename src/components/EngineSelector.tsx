import { ENGINES } from '../data/engines';
import { useApp } from '../state/appStore';
import { fmt } from '../data/helpers';
import { CarSilhouette } from '../assets/cars/CarSilhouette';
import { layoutLabel } from './Header';

export function EngineSelector() {
  const engineId = useApp((s) => s.engineId);
  const setEngine = useApp((s) => s.setEngine);
  const set = useApp((s) => s.set);
  return (
    <nav aria-label="Motores disponíveis">
      <p className="panel-title">Motores · veículos</p>
      {ENGINES.map((e) => (
        <button
          key={e.id}
          className={`engine-card ${e.id === engineId ? 'active' : ''}`}
          aria-pressed={e.id === engineId}
          onClick={() => {
            setEngine(e.id);
            set({ drawer: 'none' });
          }}
        >
          <div className="car" aria-hidden>
            <CarSilhouette id={e.id} accent={e.visual.accent} />
          </div>
          <div className="mfr">
            {e.manufacturer}
            {e.isCrateEngine && <span className="crate-tag">CRATE</span>}
          </div>
          <div className="model">{e.vehicle}</div>
          <div className="eng">{e.headline}</div>
          <div className="meta">
            <span>
              {layoutLabel(e)} · {fmt(e.engine.displacementCc / 1000, 1)} L
            </span>
            <span>{fmt(e.performance.powerPs)} PS</span>
          </div>
        </button>
      ))}
    </nav>
  );
}
