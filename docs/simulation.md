# Simulation model

Engine Lab is not a certified engineering tool, but every number it shows is
produced by explicit, documented formulas driven by **one master clock**.
Source: `src/simulation/`.

## Master clock

```
dt_sim = dt_real × slow-motion factor          (1, 1/4, 1/10, 1/25, 1/100)
EngineSimulation.step(dt_sim)                    (sub-steps of 1/600 s)
crankDeg ← (crankDeg + rpm × 6 × dt) mod 720     (rpm × 360°/60 s)
```

Everything that moves reads `crankDeg`/`rpm` from the same object in the same
frame: pistons, rods, crankshaft, valves, cams, combustion glow, accessory
pulleys, supercharger rotors, the turbo shafts (their own speed state) and the
procedural sound (the AudioWorklet re-synchronises its phase to `crankDeg`).
Slow motion slows the whole clock, so pitch drops like a slow-motion recording.

## Kinematics (`kinematics.ts`, `cylinderLayout.ts`)

Slider–crank, crank radius `r = stroke/2`, rod length `l`, angle θ from TDC:

```
s(θ)   = r·cos θ + √(l² − r²·sin² θ)       piston-pin distance from the crank axis
β(θ)   = asin(r/l · sin θ)                  rod angle
```

Four-stroke cycle over 720°: 0–180 power, 180–360 exhaust, 360–540 intake,
540–720 compression. Valve events (typical values, not engine-specific):
EVO 130°, EVC 370°, IVO 350°, IVC 590°, raised-cosine lift. Cams turn at θ/2.

**Crank throws are derived, not hand-animated.** Each cylinder `i` reaches
combustion TDC at `tdc_i = Σ firing intervals` along the firing order, so its
throw angle is `α_i = axis_i − tdc_i (mod 360)`. The solver evaluates both
mirror assignments of the banks and keeps the one where cylinders sharing a
crank slot share (or nearly share) a throw. Tests confirm that real firing
orders reproduce real crankshafts: Chevrolet-numbered V8 → cross-plane
(0/90/270/180), Ferrari-numbered V8 → flat-plane, 1-5-3-6-2-4 → 120° inline-6,
BMW S85 order → 18° split-pin V10.

When no firing order can be confirmed (or mapped to a published cylinder
numbering), an **illustrative** even-firing order is generated and labelled as
such in the UI.

## Torque, airflow and boost (`curves.ts`, `engineModel.ts`)

* Full-load brake torque `T_wot(rpm)`: monotone cubic through the published
  anchor points only (peak torque rpm/plateau, peak power rpm); shapes below
  the peak use typical ratios. Labelled “curva aproximada”.
* Friction: `FMEP = 0.97 + 0.15·N + 0.05·N²` bar (N in 1000 rpm),
  `T = MEP · V_d / (4π)`.
* Pumping: `PMEP = 0.9 bar · (1 − p_man)`.
* Throttle: drive-by-wire pedal map `plate = pedal^1.6`; airflow limit
  `p_man = min(1, 13 750 · plate^1.5 / rpm)` (≥ 0.16), manifold lag 35 ms.
* Indicated torque `T_i = (T_wot + T_fric) / (1 + boost_ss/1.013) · (p_man + boost/1.013)`,
  so at wide-open throttle and steady boost the brake torque equals the published curve.
* Idle: PI idle-air control + spark-retard authority; deceleration fuel cut-off
  above idle + 450 rpm with a closed throttle.
* Rev limiter: fuel cut above the limit, resumes 180 rpm below.
* Turbo: target boost = steady-state curve × pedal demand (reduced without
  load); first-order lag with time constant `τ = τ₃₀₀₀ · (3000/rpm)^0.9`;
  sequential systems bring the second stage on at the published rpm; shaft
  speed `∝ √(boost/boost_max)`.
* Supercharger: positive displacement → near-instant boost (bypass valve shut
  only under load); rotor speed = crank speed × drive ratio.
* Engine dynamics: `J · dω/dt = T_brake − T_load`.

## Drivetrain (`transmission.ts`)

```
rpm = v / (2π r_tyre) · 60 · gear ratio · final drive          (clutch locked)
m_eq · dv/dt = T·i·η/r − ½ρ·CdA·v² − C_rr·m·g − F_brake,   m_eq = m + J·i²/r²
```

Automatic clutch for launch/re-engagement (slip torque `∝ tanh(Δω)`), shift
time per gearbox type (dual-clutch keeps ~50 % torque during the shift), rev
matching on downshifts, over-rev protection on manual downshifts, automatic
mode with throttle-dependent shift points and kick-down, cruise controller for
“velocidade alvo”, electronic top-speed limiters. When a manufacturer
publishes speed-per-gear instead of ratios, overall ratios are derived from it.
`CdA` is either official (Cd × estimated area) or calibrated so that the
published power at the wheels balances drag at the published top speed.

## Fuel (`engineModel.ts`, `fuel.ts`)

```
ṁ_fuel = P_indicated · ISFC · enrichment          ISFC = 225 g/kWh
enrichment = 1 + 0.16·smoothstep(load 0.82→1) + 0.08·boost fraction
litres = grams / 745 g/L
```

So idle consumes little (friction + pumping power only), wide-open throttle a
lot. The “simulation speed” multiplier (1×/10×/30×/60×) scales ONLY the fuel
clock (consumption and pump flow). Below 0.25 L, fuel pick-up becomes
intermittent (misfires); at 0 L the engine stops and cannot be restarted until
refuelled. Refuelling: connect (1.4 s) → pump at 48 L/min × fuel clock →
disconnect; the engine stays off.

## Temperatures and dyno

Coolant: lumped heat capacity, 27 % of fuel energy into the coolant,
thermostat opening 84–96 °C, airflow from speed/fan. Oil follows coolant plus
load. Oil pressure ∝ rpm with a viscosity factor. Dyno: PI-controlled absorber
holds a target rpm; the sweep runs a wide-open-throttle pull at 280–360 rpm/s
and records torque/power every 50 rpm.
