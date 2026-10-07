import * as THREE from 'three';

/**
 * Procedural textures generated at runtime (no external image assets):
 * carbon-fibre twill, wrinkle ("crinkle") paint, cast-metal grain, brushed
 * metal and dimpled heat-shield foil. All are original and license free.
 */

function canvas(size: number) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;
  return { c, ctx };
}

function finalize(c: HTMLCanvasElement, repeat: number, color = true) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  t.anisotropy = 4;
  if (color) t.colorSpace = THREE.SRGBColorSpace;
  t.needsUpdate = true;
  return t;
}

// deterministic pseudo random
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** Height-field → normal map (tangent space). */
function heightToNormal(height: Float32Array, size: number, strength: number): HTMLCanvasElement {
  const { c, ctx } = canvas(size);
  const img = ctx.createImageData(size, size);
  const at = (x: number, y: number) => height[((y + size) % size) * size + ((x + size) % size)];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * strength;
      const dy = (at(x, y + 1) - at(x, y - 1)) * strength;
      const nz = 1;
      const len = Math.hypot(dx, dy, nz);
      const i = (y * size + x) * 4;
      img.data[i] = ((-dx / len) * 0.5 + 0.5) * 255;
      img.data[i + 1] = ((-dy / len) * 0.5 + 0.5) * 255;
      img.data[i + 2] = (nz / len) * 255;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

function valueNoise(size: number, cells: number, seed: number): Float32Array {
  const r = rng(seed);
  const grid = new Float32Array((cells + 1) * (cells + 1)).map(() => r());
  const out = new Float32Array(size * size);
  const g = (x: number, y: number) => grid[(y % cells) * (cells + 1) + (x % cells)];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const fx = (x / size) * cells;
      const fy = (y / size) * cells;
      const ix = Math.floor(fx);
      const iy = Math.floor(fy);
      const tx = fx - ix;
      const ty = fy - iy;
      const sx = tx * tx * (3 - 2 * tx);
      const sy = ty * ty * (3 - 2 * ty);
      const a = g(ix, iy);
      const b = g(ix + 1, iy);
      const c2 = g(ix, iy + 1);
      const d = g(ix + 1, iy + 1);
      out[y * size + x] = a + (b - a) * sx + (c2 - a) * sy + (a - b - c2 + d) * sx * sy;
    }
  }
  return out;
}

function fbm(size: number, seed: number, octaves: number[]): Float32Array {
  const out = new Float32Array(size * size);
  let amp = 1;
  let total = 0;
  octaves.forEach((cells, i) => {
    const n = valueNoise(size, cells, seed + i * 97);
    for (let k = 0; k < out.length; k++) out[k] += n[k] * amp;
    total += amp;
    amp *= 0.5;
  });
  for (let k = 0; k < out.length; k++) out[k] /= total;
  return out;
}

export interface TextureSet {
  carbonMap: THREE.Texture;
  carbonNormal: THREE.Texture;
  crinkleNormal: THREE.Texture;
  castNormal: THREE.Texture;
  castRough: THREE.Texture;
  brushedRough: THREE.Texture;
  dimpleNormal: THREE.Texture;
  dispose: () => void;
}

