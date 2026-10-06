import type { ComponentType } from 'react';
import type { EngineDefinition } from '../types/engine';
import type { Telemetry } from '../simulation/EngineSimulation';

export interface DashboardProps {
  def: EngineDefinition;
  t: Telemetry;
  /** Seconds since the ignition was switched on (for needle-sweep / self-test animations). */
  sinceIgnition: number;
  /** True when the ignition is on (cranking or running). */
  powered: boolean;
}

export type DashboardComponent = ComponentType<DashboardProps>;
