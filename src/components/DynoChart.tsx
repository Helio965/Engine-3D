import { useMemo, useRef, useState } from 'react';
import type { EngineDefinition } from '../types/engine';
import { simRef, useTelemetry } from '../state/simulationStore';
import { buildTorqueCurve, powerFromTorque } from '../simulation/curves';
import { fmt } from '../data/helpers';

/**
 * Live dyno charts. Two separate charts (torque × rpm and power × rpm) share
 * the rpm axis — never a dual y-axis. Series: the model's full-load curve
 * (approximation built from published anchor points) and the last measured
 * sweep. The live operating point is drawn on both.
 */

const C_MODEL = '#3987e5';
const C_RUN = '#d95926';
const W = 340;
const H = 132;
const PAD = { l: 44, r: 10, t: 10, b: 20 };

interface Pt {
  rpm: number;
  v: number;
}

export function DynoChart({ def }: { def: EngineDefinition }) {
  const t = useTelemetry((x) => x.t);
  const curve = useMemo(() => buildTorqueCurve(def), [def]);
  const lo = Math.max(800, Math.round(def.performance.idleRpm / 100) * 100);
  const hi = def.performance.revLimitRpm;
  const model = useMemo(() => {
    const pts: { rpm: number; tq: number; pw: number }[] = [];
    for (let r = lo; r <= hi; r += 100) {
      const tq = curve(r);
      pts.push({ rpm: r, tq, pw: powerFromTorque(tq, r) * 1.35962 });
    }
    return pts;
  }, [curve, lo, hi]);
  const sim = simRef.current;
  const run = sim?.dynoSamples.length ? sim.dynoSamples : sim?.dynoRuns[sim.dynoRuns.length - 1] ?? [];
  const runTq = run.map((s) => ({ rpm: s.rpm, v: s.torqueNm }));
  const runPw = run.map((s) => ({ rpm: s.rpm, v: s.powerKw * 1.35962 }));
  const maxTq = Math.max(def.performance.torqueNm * 1.12, ...runTq.map((p) => p.v));
  const maxPw = Math.max(def.performance.powerPs * 1.12, ...runPw.map((p) => p.v));
  const live = t && t.running ? { rpm: t.rpm, tq: Math.max(0, t.torqueNm), pw: t.powerKw * 1.35962 } : null;
  const peakRun = run.length
    ? {
        tq: run.reduce((a, b) => (b.torqueNm > a.torqueNm ? b : a)),
        pw: run.reduce((a, b) => (b.powerKw > a.powerKw ? b : a)),
      }
    : null;

  return (
    <section className="panel" style={{ padding: '10px 12px' }} aria-label="Dinamômetro: curvas de torque e potência">
      <p className="panel-title">Dyno · plena carga</p>
      <Legend />
      <Chart title="Torque" unit="N·m" lo={lo} hi={hi} max={maxTq} model={model.map((p) => ({ rpm: p.rpm, v: p.tq }))} run={runTq} live={live ? { rpm: live.rpm, v: live.tq } : null} />
      <Chart title="Potência" unit="PS" lo={lo} hi={hi} max={maxPw} model={model.map((p) => ({ rpm: p.rpm, v: p.pw }))} run={runPw} live={live ? { rpm: live.rpm, v: live.pw } : null} xAxis />
      {peakRun && (
        <div className="kv" style={{ marginTop: 6 }}>
          <span>Medido</span>
          <b>
            {fmt(peakRun.tq.torqueNm)} N·m @ {fmt(peakRun.tq.rpm)} · {fmt(peakRun.pw.powerKw * 1.35962)} PS @ {fmt(peakRun.pw.rpm)}
          </b>
        </div>
      )}
      <p className="note">Curva aproximada para visualização: construída a partir dos valores publicados de torque e potência máximos, não é a curva oficial do fabricante.</p>
      <details>
        <summary className="note" style={{ cursor: 'pointer' }}>Ver tabela</summary>
        <table className="spec-table" style={{ fontSize: 11 }}>
          <tbody>
            {model
              .filter((p) => p.rpm % 500 === 0)
              .map((p) => (
                <tr key={p.rpm}>
                  <td className="mono">{fmt(p.rpm)} rpm</td>
                  <td className="mono">{fmt(p.tq)} N·m</td>
                  <td className="mono">{fmt(p.pw)} PS</td>
                </tr>
              ))}
          </tbody>
        </table>
      </details>
    </section>
  );
}

