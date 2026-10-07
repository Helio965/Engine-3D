import { W16Exterior, w16Meta } from './w16Common';

/** Bugatti Veyron 16.4 — 8.0 W16, four parallel turbochargers. */
export default function BugattiVeyron() {
  return <W16Exterior variant="veyron" />;
}

export const meta = w16Meta('veyron');
