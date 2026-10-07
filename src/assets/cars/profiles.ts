import type { EngineId } from '../../types/engine';

/**
 * Hand-drawn side profiles (original artwork, not traced). viewBox 0 0 240 70,
 * front of the car to the LEFT, ground at y = GROUND, roughly 25 mm per unit
 * so the cars keep their relative length/height.
 */
export const GROUND = 64;

export interface Wheel {
  /** Axle position. */
  x: number;
  /** Tyre radius (wheel centre sits at GROUND - r). */
  r: number;
}

export interface CarProfile {
  name: string;
  front: Wheel;
  rear: Wheel;
  /** Lower body edge (bumpers / sills) the wheel arches are cut from. */
  sill: number;
  /** Outline from the front-lower corner, over the roof, to the rear-lower corner (both at `sill`). */
  outline: string;
  /** Add-on body parts drawn like the body (wings, scoops, fins). */
  extras?: string;
  glass: string;
  /** Dark openings (intakes, vents). */
  vents?: string;
  /** Panel gaps. */
  seams?: string;
  /** Metallic bits (exhaust tips). */
  metal?: string;
  /** Subtle light reflection along the shoulders. */
  highlight: string;
  /** Signature line drawn in the accent colour. */
  feature: string;
  featureWidth?: number;
}

const ARCH_GAP = 1.3;
const r2 = (n: number) => Math.round(n * 100) / 100;

/** Wheel-arch cut, traversed rear → front over the top of the wheel. */
function arch(w: Wheel, sill: number): string {
  const R = w.r + ARCH_GAP;
  const dy = sill - (GROUND - w.r);
  const dx = Math.sqrt(R * R - dy * dy);
  return `L${r2(w.x + dx)} ${sill} A${r2(R)} ${r2(R)} 0 1 0 ${r2(w.x - dx)} ${sill}`;
}

/** Closed body path: outline + rear arch + sill + front arch. */
export function bodyPath(p: CarProfile): string {
  return `${p.outline} ${arch(p.rear, p.sill)} ${arch(p.front, p.sill)} Z`;
}

/** Every engine except the ZZ632 crate engine, which is drawn on a stand. */
export type CarId = Exclude<EngineId, 'chevrolet-zz632'>;

