import type { EngineId } from '../../types/engine';

/**
 * Original side-profile silhouettes (hand-made SVG, no photos) so the user
 * can tell which car each engine belongs to. Placeholder generic coupé —
 * replaced by per-car silhouettes in ./silhouettes.
 */
export function CarSilhouette({ id, accent = '#ff6a1f' }: { id: EngineId; accent?: string }) {
  void id;
  return (
    <svg viewBox="0 0 240 70" role="img" aria-label="Silhueta do veículo">
      <path d="M8 52 C20 44 40 40 64 38 L96 22 C110 16 150 15 170 24 L196 36 C214 38 228 42 232 50 L232 54 L8 54 Z" fill="#26282d" stroke={accent} strokeWidth="1.2" />
      <circle cx="58" cy="54" r="11" fill="#0e0f11" stroke="#555" />
      <circle cx="190" cy="54" r="11" fill="#0e0f11" stroke="#555" />
    </svg>
  );
}
