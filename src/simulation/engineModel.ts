/**
 * Engine torque, friction, pumping and fuel-flow models.
 *
 * These are engineering approximations meant to be mechanically coherent,
 * NOT certified figures:
 *  - friction mean effective pressure: Heywood-style polynomial in rpm;
 *  - pumping losses proportional to manifold vacuum;
 *  - indicated torque proportional to absolute manifold pressure, calibrated
 *    so that at wide-open throttle (and steady-state boost) the brake torque
 *    equals the published full-load curve;
 *  - fuel flow from indicated power and an indicated specific fuel consumption
 *    with full-load enrichment.
 */

export const ATM_BAR = 1.01325;
export const GASOLINE_DENSITY_G_PER_L = 745;
export const GASOLINE_LHV_KJ_PER_G = 43;

/** Indicated specific fuel consumption at stoichiometric part load (g/kWh). */
export const ISFC_G_PER_KWH = 225;

/** Friction mean effective pressure (bar) as a function of rpm. */
export function fmepBar(rpm: number): number {
  const k = rpm / 1000;
  return 0.97 + 0.15 * k + 0.05 * k * k;
}

/** Converts a mean effective pressure (bar) into crank torque (Nm). */
export function mepToTorque(bar: number, displacementCc: number): number {
  return (bar * 1e5 * (displacementCc * 1e-6)) / (4 * Math.PI);
}

export function frictionTorque(rpm: number, displacementCc: number): number {
  if (rpm <= 0) return 0;
  // static breakaway friction + speed dependent part
  return mepToTorque(fmepBar(rpm), displacementCc);
}

/** Maximum pumping mean effective pressure at fully closed throttle (bar). */
export const PMEP_MAX_BAR = 0.9;

export function pumpingTorque(manifoldFraction: number, displacementCc: number): number {
  return mepToTorque(PMEP_MAX_BAR * Math.max(0, 1 - manifoldFraction), displacementCc);
}

/**
 * Throttle airflow model. The throttle plate limits the air the engine can
 * draw; above the rpm the plate can feed, manifold pressure falls ∝ 1/rpm.
 * This gives the familiar behaviour that a fixed pedal position settles at a
 * fixed free-revving rpm in neutral.
 */
export const THROTTLE_FLOW_RPM = 13750;
export const MIN_MANIFOLD_FRACTION = 0.16;

export function throttleArea(plate: number): number {
  const p = Math.min(1, Math.max(0, plate));
  return Math.pow(p, 1.5);
}

export function manifoldTarget(plate: number, rpm: number): number {
  const air = THROTTLE_FLOW_RPM * throttleArea(plate);
  return Math.min(1, Math.max(MIN_MANIFOLD_FRACTION, air / Math.max(rpm, 120)));
}

/**
 * Indicated torque at the given absolute manifold pressure.
 * @param brakeFullLoad published full-load brake torque at this rpm (Nm)
 * @param boostSteadyState steady-state full-load boost at this rpm (bar)
 * @param manifold absolute manifold pressure as a fraction of atmospheric
 *        (throttled part, 0.16..1) — boost is added on top
 * @param boost current boost (bar above atmosphere)
 */
export function indicatedTorque(
  brakeFullLoad: number,
  frictionNm: number,
  boostSteadyState: number,
  manifold: number,
  boost: number,
): number {
  const indicatedFullSteady = brakeFullLoad + frictionNm;
  const naturallyAspirated = indicatedFullSteady / (1 + boostSteadyState / ATM_BAR);
  const absolute = manifold + boost / ATM_BAR;
  return naturallyAspirated * absolute;
}

/**
 * Fuel enrichment factor: stoichiometric at part load, richer near full load
 * (component protection), slightly richer again under boost.
 */
export function enrichment(loadFraction: number, boostFraction: number): number {
  const x = Math.min(1, Math.max(0, (loadFraction - 0.82) / 0.18));
  const wot = x * x * (3 - 2 * x);
  return 1 + 0.16 * wot + 0.08 * Math.max(0, boostFraction);
}

/** Fuel mass flow (g/s) from indicated power. */
export function fuelMassFlow(indicatedKw: number, loadFraction: number, boostFraction: number): number {
  if (indicatedKw <= 0) return 0;
  return (indicatedKw * ISFC_G_PER_KWH * enrichment(loadFraction, boostFraction)) / 3600;
}

export const gramsToLitres = (g: number) => g / GASOLINE_DENSITY_G_PER_L;
