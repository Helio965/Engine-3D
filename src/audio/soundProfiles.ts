import type { SoundProfile } from '../types/engine';

/**
 * Synthesis character of each sound profile. These are tuning values of the
 * synthesiser (perceptual), not engine specifications: the firing rhythm
 * itself always comes from the engine data (firing order, intervals, banks).
 *
 * Time values are milliseconds and frequencies Hz at real-time playback; they
 * scale with the slow-motion factor inside the synthesiser.
 */
export interface SoundParams {
  /** Exhaust blowdown pulse width (crank degrees) and its shortest duration (ms). */
  pulseDeg: number;
  pulseMinMs: number;
  /** Rise time as a fraction of the pulse width. */
  attack: number;
  /** Decay steepness of the pulse (higher = sharper edge, more harmonics). */
  sharpness: number;
  /** Turbulent (noise) share of each pulse, 0..1. */
  noise: number;
  /** Fixed amplitude spread between cylinders (unequal runners), 0..1. */
  cylSpread: number;
  /** Random cycle-to-cycle amplitude variation, 0..1. */
  jitter: number;
  /** Primary pipe resonator: delay (ms), feedback (negative = closed-open pipe, odd harmonics), in-loop low-pass (Hz). */
  pipeMs: number;
  pipeFb: number;
  pipeLpHz: number;
  /** Muffler / tail-pipe resonator. */
  tailMs: number;
  tailFb: number;
  /** Body resonance (band-pass) mixed onto the exhaust. */
  bodyHz: number;
  bodyQ: number;
  bodyGain: number;
  /** Exhaust brightness: low-pass cut-off at idle and at the redline. */
  lpIdleHz: number;
  lpRedlineHz: number;
  /** Saturation of the pulse train (rasp), 1 = mild. */
  drive: number;
  /** Share of one exhaust path leaking into the other (X/H pipe, common collector). */
  crossfeed: number;
  /** Stereo spread between exhaust paths, 0..1. */
  pan: number;
  /** Induction roar level and airbox resonance (Hz). */
  intake: number;
  intakeHz: number;
  /** Valvetrain ticking level. */
  mech: number;
  /** Turbo whistle and compressor whoosh levels (turbo engines only). */
  whistle: number;
  whoosh: number;
  /** Blow-off sound: diverter-valve hiss or compressor-surge flutter. */
  blowOff: 'hiss' | 'flutter';
  blowOffGain: number;
  /** Supercharger whine level (supercharged engines only). */
  whine: number;
  /** Cam lope at idle (uneven cycle-to-cycle combustion), 0..1. */
  lope: number;
  /** Output trim so every profile plays at a similar loudness. */
  gain: number;
}

export const SOUND_PROFILES: Record<SoundProfile, SoundParams> = {
  // deep, dense and smooth: broad overlapping pulses, long pipes, four turbines muffling the exhaust
  'w16-quad-turbo': {
    pulseDeg: 150, pulseMinMs: 2.2, attack: 0.18, sharpness: 3, noise: 0.18, cylSpread: 0.06, jitter: 0.05,
    pipeMs: 7.5, pipeFb: -0.55, pipeLpHz: 1400, tailMs: 13, tailFb: 0.35,
    bodyHz: 78, bodyQ: 1.4, bodyGain: 1.2, lpIdleHz: 900, lpRedlineHz: 2600,
    drive: 1.3, crossfeed: 0.35, pan: 0.25, intake: 0.15, intakeHz: 220, mech: 0.12,
    whistle: 0.55, whoosh: 0.6, blowOff: 'hiss', blowOffGain: 0.5, whine: 0, lope: 0, gain: 1,
  },
  // smooth inline-six, raspy (saturated, noisy pulses), whistle + compressor flutter
  'i6-twin-turbo': {
    pulseDeg: 110, pulseMinMs: 1.6, attack: 0.12, sharpness: 4.5, noise: 0.35, cylSpread: 0.05, jitter: 0.06,
    pipeMs: 4.2, pipeFb: -0.5, pipeLpHz: 3000, tailMs: 9, tailFb: 0.3,
    bodyHz: 160, bodyQ: 1.8, bodyGain: 0.9, lpIdleHz: 1500, lpRedlineHz: 5000,
    drive: 2.4, crossfeed: 0.25, pan: 0.2, intake: 0.25, intakeHz: 400, mech: 0.2,
    whistle: 0.7, whoosh: 0.45, blowOff: 'flutter', blowOffGain: 0.7, whine: 0, lope: 0, gain: 1,
  },
  // high-pitched shriek: narrow sharp pulses, short bright pipes, strong induction howl
  'v10-na': {
    pulseDeg: 85, pulseMinMs: 1.1, attack: 0.08, sharpness: 6, noise: 0.22, cylSpread: 0.04, jitter: 0.04,
    pipeMs: 2.6, pipeFb: 0.55, pipeLpHz: 5000, tailMs: 5.5, tailFb: 0.3,
    bodyHz: 320, bodyQ: 2.2, bodyGain: 0.8, lpIdleHz: 2200, lpRedlineHz: 9000,
    drive: 1.8, crossfeed: 0.1, pan: 0.35, intake: 0.55, intakeHz: 520, mech: 0.25,
    whistle: 0, whoosh: 0, blowOff: 'hiss', blowOffGain: 0, whine: 0, lope: 0, gain: 1,
  },
  // cross-plane burble (uneven bank pulses) + supercharger whine
  'v8-cross-supercharged': {
    pulseDeg: 135, pulseMinMs: 2, attack: 0.12, sharpness: 3.6, noise: 0.28, cylSpread: 0.08, jitter: 0.08,
    pipeMs: 6, pipeFb: -0.6, pipeLpHz: 1800, tailMs: 11, tailFb: 0.4,
    bodyHz: 95, bodyQ: 1.6, bodyGain: 1.3, lpIdleHz: 1000, lpRedlineHz: 4200,
    drive: 2, crossfeed: 0.12, pan: 0.4, intake: 0.3, intakeHz: 300, mech: 0.15,
    whistle: 0, whoosh: 0, blowOff: 'hiss', blowOffGain: 0, whine: 0.55, lope: 0.25, gain: 1,
  },
  // lumpy and loud: wide heavy pulses, open long pipes, strong cam lope, pushrod clatter
  'v8-cross-bigblock': {
    pulseDeg: 160, pulseMinMs: 2.4, attack: 0.1, sharpness: 2.8, noise: 0.35, cylSpread: 0.12, jitter: 0.12,
    pipeMs: 7, pipeFb: -0.65, pipeLpHz: 1500, tailMs: 12, tailFb: 0.45,
    bodyHz: 72, bodyQ: 1.3, bodyGain: 1.6, lpIdleHz: 800, lpRedlineHz: 3600,
    drive: 2.6, crossfeed: 0.05, pan: 0.45, intake: 0.45, intakeHz: 260, mech: 0.4,
    whistle: 0, whoosh: 0, blowOff: 'hiss', blowOffGain: 0, whine: 0, lope: 0.8, gain: 1,
  },
  // flat-plane scream: even alternating banks, sharp bright pulses
  'v8-flat-na': {
    pulseDeg: 90, pulseMinMs: 1.2, attack: 0.07, sharpness: 5.5, noise: 0.2, cylSpread: 0.04, jitter: 0.05,
    pipeMs: 3.2, pipeFb: 0.6, pipeLpHz: 4500, tailMs: 6.5, tailFb: 0.3,
    bodyHz: 260, bodyQ: 2, bodyGain: 0.9, lpIdleHz: 1800, lpRedlineHz: 8000,
    drive: 2.2, crossfeed: 0.08, pan: 0.4, intake: 0.5, intakeHz: 450, mech: 0.2,
    whistle: 0, whoosh: 0, blowOff: 'hiss', blowOffGain: 0, whine: 0, lope: 0, gain: 1,
  },
  // smooth, high harmonic wail: very narrow clean pulses, short pipes, open top end
  'v12-na': {
    pulseDeg: 75, pulseMinMs: 1, attack: 0.06, sharpness: 6.5, noise: 0.12, cylSpread: 0.03, jitter: 0.03,
    pipeMs: 2.3, pipeFb: 0.6, pipeLpHz: 6000, tailMs: 5, tailFb: 0.25,
    bodyHz: 380, bodyQ: 2.4, bodyGain: 0.7, lpIdleHz: 2500, lpRedlineHz: 11000,
    drive: 1.4, crossfeed: 0.1, pan: 0.35, intake: 0.6, intakeHz: 600, mech: 0.15,
    whistle: 0, whoosh: 0, blowOff: 'hiss', blowOffGain: 0, whine: 0, lope: 0, gain: 1,
  },
  // smooth and refined: rounded pulses, damped mid-length pipes, little rasp
  'w12-na': {
    pulseDeg: 115, pulseMinMs: 1.6, attack: 0.12, sharpness: 4, noise: 0.15, cylSpread: 0.04, jitter: 0.03,
    pipeMs: 4.5, pipeFb: -0.45, pipeLpHz: 2600, tailMs: 9, tailFb: 0.35,
    bodyHz: 170, bodyQ: 1.6, bodyGain: 0.9, lpIdleHz: 1300, lpRedlineHz: 5200,
    drive: 1.2, crossfeed: 0.2, pan: 0.3, intake: 0.3, intakeHz: 380, mech: 0.12,
    whistle: 0, whoosh: 0, blowOff: 'hiss', blowOffGain: 0, whine: 0, lope: 0, gain: 1,
  },
};