export function createTextures(quality: 'low' | 'medium' | 'high' | 'ultra'): TextureSet {
  const size = quality === 'low' ? 128 : quality === 'medium' ? 256 : 512;

  // --- carbon twill weave
  const cw = canvas(size);
  const tows = 8;
  const cell = size / tows;
  const heightC = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const cx = Math.floor(x / cell);
      const cy = Math.floor(y / cell);
      const horizontal = (cx + cy) % 4 < 2; // 2x2 twill
      const u = (x % cell) / cell;
      const v = (y % cell) / cell;
      const along = horizontal ? v : u;
      const ridge = Math.sin(along * Math.PI);
      const fibre = 0.5 + 0.5 * Math.sin((horizontal ? u : v) * Math.PI * 18);
      heightC[y * size + x] = ridge * 0.8 + fibre * 0.08;
    }
  }
  const img = cw.ctx.createImageData(size, size);
  for (let i = 0; i < heightC.length; i++) {
    const h = heightC[i];
    const v = 18 + h * 34;
    img.data[i * 4] = v;
    img.data[i * 4 + 1] = v + 1;
    img.data[i * 4 + 2] = v + 4;
    img.data[i * 4 + 3] = 255;
  }
  cw.ctx.putImageData(img, 0, 0);
  const carbonMap = finalize(cw.c, 10);
  const carbonNormal = finalize(heightToNormal(heightC, size, 2.2), 10, false);

  // --- wrinkle paint (crinkle)
  const crinkleH = fbm(size, 11, [64, 128, 32]);
  for (let i = 0; i < crinkleH.length; i++) crinkleH[i] = Math.pow(crinkleH[i], 1.6);
  const crinkleNormal = finalize(heightToNormal(crinkleH, size, 7), 9, false);

  // --- sand-cast grain
  const castH = fbm(size, 5, [96, 48, 192]);
  const castNormal = finalize(heightToNormal(castH, size, 3), 7, false);
  const cr = canvas(size);
  const cimg = cr.ctx.createImageData(size, size);
  for (let i = 0; i < castH.length; i++) {
    const v = 150 + castH[i] * 80;
    cimg.data[i * 4] = cimg.data[i * 4 + 1] = cimg.data[i * 4 + 2] = v;
    cimg.data[i * 4 + 3] = 255;
  }
  cr.ctx.putImageData(cimg, 0, 0);
  const castRough = finalize(cr.c, 7, false);

  // --- brushed metal roughness
  const br = canvas(size);
  const r = rng(3);
  br.ctx.fillStyle = 'rgb(90,90,90)';
  br.ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < size * 3; i++) {
    const y = r() * size;
    const g = 60 + r() * 80;
    br.ctx.strokeStyle = `rgba(${g},${g},${g},0.35)`;
    br.ctx.beginPath();
    br.ctx.moveTo(0, y);
    br.ctx.lineTo(size, y + (r() - 0.5) * 2);
    br.ctx.stroke();
  }
  const brushedRough = finalize(br.c, 1, false);

  // --- dimpled heat shield
  const dimH = new Float32Array(size * size);
  const pitch = size / 16;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const row = Math.floor(y / pitch);
      const ox = row % 2 ? pitch / 2 : 0;
      const dx = ((x + ox) % pitch) - pitch / 2;
      const dy = (y % pitch) - pitch / 2;
      const d = Math.hypot(dx, dy) / (pitch / 2);
      dimH[y * size + x] = d < 1 ? Math.cos(d * Math.PI * 0.5) : 0;
    }
  }
  const dimpleNormal = finalize(heightToNormal(dimH, size, 3.5), 12, false);

  const all = [carbonMap, carbonNormal, crinkleNormal, castNormal, castRough, brushedRough, dimpleNormal];
  return {
    carbonMap,
    carbonNormal,
    crinkleNormal,
    castNormal,
    castRough,
    brushedRough,
    dimpleNormal,
    dispose: () => all.forEach((t) => t.dispose()),
  };
}

/** Canvas texture with lettering for cast/painted inscriptions on covers. */
export function createLabelTexture(
  text: string,
  opts: { color?: string; background?: string; font?: string; width?: number; height?: number; italic?: boolean; letterSpacing?: number } = {},
): THREE.CanvasTexture {
  const w = opts.width ?? 1024;
  const h = opts.height ?? 256;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  if (opts.background) {
    ctx.fillStyle = opts.background;
    ctx.fillRect(0, 0, w, h);
  }
  ctx.fillStyle = opts.color ?? '#e9e6df';
  const size = Math.floor(h * 0.62);
  ctx.font = `${opts.italic ? 'italic ' : ''}${opts.font ?? `700 ${size}px "Helvetica Neue", Arial, sans-serif`}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (opts.letterSpacing && 'letterSpacing' in ctx) {
    (ctx as unknown as { letterSpacing: string }).letterSpacing = `${opts.letterSpacing}px`;
  }
  ctx.fillText(text, w / 2, h / 2 + h * 0.03);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
