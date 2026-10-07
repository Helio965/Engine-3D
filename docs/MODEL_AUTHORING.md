# Authoring an engine exterior model

Every engine is generated procedurally. The **moving internals** (crankshaft,
rods, pistons, liners, valves, cams, plugs, injectors, combustion) are built
automatically by `src/engine/parts/Internals.tsx` from the engine data
(`src/data/engines/*.ts`). A model file only builds the **exterior dressing**
that makes the engine recognisable, and declares a little metadata.

File: `src/engine/models/<name>.tsx` (registered in `src/engine/models/index.ts`).

```tsx
import { useEngine } from '../EngineContext';
import type { ModelMeta } from './types';

export default function MyEngine() {
  const { def, dims, layout, lib, geo, seg } = useEngine();
  return <group>{/* parts */}</group>;
}

export const meta: ModelMeta = {
  valvetrain: { intakeInside: true, injection: 'port', coilOnPlug: true },
  anchors: (ctx) => ({ intake: [...], exhaust: [...], pistons: [...], crankshaft: [0, 0, 0], induction: [...], valvetrain: [...], front: [...] }),
  flows: (ctx) => ({ air: [...paths], fuel: [...], exhaust: [...], coolant: [...] }),
  fuelInlet: (ctx) => [x, y, z],
  size: (ctx) => [length, height, width],
};
```

## Coordinate frame (engine space, metres)

* **X** = crankshaft axis. **+X is the FRONT** (accessory drive); flywheel / gearbox at −X.
* **Y** = up. The crank axis is at `y = 0, z = 0`.
* **Z** = lateral. Bank angles are measured from +Y toward +Z.
* `dims.bankAxisDeg[b]` gives each bank's axis; `<BankFrame bank={b}>` creates
  a group whose local +Y is that bank's axis and local +Z the bank's lateral
  direction (perpendicular). Inside a BankFrame:
  * deck face at `y = dims.deck`;
  * head from `dims.deck` to `dims.deck + dims.headHeight`;
  * cam cover on top (`dims.coverHeight`).
* Useful dims: `dims.bore`, `dims.bankWidth`, `dims.blockLength`,
  `dims.frontX`, `dims.rearX`, `dims.crankcaseRadius`, `dims.sumpDepth`,
  `dims.bottomY` (lowest point; the renderer lifts the engine onto the platform).
* `layout.cylinders[]` → `{ number, bank, row, axisDeg, axialM, ... }` per cylinder.
* Helpers: `portPoint(c, dims, sideSign, out)` gives a port location on the
  side of the head; `intakeSideOf(...)` returns the intake side sign.

## Building blocks (`src/engine/parts/*`)

| Component | Use |
|---|---|
| `Block`, `Heads`, `CamCovers`, `Sump`, `TimingCover`, `Bellhousing` | parametric housings (finish/colour/labels/fins/twinHumps) |
| `FrontDrive` | crank pulley + accessories + belt (all rotate with the crank) |
| `Headers` | exhaust primaries from each exhaust port to collectors |
| `Runners` | intake runners from each intake port to a target point |
| `ThrottleBody`, `AirFilter`, `Intercooler`, `FuelRail`, `Box`, `Pipe` | plumbing kit |
| `Turbo index={i}` | turbocharger; spins with `sim.turboShaft[i]` (compressor at local +Y) |
| `TwinScrewSupercharger` | twin-screw supercharger with rotors (Hellcat) |
| `OilFilter` | spin-on filter |
| `Part` | wrap ANY custom mesh group: gives it identification, view-mode visibility and exploded-view motion |

Every custom mesh must sit inside a `<Part kind=… category=… explode=[dx,dy,dz]>`.
`kind` is a key of `src/data/components.ts` (identification tooltip).
Categories: `block`, `head`, `cover`, `induction`, `exhaust`, `accessory`,
`turbo`, `supercharger`, `fuel` (only with the fuel system shown),
`rotating`, `valvetrain`, `liner`. Pick the right one — view modes fade/hide by category.

Materials: always `lib.get(finish, category, colour?, variant?)` (never inline
`<meshStandardMaterial>`), so transparency/cutaway work. Finishes:
`castAluminium, machinedAluminium, castIron, forgedSteel, chrome,
polishedSteel, titanium, heatTint, carbon, crinkle, satin, gloss, plastic,
rubber, brass, copper, heatShield, ceramic`. Text on covers:
`createLabelTexture()` + `lib.decal()` (plain lettering in a generic font —
do not reproduce manufacturer logo artwork).

Geometry: cache shared geometry with `geo('unique-key', () => new THREE.XGeometry(...))`
(disposed automatically); scale segment counts with `seg(n)`.

## Rules

* Never add components the real engine does not have (no turbo on a naturally
  aspirated engine, no supercharger on a turbo engine, correct turbo count).
* The cylinder count and arrangement come from the data — do not fake them.
* Keep the engine readable: the exterior should not swallow the internals in
  the TRANSPARENT/CUTAWAY views.
* Animated exterior parts must be driven by `simRef.current` (crank angle,
  turbo shaft speed…) inside `useFrame`, never by independent timers.

## Checking your work

A dev server runs at `http://127.0.0.1:5173/`. Deep-link parameters:
`?engine=<id>&intro=0&q=medium&sound=0&view=complete|transparent|cutaway|internals|pistons|exploded&cam=front|rear|left|right|top|intake|exhaust|pistons|crankshaft|induction`.
Screenshot helper (headless Chromium):

```
node /tmp/claude-0/-home-user-Engine-3D/ab244162-9ce5-5cd9-9c48-a6bbaade3bc9/scratchpad/pw/shot.mjs "<url>" <out.png> [waitMs] ['[{"click":"button.start-btn"},{"wait":2000}]']
```
Look at the PNG (Read tool) and iterate until the engine is recognisable.
