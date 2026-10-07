/**
 * Crank-angle event scheduler shared by the sound synthesiser.
 *
 * Events are fixed points of the 720° four-stroke cycle (combustion TDC,
 * valve seating, intake flow peak…). The clock advances by an arbitrary
 * number of crank degrees and reports, in order, every event it passed —
 * including across the 720° wrap — so pulse spacing comes straight from the
 * engine's real firing angles.
 */

export function wrapCycle(deg: number): number {
  const r = deg % 720;
  return r < 0 ? r + 720 : r;
}

/** Signed shortest difference a − b on the 720° cycle, in (−360, 360]. */
export function cycleDiff(a: number, b: number): number {
  const d = wrapCycle(a - b);
  return d > 360 ? d - 720 : d;
}

export class CrankClock {
  /** Event angles sorted ascending (0..720). */
  private readonly degs: Float64Array;
  /** Caller's index of each sorted event. */
  private readonly ids: Int32Array;
  private next = 0;
  /** Crank degrees left until `next` fires. */
  private toNext = 720;
  /** Current cycle angle (0..720). */
  phase = 0;

  constructor(eventDegs: readonly number[]) {
    const order = eventDegs.map((d, i) => ({ d: wrapCycle(d), i })).sort((a, b) => a.d - b.d || a.i - b.i);
    this.degs = Float64Array.from(order, (o) => o.d);
    this.ids = Int32Array.from(order, (o) => o.i);
    this.reset(0);
  }

  get size(): number {
    return this.degs.length;
  }

  /** Places the crank at `deg` without emitting anything; an event exactly at `deg` counts as passed. */
  reset(deg: number): void {
    this.phase = wrapCycle(deg);
    const n = this.degs.length;
    if (!n) return;
    let k = 0;
    while (k < n && this.degs[k] <= this.phase) k++;
    this.next = k % n;
    this.toNext = k < n ? this.degs[k] - this.phase : this.degs[0] + 720 - this.phase;
  }

  /**
   * Advances the crank by `d` ≥ 0 degrees. Writes the indices of the crossed
   * events into `out` (in crossing order) and returns how many there were.
   */
  advance(d: number, out: Int32Array): number {
    this.phase = wrapCycle(this.phase + d);
    const n = this.degs.length;
    if (!n) return 0;
    this.toNext -= d;
    let count = 0;
    while (this.toNext <= 0 && count < out.length) {
      out[count++] = this.ids[this.next];
      const k = this.next + 1;
      this.next = k % n;
      this.toNext += k < n ? this.degs[k] - this.degs[k - 1] : this.degs[0] + 720 - this.degs[n - 1];
    }
    return count;
  }
}

/** Indices of the events crossed when the crank goes forward from `from` to `to` (degrees). */
export function eventsBetween(eventDegs: readonly number[], from: number, to: number): number[] {
  const clock = new CrankClock(eventDegs);
  clock.reset(from);
  const out = new Int32Array(Math.max(1, eventDegs.length));
  const n = clock.advance(wrapCycle(to - from), out);
  return Array.from(out.subarray(0, n));
}