export const CAR_PROFILES: Record<CarId, CarProfile> = {
  // Rounded mid-engine coupé: horseshoe nose, teardrop canopy, twin roof scoops.
  'bugatti-veyron': {
    name: 'Bugatti Veyron 16.4 (2005), vista lateral',
    front: { x: 68, r: 13.6 },
    rear: { x: 176, r: 14.2 },
    sill: 58.5,
    outline:
      'M37 58.5 C33.4 58 31.4 55 31.2 50.6 C31 46.4 32.6 43.2 36.4 41.4 C41 39.2 47 37.6 52 36 C58 33.6 64 32.4 70 32.2 ' +
      'C78 32 86 32.8 92 32.4 C100 26.6 108 20.6 117 17.6 C123 15.6 131 15 138 15.6 C141 15.9 143.5 16.6 145.6 17.6 ' +
      'L147.4 16.6 C150.6 15.2 155.8 15.4 158.6 16.8 C161.6 18.4 163.4 20 165.4 21.4 C176 22.2 190 23.6 201 25.4 ' +
      'C205.6 26.4 208.6 28.8 209.2 32.8 L209.4 47 C209.4 53 208 56.6 205 58.5',
    glass:
      'M97 31.4 C103 26 110 21 118 19 C126 17.2 135 17.2 141 18.8 C146 20.2 149 23 151 27.2 C140 29 118 30.8 97 31.4 Z',
    vents: 'M146 17.8 L147.6 16.8 L148.8 19.8 L146.8 20.4 Z M153 33.4 C157 31.6 161 32.6 162 36 L161.4 45 C160.6 48.4 155.6 48.6 153.4 46 C150.8 42 150.8 36.4 153 33.4 Z',
    seams: 'M96.4 32.2 C98 40 97.6 50 96.2 57.8 M167 22.8 C172 23 177 23.8 181 24.6 M184 24.4 L201 27.2',
    highlight: 'M38 41.2 C48 37.6 60 33.8 74 33.4 M168 22.6 C181 23.4 194 25 203 27.2',
    feature: 'M151 27.6 C156.6 33.6 156 50 141 57.6',
  },
  // Longer and crisper: the big C-shaped side line around the door and a sharp tail.
  'bugatti-chiron': {
    name: 'Bugatti Chiron (2016), vista lateral',
    front: { x: 67, r: 13.6 },
    rear: { x: 175.5, r: 14.2 },
    sill: 58.5,
    outline:
      'M33 58.5 C30 57.6 29 53.4 29.5 49 C30 45 31.5 42 36 40.6 C46 38 56 33.6 67 32.2 C78 31.2 88 31 94 30.6 ' +
      'C102 25 110 19.8 120 17.4 C128 15.8 138 15.6 146 17.2 C154 18.8 162 20.6 170 22.2 C182 24.4 196 27 206 29 ' +
      'L211.2 29.4 L210.2 33 L210.6 47 C210.6 53 209 56.6 206 58.5',
    extras:
      'M124 16.9 C132 14.6 142 14.4 150 16.4 C158 18.4 166 20.4 174 22.6 L174 23.4 C166 21.6 156 19.6 148 17.8 C140 16.6 132 16.8 124 17.6 Z',
    glass: 'M98 30 C104 25.4 111 21 120 19.2 C128 17.8 138 17.8 144 19 L150.4 24 C149 26.2 147 27.6 144 28.4 C130 29.4 112 30 98 30 Z',
    vents: 'M151.4 29.6 C156.4 33 158 40 156.4 47.4 C155 51.6 151 53.6 145.6 54.4 C149.6 46.6 151.4 38.4 151.4 29.6 Z',
    seams: 'M97.6 31 C99 40 98.6 50 97.4 57.8 M176 23.6 L205 29.4 M206 29.6 L210.4 30',
    highlight: 'M37 39.6 C54 34.8 72 33 92 32.4 M176 24.6 C188 26.4 198 28.4 205.6 30.2',
    featureWidth: 1.5,
    feature: 'M146.4 17.8 C159 21.6 163.6 34 161.2 44.4 C159 52.4 151 56.4 136 56.8 L100 57',
  },
  // Boxy two-door coupé: upright greenhouse, thick C-pillar, tall rear wing.
  'nissan-skyline-r34': {
    name: 'Nissan Skyline GT-R R34 (1999), vista lateral',
    front: { x: 63, r: 13 },
    rear: { x: 170, r: 13 },
    sill: 58.5,
    outline:
      'M30.4 58.5 L28.4 57.4 L28.8 51.6 L29.8 45 L31.4 40.6 L36 38.2 C52 36.8 72 36 92 35 L99.6 33.8 ' +
      'L117.6 12.8 C118.8 11.2 120.4 10.2 122.8 10 L152 10 C154.6 10.2 156.4 11 157.6 12.4 L175.6 29 L206 29.4 L210 29.8 ' +
      'L211.6 33 L212 44 L211 55 L208.6 58.5',
    extras:
      'M188 19.4 C195 17.4 204 17 212.4 17.6 L212.4 20.6 C204 20.2 196 20.4 188 21 Z M196.2 20.6 L199.4 20.4 L200.4 29.4 L196.8 29.4 Z',
    glass:
      'M103.6 31.6 L118.8 14 C119.6 13 120.6 12.6 122.2 12.6 L139 12.6 L139 30.6 Z M141.4 12.8 L152 12.8 C153.4 12.8 154.4 13.4 155.4 14.4 L167.6 28.8 L141.4 29.8 Z',
    vents: 'M81.4 41.6 L91 41.4 L90 44.2 L80.8 44.4 Z',
    seams: 'M101.8 33.8 L100.8 58 M140.2 30.4 L141.4 58 M176 29.6 L176.4 33',
    highlight: 'M37 38.8 C55 37.4 76 36.4 98 34.6 M176.6 29.8 L208 30.2',
    feature: 'M78 39.6 L198 38.6',
  },
  // Four-door saloon: long hood, rising flame-surfaced shoulder, short deck with lip spoiler.
  'bmw-m5-e60': {
    name: 'BMW M5 E60 (2005), vista lateral',
    front: { x: 57, r: 13.7 },
    rear: { x: 172.5, r: 13.7 },
    sill: 58.6,
    outline:
      'M26 58.6 L23.4 56 C23 51 23.4 47.6 24.4 44 C25.2 41 27 39 30.6 37.8 C46 35.6 70 33.6 92 31 ' +
      'C100 24 108 13 119 7 C124 5 132 4.8 145 5 C153 5.2 158 6 162 8.4 C170 14 176 21 182 25.4 ' +
      'C190 25 205 24.6 212 24.6 L214.6 23.6 L215 25.4 C216.6 30 217 36 216.6 42 L215.6 54 L213 58.6',
    glass:
      'M97.6 29.6 C103 22 110 12.6 117.6 9.2 L136.6 8.2 L136.6 29 Z ' +
      'M140.4 8.2 L156 8.4 C160 9 163 12 166.6 16 L172 23.2 C169 24.8 166 25.6 162 25.8 L140.4 27.6 Z',
    vents: 'M75.6 40.4 L88.4 40 L87.6 42 L76.2 42.4 Z',
    seams: 'M95 31.2 L94 58.2 M138.6 28.6 L139.4 58.4 M171.6 24.8 C167.4 30 163.6 35 161.8 39.8',
    highlight: 'M31 38.6 C50 35.8 72 33.6 92 32.2 M183 26 C192 25.6 204 25.4 212 25.6',
    feature: 'M72 38.4 C110 36.6 150 33.6 214 29.6',
  },
  // Retro muscle coupé: long flat hood with power bulge, short roof, squared tail.
  'dodge-challenger-hellcat': {
    name: 'Dodge Challenger SRT Hellcat (2015), vista lateral',
    front: { x: 59.5, r: 14.5 },
    rear: { x: 177.5, r: 14.5 },
    sill: 58.8,
    outline:
      'M23 58.8 L20 57.6 L20.6 50 L19.4 35 L21.6 32.8 L104 30.6 L106 30.4 C112 22 120 13 128.6 8.6 ' +
      'C131 7.2 134 6.6 137 6.4 L154 6.4 C157 6.6 159 7.4 161 8.8 C168 14.6 177 22 186 26.4 L215 26.2 L218.6 24.8 ' +
      'L219.2 27 L220.4 28.4 L220.6 52 L219 57.6 L216 58.8',
    extras: 'M54 31.4 L55.4 29 L94 28.8 L101 30.8 Z',
    glass: 'M110.6 29 C116 21.4 123 14.6 131 10.6 L156 9.8 C159.6 10.2 162.6 12.4 165.6 16 L174.4 26.6 Z',
    vents: 'M54.4 31.2 L55.6 29.2 L58 29.2 L57.6 31.2 Z',
    seams: 'M150 10.2 L151.6 27.6 M109.2 30 L108 58.4 M157.4 27.6 L158.4 58.4',
    highlight: 'M22 33.2 L52 32.4 M187 27.2 L214.6 27',
    feature: 'M70 36.6 L210 34.6',
  },
  // Mid-engine wedge: low nose, raked screen, side intake behind the door, short tail.
  'ferrari-458-italia': {
    name: 'Ferrari 458 Italia (2009), vista lateral',
    front: { x: 70, r: 13.4 },
    rear: { x: 176, r: 14.3 },
    sill: 58.8,
    outline:
      'M34 58.8 C31.4 58.4 30 56.4 30.2 53.8 C30.4 51.4 32 49.6 35.6 48.4 C44 45.6 52 41.4 60 38.2 C64 36.8 68 36 72 35.8 ' +
      'C80 35.4 88 34.4 94 33.4 C102 26.6 112 19.6 123 16.4 C128 15.2 133 15 137 15.4 C150 17 166 22.2 180 25.4 ' +
      'C190 27.4 199 28.6 205.6 28.8 L209.2 27.8 L209.8 30.8 L210.4 42 C210 48 209 52 207.6 54 L205 58.8',
    glass: 'M99 32.6 C106 26.4 113 21.2 123 18.2 C128 17.2 133 17 137 17.4 C142 18.2 146.6 21 150 25.4 C146 28.8 128 31.6 99 32.6 Z',
    vents: 'M151.4 30.4 C155.4 29.2 160.4 30 164.6 32.2 L162.6 40.2 C158.6 38 154.6 36.6 151 36.2 Z',
    seams: 'M97 33.8 C97.6 42 96.4 50 94.6 58.4 M148.6 31.2 C150.2 40 150 50 147.4 58.4',
    // three stacked tail pipes peeking past the rear fascia
    metal:
      'M208.6 45.6 a1.1 1.1 0 1 0 2.2 0 a1.1 1.1 0 1 0 -2.2 0 Z M207.6 48.8 a1.1 1.1 0 1 0 2.2 0 a1.1 1.1 0 1 0 -2.2 0 Z ' +
      'M209.8 48.8 a1.1 1.1 0 1 0 2.2 0 a1.1 1.1 0 1 0 -2.2 0 Z',
    highlight: 'M37 48.6 C48 44.2 58 39.8 70 37.4 M142 17.2 C156 19 170 23.2 184 26.8',
    feature: 'M86 52.4 C110 50.4 134 44.6 152 37',
  },
  // Front-mid-engine GT: very long hood, cabin set back, fastback, short tail.
  'ferrari-812-superfast': {
    name: 'Ferrari 812 Superfast (2017), vista lateral',
    front: { x: 64, r: 14 },
    rear: { x: 174, r: 14.5 },
    sill: 58.8,
    outline:
      'M30.6 58.8 C28 58 27 55.4 27.4 52.4 C27.8 49 30 46.8 34.4 45.4 C42 43 50 39.6 58 37.4 C62 36.4 66 35.8 70 35.6 ' +
      'C82 34.6 96 33.4 112 31.8 C119 25 127 18.4 137 14.6 C141 13.4 145 13 149 13.2 C162 14.8 178 20.6 193 26.4 ' +
      'C199 28.4 204 29.4 208.6 29.4 L211.8 28.6 L212.4 31.2 L212.8 44 C212.4 50 211.4 54 209.4 56 L207 58.8',
    glass:
      'M115.4 31.2 C121 25.4 128 19.6 137 16.6 C141.6 15.4 145.6 15.2 149.6 15.6 C158 16.8 165 20 171 24 C154 27.6 134 30 115.4 31.2 Z',
    vents: 'M78.6 39.6 C83.6 38.8 89 39.6 93.6 41.6 L92.2 45 C88 43.6 83.4 43.2 78.4 43.6 Z',
    seams: 'M113.6 32 C114 42 112.6 50 110.6 58.4 M156 25.2 C157.6 36 157.6 48 154.6 58.4',
    highlight: 'M33 46.4 C44 42.6 56 38.8 68 37 M151 14 C165 16.2 180 21.8 192 27',
    feature: 'M94 42.6 C120 45 146 42 168 33.4',
  },
  // Italdesign wedge concept: straight creases, cab-forward canopy, long flat rear deck.
  'vw-w12-concept': {
    name: 'Volkswagen W12 Syncro (Italdesign, 1997), vista lateral',
    front: { x: 74, r: 13.6 },
    rear: { x: 179, r: 14 },
    sill: 58.8,
    outline:
      'M43 58.8 L39.6 57.4 L39 51.4 L41 49.4 L64 42.6 L96 35.4 L114 21.6 L134 20.2 L140.4 22 L206 27.6 L208.4 28.8 L208.8 50 L207 58.8',
    glass: 'M100 34.8 L115 23.2 L132.6 22.4 L142.6 25.2 L148.6 30.4 Z',
    vents: 'M152 34.2 L171 32 L168.6 42.2 L153 42.8 Z',
    seams: 'M101.4 35.6 L99.8 58.4 M149.6 31.4 L150.2 58.4',
    highlight: 'M42 50.4 L96 36.4 M141 23 L205 28.6',
    feature: 'M41.6 53 L150 43.4 L206 39',
  },
};
