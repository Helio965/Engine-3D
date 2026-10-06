import { useApp } from '../state/appStore';
import { componentInfo } from '../data/components';

/** Tooltip for IDENTIFICAR COMPONENTES (hover; click pins it). */
export function ComponentTooltip() {
  const identify = useApp((s) => s.identify);
  const hover = useApp((s) => s.hover);
  const pinned = useApp((s) => s.pinnedPart);
  const set = useApp((s) => s.set);
  const h = hover ?? pinned;
  if (!identify || !h) return null;
  const info = componentInfo(h.kind);
  const isPinned = !hover && !!pinned;
  return (
    <div
      className={`tooltip3d panel ${isPinned ? 'pinned' : ''}`}
      style={{ left: Math.min(h.x, window.innerWidth - 300), top: Math.min(h.y, window.innerHeight - 160) }}
      role="tooltip"
    >
      {isPinned && (
        <button className="btn sm" style={{ float: 'right' }} onClick={() => set({ pinnedPart: null })} aria-label="Fechar">
          ✕
        </button>
      )}
      <h4>{h.label ?? info.name}</h4>
      <div className="en">{info.english}</div>
      <div className="sys">Sistema: {info.system}</div>
      <p>{info.fn}</p>
    </div>
  );
}
