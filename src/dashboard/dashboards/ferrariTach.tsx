import { Band, Needle, Readout, Ticks, scale } from '../gauge';

/**
 * Ferrari-style central analogue rev counter (0–10 ×1000): yellow face
 * (a period option, very common), black numerals, red needle with black cap,
 * red sector at the top of the scale and a digital gear read-out in the dial.
 */
export function FerrariTach({ cx, cy, r, rpm, max, redFrom, gear, sub, powered, limiter }: { cx: number; cy: number; r: number; rpm: number; max: number; redFrom: number; gear: string; sub?: string; powered: boolean; limiter: boolean }) {
  const a0 = -140;
  const a1 = 120;
  return (
    <g>
      <circle cx={cx} cy={cy} r={r + 3} fill="#1a1a1b" stroke="#55575b" strokeWidth={1.5} />
      <circle cx={cx} cy={cy} r={r} fill={powered ? '#f5c518' : '#8a7419'} />
      <Band cx={cx} cy={cy} r={r * 0.86} w={r * 0.1} from={redFrom} to={max} min={0} max={max} a0={a0} a1={a1} color="#d0021b" />
      <Ticks cx={cx} cy={cy} s={{ min: 0, max, major: 1000, minor: 250, a0, a1, r: r * 0.93, majorLen: r * 0.12, minorLen: r * 0.05, width: 2, color: '#111111', label: (v) => String(v / 1000), fontSize: r * 0.17, fontWeight: 700, labelColor: '#111111', redFrom, redColor: '#d0021b' }} />
      <Readout x={cx} y={cy - r * 0.38} size={r * 0.075} color="#3a2f05" weight={700}>
        RPM ×1000
      </Readout>
      <rect x={cx - r * 0.2} y={cy + r * 0.28} width={r * 0.4} height={r * 0.34} rx={3} fill="#0e0e0f" />
      <Readout x={cx} y={cy + r * 0.45} size={r * 0.24} color={limiter ? '#ff3b30' : '#ffffff'} mono>
        {gear}
      </Readout>
      {sub && (
        <Readout x={cx} y={cy + r * 0.73} size={r * 0.07} color="#3a2f05" weight={800}>
          {sub}
        </Readout>
      )}
      <Needle cx={cx} cy={cy} angle={scale(rpm, 0, max, a0, a1)} length={r * 0.86} width={3.2} color="#d0021b" hub={r * 0.13} hubColor="#0d0d0d" />
    </g>
  );
}

