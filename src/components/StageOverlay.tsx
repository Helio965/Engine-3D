import { useShallow } from 'zustand/react/shallow';
import { useApp, type CameraPresetName, type ViewMode, TIME_SCALES } from '../state/appStore';
import { useTelemetry } from '../state/simulationStore';
import type { EngineDefinition } from '../types/engine';
import { TourPanel } from './TourPanel';

const VIEWS: { id: ViewMode; label: string; hint: string }[] = [
  { id: 'complete', label: 'Completo', hint: 'Motor totalmente montado' },
  { id: 'transparent', label: 'Transparente', hint: 'Carcaças progressivamente transparentes' },
  { id: 'cutaway', label: 'Cutaway', hint: 'Corte técnico do motor' },
  { id: 'internals', label: 'Internos', hint: 'Pistões, bielas, virabrequim, cilindros, válvulas e comandos' },
  { id: 'pistons', label: 'Pistões', hint: 'Apenas o conjunto móvel e as válvulas essenciais' },
  { id: 'exploded', label: 'Explodido', hint: 'Separa os componentes' },
];

const CAMS: { id: CameraPresetName; label: string }[] = [
  { id: 'front', label: 'Frontal' },
  { id: 'rear', label: 'Traseira' },
  { id: 'left', label: 'Lat. esq.' },
  { id: 'right', label: 'Lat. dir.' },
  { id: 'top', label: 'Superior' },
  { id: 'intake', label: 'Admissão' },
  { id: 'exhaust', label: 'Escape' },
  { id: 'pistons', label: 'Pistões' },
  { id: 'crankshaft', label: 'Virabrequim' },
  { id: 'induction', label: 'Turbo/Comp.' },
];

