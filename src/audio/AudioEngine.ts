import type { EngineSimulation } from '../simulation/EngineSimulation';
import type { EngineDefinition } from '../types/engine';

/**
 * Procedural engine sound (Web Audio). Placeholder implementation: the real
 * synthesiser lives in ./engineWorklet and is wired in by AudioEngine.init().
 */
class AudioEngineImpl {
  private ctx: AudioContext | null = null;

  /** Must be called from a user gesture (browser autoplay policy). */
  async init(): Promise<void> {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') await this.ctx.resume();
      return;
    }
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
  }

  get ready(): boolean {
    return !!this.ctx;
  }

  setEngine(_def: EngineDefinition): void {}

  update(_sim: EngineSimulation, _timeScale: number, _volume: number): void {}
}

export const audioEngine = new AudioEngineImpl();
