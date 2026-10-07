import { W16Exterior, w16Meta } from './w16Common';

/** Bugatti Chiron — 8.0 W16, four turbochargers in two sequential stages. */
export default function BugattiChiron() {
  return <W16Exterior variant="chiron" />;
}

export const meta = w16Meta('chiron');
