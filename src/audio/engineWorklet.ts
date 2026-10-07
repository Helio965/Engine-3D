import { EngineSynth } from './engineSynth';
import type { SynthMessage } from './synthTypes';

/**
 * AudioWorklet entry point (loaded by AudioEngine through Vite's `?worker&url`,
 * so it is bundled with its imports and served from a relative path).
 */

// AudioWorkletGlobalScope members (not part of the DOM typings)
declare const sampleRate: number;
declare const currentTime: number;
declare class AudioWorkletProcessor {
  readonly port: MessagePort;
}
declare function registerProcessor(name: string, ctor: new () => AudioWorkletProcessor): void;

class EngineSynthProcessor extends AudioWorkletProcessor {
  private readonly synth = new EngineSynth(sampleRate);

  constructor() {
    super();
    this.port.onmessage = (e: MessageEvent<SynthMessage>) => this.synth.handle(e.data, currentTime);
  }

  process(_inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
    const out = outputs[0];
    this.synth.process(out[0], out[1] ?? out[0], currentTime);
    return true;
  }
}

registerProcessor('engine-synth', EngineSynthProcessor);
