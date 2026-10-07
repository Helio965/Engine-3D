import type { EngineDefinition } from '../types/engine';

/**
 * Full-load torque curve approximation.
 *
 * Manufacturers rarely publish the whole curve, so the curve is built from the
 * published anchor points only (peak torque rpm/plateau, peak power rpm) and
 * smoothly interpolated with a monotone cubic (Fritsch–Carlson). The UI labels
 * every curve as "Curva aproximada para visualização".
 */

export interface CurvePoint {
  rpm: number;
  value: number;
}

/** Monotone cubic Hermite interpolation (no overshoot between anchors). */
export function monotoneCubic(points: CurvePoint[]): (x: number) => number {
  const pts = [...points].sort((a, b) => a.rpm - b.rpm);
  const n = pts.length;
  if (n === 0) return () => 0;
  if (n === 1) return () => pts[0].value;
  const xs = pts.map((p) => p.rpm);
  const ys = pts.map((p) => p.value);
  const d: number[] = [];
  const m: number[] = [];
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  m.push(d[0]);
  for (let i = 1; i < n - 1; i++) {
    if (d[i - 1] * d[i] <= 0) m.push(0);
    else {
      const w1 = 2 * (xs[i + 1] - xs[i]) + (xs[i] - xs[i - 1]);
      const w2 = (xs[i + 1] - xs[i]) + 2 * (xs[i] - xs[i - 1]);
      m.push((w1 + w2) / (w1 / d[i - 1] + w2 / d[i]));
    }
  }
  m.push(d[n - 2]);
  return (x: number) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0;
    while (i < n - 2 && x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i];
    const t = (x - xs[i]) / h;
    const t2 = t * t;
    const t3 = t2 * t;
    return (
      (2 * t3 - 3 * t2 + 1) * ys[i] +
      (t3 - 2 * t2 + t) * h * m[i] +
      (-2 * t3 + 3 * t2) * ys[i + 1] +
      (t3 - t2) * h * m[i + 1]
    );
  };
}

export const torqueFromPower = (kw: number, rpm: number) => (kw * 1000) / ((rpm * 2 * Math.PI) / 60);
export const powerFromTorque = (nm: number, rpm: number) => (nm * rpm * 2 * Math.PI) / 60 / 1000;

/**
 * Anchor points of the brake torque curve at full load (steady state).
 * Values below the torque peak follow typical shapes: naturally aspirated
 * engines keep ~60–70 % of peak torque at idle, forced-induction engines are
 * lower off-boost.
 */
export function torqueAnchors(def: EngineDefinition): CurvePoint[] {
  const p = def.performance;
  const [tFrom, tTo] = Array.isArray(p.torqueRpm) ? p.torqueRpm : [p.torqueRpm, p.torqueRpm];
  const tPowerPeak = torqueFromPower(p.powerKw, p.powerRpm);
  const forced = def.engine.aspiration !== 'na';
  const lowFrac = def.engine.aspiration === 'turbo' ? 0.42 : forced ? 0.62 : 0.66;
  const idle = p.idleRpm;
  const pts: CurvePoint[] = [{ rpm: idle * 0.5, value: p.torqueNm * lowFrac * 0.85 }];
  pts.push({ rpm: idle, value: p.torqueNm * lowFrac });
  const mid = idle + (tFrom - idle) * 0.5;
  if (mid > idle + 200 && mid < tFrom - 200) {
    pts.push({ rpm: mid, value: p.torqueNm * (lowFrac + (1 - lowFrac) * 0.72) });
  }
  for (const q of p.publishedTorquePoints ?? []) {
    // a published point replaces the generic mid-range shape around it
    for (let i = pts.length - 1; i >= 0; i--) if (pts[i].rpm > idle && Math.abs(pts[i].rpm - q.rpm) < 600) pts.splice(i, 1);
    if (q.rpm > idle && q.rpm < tFrom) pts.push({ rpm: q.rpm, value: q.nm });
  }
  pts.push({ rpm: tFrom, value: p.torqueNm });
  if (tTo > tFrom + 50) pts.push({ rpm: tTo, value: p.torqueNm });
  if (p.powerRpm > tTo + 50) {
    pts.push({ rpm: p.powerRpm, value: Math.min(tPowerPeak, p.torqueNm) });
  }
  const limit = Math.max(p.revLimitRpm, p.powerRpm + 100);
  if (limit > p.powerRpm + 50) {
    // Past peak power, power drops gently (~4 % at the limiter).
    const kwAtLimit = p.powerKw * (limit - p.powerRpm > 600 ? 0.93 : 0.96);
    pts.push({ rpm: limit, value: Math.min(torqueFromPower(kwAtLimit, limit), tPowerPeak) });
  }
  pts.push({ rpm: limit + 1500, value: torqueFromPower(p.powerKw * 0.75, limit + 1500) });
  return pts;
}

export function buildTorqueCurve(def: EngineDefinition): (rpm: number) => number {
  return monotoneCubic(torqueAnchors(def));
}

/**
 * Steady-state full-load boost curve (bar above atmosphere) for forced
 * induction engines. Returns 0 for naturally aspirated engines.
 */
export function buildBoostCurve(def: EngineDefinition): (rpm: number) => number {
  const e = def.engine;
  if (e.turbo) {
    const t = e.turbo;
    const idle = def.performance.idleRpm;
    return monotoneCubic([
      { rpm: idle, value: t.maxBoostBar * 0.05 },
      { rpm: idle + (t.fullBoostRpm - idle) * 0.5, value: t.maxBoostBar * 0.55 },
      { rpm: t.fullBoostRpm, value: t.maxBoostBar },
      { rpm: def.performance.revLimitRpm, value: t.maxBoostBar * 0.97 },
    ]);
  }
  if (e.supercharger) {
    const s = e.supercharger;
    const idle = def.performance.idleRpm;
    // positive-displacement compressors build boost almost immediately
    return monotoneCubic([
      { rpm: idle, value: s.maxBoostBar * 0.45 },
      { rpm: 2500, value: s.maxBoostBar * 0.85 },
      { rpm: 4000, value: s.maxBoostBar },
      { rpm: def.performance.revLimitRpm, value: s.maxBoostBar },
    ]);
  }
  return () => 0;
}
