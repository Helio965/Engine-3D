import { useApp } from '../state/appStore';

/** Bottom tabs on phones/tablets: open the selector, dashboard, controls and visual tools as drawers. */
export function MobileTabs() {
  const drawer = useApp((s) => s.drawer);
  const set = useApp((s) => s.set);
  const toggle = (d: typeof drawer) => set({ drawer: drawer === d ? 'none' : d });
  return (
    <nav className="mobile-tabs" aria-label="Painéis">
      <button className={`btn sm ${drawer === 'engines' ? 'active' : ''}`} onClick={() => toggle('engines')}>
        Motores
      </button>
      <button className={`btn sm ${drawer === 'dash' ? 'active' : ''}`} onClick={() => toggle('dash')}>
        Painel
      </button>
      <button className={`btn sm ${drawer === 'flows' ? 'active' : ''}`} onClick={() => toggle('flows')}>
        Visualizar
      </button>
      <button className={`btn sm ${drawer === 'controls' ? 'active' : ''}`} onClick={() => toggle('controls')}>
        Mais
      </button>
    </nav>
  );
}
