import { GROUND } from './profiles';

/**
 * Crate engine (not a vehicle): big-block V8 side view bolted to a workshop
 * engine stand. Front of the engine to the LEFT, same viewBox as the cars.
 */
export function CrateEngineStand({ accent, metal }: { accent: string; metal: string }) {
  const caster = (cx: number) => (
    <g key={cx}>
      <rect x={cx - 1.4} y={GROUND - 9} width={2.8} height={3} fill="#2a2c31" />
      <circle cx={cx} cy={GROUND - 3.4} r={3.4} fill="#0b0b0d" stroke="#3a3d44" strokeWidth={0.6} />
      <circle cx={cx} cy={GROUND - 3.4} r={1.1} fill="#7a808a" />
    </g>
  );
  return (
    <g>
      <ellipse cx={124} cy={GROUND + 0.6} rx={66} ry={2.2} fill="#000" opacity={0.55} />
      {/* stand: base rail, post, arm and mounting head */}
      <g fill="#24262b" stroke={accent} strokeWidth={0.7} strokeOpacity={0.55}>
        <rect x={62} y={GROUND - 10.6} width={126} height={3.2} rx={1} />
        <rect x={172} y={27} width={5} height={27} />
        <path d="M172 42 L172 45.6 L161 53.4 L156 53.4 Z" />
        <rect x={152} y={29.6} width={20} height={4} />
        <rect x={149} y={23} width={3.4} height={18} rx={0.8} />
      </g>
      {[66, 184].map(caster)}
      {/* oil pan, block, head, valve cover */}
      <path d="M90 47.6 L144 47.6 L141.6 51.4 L108 51.4 L104 53.4 L92 53.4 Z" fill="#1b1d21" stroke="#0a0b0d" strokeWidth={0.5} />
      <path d="M80 27 L148 27 L148 47.6 L86 47.6 L80 42 Z" fill={`url(#${metal})`} stroke="#0a0b0d" strokeWidth={0.5} />
      <path d="M83 22.4 L146 22.4 L148 27 L80 27 Z" fill="#33363d" stroke="#0a0b0d" strokeWidth={0.5} />
      <rect x={86} y={17.6} width={58} height={4.8} rx={2} fill="#2b2e34" stroke={accent} strokeWidth={0.8} />
      {/* tall intake, throttle body, round air cleaner */}
      <path d="M95 17.6 L133 17.6 L129 10.4 L100 10.4 Z" fill="#3a3e46" stroke="#0a0b0d" strokeWidth={0.5} />
      <rect x={108} y={7.4} width={14} height={3} fill="#4a4f58" />
      <rect x={93} y={2.6} width={44} height={4.8} rx={2.2} fill="#2b2e34" stroke={accent} strokeWidth={0.8} />
      <path d="M96 4.2 L134 4.2" stroke="#fff" strokeOpacity={0.25} strokeWidth={0.8} strokeLinecap="round" />
      {/* exhaust ports and core plugs */}
      <g fill="#0a0b0d">
        {[92, 106, 120, 134].map((x) => (
          <rect key={x} x={x} y={28.6} width={6} height={3} rx={0.8} />
        ))}
        {[99, 115, 131].map((x) => (
          <circle key={x} cx={x} cy={39.6} r={1.8} />
        ))}
      </g>
      {/* front drive: timing cover, water pump and crank pulleys, belt */}
      <path d="M80 27 L75 27 L75 44 L80 46 Z" fill="#2b2e34" />
      <path d="M68.6 30 L68.4 45.6 M78 30.4 L80 45" stroke={accent} strokeWidth={0.8} />
      <circle cx={73.4} cy={30.6} r={5} fill="#24262b" stroke="#7a808a" strokeWidth={0.7} />
      <circle cx={73.4} cy={30.6} r={1.4} fill="#7a808a" />
      <circle cx={74} cy={45.4} r={6.4} fill="#24262b" stroke="#7a808a" strokeWidth={0.7} />
      <circle cx={74} cy={45.4} r={2} fill="#7a808a" />
      <path d="M82 24 L144 24" stroke="#fff" strokeOpacity={0.2} strokeWidth={0.8} strokeLinecap="round" />
    </g>
  );
}
