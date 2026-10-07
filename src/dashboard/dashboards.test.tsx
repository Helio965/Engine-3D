import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { DashboardStyle } from '../types/engine';
import { ENGINES } from '../data/engines';
import { EngineSimulation } from '../simulation/EngineSimulation';
import type { DashboardComponent } from './types';
import VeyronDash from './dashboards/VeyronDash';
import ChironDash from './dashboards/ChironDash';
import R34Dash from './dashboards/R34Dash';
import E60Dash, { e60WarningRpm } from './dashboards/E60Dash';
import HellcatDash from './dashboards/HellcatDash';
import CrateDash from './dashboards/CrateDash';
import F458Dash from './dashboards/F458Dash';
import F812Dash from './dashboards/F812Dash';
import W12ConceptDash from './dashboards/W12ConceptDash';

const DASHES: Record<DashboardStyle, DashboardComponent> = {
  veyron: VeyronDash,
  chiron: ChironDash,
  r34: R34Dash,
  e60: E60Dash,
  hellcat: HellcatDash,
  crate: CrateDash,
  f458: F458Dash,
  f812: F812Dash,
  w12concept: W12ConceptDash,
};

function run(sim: EngineSimulation, seconds: number) {
  for (let t = 0; t < seconds; t += 1 / 60) sim.step(1 / 60);
}

describe('dashboards', () => {
  it('every car has its own dashboard style', () => {
    expect(new Set(ENGINES.map((e) => e.dashboard.style)).size).toBe(ENGINES.length);
  });

  ENGINES.forEach((def) => {
    it(`${def.id}: renders off, idling and at full load without invalid numbers`, () => {
      const Dash = DASHES[def.dashboard.style];
      const sim = new EngineSimulation(def);
      const off = renderToStaticMarkup(<Dash def={def} t={sim.snapshot()} powered={false} sinceIgnition={-1} />);
      sim.start();
      run(sim, 3);
      const idle = renderToStaticMarkup(<Dash def={def} t={sim.snapshot()} powered sinceIgnition={0.5} />);
      sim.pedal = 1;
      run(sim, 2);
      const wot = renderToStaticMarkup(<Dash def={def} t={sim.snapshot()} powered sinceIgnition={3} />);
      for (const html of [off, idle, wot]) {
        expect(html).toContain('<svg');
        expect(html).not.toMatch(/NaN|Infinity|undefined/);
      }
    });
  });

  it('M5 pre-warning field rises with oil temperature up to the governed speed', () => {
    expect(e60WarningRpm(20, 8250)).toBeLessThan(e60WarningRpm(60, 8250));
    expect(e60WarningRpm(95, 8250)).toBe(8250);
  });
});
