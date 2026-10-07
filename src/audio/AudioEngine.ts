import type { EngineSimulation } from '../simulation/EngineSimulation';
import type { EngineDefinition } from '../types/engine';
import { buildSynthConfig, frameFromSim } from './synthConfig';
import workletUrl from './engineWorklet.ts?worker&url';

/** A rendered frame reaches the screen about one refresh after the simulation step. */
const DISPLAY_LAG_S = 1 / 60;
/** Silence (volume 0, engine stopped) lasting this long suspends the AudioContext. */
const SUSPEND_AFTER_S = 1.5;

/**
 * Procedural engine sound. The synthesiser runs in an AudioWorklet
 * (./engineWorklet → ./engineSynth); this class owns the AudioContext, sends
 * the engine configuration (firing events from the crank layout + sound
 * profile) and, every animation frame, the simulation state stamped with the
 * audio-context time at which it must be heard.
 */
class AudioEngineImpl {
  private ctx: AudioContext | null = null;
  private node: AudioWorkletNode | null = null;
  private out: GainNode | null = null;
  private def: EngineDefinition | null = null;
  private configured: EngineDefinition | null = null;
  private sim: EngineSimulation | null = null;
  private lastBlowOff = 0;
  private volume = -1;
  private quietSince = -1;
  private autoSuspended = false;

  /** Must be called from a user gesture (browser autoplay policy). Never throws. */
  async init(): Promise<void> {
    if (!this.ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      try {
        this.ctx = new AC({ latencyHint: 'interactive' });
      } catch (err) {
        console.warn('[audio] AudioContext unavailable:', err);
        return;
      }
      void this.load(this.ctx);
      document.addEventListener('visibilitychange', () => document.hidden && this.suspend());
    }
    this.autoSuspended = false;
    // not awaited: the engine must not wait for the audio device to start
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => undefined);
  }

  get ready(): boolean {
    return !!this.node;
  }

  setEngine(def: EngineDefinition): void {
    this.def = def;
    this.sendConfig();
  }

  /** Called every animation frame by the SimulationDriver. */
  update(sim: EngineSimulation, timeScale: number, volume: number): void {
    const ctx = this.ctx;
    const node = this.node;
    const out = this.out;
    if (!ctx || !node || !out) return;

    const audible = volume > 0 && (sim.ignition !== 'off' || sim.rpm > 1) && !document.hidden;
    const now = performance.now() / 1000;
    if (audible) {
      this.quietSince = -1;
      if (ctx.state === 'suspended' && this.autoSuspended) {
        this.autoSuspended = false;
        ctx.resume().catch(() => undefined);
      }
    } else if (this.quietSince < 0) this.quietSince = now;
    else if (now - this.quietSince > SUSPEND_AFTER_S) this.suspend();
    if (ctx.state !== 'running') return;

    if (volume !== this.volume) {
      out.gain.setTargetAtTime(volume, ctx.currentTime, 0.05);
      this.volume = volume;
    }

    if (sim !== this.sim) {
      this.sim = sim;
      this.lastBlowOff = sim.blowOffAt;
    }
    const blowOff = sim.blowOffAt !== this.lastBlowOff;
    this.lastBlowOff = sim.blowOffAt;
    node.port.postMessage(frameFromSim(sim, timeScale, this.heardAt(ctx), blowOff));
  }

  private async load(ctx: AudioContext): Promise<void> {
    try {
      // AudioWorklet needs a secure context (https or localhost)
      if (!ctx.audioWorklet) throw new Error('AudioWorklet not supported');
      await ctx.audioWorklet.addModule(workletUrl);
      const node = new AudioWorkletNode(ctx, 'engine-synth', { numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [2] });
      const out = ctx.createGain();
      out.gain.value = 0;
      node.connect(out).connect(ctx.destination);
      this.node = node;
      this.out = out;
      this.sendConfig();
    } catch (err) {
      console.warn('[audio] engine sound unavailable:', err);
    }
  }

  private sendConfig(): void {
    if (!this.node || !this.def || this.configured === this.def) return;
    this.node.port.postMessage(buildSynthConfig(this.def));
    this.configured = this.def;
  }

  /** Audio-context time at which the state simulated for this frame will be on screen. */
  private heardAt(ctx: AudioContext): number {
    const ts = ctx.getOutputTimestamp?.();
    const base =
      ts?.contextTime !== undefined && ts.performanceTime
        ? ts.contextTime + (performance.now() - ts.performanceTime) / 1000
        : ctx.currentTime - ctx.baseLatency - (ctx.outputLatency || 0);
    return base + DISPLAY_LAG_S;
  }

  private suspend(): void {
    if (!this.ctx || this.ctx.state !== 'running') return;
    this.autoSuspended = true;
    this.ctx.suspend().catch(() => undefined);
  }
}

export const audioEngine = new AudioEngineImpl();
