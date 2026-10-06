import { lazy, Suspense, useEffect, useMemo, useRef } from 'react';
import type { DashboardStyle, EngineDefinition } from '../types/engine';
import { useTelemetry } from '../state/simulationStore';
import { useApp } from '../state/appStore';
import type { DashboardComponent } from './types';

/**
 * Loads the dashboard inspired by the real instrument cluster of the selected
 * car (code-split per car) and feeds it live telemetry.
 */
const loaders: Record<DashboardStyle, () => Promise<{ default: DashboardComponent }>> = {
  veyron: () => import('./dashboards/VeyronDash'),
  chiron: () => import('./dashboards/ChironDash'),
  r34: () => import('./dashboards/R34Dash'),
  e60: () => import('./dashboards/E60Dash'),
  hellcat: () => import('./dashboards/HellcatDash'),
  crate: () => import('./dashboards/CrateDash'),
  f458: () => import('./dashboards/F458Dash'),
  f812: () => import('./dashboards/F812Dash'),
  w12concept: () => import('./dashboards/W12ConceptDash'),
};

const cache = new Map<DashboardStyle, React.LazyExoticComponent<DashboardComponent>>();
function lazyDash(style: DashboardStyle) {
  if (!cache.has(style)) {
    cache.set(
      style,
      lazy(() =>
        loaders[style]().then((m) => {
          useApp.getState().markLoadStep('dashboard');
          return m;
        }),
      ),
    );
  }
  return cache.get(style)!;
}

export function DashboardHost({ def }: { def: EngineDefinition }) {
  const t = useTelemetry((x) => x.t);
  const Dash = useMemo(() => lazyDash(def.dashboard.style), [def.dashboard.style]);
  const onAt = useRef<number | null>(null);
  const powered = !!t && t.ignition !== 'off';
  if (powered && onAt.current === null && t) onAt.current = t.time;
  if (!powered) onAt.current = null;
  useEffect(() => {
    // dashboards already cached do not trigger the lazy loader again
    if (cache.has(def.dashboard.style)) {
      const id = setTimeout(() => useApp.getState().markLoadStep('dashboard'), 0);
      return () => clearTimeout(id);
    }
  }, [def.dashboard.style]);

  return (
    <section className="dash-host panel" aria-label={`Painel inspirado no ${def.manufacturer} ${def.vehicle}`}>
      <p className="panel-title">
        Painel · {def.manufacturer} {def.vehicle}
      </p>
      <Suspense fallback={<div style={{ height: 210 }} />}>
        {t && <Dash def={def} t={t} powered={powered} sinceIgnition={powered && onAt.current !== null ? t.time - onAt.current : -1} />}
      </Suspense>
      <p className="dash-ref">
        Inspirado no painel real (recriado em vetor; não é fotografia): {def.dashboard.reference}
      </p>
    </section>
  );
}
