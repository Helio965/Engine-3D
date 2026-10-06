import { useEffect, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import type { EngineDefinition, EngineId, FactStatus } from '../types/engine';
import { useApp, type GraphicsQuality } from '../state/appStore';
import { ENGINES, getEngine } from '../data/engines';
import { fmt } from '../data/helpers';
import { aspirationLabel, layoutLabel } from './Header';

const STATUS_LABEL: Record<FactStatus, string> = {
  official: 'oficial',
  reputable: 'fonte técnica',
  estimated: 'estimado',
  unconfirmed: 'não confirmado',
};

export function StatusBadge({ s }: { s: FactStatus }) {
  return <span className={`badge ${s}`}>{STATUS_LABEL[s]}</span>;
}

export function Modals({ def }: { def: EngineDefinition }) {
  const panel = useApp((s) => s.panel);
  const set = useApp((s) => s.set);
  const close = () => set({ panel: 'none' });
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (panel === 'none') return;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panel]);
  if (panel === 'none') return null;
  return (
    <div className="overlay" onClick={close}>
      <div className="modal panel" role="dialog" aria-modal="true" tabIndex={-1} ref={ref} onClick={(e) => e.stopPropagation()}>
        <button className="btn sm modal-close" onClick={close} aria-label="Fechar">
          ✕
        </button>
        {panel === 'specs' && <SpecsPanel def={def} />}
        {panel === 'compare' && <ComparePanel />}
        {panel === 'settings' && <SettingsPanel />}
        {panel === 'about' && <AboutPanel />}
      </div>
    </div>
  );
}