function Legend() {
  return (
    <div style={{ display: 'flex', gap: 14, fontSize: 11, color: 'var(--text-2)', marginBottom: 4 }}>
      <span>
        <svg width="18" height="8" aria-hidden>
          <line x1="0" y1="4" x2="18" y2="4" stroke={C_MODEL} strokeWidth="2" strokeDasharray="4 3" />
        </svg>{' '}
        Modelo (aprox.)
      </span>
      <span>
        <svg width="18" height="8" aria-hidden>
          <line x1="0" y1="4" x2="18" y2="4" stroke={C_RUN} strokeWidth="2" />
        </svg>{' '}
        Medição
      </span>
      <span>
        <svg width="10" height="10" aria-hidden>
          <circle cx="5" cy="5" r="4" fill="var(--text)" />
        </svg>{' '}
        Agora
      </span>
    </div>
  );
}

function Chart({ title, unit, lo, hi, max, model, run, live, xAxis }: { title: string; unit: string; lo: number; hi: number; max: number; model: Pt[]; run: Pt[]; live: Pt | null; xAxis?: boolean }) {
  const ref = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const x = (rpm: number) => PAD.l + ((rpm - lo) / (hi - lo)) * (W - PAD.l - PAD.r);
  const y = (v: number) => H - PAD.b - (Math.max(0, v) / max) * (H - PAD.t - PAD.b);
  const path = (pts: Pt[]) => pts.filter((p) => p.rpm >= lo && p.rpm <= hi).map((p, i) => `${i ? 'L' : 'M'}${x(p.rpm).toFixed(1)},${y(p.v).toFixed(1)}`).join('');
  const ticksY = [0, 0.25, 0.5, 0.75, 1].map((f) => f * max);
  const step = hi - lo > 6000 ? 2000 : 1000;
  const ticksX: number[] = [];
  for (let r = Math.ceil(lo / step) * step; r <= hi; r += step) ticksX.push(r);
  const near = (pts: Pt[], rpm: number) => (pts.length ? pts.reduce((a, b) => (Math.abs(b.rpm - rpm) < Math.abs(a.rpm - rpm) ? b : a)) : null);
  const hm = hover != null ? near(model, hover) : null;
  const hr = hover != null ? near(run, hover) : null;

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ fontSize: 11, color: 'var(--text-2)', margin: '4px 0 0' }}>
        {title} ({unit}) × RPM
      </div>
      <svg
        ref={ref}
        width="100%"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`${title} em função da rotação`}
        onPointerMove={(e) => {
          const r = ref.current!.getBoundingClientRect();
          const px = ((e.clientX - r.left) / r.width) * W;
          const rpm = lo + ((px - PAD.l) / (W - PAD.l - PAD.r)) * (hi - lo);
          setHover(rpm >= lo && rpm <= hi ? rpm : null);
        }}
        onPointerLeave={() => setHover(null)}
        style={{ display: 'block', touchAction: 'none' }}
      >
        {ticksY.map((v, i) => (
          <g key={i}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} stroke="rgba(255,255,255,0.06)" />
            <text x={PAD.l - 6} y={y(v) + 3} fontSize="9" textAnchor="end" fill="var(--text-3)" className="mono">
              {fmt(v)}
            </text>
          </g>
        ))}
        {xAxis &&
          ticksX.map((r) => (
            <text key={r} x={x(r)} y={H - 5} fontSize="9" textAnchor="middle" fill="var(--text-3)" className="mono">
              {r / 1000}k
            </text>
          ))}
        <path d={path(model)} fill="none" stroke={C_MODEL} strokeWidth="2" strokeDasharray="5 4" strokeLinecap="round" />
        {run.length > 1 && <path d={path(run)} fill="none" stroke={C_RUN} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />}
        {live && live.rpm >= lo && (
          <circle cx={x(Math.min(hi, live.rpm))} cy={y(live.v)} r="4.5" fill="var(--text)" stroke="#15161a" strokeWidth="2" />
        )}
        {hover != null && (
          <g pointerEvents="none">
            <line x1={x(hover)} x2={x(hover)} y1={PAD.t} y2={H - PAD.b} stroke="rgba(255,255,255,0.25)" />
            {hm && <circle cx={x(hm.rpm)} cy={y(hm.v)} r="4" fill={C_MODEL} stroke="#15161a" strokeWidth="2" />}
            {hr && <circle cx={x(hr.rpm)} cy={y(hr.v)} r="4" fill={C_RUN} stroke="#15161a" strokeWidth="2" />}
          </g>
        )}
      </svg>
      {hover != null && hm && (
        <div
          className="panel mono"
          style={{ position: 'absolute', top: 18, left: `${Math.min(60, (x(hover) / W) * 100)}%`, padding: '4px 8px', fontSize: 11, pointerEvents: 'none', whiteSpace: 'nowrap' }}
        >
          {fmt(hover)} rpm · modelo {fmt(hm.v)} {unit}
          {hr ? ` · medido ${fmt(hr.v)} ${unit}` : ''}
        </div>
      )}
    </div>
  );
}
