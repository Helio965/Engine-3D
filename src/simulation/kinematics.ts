/**
 * Slider-crank kinematics and four-stroke cycle timing.
 *
 * Conventions (shared by the simulation, the renderer and the audio engine):
 *  - The crankshaft turns about the engine's longitudinal axis. `crankDeg` is
 *    the accumulated crank angle in degrees, in the direction of rotation.
 *  - A full four-stroke cycle spans 720° of crank rotation.
 *  - For a cylinder, `cycleDeg` = 0 is top dead centre at the start of the
 *    power stroke (combustion TDC):
 *        0–180   power (expansion)
 *        180–360 exhaust
 *        360–540 intake
 *        540–720 compression
 */

export const DEG = Math.PI / 180;

export type StrokePhase = 'power' | 'exhaust' | 'intake' | 'compression';

export function wrap360(deg: number): number {
  const r = deg % 360;
  return r < 0 ? r + 360 : r;
}

export function wrap720(deg: number): number {
  const r = deg % 720;
  return r < 0 ? r + 720 : r;
}

/**
 * Distance from the crank axis to the piston pin along the cylinder axis.
 * @param localDeg angle of the crank throw measured from the cylinder axis (0 = TDC)
 * @param r crank radius (stroke / 2)
 * @param l connecting-rod length (centre to centre)
 */
export function pistonPinDistance(localDeg: number, r: number, l: number): number {
  const a = localDeg * DEG;
  const s = Math.sin(a);
  return r * Math.cos(a) + Math.sqrt(l * l - r * r * s * s);
}

/** Piston travel from TDC (0 at TDC, = stroke at BDC). */
export function pistonTravelFromTdc(localDeg: number, r: number, l: number): number {
  return r + l - pistonPinDistance(localDeg, r, l);
}

/** Connecting-rod angle relative to the cylinder axis (radians). */
export function rodAngle(localDeg: number, r: number, l: number): number {
  return Math.asin((r / l) * Math.sin(localDeg * DEG));
}

export function strokePhase(cycleDeg: number): StrokePhase {
  const c = wrap720(cycleDeg);
  if (c < 180) return 'power';
  if (c < 360) return 'exhaust';
  if (c < 540) return 'intake';
  return 'compression';
}

/**
 * Typical (not engine-specific) valve events, in cycle degrees. Real cam
 * timing is rarely published; these values keep the cycle order correct:
 * exhaust opens before BDC of the power stroke and closes just after the
 * exhaust TDC; intake opens just before that TDC (overlap) and closes after
 * intake BDC.
 */
export const VALVE_EVENTS = {
  exhaustOpen: 130, // 50° before BDC (power)
  exhaustClose: 370, // 10° after TDC (overlap)
  intakeOpen: 350, // 10° before TDC (overlap)
  intakeClose: 590, // 50° after BDC (intake)
} as const;

/** Smooth lift profile 0..1 between open and close events. */
function liftProfile(c: number, open: number, close: number): number {
  if (c < open || c > close) return 0;
  const t = (c - open) / (close - open);
  // raised-cosine profile: zero slope at seat contact, peak at mid duration
  return 0.5 - 0.5 * Math.cos(2 * Math.PI * t);
}

export function intakeValveLift(cycleDeg: number): number {
  return liftProfile(wrap720(cycleDeg), VALVE_EVENTS.intakeOpen, VALVE_EVENTS.intakeClose);
}

export function exhaustValveLift(cycleDeg: number): number {
  const c = wrap720(cycleDeg);
  // the exhaust event wraps past 360 but never past 720
  return liftProfile(c, VALVE_EVENTS.exhaustOpen, VALVE_EVENTS.exhaustClose);
}

/**
 * Visual combustion intensity (0..1): a short flame kernel right after
 * ignition near TDC, decaying during the first part of the power stroke.
 */
export function combustionGlow(cycleDeg: number): number {
  const c = wrap720(cycleDeg);
  if (c > 60) return 0;
  return Math.exp(-c / 18) * Math.min(1, (c + 4) / 6);
}