function SpecsPanel({ def }: { def: EngineDefinition }) {
  const srcById = Object.fromEntries(def.sources.map((s, i) => [s.id, i + 1]));
  return (
    <>
      <h2>
        {def.manufacturer} {def.vehicle}
      </h2>
      <div className="sub">
        {def.engine.name} · {def.generation} · {def.marketVersion}
        {def.isCrateEngine && <span className="crate-tag">CRATE ENGINE / PERFORMANCE BUILD</span>}
      </div>
      <table className="spec-table">
        <tbody>
          {def.specs.map((r) => (
            <tr key={r.label}>
              <td>{r.label}</td>
              <td>
                {r.value}
                <StatusBadge s={r.status} />
                {r.sources?.length ? (
                  <sup className="mono" style={{ color: 'var(--text-3)', marginLeft: 4 }}>
                    [{r.sources.map((s) => srcById[s]).filter(Boolean).join(',')}]
                  </sup>
                ) : null}
                {r.note && <div className="note">{r.note}</div>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {def.notes?.length ? (
        <>
          <h3 style={{ marginTop: 16, fontSize: 14 }}>Observações</h3>
          <ul className="src-list">
            {def.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </>
      ) : null}
      <h3 style={{ marginTop: 16, fontSize: 14 }}>Parâmetros estimados usados pela simulação</h3>
      <ul className="src-list">
        {def.estimates.map((n) => (
          <li key={n}>{n}</li>
        ))}
      </ul>
      <h3 style={{ marginTop: 16, fontSize: 14 }}>Fontes</h3>
      <ol className="src-list">
        {def.sources.map((s) => (
          <li key={s.id}>
            <a href={s.url} target="_blank" rel="noreferrer noopener">
              {s.title}
            </a>{' '}
            — {s.publisher}
            {s.official && <span className="badge official">fabricante</span>}
          </li>
        ))}
      </ol>
      <p className="note">Legenda: oficial = publicado pelo fabricante; fonte técnica = imprensa especializada/documentação reconhecida; estimado = parâmetro de simulação; não confirmado = nenhuma fonte confiável encontrada.</p>
    </>
  );
}

interface Metric {
  label: string;
  get: (d: EngineDefinition) => number | null;
  fmt: (v: number) => string;
  better?: 'high' | 'low';
}

const METRICS: Metric[] = [
  { label: 'Cilindros', get: (d) => d.engine.cylinders, fmt: (v) => String(v) },
  { label: 'Cilindrada', get: (d) => d.engine.displacementCc, fmt: (v) => `${fmt(v / 1000, 1)} L`, better: 'high' },
  { label: 'Potência', get: (d) => d.performance.powerPs, fmt: (v) => `${fmt(v)} PS`, better: 'high' },
  { label: 'Torque', get: (d) => d.performance.torqueNm, fmt: (v) => `${fmt(v)} N·m`, better: 'high' },
  { label: 'RPM máximo (limitador)', get: (d) => d.performance.revLimitRpm, fmt: (v) => `${fmt(v)} rpm`, better: 'high' },
  { label: 'Potência por litro', get: (d) => d.performance.powerPs / (d.engine.displacementCc / 1000), fmt: (v) => `${fmt(v, 1)} PS/L`, better: 'high' },
  { label: 'Velocidade máxima do veículo', get: (d) => d.vehicleSpec?.topSpeedKmh ?? null, fmt: (v) => `${fmt(v)} km/h`, better: 'high' },
  { label: 'Peso do motor', get: (d) => d.engine.engineWeightKg ?? null, fmt: (v) => `${fmt(v)} kg`, better: 'low' },
  { label: 'Capacidade do tanque', get: (d) => (d.isCrateEngine ? null : d.fuel.capacityL), fmt: (v) => `${fmt(v)} L` },
];

function ComparePanel() {
  const compare = useApp((s) => s.compare);
  const set = useApp((s) => s.set);
  const [a, b] = compare.map((id) => getEngine(id));
  const pick = (i: 0 | 1, id: EngineId) => {
    const next = [...compare] as [EngineId, EngineId];
    next[i] = id;
    set({ compare: next });
  };
  return (
    <>
      <h2>Comparar motores</h2>
      <div className="sub">Escolha dois motores. Barras proporcionais ao maior valor; destaque no melhor quando faz sentido.</div>
      <div className="compare-grid">
        <div className="h">&nbsp;</div>
        {[a, b].map((d, i) => (
          <div key={i}>
            <select value={d.id} onChange={(e) => pick(i as 0 | 1, e.target.value as EngineId)} aria-label={`Motor ${i + 1}`} style={{ width: '100%', background: '#111', color: 'var(--text)', border: '1px solid var(--line-2)', borderRadius: 6, padding: 6 }}>
              {ENGINES.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.manufacturer} {e.vehicle} — {e.headline}
                </option>
              ))}
            </select>
          </div>
        ))}
        <div className="h">Arquitetura</div>
        {[a, b].map((d, i) => (
          <div key={i}>{layoutLabel(d)}</div>
        ))}
        <div className="h">Aspiração</div>
        {[a, b].map((d, i) => (
          <div key={i}>{aspirationLabel(d)}</div>
        ))}
        {METRICS.map((m) => {
          const va = m.get(a);
          const vb = m.get(b);
          const max = Math.max(va ?? 0, vb ?? 0) || 1;
          const win = (v: number | null, o: number | null) => m.better && v !== null && o !== null && v !== o && (m.better === 'high' ? v > o : v < o);
          return [
            <div key={`${m.label}h`} className="h">
              {m.label}
            </div>,
            ...[
              [va, vb],
              [vb, va],
            ].map(([v, o], i) => (
              <div key={`${m.label}${i}`} className={win(v, o) ? 'win' : ''}>
                {v === null ? <span style={{ color: 'var(--text-3)' }}>sem dado confiável</span> : m.fmt(v)}
                {v !== null && (
                  <div className="bar">
                    <div style={{ width: `${(v / max) * 100}%` }} />
                  </div>
                )}
              </div>
            )),
          ];
        })}
      </div>
      <p className="note">Crate engine (ZZ632) não tem veículo de produção: velocidade máxima e tanque aparecem como “sem dado confiável”.</p>
    </>
  );
}

function SettingsPanel() {
  const s = useApp(
    useShallow((x) => ({ graphics: x.graphics, fps: x.fps, volume: x.volume, reduceMotion: x.reduceMotion, vibration: x.vibration, set: x.set })),
  );
  const q: GraphicsQuality[] = ['low', 'medium', 'high', 'ultra'];
  return (
    <>
      <h2>Configurações</h2>
      <div className="sub">Gráficos, som e acessibilidade.</div>
      <p className="panel-title">Graphics</p>
      <div className="seg" role="radiogroup" aria-label="Qualidade gráfica">
        {q.map((g) => (
          <button key={g} role="radio" aria-checked={s.graphics === g} className={`btn ${s.graphics === g ? 'active' : ''}`} onClick={() => s.set({ graphics: g })}>
            {g.toUpperCase()}
          </button>
        ))}
      </div>
      <p className="note">
        LOW: sem sombras/pós-processamento, geometria e partículas reduzidas · MEDIUM: SMAA e contorno de seleção · HIGH: sombras suaves, oclusão ambiente (N8AO) e bloom · ULTRA: sombras 2048, AO em alta, MSAA e mais segmentos. FPS atual: <b className="mono">{s.fps}</b>
      </p>
      <p className="panel-title" style={{ marginTop: 14 }}>
        Som
      </p>
      <label className="kv" style={{ alignItems: 'center', gap: 10 }}>
        <span>Volume</span>
        <input type="range" min={0} max={1} step={0.01} value={s.volume} onChange={(e) => s.set({ volume: +e.target.value })} aria-label="Volume" />
      </label>
      <p className="panel-title" style={{ marginTop: 14 }}>
        Movimento e acessibilidade
      </p>
      <div className="btn-row">
        <button className={`btn ${s.reduceMotion ? 'active' : ''}`} onClick={() => s.set({ reduceMotion: !s.reduceMotion })} aria-pressed={s.reduceMotion}>
          Reduce motion
        </button>
        <button className={`btn ${s.vibration ? 'active' : ''}`} onClick={() => s.set({ vibration: !s.vibration })} aria-pressed={s.vibration}>
          Vibração do motor
        </button>
      </div>
      <p className="note">Atalhos: S liga/desliga · ↑/↓ acelerador · Q/E reduz/sobe marcha · 1–6 modos de visualização · C reseta a câmera · Esc fecha janelas.</p>
    </>
  );
}

function AboutPanel() {
  return (
    <>
      <h2>Sobre o Engine Lab</h2>
      <div className="sub">Laboratório virtual de motores esportivos.</div>
      <p style={{ lineHeight: 1.6, color: 'var(--text-2)' }}>
        Cada motor é gerado proceduralmente a partir da sua arquitetura real — número de cilindros, ângulo entre bancadas, diâmetro, curso, ordem de ignição — e animado por um único relógio físico: a rotação do virabrequim move bielas, pistões, válvulas e comandos pelas equações biela-manivela, e o mesmo estado alimenta turbos, supercharger, painel e som.
      </p>
      <p style={{ lineHeight: 1.6, color: 'var(--text-2)' }}>
        Os números exibidos vêm de fontes verificadas (prioridade para o fabricante). Quando um dado não pôde ser confirmado, ele aparece como “não confirmado” ou é usado apenas como parâmetro de simulação marcado como “estimado”. As curvas, consumos e temperaturas são aproximações de engenharia para visualização, não medições certificadas.
      </p>
      <p className="note">
        Marcas e nomes de modelos pertencem aos respectivos fabricantes e são usados apenas para identificação. Nenhum asset de jogos (BeamNG, Forza, Gran Turismo, Assetto Corsa…) ou modelo comercial foi utilizado; geometria, texturas, painéis, silhuetas e sons são originais deste projeto.
      </p>
    </>
  );
}
