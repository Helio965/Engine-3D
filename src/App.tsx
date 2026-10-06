import { useEffect, useMemo } from 'react';
import { useApp } from './state/appStore';
import { createSimulation, simRef } from './state/simulationStore';
import { getEngine } from './data/engines';
import { Scene } from './engine/Scene';
import { Header } from './components/Header';
import { EngineSelector } from './components/EngineSelector';
import { StageOverlay } from './components/StageOverlay';
import { RightPanel } from './components/RightPanel';
import { ControlsBar } from './components/ControlsBar';
import { IntroScreen } from './components/IntroScreen';
import { LoadingOverlay } from './components/LoadingOverlay';
import { Modals } from './components/Modals';
import { MobileTabs } from './components/MobileTabs';
import { ComponentTooltip } from './components/ComponentTooltip';
import { audioEngine } from './audio/AudioEngine';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useUrlState } from './hooks/useUrlState';

export default function App() {
  const engineId = useApp((s) => s.engineId);
  const phase = useApp((s) => s.phase);
  const drawer = useApp((s) => s.drawer);
  const def = useMemo(() => getEngine(engineId), [engineId]);

  useUrlState();
  useKeyboardShortcuts();

  // one simulation per selected engine; keeps mode / clock settings
  useEffect(() => {
    createSimulation(def, simRef.current);
    audioEngine.setEngine(def);
    useApp.getState().markLoadStep('audio');
  }, [def]);

  return (
    <div className={`app ${phase === 'intro' ? 'intro' : ''} ${drawer !== 'none' ? `drawer-${drawer}` : ''}`}>
      <Header def={def} />
      <aside className="left" aria-label="Seleção de motores">
        <EngineSelector />
      </aside>
      <main className="stage">
        <div className="canvas-wrap">
          <Scene def={def} />
        </div>
        <StageOverlay def={def} />
        <LoadingOverlay def={def} />
      </main>
      <aside className="right" aria-label="Painel do veículo e telemetria">
        <RightPanel def={def} />
      </aside>
      <MobileTabs />
      <ControlsBar def={def} />
      {phase === 'intro' && <IntroScreen def={def} />}
      <Modals def={def} />
      <ComponentTooltip />
    </div>
  );
}
