import type { EngineDefinition } from '../types/engine';
import { useApp } from '../state/appStore';
import { fmt } from '../data/helpers';

export function aspirationLabel(def: EngineDefinition): string {
  const e = def.engine;
  if (e.turbo) return `${e.turbo.count === 2 ? 'Biturbo' : `${e.turbo.count} turbos`}${e.turbo.arrangement === 'sequential' ? ' sequenciais' : ''}`;
  if (e.supercharger) return 'Supercharger';
  return 'Naturalmente aspirado';
}

export function layoutLabel(def: EngineDefinition): string {
  const e = def.engine;
  if (e.layout === 'inline') return `${e.cylinders} em linha`;
  if (e.layout === 'v') return `V${e.cylinders} ${e.bankAngleDeg}°`;
  return `W${e.cylinders}`;
}

export function Header({ def }: { def: EngineDefinition }) {
  const set = useApp((s) => s.set);
  const panel = useApp((s) => s.panel);
  const tour = useApp((s) => s.tour);
  return (
    <header className="header">
      <div className="brand" aria-label="Engine Lab">
        <span className="brand-dot" aria-hidden />
        ENGINE LAB
      </div>
      <div className="hdr-engine">
        <div className="l1">
          {def.manufacturer} {def.vehicle}
          {def.isCrateEngine && <span className="crate-tag">CRATE ENGINE</span>}
        </div>
        <div className="l2">
          {def.engine.name} · {def.generation}
        </div>
      </div>
      <div className="hdr-chips" aria-label="Resumo técnico">
        <span className="chip accent">{layoutLabel(def)}</span>
        <span className="chip">{fmt(def.engine.displacementCc / 1000, 1)} L</span>
        <span className="chip">{aspirationLabel(def)}</span>
        <span className="chip">
          {fmt(def.performance.powerPs)} PS · {fmt(def.performance.torqueNm)} N·m
        </span>
      </div>
      <div className="hdr-actions">
        <button
          className={`btn ${tour.active ? 'active' : ''}`}
          onClick={() => set({ tour: { active: !tour.active, step: 0 } })}
          title="Tour guiado pelo ciclo do motor"
        >
          Explore Engine
        </button>
        <button className={`btn ${panel === 'specs' ? 'active' : ''}`} onClick={() => set({ panel: panel === 'specs' ? 'none' : 'specs' })}>
          Engine Specs
        </button>
        <button className={`btn hide-m ${panel === 'compare' ? 'active' : ''}`} onClick={() => set({ panel: panel === 'compare' ? 'none' : 'compare' })}>
          Comparar
        </button>
        <button className={`btn icon ${panel === 'settings' ? 'active' : ''}`} onClick={() => set({ panel: panel === 'settings' ? 'none' : 'settings' })} aria-label="Configurações gráficas e de som" title="Configurações">
          ⚙
        </button>
        <button className={`btn icon hide-m ${panel === 'about' ? 'active' : ''}`} onClick={() => set({ panel: panel === 'about' ? 'none' : 'about' })} aria-label="Sobre o projeto" title="Sobre">
          ?
        </button>
      </div>
    </header>
  );
}
