import type { SoundParams } from './soundProfiles';

/** Messages between the main thread (AudioEngine) and the synthesiser (worklet). */

export const EV_FIRE = 0;
export const EV_INTAKE = 1;
export const EV_VALVE = 2;
export type EventKind = typeof EV_FIRE | typeof EV_INTAKE | typeof EV_VALVE;

export interface CrankEventSpec {
  /** Cycle angle 0..720 (crank degrees). */
  deg: number;
  kind: EventKind;
  /** Cylinder index (0-based, by cylinder number). */
  cyl: number;
  /** Exhaust path the cylinder feeds. */
  path: number;
}

export interface SynthConfig {
  type: 'config';
  params: SoundParams;
  events: CrankEventSpec[];
  cylinders: number;
  /** Number of exhaust paths (1 or 2) and their stereo position (−1..1). */
  paths: number;
  pathPan: number[];
  idleRpm: number;
  redlineRpm: number;
  /** Colour of the valvetrain clicks (Hz). */
  tickHz: number;
  /** One stereo position per turbocharger (empty: no turbo). */
  turboPan: number[];
  turboMaxRpm: number;
  /** Supercharger rotor speed at the rev limit (0: no supercharger). */
  scMaxRpm: number;
  seed: number;
}

export const IGN_OFF = 0;
export const IGN_CRANKING = 1;
export const IGN_RUNNING = 2;

/** Engine state, sent once per animation frame. */
export interface SynthFrame {
  type: 'frame';
  /** Crank angle (0..720) of the simulation… */
  crankDeg: number;
  /** …and the audio-context time at which that state must be heard. */
  at: number;
  /** Effective crank speed: simulation rpm × slow-motion factor. */
  rpm: number;
  timeScale: number;
  ignition: number;
  combusting: boolean;
  /** Cylinder filling relative to full boost (0..1). */
  charge: number;
  /** Throttle plate opening (0..1). */
  plate: number;
  /** Boost relative to the maximum (0..1). */
  boost: number;
  /** Turbo shaft speed relative to the maximum, and whether each turbo is on line. */
  turbo: number[];
  turboOn: boolean[];
  /** Supercharger rotor speed (simulation rpm). */
  scRpm: number;
  /** > 0 on the frame a blow-off/diverter valve opens (strength 0..1). */
  blowOff: number;
}

export type SynthMessage = SynthConfig | SynthFrame;
