import * as THREE from 'three';

/** Geometry helpers shared by the procedural engine parts. */

const UP = new THREE.Vector3(0, 1, 0);
const tmpV = new THREE.Vector3();
const tmpQ = new THREE.Quaternion();

/** Places an object (whose length runs along local +Y, centred) between two points. */
export function placeBetween(obj: THREE.Object3D, a: THREE.Vector3, b: THREE.Vector3, scaleLength = true) {
  tmpV.subVectors(b, a);
  const len = tmpV.length();
  obj.position.copy(a).addScaledVector(tmpV, 0.5);
  if (len > 1e-9) {
    tmpQ.setFromUnitVectors(UP, tmpV.divideScalar(len));
    obj.quaternion.copy(tmpQ);
  }
  if (scaleLength) obj.scale.set(1, len, 1);
}

/** Orients an object so its local +Y points along `dir`. */
export function alignY(obj: THREE.Object3D, dir: THREE.Vector3) {
  tmpQ.setFromUnitVectors(UP, tmpV.copy(dir).normalize());
  obj.quaternion.copy(tmpQ);
}

/** Crank web / counterweight outline: egg shape with the pin lobe at +Y. */
export function webShape(r: number, pinR: number, cwR: number, segments = 48): THREE.Shape {
  const s = new THREE.Shape();
  const rPin = r + pinR * 1.25;
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    // a = 0 → +Y (pin side); blend to counterweight radius on the opposite side
    const k = 0.5 + 0.5 * Math.cos(a);
    const rad = cwR + (rPin - cwR) * Math.pow(k, 1.6);
    const x = Math.sin(a) * rad * (0.72 + 0.28 * k);
    const y = Math.cos(a) * rad;
    if (i === 0) s.moveTo(x, y);
    else s.lineTo(x, y);
  }
  return s;
}

/**
 * Extrudes a 2D shape (drawn in the shape's XY plane = engine YZ plane after
 * mapping shape.x→Z, shape.y→Y) along the engine X axis, centred on x = 0.
 */
export function extrudeAlongX(shape: THREE.Shape, length: number, bevel = 0, curveSegments = 12): THREE.BufferGeometry {
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: length,
    bevelEnabled: bevel > 0,
    bevelSize: bevel,
    bevelThickness: bevel,
    bevelSegments: 2,
    curveSegments,
  });
  g.translate(0, 0, -length / 2);
  // shape (x,y,z) → engine (z_e = x_s, y_e = y_s, x_e = -z_s) : rotate -90° about Y
  g.rotateY(-Math.PI / 2);
  g.computeVertexNormals();
  return g;
}

/** Cam lobe profile (nose at +Y), raised-cosine flank. */
export function camLobeShape(baseR: number, lift: number, segments = 48): THREE.Shape {
  const s = new THREE.Shape();
  const half = Math.PI * 0.42; // half of the lobe duration on the cam
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2 - Math.PI;
    const t = Math.abs(a) < half ? 0.5 + 0.5 * Math.cos((a / half) * Math.PI) : 0;
    const rad = baseR + lift * t;
    const x = Math.sin(a) * rad;
    const y = Math.cos(a) * rad;
    if (i === 0) s.moveTo(x, y);
    else s.lineTo(x, y);
  }
  return s;
}

/** Lathe profile for a grooved poly-V pulley (axis along Y). */
export function pulleyGeometry(radius: number, width: number, grooves: number, segments: number): THREE.BufferGeometry {
  const pts: THREE.Vector2[] = [];
  const hub = radius * 0.32;
  pts.push(new THREE.Vector2(0.004, -width / 2));
  pts.push(new THREE.Vector2(hub, -width / 2));
  pts.push(new THREE.Vector2(radius * 0.92, -width / 2));
  const n = Math.max(1, grooves);
  for (let i = 0; i <= n * 2; i++) {
    const y = -width / 2 + (i / (n * 2)) * width;
    pts.push(new THREE.Vector2(i % 2 === 0 ? radius : radius * 0.955, y));
  }
  pts.push(new THREE.Vector2(radius * 0.92, width / 2));
  pts.push(new THREE.Vector2(hub, width / 2 + width * 0.25));
  pts.push(new THREE.Vector2(0.004, width / 2 + width * 0.25));
  const g = new THREE.LatheGeometry(pts, segments);
  g.computeVertexNormals();
  return g;
}

