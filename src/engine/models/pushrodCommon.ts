import type { EngineModelContext } from '../EngineContext';
import { axisPoint } from '../dims';

/** Shared geometry for the two pushrod (OHV) 90° V8 models. */
export function valleyGeometry(ctx: EngineModelContext) {
  const { dims } = ctx;
  const tops = dims.bankAxisDeg.map((deg) => {
    const s = Math.sign(deg) || 1;
    // inner top edge of each head
    return axisPoint(deg, dims.deck + dims.headHeight, -s * (dims.bankWidth / 2));
  });
  const valleyY = Math.max(...tops.map((t) => t[0]));
  const innerZ = Math.min(...tops.map((t) => Math.abs(t[1])));
  const portY = Math.max(...dims.bankAxisDeg.map((deg) => axisPoint(deg, dims.deck + dims.headHeight * 0.42, 0)[0]));
  return { valleyY, innerZ, portY };
}
