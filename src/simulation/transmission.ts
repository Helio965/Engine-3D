import type { DrivetrainSpec } from '../types/engine';

/**
 * Drivetrain relations.
 *
 *   wheel rpm  = v / (2·π·r) · 60
 *   engine rpm = wheel rpm · gear ratio · final drive      (clutch locked)
 *
 * Gear index convention: -1 = reverse, 0 = neutral, 1..n = forward gears.
 */

export const MS_TO_KMH = 3.6;

/** Parses a tire size like "285/30 ZR20", "245/40ZR18" or "PAX 365/710 R540" into a rolling radius (m). */
export function tireRadiusFromSize(size: string): number | null {
  const pax = size.match(/(\d{3})\s*\/\s*(\d{3})\s*Z?R\s*(\d{3})/i);
  if (pax) {
    // PAX sizing: width / overall diameter (mm) / rim (mm)
    const diameter = Number(pax[2]);
    return (diameter / 2000) * 0.975;
  }
  const m = size.match(/(\d{3})\s*\/\s*(\d{2})\s*Z?R?\s*(\d{2})/i);
  if (!m) return null;
  const width = Number(m[1]);
  const aspect = Number(m[2]);
  const rim = Number(m[3]);
  const diameter = rim * 25.4 + 2 * width * (aspect / 100);
  // dynamic rolling radius is ~2–3 % smaller than the unloaded radius
  return (diameter / 2000) * 0.975;
}

export function totalRatio(dt: DrivetrainSpec, gear: number): number {
  if (gear === 0) return 0;
  if (gear < 0) return dt.reverseRatio * dt.finalDrive;
  const r = dt.ratios[gear - 1];
  return r === undefined ? 0 : r * dt.finalDrive;
}

/** Engine rpm for a vehicle speed (km/h) in a gear, clutch locked. */
export function rpmFromSpeed(dt: DrivetrainSpec, gear: number, speedKmh: number): number {
  const ratio = totalRatio(dt, gear);
  if (!ratio) return 0;
  const v = Math.abs(speedKmh) / MS_TO_KMH;
  const wheelRpm = (v / (2 * Math.PI * dt.tireRadiusM)) * 60;
  return wheelRpm * ratio;
}

/** Vehicle speed (km/h) for an engine rpm in a gear, clutch locked. */
export function speedFromRpm(dt: DrivetrainSpec, gear: number, rpm: number): number {
  const ratio = totalRatio(dt, gear);
  if (!ratio) return 0;
  const wheelRpm = rpm / ratio;
  const v = (wheelRpm / 60) * 2 * Math.PI * dt.tireRadiusM;
  return v * MS_TO_KMH * (gear < 0 ? -1 : 1);
}

export interface ShiftPolicyInput {
  rpm: number;
  gear: number;
  throttle: number;
  idleRpm: number;
  redlineRpm: number;
  revLimitRpm: number;
  speedKmh: number;
}

/**
 * Upshift threshold of the automatic mode: relaxed shifting at light
 * throttle, close to the limiter at wide-open throttle.
 */
export function upshiftRpm(p: Pick<ShiftPolicyInput, 'throttle' | 'idleRpm' | 'redlineRpm' | 'revLimitRpm'>): number {
  if (p.throttle >= 0.92) return Math.min(p.revLimitRpm - 120, p.redlineRpm + (p.revLimitRpm - p.redlineRpm) * 0.6);
  const span = p.redlineRpm - p.idleRpm;
  return p.idleRpm + span * (0.32 + 0.6 * p.throttle);
}

export function downshiftRpm(p: Pick<ShiftPolicyInput, 'throttle' | 'idleRpm' | 'redlineRpm'>): number {
  const span = p.redlineRpm - p.idleRpm;
  return p.idleRpm * 1.25 + span * 0.28 * p.throttle;
}

/**
 * Automatic gear choice. Returns the desired gear (may equal the current one).
 * Never selects a gear that would immediately exceed the upshift point or
 * fall under the downshift point.
 */
export function autoSelectGear(dt: DrivetrainSpec, s: ShiftPolicyInput): number {
  const n = dt.ratios.length;
  if (s.gear <= 0) return s.gear;
  const up = upshiftRpm(s);
  const down = downshiftRpm(s);
  if (s.rpm > up && s.gear < n) {
    const next = rpmFromSpeed(dt, s.gear + 1, s.speedKmh);
    if (next > down) return s.gear + 1;
  }
  if (s.gear > 1) {
    const lowerRpm = rpmFromSpeed(dt, s.gear - 1, s.speedKmh);
    const kickdown = s.throttle > 0.9 && lowerRpm < s.redlineRpm * 0.88;
    if ((s.rpm < down || kickdown) && lowerRpm < up * 0.97) return s.gear - 1;
  }
  return s.gear;
}

export function gearLabel(gear: number, auto: boolean): string {
  if (gear < 0) return 'R';
  if (gear === 0) return 'N';
  return auto ? `D${gear}` : `M${gear}`;
}
