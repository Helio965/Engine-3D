import type { EngineDefinition } from '../types/engine';
import { useApp } from '../state/appStore';

/** Real loading progress: each step completes when that resource is actually ready. */
export function LoadingOverlay({ def }: { def: EngineDefinition }) {
  const loading = useApp((s) => s.loading);
  if (!loading) return null;
  const done = loading.steps.filter((s) => s.done).length;
  const pct = Math.round((done / loading.steps.length) * 100);
  const name = `${def.manufacturer} ${def.engine.layout === 'w' ? `W${def.engine.cylinders}` : def.engine.code}`.toUpperCase();
  return (
    <div className="loading" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`Carregando ${name}`}>
      <div className="loading-box">
        <div className="loading-title">LOADING {name}</div>
        <div className="loading-bar">
          <div style={{ width: `${pct}%` }} />
        </div>
        <div className="mono" style={{ marginTop: 6, color: 'var(--text-2)' }}>
          {pct}%
        </div>
        <ul className="loading-steps">
          {loading.steps.map((s) => (
            <li key={s.key} className={s.done ? 'done' : ''}>
              {s.label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