export function StageOverlay({ def }: { def: EngineDefinition }) {
  const s = useApp(
    useShallow((x) => ({
      viewMode: x.viewMode,
      housingOpacity: x.housingOpacity,
      explode: x.explode,
      cutAxis: x.cutAxis,
      cutPosition: x.cutPosition,
      highlight: x.highlight,
      showFuelSystem: x.showFuelSystem,
      identify: x.identify,
      combustionGlow: x.combustionGlow,
      flows: x.flows,
      timeScale: x.timeScale,
      tour: x.tour,
      set: x.set,
      setViewMode: x.setViewMode,
      requestCamera: x.requestCamera,
      toggleFlow: x.toggleFlow,
    })),
  );
  const t = useTelemetry((x) => x.t);
  const forced = def.engine.aspiration !== 'na';
  const fastHint = t && t.running && t.rpm * s.timeScale > 2500 && (s.viewMode === 'pistons' || s.viewMode === 'internals' || s.viewMode === 'cutaway');
  const msg = t?.message && t.time - t.message.at < 4 ? t.message : null;

  return (
    <div className="stage-ui">
      <div className="viewbar">
        <div className="row panel" style={{ padding: 4 }} role="toolbar" aria-label="Modos de visualização">
          {VIEWS.map((v) => (
            <button key={v.id} className={`btn sm ${s.viewMode === v.id ? 'active' : ''}`} title={v.hint} aria-pressed={s.viewMode === v.id} onClick={() => s.setViewMode(v.id)}>
              {v.label}
            </button>
          ))}
        </div>
        {s.viewMode === 'transparent' && (
          <label className="slider-row panel">
            Opacidade <span className="mono">{Math.round(s.housingOpacity * 100)}%</span>
            <input type="range" min={0} max={1} step={0.01} value={s.housingOpacity} aria-label="Opacidade das carcaças" onChange={(e) => s.set({ housingOpacity: +e.target.value })} />
          </label>
        )}
        {s.viewMode === 'exploded' && (
          <label className="slider-row panel">
            Montado
            <input type="range" min={0} max={1} step={0.01} value={s.explode} aria-label="Separação dos componentes" onChange={(e) => s.set({ explode: +e.target.value })} />
            Explodido
          </label>
        )}
        {s.viewMode === 'cutaway' && (
          <div className="slider-row panel">
            <div className="seg">
              <button className={`btn sm ${s.cutAxis === 'longitudinal' ? 'active' : ''}`} onClick={() => s.set({ cutAxis: 'longitudinal' })}>
                Longitudinal
              </button>
              <button className={`btn sm ${s.cutAxis === 'cross' ? 'active' : ''}`} onClick={() => s.set({ cutAxis: 'cross' })}>
                Transversal
              </button>
            </div>
            <input type="range" min={-1} max={1} step={0.01} value={s.cutPosition} aria-label="Posição do corte" onChange={(e) => s.set({ cutPosition: +e.target.value })} />
          </div>
        )}
      </div>

      <div className="toolstack">
        <div className="group panel" role="group" aria-label="Câmera">
          <p className="panel-title" style={{ margin: 0 }}>Câmera</p>
          <div className="camgrid">
            {CAMS.filter((c) => c.id !== 'induction' || forced).map((c) => (
              <button key={c.id} className="btn sm" onClick={() => s.requestCamera(c.id)}>
                {c.label}
              </button>
            ))}
          </div>
          <button className="btn sm" onClick={() => s.requestCamera('home')}>
            Reset câmera
          </button>
        </div>
        <div className="group panel" role="group" aria-label="Câmera lenta">
          <p className="panel-title" style={{ margin: 0 }}>Câmera lenta</p>
          <div className="seg">
            {TIME_SCALES.map((ts) => (
              <button key={ts} className={`btn sm ${s.timeScale === ts ? 'active' : ''}`} onClick={() => s.set({ timeScale: ts })} title={ts === 1 ? 'Tempo real' : `Tudo (pistões, válvulas, turbos e som) a ${ts}× da velocidade real`}>
                {ts === 1 ? '1×' : `1/${Math.round(1 / ts)}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flowbar panel" role="group" aria-label="Visualizações e fluxos">
        <p className="panel-title" style={{ margin: 0 }}>Visualizar</p>
        {def.engine.turbo && (
          <button className={`btn sm ${s.highlight === 'turbos' ? 'active' : ''}`} onClick={() => s.set({ highlight: s.highlight === 'turbos' ? 'none' : 'turbos' })}>
            Destacar turbos
          </button>
        )}
        {def.engine.supercharger && (
          <button className={`btn sm ${s.highlight === 'supercharger' ? 'active' : ''}`} onClick={() => s.set({ highlight: s.highlight === 'supercharger' ? 'none' : 'supercharger' })}>
            Ver supercharger
          </button>
        )}
        <button className={`btn sm ${s.showFuelSystem ? 'active' : ''}`} onClick={() => s.set({ showFuelSystem: !s.showFuelSystem })}>
          Sistema de combustível
        </button>
        <button className={`btn sm ${s.identify ? 'active' : ''}`} onClick={() => s.set({ identify: !s.identify, hover: null, pinnedPart: null })}>
          Identificar componentes
        </button>
        <button className={`btn sm ${s.combustionGlow ? 'active' : ''}`} onClick={() => s.set({ combustionGlow: !s.combustionGlow })}>
          Combustão visível
        </button>
        <p className="panel-title" style={{ margin: '6px 0 0' }}>Fluxos</p>
        {(
          [
            ['air', 'Ar'],
            ['fuel', 'Combustível'],
            ['exhaust', 'Escape'],
            ['coolant', 'Refrigeração'],
          ] as const
        ).map(([k, label]) => (
          <button key={k} className={`btn sm ${s.flows[k] ? 'active' : ''}`} onClick={() => s.toggleFlow(k)}>
            {label}
          </button>
        ))}
      </div>

      {msg && <div className={`toast ${msg.level}`} role="status">{msg.text}</div>}
      {fastHint && !s.tour.active && (
        <button className="hint" onClick={() => s.set({ timeScale: 0.04 })}>
          Rotação alta para o olho — clique para câmera lenta 1/25 e acompanhar o ciclo
        </button>
      )}
      {s.tour.active && <TourPanel def={def} />}
      <div className="disclaimer">Visualização técnica interativa baseada em especificações públicas. Não representa CAD oficial do fabricante.</div>
    </div>
  );
}