/** Helix tube for valve springs (axis along Y, from y=0 to y=1, unit height; scale Y to compress). */
export function springGeometry(radius: number, wire: number, coils: number, segments: number): THREE.BufferGeometry {
  const steps = Math.max(24, coils * segments);
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const a = t * coils * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(a) * radius, t, Math.sin(a) * radius));
  }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), steps, wire, 5, false);
}

/** Compressor / turbine wheel: hub + curved blades (axis along Y). */
export function bladedWheelGeometry(radius: number, height: number, blades: number, twist = 0.6): THREE.BufferGeometry {
  const geos: THREE.BufferGeometry[] = [];
  const hub = new THREE.CylinderGeometry(radius * 0.22, radius * 0.42, height, 20);
  geos.push(hub);
  for (let i = 0; i < blades; i++) {
    const blade = new THREE.BoxGeometry(radius * 0.78, height * 0.92, radius * 0.045);
    blade.translate(radius * 0.5, 0, 0);
    // twist the blade along its height
    const pos = blade.attributes.position;
    for (let k = 0; k < pos.count; k++) {
      const y = pos.getY(k);
      const x = pos.getX(k);
      const z = pos.getZ(k);
      const ang = (y / height) * twist;
      const taper = 1 - (y / height + 0.5) * 0.35 * (x / radius);
      pos.setXYZ(k, x * taper * Math.cos(ang) - z * Math.sin(ang), y, x * taper * Math.sin(ang) + z * Math.cos(ang));
    }
    blade.rotateY((i / blades) * Math.PI * 2);
    geos.push(blade);
  }
  const merged = mergeGeometries(geos);
  geos.forEach((g) => g.dispose());
  return merged;
}

/** Minimal non-indexed geometry merge (position + normal). */
export function mergeGeometries(geos: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const parts = geos.map((g) => (g.index ? g.toNonIndexed() : g));
  let count = 0;
  parts.forEach((g) => (count += g.attributes.position.count));
  const pos = new Float32Array(count * 3);
  const nor = new Float32Array(count * 3);
  let o = 0;
  parts.forEach((g) => {
    if (!g.attributes.normal) g.computeVertexNormals();
    pos.set(g.attributes.position.array as Float32Array, o * 3);
    nor.set(g.attributes.normal.array as Float32Array, o * 3);
    o += g.attributes.position.count;
  });
  parts.forEach((g, i) => g !== geos[i] && g.dispose());
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  return out;
}

/** Smooth closed loop around pulleys (belt path) given centres (in YZ of a plane at x) and radii. */
export function beltPath(centres: [number, number][], radii: number[], samplesPerPulley = 10): THREE.Vector3[] {
  // order pulleys around their centroid so the loop does not self-intersect
  const cx = centres.reduce((s, c) => s + c[0], 0) / centres.length;
  const cy = centres.reduce((s, c) => s + c[1], 0) / centres.length;
  const order = centres
    .map((c, i) => ({ i, a: Math.atan2(c[1] - cy, c[0] - cx) }))
    .sort((p, q) => p.a - q.a)
    .map((p) => p.i);
  const pts: THREE.Vector3[] = [];
  order.forEach((i) => {
    const [x, y] = centres[i];
    const base = Math.atan2(y - cy, x - cx);
    for (let k = 0; k < samplesPerPulley; k++) {
      const a = base - Math.PI * 0.5 + (k / (samplesPerPulley - 1)) * Math.PI;
      pts.push(new THREE.Vector3(0, y + Math.sin(a) * radii[i], x + Math.cos(a) * radii[i]));
    }
  });
  return pts;
}
