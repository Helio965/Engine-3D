import { useEffect } from 'react';
import type { EngineDefinition } from '../types/engine';
import { useApp } from '../state/appStore';

/** Entry screen: the selected engine is revealed slowly behind the title. */
export function IntroScreen({ def }: { def: EngineDefinition }) {
  const set = useApp((s) => s.set);
  useEffect(() => {
    // slow reveal: start in the complete view; the camera rig orbits gently
    useApp.getState().set({ viewMode: 'complete' });
  }, []);
  const enter = () => {
    set({ phase: 'lab' });
    useApp.getState().requestCamera('home');
  };
  return (
    <div className="intro" role="dialog" aria-label="Engine Lab — tela inicial">
      <h1>
        ENGINE<span>·</span>LAB
      </h1>
      <div className="tag">Interactive Performance Engine Simulator</div>
      <button className="btn primary" onClick={enter} autoFocus>
        ENTER LAB
      </button>
      <div className="credits">
        Motores 3D procedurais animados a partir de especificações públicas verificadas · {def.manufacturer} {def.engine.name} em destaque. Visualização técnica, não CAD oficial.
      </div>
    </div>
  );
}
