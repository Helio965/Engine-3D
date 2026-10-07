import type { FactStatus, SourceRef, SpecRow } from '../types/engine';
import { tireRadiusFromSize } from '../simulation/transmission';

/** Helpers used by the engine data files. */

export function src(id: string, title: string, publisher: string, url: string, official = false): SourceRef {
  return { id, title, publisher, url, official };
}

export function row(label: string, value: string, status: FactStatus, sources?: string[], note?: string): SpecRow {
  return { label, value, status, sources, note };
}

export function tireRadius(size: string): number {
  const r = tireRadiusFromSize(size);
  if (!r) throw new Error(`Unparseable tyre size ${size}`);
  return r;
}

/**
 * Overall drive ratio (gearbox × final drive) that gives `speedKmh` at
 * `rpm` with rolling radius `radiusM` — used when a manufacturer publishes
 * maximum speed per gear but not the individual ratios.
 */
export function overallRatioFromSpeed(rpm: number, speedKmh: number, radiusM: number): number {
  const v = speedKmh / 3.6;
  return (rpm * 2 * Math.PI * radiusM) / (60 * v);
}

/**
 * Aerodynamic drag area Cd·A calibrated so that the published power at the
 * wheels balances drag + rolling resistance at the published top speed.
 */
export function calibratedDragArea(powerKw: number, topSpeedKmh: number, massKg: number, drivetrainEff = 0.86, crr = 0.012): number {
  const v = topSpeedKmh / 3.6;
  const wheel = powerKw * 1000 * drivetrainEff;
  const roll = crr * (massKg + 80) * 9.81 * v;
  return (2 * (wheel - roll)) / (1.2 * v * v * v);
}

export const fmt = (n: number, digits = 0) =>
  n.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits });
