import { CrankClock, cycleDiff } from './crankClock';
import type { SoundParams } from './soundProfiles';
import { EV_FIRE, EV_INTAKE, IGN_CRANKING, IGN_RUNNING, type SynthConfig, type SynthFrame, type SynthMessage } from './synthTypes';

/**
 * Procedural engine synthesiser (pure DSP, runs inside the AudioWorklet).
 *
 * Every exhaust pulse is triggered by the crank angle passing a cylinder's
 * firing TDC (CrankClock), so the rhythm — even 72° on a V10, uneven per bank
 * on a cross-plane V8 — comes from the engine data. Pulses of each exhaust
 * path feed their own resonators (primary pipe comb, muffler comb, body
 * band-pass, brightness low-pass) and are panned by bank. On top: induction,
 * valvetrain clicks, starter motor, turbo whistle/whoosh, blow-off and
 * supercharger whine.
 *
 * Clock: the synth integrates its own crank phase at the effective rpm
 * (simulation rpm × slow-motion factor) and is gently pulled toward the
 * main-thread crank angle, time-stamped in audio-context time, so pulses land
 * with the visual combustion glow. Slow motion slows everything crank- or
 * shaft-locked; resonances and short decays drop in pitch with it down to
 * 1/4 (PITCH_FLOOR) so each combustion stays audible in extreme slow motion.
 */

const TABLE = 1024;
const MAX_VOICES = 16;
const PITCH_FLOOR = 0.25;
const TWO_PI = Math.PI * 2;
/** Starter motor speed / crank speed, and pinion teeth (perceptual values). */
const STARTER_RATIO = 12;
const STARTER_TEETH = 9;
/** Audible whistle tone per shaft revolution (perceptual, not a blade count). */
const WHISTLE_ORDER = 2;
/** Supercharger whine tone per rotor revolution (perceptual, not a lobe count). */
const WHINE_ORDER = 4;
const TURBO_DETUNE = [0, 0.006, -0.005, 0.011];
const MASTER = 0.32;

const clamp = (x: number, lo: number, hi: number) => (x < lo ? lo : x > hi ? hi : x);

/** Rational tanh approximation (soft saturation). */
function sat(x: number): number {
  if (x >= 3) return 1;
  if (x <= -3) return -1;
  const x2 = x * x;
  return (x * (27 + x2)) / (27 + 9 * x2);
}

/** Exhaust pressure pulse: fast rise, profile-dependent decay, then a rarefaction lobe. */
export function buildPulseTable(p: Pick<SoundParams, 'attack' | 'sharpness'>): Float32Array {
  const pos = new Float64Array(TABLE + 1);
  const neg = new Float64Array(TABLE + 1);
  let sp = 0;
  let sn = 0;
  for (let i = 0; i <= TABLE; i++) {
    const x = i / TABLE;
    const rise = x < p.attack ? Math.sin((0.5 * Math.PI * x) / p.attack) ** 2 : 1;
    pos[i] = rise * Math.exp((-p.sharpness * Math.max(0, x - p.attack)) / (1 - p.attack)) * (1 - x);
    neg[i] = Math.sin(Math.PI * x) ** 3;
    sp += pos[i];
    sn += neg[i];
  }
  const k = (0.75 * sp) / sn;
  const out = new Float32Array(TABLE + 2);
  let peak = 0;
  for (let i = 0; i <= TABLE; i++) peak = Math.max(peak, Math.abs(pos[i] - k * neg[i]));
  for (let i = 0; i <= TABLE; i++) out[i] = (pos[i] - k * neg[i]) / peak;
  return out;
}

class Biquad {
  private b0 = 1;
  private b1 = 0;
  private b2 = 0;
  private a1 = 0;
  private a2 = 0;
  private z1 = 0;
  private z2 = 0;

  /** RBJ cookbook: 0 = low-pass, 1 = band-pass (0 dB peak), 2 = high-pass. */
  set(kind: 0 | 1 | 2, f: number, q: number, sr: number): void {
    const w = (TWO_PI * clamp(f, 5, sr * 0.45)) / sr;
    const cs = Math.cos(w);
    const alpha = Math.sin(w) / (2 * q);
    const a0 = 1 + alpha;
    if (kind === 0) {
      this.b0 = this.b2 = (1 - cs) / 2 / a0;
      this.b1 = (1 - cs) / a0;
    } else if (kind === 1) {
      this.b0 = alpha / a0;
      this.b1 = 0;
      this.b2 = -alpha / a0;
    } else {
      this.b0 = this.b2 = (1 + cs) / 2 / a0;
      this.b1 = -(1 + cs) / a0;
    }
    this.a1 = (-2 * cs) / a0;
    this.a2 = (1 - alpha) / a0;
  }

  run(x: number): number {
    const y = this.b0 * x + this.z1;
    this.z1 = this.b1 * x - this.a1 * y + this.z2;
    this.z2 = this.b2 * x - this.a2 * y;
    return y;
  }
}

/** Feedback comb (pipe resonance) with a fractional delay and an in-loop low-pass. */
class Comb {
  private readonly buf: Float32Array;
  private readonly mask: number;
  private w = 0;
  private lp = 0;

  constructor(size: number) {
    this.buf = new Float32Array(size);
    this.mask = size - 1;
  }

  get maxDelay(): number {
    return this.mask - 1;
  }

  run(x: number, delay: number, fb: number, damp: number): number {
    const rp = this.w - delay;
    const i = Math.floor(rp);
    const a = this.buf[i & this.mask];
    const d = a + (this.buf[(i + 1) & this.mask] - a) * (rp - i);
    this.lp += (d - this.lp) * damp;
    const y = x + fb * this.lp;
    this.buf[this.w] = y;
    this.w = (this.w + 1) & this.mask;
    return y;
  }
}

interface PathDsp {
  pipe: Comb;
  tail: Comb;
  body: Biquad;
  lp: Biquad;
  hp: Biquad;
  gl: number;
  gr: number;
}

export class EngineSynth {
  private readonly sr: number;
  private cfg: SynthConfig | null = null;
  private pending: SynthConfig | null = null;
  private frame: SynthFrame | null = null;
  private lastFrameAt = -1;
  private needSnap = true;

  private clock = new CrankClock([]);
  private hits = new Int32Array(64);
  private evKind = new Uint8Array(0);
  private evCyl = new Uint16Array(0);
  private evPath = new Uint8Array(0);
  private cylGain = new Float32Array(0);
  private pulse: Float32Array = new Float32Array(TABLE + 2);
  private paths: PathDsp[] = [];
  private fires = 0;

  // exhaust pulse voices (struct of arrays)
  private vOn = new Uint8Array(MAX_VOICES);
  private vPath = new Uint8Array(MAX_VOICES);
  private vWait = new Int32Array(MAX_VOICES);
  private vPos = new Float64Array(MAX_VOICES);
  private vInc = new Float64Array(MAX_VOICES);
  private vAmp = new Float32Array(MAX_VOICES);
  private vNoise = new Float32Array(MAX_VOICES);

  // smoothed state
  private rate = 0; // crank degrees per sample
  private rpm = 0; // simulation rpm (timbre)
  private ps = 1; // pitch scale (slow motion)
  private charge = 0;
  private plate = 0;
  private boost = 0;
  private heat = 0;
  private starter = 0;
  private fade = 0;
  private turbo = new Float32Array(4);
  private turboOn = new Float32Array(4);
  private turboPhase = new Float64Array(4);
  private scRpm = 0;
  private scPhase = 0;
  private motorPhase = 0;

  // event envelopes
  private intakeEnv = 0;
  private tickEnv = 0;
  private load = 0; // starter load from compression strokes
  private bov = 0;
  private bovT = 0;

  private intakeBp = new Biquad();
  private tickBp = new Biquad();
  private whooshBp = new Biquad();
  private bovBp = new Biquad();
  private starterLp = new Biquad();
  private rng = 0x1234567;

  constructor(sampleRate: number) {
    this.sr = sampleRate;
  }

  handle(msg: SynthMessage, now: number): void {
    if (msg.type === 'config') {
      // swap engines behind a short fade so resonators never click
      if (this.cfg) this.pending = msg;
      else this.apply(msg);
      return;
    }
    if (this.lastFrameAt < 0 || now - this.lastFrameAt > 0.25) this.needSnap = true;
    this.frame = msg;
    this.lastFrameAt = now;
    if (msg.blowOff > 0) {
      this.bov = Math.max(this.bov, msg.blowOff);
      this.bovT = 0;
    }
  }

  private apply(cfg: SynthConfig): void {
    this.cfg = cfg;
    this.pending = null;
    this.clock = new CrankClock(cfg.events.map((e) => e.deg));
    this.hits = new Int32Array(Math.max(1, cfg.events.length));
    this.evKind = Uint8Array.from(cfg.events, (e) => e.kind);
    this.evCyl = Uint16Array.from(cfg.events, (e) => e.cyl);
    this.evPath = Uint8Array.from(cfg.events, (e) => e.path);
    this.rng = cfg.seed | 1;
    this.cylGain = Float32Array.from({ length: cfg.cylinders }, () => 1 + cfg.params.cylSpread * this.noise());
    this.pulse = buildPulseTable(cfg.params);
    let size = 1024;
    while (size < this.sr * 0.08) size *= 2;
    this.paths = cfg.pathPan.map((pan) => {
      const a = ((pan + 1) * Math.PI) / 4;
      return { pipe: new Comb(size), tail: new Comb(size), body: new Biquad(), lp: new Biquad(), hp: new Biquad(), gl: Math.cos(a) * Math.SQRT2, gr: Math.sin(a) * Math.SQRT2 };
    });
    this.vOn.fill(0);
    this.turbo.fill(0);
    this.turboOn.fill(0);
    this.intakeEnv = this.tickEnv = this.load = this.bov = this.starter = this.heat = 0;
    this.needSnap = true;
  }

  private noise(): number {
    let x = this.rng;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    this.rng = x;
    return x / 2147483648;
  }

  /** Renders one block. `now` is the audio-context time of its first sample. */
  process(outL: Float32Array, outR: Float32Array, now: number): void {
    const n = outL.length;
    if (this.pending && this.fade < 1e-3) this.apply(this.pending);
    const cfg = this.cfg;
    const f = this.frame;
    const live = !!cfg && !!f && !this.pending && now - this.lastFrameAt < 0.3;
    if (!cfg || !f || (!live && this.fade < 1e-4)) {
      outL.fill(0);
      outR.fill(0);
      this.fade = 0;
      return;
    }
    const P = cfg.params;
    const sr = this.sr;

    // ---- crank clock: extrapolate the main-thread angle and steer toward it
    const degPerSec = f.rpm * 6;
    const target = f.crankDeg + degPerSec * (now - f.at);
    let err = cycleDiff(target, this.clock.phase);
    if (this.needSnap || Math.abs(err) > 180 || (Math.abs(err) > 45 && degPerSec < 3000)) {
      this.clock.reset(target);
      this.rate = degPerSec / sr;
      this.needSnap = false;
      err = 0;
    }
    const tau = 0.1 + 0.3 * Math.min(1, f.rpm / 6000);
    const maxCorr = 0.04 * degPerSec + 30;
    const rateTarget = Math.max(0, degPerSec + clamp(err / tau, -maxCorr, maxCorr)) / sr;

    // ---- block-rate parameters
    const ts = Math.max(1e-3, f.timeScale);
    this.ps += (Math.max(ts, PITCH_FLOOR) - this.ps) * Math.min(1, n / (0.15 * sr));
    const ps = this.ps;
    const simRpm = f.rpm / ts;
    const rpmFrac = clamp(this.rpm / cfg.redlineRpm, 0, 1.2);
    const running = f.ignition === IGN_RUNNING;
    const kFast = 1 - Math.exp(-1 / (0.02 * sr));
    const kSlow = 1 - Math.exp(-1 / (0.06 * sr));
    const fadeK = 1 - Math.exp(-1 / (0.03 * sr));
    const fadeTarget = live ? 1 : 0;
    const heatTarget = f.combusting ? f.charge * Math.min(1, rpmFrac) : 0;
    this.heat += (heatTarget - this.heat) * Math.min(1, n / (1.5 * sr));
    const heatK = 1 + 0.15 * this.heat;

    const pipeD = Math.min((P.pipeMs * sr) / 1000 / ps / heatK, this.paths[0].pipe.maxDelay);
    const tailD = Math.min((P.tailMs * sr) / 1000 / ps / heatK, this.paths[0].tail.maxDelay);
    const pipeDamp = 1 - Math.exp((-TWO_PI * P.pipeLpHz * ps) / sr);
    const lpHz = (P.lpIdleHz + (P.lpRedlineHz - P.lpIdleHz) * Math.min(1, rpmFrac)) * (0.75 + 0.25 * this.plate + 0.15 * this.charge) * ps;
    for (const p of this.paths) {
      p.body.set(1, P.bodyHz * ps * heatK, P.bodyQ, sr);
      p.lp.set(0, lpHz, 0.707, sr);
      p.hp.set(2, 25 * ps, 0.707, sr);
    }
    const shapeNorm = 1 / sat(P.drive);
    const bias = 0.15;
    const biasOut = sat(bias);

    const intakeGain = P.intake * Math.pow(this.plate, 0.8) * (0.15 + 0.85 * Math.min(1, rpmFrac));
    this.intakeBp.set(1, P.intakeHz * (0.7 + 0.6 * Math.min(1, rpmFrac)) * ps, 1.2, sr);
    const intakeDecay = Math.exp(-this.rate / 60);
    const mechGain = this.rpm > 1 ? P.mech * (0.2 + 0.8 * Math.sqrt(Math.min(1, rpmFrac))) : 0;
    this.tickBp.set(1, cfg.tickHz * ps, 1.5, sr);
    const tickDecay = Math.exp(-1 / (0.0006 * sr / ps));
    const loadDecay = Math.exp(-this.rate / 90);

    const turbos = cfg.turboPan.length;
    let spool = 0;
    for (let i = 0; i < turbos; i++) spool += this.turbo[i] * this.turbo[i] * this.turboOn[i];
    spool = turbos ? spool / turbos : 0;
    const whooshGain = P.whoosh * spool * (0.3 + 0.7 * this.plate);
    this.whooshBp.set(1, (900 + 2600 * Math.sqrt(spool)) * ps, 0.9, sr);
    this.bovBp.set(1, (P.blowOff === 'hiss' ? 2600 : 750) * ps, P.blowOff === 'hiss' ? 0.8 : 1.3, sr);
    const bovDecay = Math.exp(-1 / ((P.blowOff === 'hiss' ? 0.22 : 0.45) * sr / ps));
    const flutterHz = 16 * ps;
    this.starterLp.set(0, 2500 * ps, 0.707, sr);
    const scFrac = cfg.scMaxRpm ? clamp(this.scRpm / cfg.scMaxRpm, 0, 1.2) : 0;
    const whineGain = cfg.scMaxRpm ? P.whine * Math.pow(scFrac, 1.5) * (0.35 + 0.65 * this.boost) : 0;
    const whineInc = (this.scRpm * ts * WHINE_ORDER) / 60 / sr;
    const twoPaths = this.paths.length > 1;
    const p0 = this.paths[0];
    const p1 = twoPaths ? this.paths[1] : p0;
    let lastL = 0;
    let lastR = 0;

    for (let s = 0; s < n; s++) {
      // smoothed controls
      this.rate += (rateTarget - this.rate) * kFast;
      this.rpm += (simRpm - this.rpm) * kFast;
      this.charge += (f.charge - this.charge) * kFast;
      this.plate += (f.plate - this.plate) * kFast;
      this.boost += (f.boost - this.boost) * kSlow;
      this.scRpm += (f.scRpm - this.scRpm) * kSlow;
      this.starter += ((f.ignition === IGN_CRANKING ? 1 : 0) - this.starter) * kSlow;
      this.fade += (fadeTarget - this.fade) * fadeK;
      for (let i = 0; i < turbos; i++) {
        this.turbo[i] += ((f.turbo[i] ?? 0) - this.turbo[i]) * kSlow;
        this.turboOn[i] += ((f.turboOn[i] ? 1 : 0) - this.turboOn[i]) * kSlow;
      }

      // crank events
      const hitCount = this.clock.advance(this.rate, this.hits);
      for (let h = 0; h < hitCount; h++) {
        const ev = this.hits[h];
        const kind = this.evKind[ev];
        if (kind === EV_FIRE) this.fire(this.evCyl[ev], this.evPath[ev], f, running);
        else if (kind === EV_INTAKE) this.intakeEnv += 0.6 * (0.3 + this.charge);
        else this.tickEnv = 0.6 + 0.4 * Math.abs(this.noise());
      }

      // exhaust pulses
      let x0 = 0;
      let x1 = 0;
      for (let v = 0; v < MAX_VOICES; v++) {
        if (!this.vOn[v]) continue;
        if (this.vWait[v] > 0) {
          this.vWait[v]--;
          continue;
        }
        const t = this.vPos[v] * TABLE;
        const i = t | 0;
        const sh = this.pulse[i] + (this.pulse[i + 1] - this.pulse[i]) * (t - i);
        const nz = this.vNoise[v];
        const val = this.vAmp[v] * (sh * (1 - nz) + nz * (sh > 0 ? sh : -sh) * this.noise() * 1.5);
        if (this.vPath[v]) x1 += val;
        else x0 += val;
        this.vPos[v] += this.vInc[v];
        if (this.vPos[v] >= 1) this.vOn[v] = 0;
      }

      let l = 0;
      let r = 0;
      // exhaust paths: rasp → pipe → muffler → body → brightness → DC block
      const in0 = x0 + P.crossfeed * x1;
      let y = (sat(P.drive * in0 + bias) - biasOut) * shapeNorm;
      y = p0.pipe.run(y, pipeD, P.pipeFb, pipeDamp);
      y = p0.tail.run(y, tailD, P.tailFb, 1);
      y = p0.hp.run(p0.lp.run(y + P.bodyGain * p0.body.run(y)));
      l += y * p0.gl;
      r += y * p0.gr;
      if (twoPaths) {
        const in1 = x1 + P.crossfeed * x0;
        y = (sat(P.drive * in1 + bias) - biasOut) * shapeNorm;
        y = p1.pipe.run(y, pipeD * 1.04, P.pipeFb, pipeDamp);
        y = p1.tail.run(y, tailD * 0.97, P.tailFb, 1);
        y = p1.hp.run(p1.lp.run(y + P.bodyGain * p1.body.run(y)));
        l += y * p1.gl;
        r += y * p1.gr;
      }

      // induction: airbox resonance excited by intake strokes and turbulent flow
      let c = 0;
      if (intakeGain > 1e-4) c += intakeGain * this.intakeBp.run(this.noise() * (0.3 + this.intakeEnv) + 2 * this.intakeEnv);
      this.intakeEnv *= intakeDecay;

      // valvetrain clicks
      if (mechGain > 0) c += mechGain * this.tickBp.run(this.noise() * this.tickEnv);
      this.tickEnv *= tickDecay;

      // starter motor: pinion mesh whine + commutator buzz, slowed by each compression
      if (this.starter > 1e-4) {
        const motorHz = (this.rate * sr * STARTER_RATIO) / 360 * (1 - 0.12 * this.load);
        this.motorPhase = (this.motorPhase + motorHz / sr) % 1;
        const mesh = TWO_PI * ((this.motorPhase * STARTER_TEETH) % 1);
        const buzz = ((this.motorPhase * 2) % 1) * 2 - 1;
        c += this.starter * 0.25 * (0.7 + 0.6 * this.load) * this.starterLp.run(0.5 * Math.sin(mesh) + 0.2 * Math.sin(2 * mesh) + 0.35 * buzz);
      }
      this.load *= loadDecay;

      // turbochargers: one whistle per shaft (detuned), compressor whoosh, blow-off
      for (let i = 0; i < turbos; i++) {
        const fr = this.turbo[i];
        if (fr < 0.01) continue;
        this.turboPhase[i] = (this.turboPhase[i] + (fr * cfg.turboMaxRpm * ts * WHISTLE_ORDER * (1 + TURBO_DETUNE[i & 3])) / 60 / sr) % 1;
        const a = P.whistle * fr * fr * (0.25 + 0.75 * this.boost) * (0.3 + 0.7 * this.turboOn[i]);
        const w = a * Math.sin(TWO_PI * this.turboPhase[i]);
        const pan = cfg.turboPan[i];
        l += w * (1 - pan);
        r += w * (1 + pan);
      }
      if (whooshGain > 1e-4) c += whooshGain * this.whooshBp.run(this.noise());
      if (this.bov > 1e-4) {
        let b = this.bovBp.run(this.noise()) * this.bov;
        if (P.blowOff === 'flutter') {
          const lfo = 0.5 + 0.5 * Math.sin(TWO_PI * flutterHz * this.bovT);
          b *= 2 * lfo * lfo;
        }
        c += P.blowOffGain * b;
        this.bov *= bovDecay;
        this.bovT += 1 / sr;
      }

      // supercharger whine (rotor mesh tone + harmonic)
      if (whineGain > 1e-4) {
        this.scPhase = (this.scPhase + whineInc) % 1;
        c += whineGain * (Math.sin(TWO_PI * this.scPhase) + 0.35 * Math.sin(2 * TWO_PI * this.scPhase));
      }

      const g = MASTER * P.gain * this.fade;
      lastL = sat((l + c) * g);
      lastR = sat((r + c) * g);
      outL[s] = lastL;
      outR[s] = lastR;
    }
    if (!live && this.fade < 1e-4) this.needSnap = true;
  }

  /** Starts an exhaust pulse for one combustion (or a weak pumping pulse without combustion). */
  private fire(cyl: number, path: number, f: SynthFrame, running: boolean): void {
    const cfg = this.cfg!;
    const P = cfg.params;
    const rpm = Math.max(this.rpm, 1);
    let amp: number;
    let nz = P.noise;
    let widthDeg = P.pulseDeg;
    let wait = 0;
    if (running && f.combusting) {
      amp = (0.35 + 0.65 * this.charge) * this.cylGain[cyl] * (1 + P.jitter * this.noise());
      // cam lope: lumpy cycle-to-cycle combustion near idle with the throttle closed
      const lope = P.lope * clamp(2 - rpm / cfg.idleRpm, 0, 1) * (1 - this.plate);
      if (lope > 0) {
        const cycle = Math.floor(this.fires / cfg.cylinders);
        amp *= Math.max(0.2, 1 + lope * (0.5 * Math.sin(cycle * 2.4 + cyl * 1.7) + 0.5 * this.noise()));
        wait = Math.round((Math.abs(this.noise()) * lope * 20) / Math.max(this.rate, 1e-3));
      }
    } else {
      // no combustion (cranking, fuel cut, coasting down): only pumped air
      amp = 0.14 * Math.min(1, rpm / 400) * (0.4 + this.charge);
      nz = Math.min(1, nz + 0.3);
      widthDeg *= 1.3;
      if (f.ignition === IGN_CRANKING) this.load = 1;
    }
    this.fires++;
    // pulse energy grows with firing rate: keep the overall loudness in check
    amp *= Math.pow(cfg.idleRpm / Math.max(rpm, cfg.idleRpm), 0.3);
    const sr = this.sr;
    const minW = (P.pulseMinMs * sr) / 1000 / this.ps;
    const maxW = (0.12 * sr) / this.ps;
    const width = clamp(widthDeg / Math.max(this.rate, 1e-6), minW, maxW);

    // free voice, or steal the one closest to its end
    let v = this.vOn.indexOf(0);
    if (v < 0) {
      v = 0;
      for (let k = 1; k < MAX_VOICES; k++) if (this.vPos[k] > this.vPos[v]) v = k;
    }
    this.vOn[v] = 1;
    this.vPath[v] = path;
    this.vWait[v] = Math.min(wait, Math.round(0.05 * sr));
    this.vPos[v] = 0;
    this.vInc[v] = 1 / width;
    this.vAmp[v] = amp;
    this.vNoise[v] = nz;
  }
}
