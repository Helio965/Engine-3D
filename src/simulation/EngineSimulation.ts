import type { EngineDefinition } from '../types/engine';
import { buildBoostCurve, buildTorqueCurve, powerFromTorque } from './curves';
import {
  ATM_BAR,
  GASOLINE_LHV_KJ_PER_G,
  frictionTorque,
  fuelMassFlow,
  gramsToLitres,
  indicatedTorque,
  pumpingTorque,
  throttleArea,
  THROTTLE_FLOW_RPM,
  MIN_MANIFOLD_FRACTION,
} from './engineModel';
import {
  createFuelState,
  consume,
  completeRefuel,
  startRefuel,
  stepRefuel,
  stopRefuel,
  STARVATION_L,
  type FuelState,
  type RefuelPhase,
} from './fuel';
import { wrap720 } from './kinematics';
import { autoSelectGear, gearLabel, MS_TO_KMH, rpmFromSpeed, totalRatio } from './transmission';

/**
 * EngineSimulation — single source of truth for everything that moves.
 *
 * One instance simulates one engine (and its vehicle, when there is one).
 * The renderer, dashboards and audio only READ from it; the master clock is
 * `step(dt)`, called once per animation frame. The crank angle produced here
 * drives pistons, rods, valves, cams, combustion glow, turbo/supercharger
 * rotation and the procedural sound, so they cannot fall out of sync.
 *
 * All formulas are engineering approximations; see docs/simulation.md.
 */

export type SimMode = 'neutral' | 'drive' | 'dyno';
export type Ignition = 'off' | 'cranking' | 'running';
export type GearMode = 'auto' | 'manual';
export type DriveControl = 'cruise' | 'pedal';
export type DynoMode = 'hold' | 'sweep';
export type DynoPhase = 'idle' | 'settle' | 'pull' | 'cooldown';

export interface DynoSample {
  rpm: number;
  torqueNm: number;
  powerKw: number;
  boostBar: number;
}

export interface SimMessage {
  text: string;
  level: 'info' | 'warn' | 'error';
  /** Simulation time the message was raised. */
  at: number;
}

export interface Telemetry {
  ignition: Ignition;
  running: boolean;
  rpm: number;
  crankDeg: number;
  pedal: number;
  throttlePlate: number;
  manifoldBar: number;
  boostBar: number;
  turboShaftRpm: number[];
  turboActive: boolean[];
  superchargerRpm: number;
  torqueNm: number;
  powerKw: number;
  loadFraction: number;
  speedKmh: number;
  gear: number;
  gearLabel: string;
  shifting: boolean;
  clutchLocked: boolean;
  limiter: boolean;
  speedLimiter: boolean;
  shiftLight: number;
  fuelL: number;
  fuelCapacityL: number;
  fuelFraction: number;
  fuelFlowLph: number;
  consumptionL100: number | null;
  rangeKm: number | null;
  enduranceMin: number | null;
  outOfFuel: boolean;
  lowFuel: boolean;
  refuel: RefuelPhase;
  refuelPumpedL: number;
  coolantC: number;
  oilC: number;
  oilBar: number;
  mode: SimMode;
  gearMode: GearMode;
  driveControl: DriveControl;
  targetSpeedKmh: number;
  dynoPhase: DynoPhase;
  dynoTargetRpm: number;
  dynoLoadNm: number;
  combusting: boolean;
  time: number;
  message: SimMessage | null;
  blowOffAt: number;
}

const SUBSTEP = 1 / 600;
/** Drive-by-wire pedal map: plate opening = pedal^k (progressive at small pedal travel). */
export const PEDAL_MAP_EXPONENT = 1.6;
const CRANK_RPM = 220;
const CRANK_TIME_S = 0.95;
const AMBIENT_C = 25;
const G = 9.81;
const AIR_DENSITY = 1.2;

const clamp = (x: number, lo: number, hi: number) => (x < lo ? lo : x > hi ? hi : x);
const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const toOmega = (rpm: number) => (rpm * 2 * Math.PI) / 60;
const toRpm = (omega: number) => (omega * 60) / (2 * Math.PI);

export class EngineSimulation {
  readonly def: EngineDefinition;
  readonly torqueCurve: (rpm: number) => number;
  readonly boostCurve: (rpm: number) => number;

  // ---------------------------------------------------------------- inputs
  pedal = 0;
  brake = 0;
  mode: SimMode = 'neutral';
  gearMode: GearMode = 'auto';
  driveControl: DriveControl = 'cruise';
  targetSpeedKmh = 0;
  dynoMode: DynoMode = 'hold';
  dynoTargetRpm = 3000;
  /** Multiplies only the fuel clock (consumption + refuel pump). */
  fuelTimeScale = 1;

  // ----------------------------------------------------------------- state
  ignition: Ignition = 'off';
  time = 0;
  rpm = 0;
  crankDeg = 0;
  plate = 0;
  idleAir = 0;
  private idleI = 0;
  manifold = 1;
  boost = 0;
  turboShaft: number[] = [];
  scRotorRpm = 0;
  torqueInd = 0;
  torqueBrake = 0;
  fuelCut = false;
  speedCut = false;
  combusting = false;
  private crankTimer = 0;
  private startFlare = 0;
  private misfire = false;
  private rng = 0x2f6b1a3d;
  private shiftCut = 1;

  gear = 0;
  private targetGear = 0;
  private shiftTimer = 0;
  private shiftTotal = 0;
  private shiftSwapped = false;
  clutchLocked = false;
  private engagement = 0;
  speedMs = 0;
  private cruiseI = 0;
  private autoShiftCooldown = 0;

  fuel: FuelState;
  fuelFlowLps = 0;
  private consumptionAvg: number | null = null;
  outOfFuel = false;

  coolantC = 88;
  oilC = 85;
  oilBar = 0;

  dynoPhase: DynoPhase = 'idle';
  dynoLoad = 0;
  private dynoI = 0;
  private dynoSettle = 0;
  private lastSampleRpm = 0;
  dynoSamples: DynoSample[] = [];
  /** Completed sweep curves, most recent last. */
  dynoRuns: DynoSample[][] = [];

  message: SimMessage | null = null;
  blowOffAt = -10;
  private lastPlate = 0;

  constructor(def: EngineDefinition) {
    this.def = def;
    this.torqueCurve = buildTorqueCurve(def);
    this.boostCurve = buildBoostCurve(def);
    this.fuel = createFuelState(def.fuel.capacityL);
    this.turboShaft = new Array(def.engine.turbo?.count ?? 0).fill(0);
    this.dynoTargetRpm = Math.round((def.performance.torqueRpm instanceof Array ? def.performance.torqueRpm[0] : def.performance.torqueRpm) / 100) * 100;
  }

  // ------------------------------------------------------------- commands
  get hasVehicle(): boolean {
    return !!this.def.drivetrain && !!this.def.vehicleSpec;
  }

  get running(): boolean {
    return this.ignition === 'running';
  }

  private say(text: string, level: SimMessage['level'] = 'info') {
    this.message = { text, level, at: this.time };
  }

  start(): boolean {
    if (this.ignition !== 'off') return false;
    if (this.fuel.refuel !== 'idle') {
      this.say('Abastecimento em andamento — o motor permanece desligado.', 'warn');
      return false;
    }
    if (this.mode === 'drive' && this.gear !== 0 && Math.abs(this.speedMs) < 0.5) {
      // starting in gear with the car stopped: the auto clutch stays open
      this.engagement = 0;
      this.clutchLocked = false;
    }
    this.ignition = 'cranking';
    this.crankTimer = CRANK_TIME_S;
    this.say(this.fuel.levelL <= 0 ? 'Motor de arranque acionado…' : 'Partida…');
    return true;
  }

  stop(): void {
    if (this.ignition === 'off') return;
    this.ignition = 'off';
    this.say('Motor desligado.');
  }

  setMode(mode: SimMode): void {
    if (mode === 'drive' && !this.hasVehicle) {
      this.say('Crate engine: sem veículo documentado — modo condução indisponível.', 'warn');
      return;
    }
    if (mode === this.mode) return;
    this.mode = mode;
    this.speedMs = 0;
    this.gear = 0;
    this.targetGear = 0;
    this.shiftTimer = 0;
    this.clutchLocked = false;
    this.engagement = 0;
    this.cruiseI = 0;
    this.brake = 0;
    this.dynoPhase = 'idle';
    this.dynoLoad = 0;
    this.dynoI = 0;
    if (mode === 'drive' && this.gearMode === 'auto') this.gear = this.targetGear = 1;
  }

  setGearMode(m: GearMode): void {
    this.gearMode = m;
    if (this.mode === 'drive' && m === 'auto' && this.gear === 0) {
      this.gear = this.targetGear = 1;
      this.clutchLocked = false;
    }
  }

  /** Manual gear request: -1 = R, 0 = N, 1..n. Returns false when refused. */
  requestGear(g: number): boolean {
    const dt = this.def.drivetrain;
    if (!dt || this.mode !== 'drive') return false;
    if (g > dt.ratios.length || g < -1) return false;
    if (this.shiftTimer > 0) return false;
    const kmh = Math.abs(this.speedMs * MS_TO_KMH);
    if (g === -1 && kmh > 3 && this.speedMs > 0) {
      this.say('Ré bloqueada: pare o veículo antes de engatar R.', 'warn');
      return false;
    }
    if (g > 0 && this.speedMs < -0.8) {
      this.say('Pare o veículo antes de engatar uma marcha à frente.', 'warn');
      return false;
    }
    if (g > 0 && this.clutchLocked) {
      const newRpm = rpmFromSpeed(dt, g, kmh);
      if (newRpm > this.def.performance.revLimitRpm) {
        this.say(`Redução para ${g}ª bloqueada: excederia ${this.def.performance.revLimitRpm} rpm.`, 'warn');
        return false;
      }
    }
    if (g === this.gear) return true;
    this.beginShift(g);
    return true;
  }

  shiftUp(): boolean {
    const n = this.def.drivetrain?.ratios.length ?? 0;
    if (this.gearMode === 'auto') this.gearMode = 'manual';
    return this.gear < n ? this.requestGear(this.gear < 0 ? 0 : this.gear + 1) : false;
  }

  shiftDown(): boolean {
    if (this.gearMode === 'auto') this.gearMode = 'manual';
    return this.gear > -1 ? this.requestGear(this.gear - 1) : false;
  }

  private beginShift(g: number) {
    const dt = this.def.drivetrain!;
    this.targetGear = g;
    this.shiftTotal = this.gear === 0 || g === 0 ? Math.min(0.12, dt.shiftTimeS) : dt.shiftTimeS;
    this.shiftTimer = this.shiftTotal;
    this.shiftSwapped = false;
    this.autoShiftCooldown = 0.6;
  }

  startRefuel(): boolean {
    if (this.ignition !== 'off') this.stop();
    const ok = startRefuel(this.fuel);
    if (!ok && this.fuel.levelL >= this.fuel.capacityL) this.say('Tanque cheio.');
    return ok;
  }

  stopRefuel(): void {
    stopRefuel(this.fuel);
  }

  completeRefuel(): void {
    if (this.ignition !== 'off') this.stop();
    completeRefuel(this.fuel);
  }

  /** Test/utility helper. */
  setFuelLevel(litres: number): void {
    this.fuel.levelL = clamp(litres, 0, this.fuel.capacityL);
    if (this.fuel.levelL > 0) this.outOfFuel = false;
  }

  startDynoSweep(): void {
    if (this.mode !== 'dyno') this.setMode('dyno');
    if (!this.running) {
      this.say('Ligue o motor para iniciar a medição no dinamômetro.', 'warn');
      return;
    }
    this.dynoMode = 'sweep';
    this.dynoPhase = 'settle';
    this.dynoSettle = 1.2;
    this.dynoSamples = [];
    this.lastSampleRpm = 0;
    this.dynoI = 0;
    this.dynoTargetRpm = this.sweepStartRpm();
    this.say('Dinamômetro: estabilizando para a puxada em plena carga…');
  }

  abortDynoSweep(): void {
    if (this.dynoPhase !== 'idle') {
      this.dynoPhase = 'cooldown';
      this.dynoSettle = 1.0;
    }
  }

  sweepStartRpm(): number {
    const p = this.def.performance;
    return Math.round(Math.max(p.idleRpm * 2.2, 1800) / 100) * 100;
  }

  // ----------------------------------------------------------------- step
  /**
   * Advances the simulation.
   * @param dt simulated seconds (already scaled by the slow-motion factor)
   */
  step(dt: number): void {
    let remaining = clamp(dt, 0, 0.1);
    while (remaining > 1e-9) {
      const h = Math.min(SUBSTEP, remaining);
      this.stepOnce(h);
      remaining -= h;
    }
    const kmh = Math.abs(this.speedMs) * MS_TO_KMH;
    const lph = this.fuelFlowLps * 3600;
    if (this.mode === 'drive' && kmh > 3) {
      const l100 = (lph / kmh) * 100;
      this.consumptionAvg = this.consumptionAvg === null ? l100 : this.consumptionAvg + (l100 - this.consumptionAvg) * Math.min(1, dt / 2.5);
    } else if (this.mode !== 'drive') {
      this.consumptionAvg = null;
    }
  }

  private random(): number {
    // deterministic LCG so tests are reproducible
    this.rng = (Math.imul(this.rng, 1664525) + 1013904223) >>> 0;
    return this.rng / 4294967296;
  }

  private stepOnce(h: number) {
    const def = this.def;
    const p = def.performance;
    const e = def.engine;
    this.time += h;

    // --- ignition / starter -------------------------------------------
    if (this.ignition === 'cranking') {
      this.rpm += (CRANK_RPM - this.rpm) * (1 - Math.exp(-h / 0.12));
      this.crankTimer -= h;
      if (this.crankTimer <= 0) {
        if (this.fuel.levelL > 0 && !this.outOfFuel) {
          this.ignition = 'running';
          this.runTime = 0;
          this.startFlare = 1;
          this.idleI = 0.03;
          this.say('Motor em funcionamento.');
        } else if (this.crankTimer <= -1.1) {
          this.ignition = 'off';
          this.outOfFuel = true;
          this.say('SEM COMBUSTÍVEL — o motor não pega. Abasteça.', 'error');
        }
      }
    }
    this.startFlare *= Math.exp(-h / 2.2);

    // --- driver inputs ---------------------------------------------------
    let pedal = clamp(this.pedal, 0, 1);
    let brake = clamp(this.brake, 0, 1);
    if (this.mode === 'drive' && this.driveControl === 'cruise') {
      const out = this.cruiseControl(h);
      pedal = out.pedal;
      brake = out.brake;
    }
    if (this.mode === 'dyno' && this.dynoMode === 'sweep' && this.dynoPhase !== 'idle') {
      pedal = this.dynoPhase === 'pull' ? 1 : this.dynoPhase === 'settle' ? 0.35 : 0;
    }
    this.effectivePedal = pedal;

    // electronic throttle: progressive pedal map, plate follows with a short lag
    const plateTarget = Math.pow(pedal, PEDAL_MAP_EXPONENT);
    this.plate += (plateTarget - this.plate) * (1 - Math.exp(-h / 0.05));

    // idle air control (PI) keeps the idle speed when the pedal is released
    const running = this.ignition === 'running';
    if (running && !this.outOfFuel) {
      const idleTarget = p.idleRpm * (1 + 0.32 * this.startFlare);
      const err = (idleTarget - this.rpm) / p.idleRpm;
      this.idleI = clamp(this.idleI + err * 0.9 * h, 0, 0.3);
      this.idleAir = clamp(0.35 * err + this.idleI, 0, 0.35);
    } else {
      this.idleAir = 0;
      this.idleI = 0;
    }
    const area = Math.min(1, throttleArea(this.plate) + throttleArea(this.idleAir));
    const mapTarget = clamp((THROTTLE_FLOW_RPM * area) / Math.max(this.rpm, 120), MIN_MANIFOLD_FRACTION, 1);
    this.manifold += (mapTarget - this.manifold) * (1 - Math.exp(-h / 0.035));

    // --- combustion gating -------------------------------------------------
    if (this.rpm > p.revLimitRpm) this.fuelCut = true;
    else if (this.rpm < p.revLimitRpm - 180) this.fuelCut = false;

    const vs = def.vehicleSpec;
    const kmhNow = Math.abs(this.speedMs) * MS_TO_KMH;
    if (vs && this.mode === 'drive' && vs.topSpeedLimited) {
      if (kmhNow > vs.topSpeedKmh) this.speedCut = true;
      else if (kmhNow < vs.topSpeedKmh - 1.5) this.speedCut = false;
    } else this.speedCut = false;

    // fuel starvation when the tank is nearly empty
    if (this.fuel.levelL < STARVATION_L && running) {
      const pMisfire = 1 - this.fuel.levelL / STARVATION_L;
      if (this.random() < pMisfire * h * 40) this.misfire = !this.misfire;
    } else this.misfire = false;

    // deceleration fuel cut-off (closed throttle well above idle), as real ECUs do
    const idleTarget = p.idleRpm * (1 + 0.32 * this.startFlare);
    if (pedal < 0.01 && this.rpm > idleTarget + 450) this.decelCut = true;
    else if (pedal >= 0.01 || this.rpm < idleTarget + 220) this.decelCut = false;
    // idle spark-retard authority: trims torque when closed-throttle airflow alone is too much
    const over = Math.max(0, (this.rpm - idleTarget) / idleTarget);
    const retardTarget = pedal < 0.02 && running ? Math.max(0.3, 1 - 2.2 * over) : 1;
    this.sparkEff += (retardTarget - this.sparkEff) * (1 - Math.exp(-h / 0.08));

    this.combusting = running && !this.outOfFuel && !this.fuelCut && !this.misfire && !this.decelCut;

    // --- forced induction ----------------------------------------------------
    this.stepInduction(h, pedal);

    // --- torque --------------------------------------------------------------
    const rpm = Math.max(this.rpm, 0);
    const fullLoad = this.torqueCurve(Math.max(rpm, 300));
    const boostSS = this.boostCurve(Math.max(rpm, 300));
    const friction = frictionTorque(rpm, e.displacementCc);
    const pumping = pumpingTorque(this.manifold, e.displacementCc);
    let tInd = 0;
    if (this.combusting) {
      tInd = indicatedTorque(fullLoad, friction, boostSS, this.manifold, this.boost) * this.shiftCut * this.sparkEff;
      if (this.speedCut) tInd = Math.min(tInd, friction + pumping + 0.25 * fullLoad);
    }
    this.torqueInd = tInd;
    const rpmSign = rpm > 1 ? 1 : 0;
    this.torqueBrake = tInd - (friction + pumping) * rpmSign;

    // --- dynamics per mode ---------------------------------------------------
    if (this.ignition === 'cranking') {
      // the starter dictates crank speed; vehicle untouched
      this.coastVehicle(h, brake);
    } else if (this.mode === 'drive' && this.hasVehicle) {
      this.stepDrive(h, pedal, brake);
    } else if (this.mode === 'dyno') {
      this.stepDyno(h);
    } else {
      this.integrateEngine(h, this.torqueBrake);
      this.speedMs = 0;
    }

    // engine stopped / stall
    if (this.ignition === 'running') {
      this.runTime += h;
      const stallRpm = Math.min(p.idleRpm * 0.3, 170);
      if (this.rpm < stallRpm && this.runTime > 0.6) {
        this.ignition = 'off';
        this.say(this.outOfFuel ? 'SEM COMBUSTÍVEL — motor parou.' : 'O motor apagou.', this.outOfFuel ? 'error' : 'warn');
      }
    }
    if (this.ignition === 'off' && this.rpm < 4) this.rpm = 0;

    // --- crank angle (master clock for every animation) ----------------------
    this.crankDeg = wrap720(this.crankDeg + this.rpm * 6 * h);

    // --- fuel -----------------------------------------------------------------
    if (this.combusting) {
      const indKw = (tInd * toOmega(rpm)) / 1000;
      const load = clamp(this.manifold + this.boost / ATM_BAR - 0.0, 0, 3);
      const boostFrac = e.turbo ? this.boost / e.turbo.maxBoostBar : e.supercharger ? this.boost / e.supercharger.maxBoostBar : 0;
      const gps = fuelMassFlow(indKw, Math.min(1, load), boostFrac);
      this.fuelFlowLps = gramsToLitres(gps);
      this.fuelGps = gps;
      consume(this.fuel, this.fuelFlowLps * h * this.fuelTimeScale);
      if (this.fuel.levelL <= 0 && !this.outOfFuel) {
        this.outOfFuel = true;
        this.say('SEM COMBUSTÍVEL', 'error');
      }
    } else {
      this.fuelFlowLps = 0;
      this.fuelGps = 0;
    }
    if (this.outOfFuel && this.fuel.levelL > 0.5) this.outOfFuel = false;

    stepRefuel(this.fuel, h, this.fuelTimeScale);

    this.stepThermal(h);
    this.lastPlate = this.plate;
  }

  private effectivePedal = 0;
  private decelCut = false;
  private sparkEff = 1;
  private fuelGps = 0;
  private runTime = 0;

  private integrateEngine(h: number, torque: number) {
    const inertia = this.def.engine.inertiaKgM2;
    let omega = toOmega(this.rpm);
    omega += (torque / inertia) * h;
    if (omega < 0) omega = 0;
    this.rpm = toRpm(omega);
  }

  private stepInduction(h: number, pedal: number) {
    const e = this.def.engine;
    const rpm = this.rpm;
    const running = this.combusting || this.ignition === 'running';
    if (e.turbo) {
      const t = e.turbo;
      const demand =
        smoothstep(0.3, 0.95, pedal) *
        smoothstep(0.82, 0.99, this.manifold) *
        (this.mode === 'neutral' ? 0.55 : 1) *
        (this.combusting ? 1 : 0);
      const target = this.boostCurve(Math.max(rpm, 300)) * demand;
      const rising = target > this.boost;
      const tau = rising ? t.spoolTimeS * Math.pow(3000 / Math.max(rpm, 700), 0.9) : 0.32;
      if (!rising && this.boost > 0.35 && this.lastPlate - this.plate > 0.004 && pedal < 0.2) {
        if (this.time - this.blowOffAt > 0.6) this.blowOffAt = this.time;
      }
      this.boost += (target - this.boost) * (1 - Math.exp(-h / tau));
      const active = this.activeTurbos();
      const idleSpin = running ? 0.05 + 0.07 * clamp(rpm / this.def.performance.redlineRpm, 0, 1) : 0;
      for (let i = 0; i < this.turboShaft.length; i++) {
        const frac = active[i] ? Math.sqrt(Math.max(0, this.boost) / t.maxBoostBar) : 0;
        const tgt = t.maxShaftRpm * Math.max(frac, idleSpin * (running ? 1 : 0));
        const tauShaft = tgt > this.turboShaft[i] ? 0.25 : 0.9;
        this.turboShaft[i] += (tgt - this.turboShaft[i]) * (1 - Math.exp(-h / tauShaft));
      }
    } else if (e.supercharger) {
      const s = e.supercharger;
      // bypass valve open at light load: no boost while cruising
      const demand = smoothstep(0.35, 0.9, pedal) * smoothstep(0.85, 0.99, this.manifold) * (this.combusting ? 1 : 0);
      const target = this.boostCurve(Math.max(rpm, 300)) * demand * (this.mode === 'neutral' ? 0.7 : 1);
      this.boost += (target - this.boost) * (1 - Math.exp(-h / 0.07));
      this.scRotorRpm = rpm * s.driveRatio;
    } else {
      this.boost = 0;
    }
  }

  /** Which turbochargers are currently on line (sequential systems switch the second stage). */
  activeTurbos(): boolean[] {
    const t = this.def.engine.turbo;
    if (!t) return [];
    if (t.arrangement !== 'sequential' || !t.sequentialSwitchRpm) return new Array(t.count).fill(true);
    const all = this.rpm >= t.sequentialSwitchRpm;
    return new Array(t.count).fill(false).map((_, i) => all || i < (t.primaryCount ?? 2));
  }

  private resistance(v: number, brake: number): number {
    const vs = this.def.vehicleSpec!;
    const mass = vs.curbWeightKg + 80;
    const dir = Math.tanh(v / 0.4);
    const aero = 0.5 * AIR_DENSITY * vs.dragAreaM2 * v * v * Math.sign(v);
    const roll = vs.rollingResistance * mass * G * dir;
    const brakeForce = brake * 1.05 * mass * G * dir;
    return aero + roll + brakeForce;
  }

  private coastVehicle(h: number, brake: number) {
    if (!this.hasVehicle || this.mode !== 'drive') {
      this.speedMs = 0;
      return;
    }
    const vs = this.def.vehicleSpec!;
    const mass = vs.curbWeightKg + 80;
    const before = this.speedMs;
    this.speedMs -= (this.resistance(this.speedMs, brake) / (mass * 1.04)) * h;
    if (Math.sign(before) !== Math.sign(this.speedMs) && before !== 0) this.speedMs = 0;
    if (Math.abs(this.speedMs) < 0.02 && brake > 0) this.speedMs = 0;
  }

  private stepDrive(h: number, pedal: number, brake: number) {
    const dt = this.def.drivetrain!;
    const vs = this.def.vehicleSpec!;
    const p = this.def.performance;
    const mass = (vs.curbWeightKg + 80) * 1.04; // + rotating wheels/driveline
    const r = dt.tireRadiusM;
    const inertia = this.def.engine.inertiaKgM2;

    // automatic gear selection
    this.autoShiftCooldown = Math.max(0, this.autoShiftCooldown - h);
    if (this.gearMode === 'auto' && this.shiftTimer <= 0 && this.gear > 0 && this.autoShiftCooldown <= 0 && this.ignition === 'running') {
      const want = autoSelectGear(dt, {
        rpm: this.rpm,
        gear: this.gear,
        throttle: pedal,
        idleRpm: p.idleRpm,
        redlineRpm: p.redlineRpm,
        revLimitRpm: p.revLimitRpm,
        speedKmh: Math.abs(this.speedMs) * MS_TO_KMH,
      });
      if (want !== this.gear && this.clutchLocked) this.beginShift(want);
    }

    // shift in progress: clutch open (DCT keeps partial torque), rpm synchronises
    this.shiftCut = 1;
    if (this.shiftTimer > 0) {
      this.shiftTimer -= h;
      if (!this.shiftSwapped && this.shiftTimer <= this.shiftTotal / 2) {
        this.gear = this.targetGear;
        this.shiftSwapped = true;
      }
      const ratio = totalRatio(dt, this.gear === 0 ? this.targetGear : this.gear);
      const syncRpm = ratio ? Math.max(p.idleRpm, toRpm((Math.abs(this.speedMs) / r) * ratio)) : p.idleRpm;
      const seamless = dt.kind === 'dct';
      if (seamless && this.gear !== 0 && this.targetGear !== 0) {
        // dual clutch: torque hand-over between clutches, ~half torque reaches the wheels
        const rpmNew = this.rpm + (syncRpm - this.rpm) * (1 - Math.exp(-h / (this.shiftTotal * 0.35)));
        const ratioNow = totalRatio(dt, this.gear);
        const force = (this.torqueBrake * 0.5 * Math.abs(ratioNow) * dt.efficiency) / r;
        this.applyVehicleForce(h, force * Math.sign(ratioNow), brake, mass);
        this.rpm = rpmNew;
      } else {
        // ECU torque cut on upshift / rev-match blip on downshift
        if (this.ignition === 'running' && !this.outOfFuel) {
          this.rpm += (syncRpm - this.rpm) * (1 - Math.exp(-h / Math.max(0.03, this.shiftTotal * 0.3)));
        } else this.integrateEngine(h, this.torqueBrake);
        this.coastVehicle(h, brake);
      }
      if (this.shiftTimer <= 0) {
        this.shiftTimer = 0;
        this.clutchLocked = false;
        this.engagement = this.gear === 0 ? 0 : 0.85;
      }
      return;
    }

    if (this.gear === 0) {
      this.clutchLocked = false;
      this.integrateEngine(h, this.torqueBrake);
      this.coastVehicle(h, brake);
      return;
    }

    const ratio = totalRatio(dt, this.gear);
    const dirSign = this.gear < 0 ? -1 : 1;
    const omegaIn = (this.speedMs * dirSign / r) * ratio; // gearbox input speed (rad/s)
    const omegaE = toOmega(this.rpm);

    if (this.clutchLocked) {
      const force = (this.torqueBrake * ratio * dt.efficiency) / r;
      const eqMass = mass + (inertia * ratio * ratio) / (r * r);
      const a = (force * dirSign - this.resistance(this.speedMs, brake)) / eqMass;
      this.speedMs += a * h;
      if (this.speedMs * dirSign < 0) this.speedMs = 0;
      this.rpm = toRpm(Math.max(0, (this.speedMs * dirSign / r) * ratio));
      // automatic clutch opens before the engine would stall
      const stall = this.rpm < p.idleRpm * 0.8;
      if (stall || this.ignition !== 'running') {
        if (this.ignition === 'running' || stall) {
          this.clutchLocked = false;
          this.engagement = 0;
        }
      }
      return;
    }

    // slipping clutch (launch / re-engagement)
    const want = this.ignition === 'running' && (pedal > 0.03 || Math.abs(this.speedMs) > 1.2) ? 1 : 0;
    const rate = want ? 1.2 + pedal * 2.2 : 4;
    this.engagement += clamp(want - this.engagement, -rate * h, rate * h);
    if (this.rpm < p.idleRpm * 0.85 && this.ignition === 'running') this.engagement = Math.max(0, this.engagement - 3 * h);
    const capacity = this.engagement * this.def.performance.torqueNm * 1.6;
    const slip = omegaE - omegaIn;
    const clutchT = capacity * Math.tanh(slip / 6);
    this.integrateEngine(h, this.torqueBrake - clutchT);
    const force = (clutchT * ratio * dt.efficiency) / r;
    this.applyVehicleForce(h, force * dirSign, brake, mass);
    if (this.engagement >= 0.999 && Math.abs(toOmega(this.rpm) - (this.speedMs * dirSign / r) * ratio) < 4 && this.ignition === 'running') {
      this.clutchLocked = true;
    }
  }

  private applyVehicleForce(h: number, force: number, brake: number, mass: number) {
    const before = this.speedMs;
    const res = this.resistance(this.speedMs, brake);
    let a = (force - res) / mass;
    // a stopped car does not roll backwards because of braking/rolling force
    if (Math.abs(this.speedMs) < 0.05 && Math.abs(force) < Math.abs(res) && Math.sign(force) !== Math.sign(a)) a = 0;
    this.speedMs += a * h;
    if (before !== 0 && Math.sign(before) !== Math.sign(this.speedMs) && Math.abs(force) < 1) this.speedMs = 0;
  }

  private cruiseControl(h: number): { pedal: number; brake: number } {
    const vs = this.def.vehicleSpec;
    if (!vs || this.gear === 0) {
      this.cruiseI = 0;
      return { pedal: 0, brake: this.targetSpeedKmh <= 0 ? 1 : 0 };
    }
    const reverse = this.gear < 0;
    const target = reverse ? Math.min(this.targetSpeedKmh, 30) : this.targetSpeedKmh;
    const kmh = Math.abs(this.speedMs) * MS_TO_KMH;
    const err = target - kmh;
    if (target <= 0.5 && kmh < 1.5) {
      this.cruiseI = 0;
      return { pedal: 0, brake: 1 };
    }
    this.cruiseI = clamp(this.cruiseI + err * h * 0.02, -0.2, 0.6);
    // feed-forward: pedal needed to hold the target against drag
    const ff = clamp(0.06 + (target / Math.max(vs.topSpeedKmh, 1)) ** 2 * 0.55, 0, 0.8);
    const pedal = clamp(ff + 0.045 * err + this.cruiseI, 0, 1);
    const brake = err < -3 ? clamp((-err - 3) * 0.04, 0, 0.8) : 0;
    return { pedal: brake > 0 ? 0 : pedal, brake };
  }

  private stepDyno(h: number) {
    const p = this.def.performance;
    if (this.dynoMode === 'sweep' && this.dynoPhase !== 'idle') {
      if (this.dynoPhase === 'settle') {
        this.dynoSettle -= h;
        if (this.dynoSettle <= 0 && Math.abs(this.rpm - this.dynoTargetRpm) < 250) this.dynoPhase = 'pull';
      } else if (this.dynoPhase === 'pull') {
        const rate = this.def.engine.aspiration === 'turbo' ? 280 : 360; // rpm/s ramp
        this.dynoTargetRpm += rate * h;
        if (this.rpm >= this.lastSampleRpm + 50 && Math.abs(this.rpm - this.dynoTargetRpm) < 400) {
          this.lastSampleRpm = Math.floor(this.rpm / 50) * 50;
          this.dynoSamples.push({
            rpm: this.rpm,
            torqueNm: this.torqueBrake,
            powerKw: powerFromTorque(this.torqueBrake, this.rpm),
            boostBar: this.boost,
          });
        }
        if (this.dynoTargetRpm >= p.revLimitRpm - 80) {
          this.dynoRuns.push(this.dynoSamples);
          if (this.dynoRuns.length > 4) this.dynoRuns.shift();
          this.dynoPhase = 'cooldown';
          this.dynoSettle = 1.4;
          this.say('Medição concluída — curva aproximada registrada.');
        }
      } else if (this.dynoPhase === 'cooldown') {
        this.dynoTargetRpm += (p.idleRpm * 1.5 - this.dynoTargetRpm) * (1 - Math.exp(-h / 0.4));
        this.dynoSettle -= h;
        if (this.dynoSettle <= 0) {
          this.dynoPhase = 'idle';
          this.dynoMode = 'hold';
          this.dynoTargetRpm = Math.round(this.rpm / 100) * 100;
        }
      }
    }
    // absorber: PI controller that can only brake the engine
    const omegaErr = toOmega(this.rpm) - toOmega(this.dynoTargetRpm);
    const holdActive = this.running && (this.dynoMode === 'sweep' ? this.dynoPhase !== 'idle' : true);
    if (holdActive) {
      this.dynoI = clamp(this.dynoI + omegaErr * 25 * h, 0, 4000);
      this.dynoLoad = clamp(omegaErr * 18 + this.dynoI, 0, 4000);
    } else {
      this.dynoI = 0;
      this.dynoLoad = 0;
    }
    this.integrateEngine(h, this.torqueBrake - this.dynoLoad);
  }

  private stepThermal(h: number) {
    const e = this.def.engine;
    const p = this.def.performance;
    const fuelKw = this.fuelGps * GASOLINE_LHV_KJ_PER_G;
    const capacity = 28 + (e.displacementCc / 1000) * 7; // kJ/K
    const heat = fuelKw * 0.27 + (this.running ? 1.5 : 0);
    const open = smoothstep(84, 96, this.coolantC);
    const airflow = 1 + Math.abs(this.speedMs) / 12 + (this.coolantC > 98 ? 1.5 : 0) + (this.mode === 'dyno' ? 2.5 : 0);
    const cooling = (0.09 + 1.4 * open * airflow) * (this.coolantC - AMBIENT_C) * (this.running ? 1 : 0.15);
    this.coolantC += ((heat - cooling) / capacity) * h;
    const rpmFrac = clamp(this.rpm / p.redlineRpm, 0, 1.1);
    const oilTarget = this.running ? this.coolantC - 2 + 22 * rpmFrac * clamp(this.manifold + this.boost, 0, 2) : this.coolantC - 4;
    this.oilC += (oilTarget - this.oilC) * (1 - Math.exp(-h / 70));
    const viscosity = 1 + Math.max(0, 80 - this.oilC) / 80 * 0.6;
    const target = this.rpm > 30 ? clamp((0.9 + 4.4 * clamp(this.rpm / (p.redlineRpm * 0.55), 0, 1)) * viscosity, 0, 7) : 0;
    this.oilBar += (target - this.oilBar) * (1 - Math.exp(-h / 0.25));
  }

  // ------------------------------------------------------------ telemetry
  snapshot(): Telemetry {
    const p = this.def.performance;
    const fuelL = this.fuel.levelL;
    const kmh = this.speedMs * MS_TO_KMH;
    const lph = this.fuelFlowLps * 3600;
    const range = this.consumptionAvg && this.consumptionAvg > 0.1 ? (fuelL / this.consumptionAvg) * 100 : null;
    const endurance = lph > 0.05 ? (fuelL / lph) * 60 : null;
    const shiftStart = p.redlineRpm - Math.min(1200, (p.redlineRpm - p.idleRpm) * 0.18);
    const shiftLight = clamp((this.rpm - shiftStart) / (p.revLimitRpm - shiftStart), 0, 1);
    const turbo = this.def.engine.turbo;
    return {
      ignition: this.ignition,
      running: this.running,
      rpm: this.rpm,
      crankDeg: this.crankDeg,
      pedal: this.effectivePedal,
      throttlePlate: this.plate,
      manifoldBar: this.manifold * ATM_BAR,
      boostBar: this.boost,
      turboShaftRpm: [...this.turboShaft],
      turboActive: turbo ? this.activeTurbos() : [],
      superchargerRpm: this.scRotorRpm,
      torqueNm: this.torqueBrake,
      powerKw: Math.max(0, powerFromTorque(this.torqueBrake, this.rpm)),
      loadFraction: clamp(this.torqueBrake / Math.max(1, this.def.performance.torqueNm), 0, 1),
      speedKmh: kmh,
      gear: this.gear,
      gearLabel: this.mode === 'drive' ? gearLabel(this.gear, this.gearMode === 'auto') : 'N',
      shifting: this.shiftTimer > 0,
      clutchLocked: this.clutchLocked,
      limiter: this.fuelCut && this.running,
      speedLimiter: this.speedCut,
      shiftLight,
      fuelL,
      fuelCapacityL: this.fuel.capacityL,
      fuelFraction: this.fuel.capacityL ? fuelL / this.fuel.capacityL : 0,
      fuelFlowLph: lph,
      consumptionL100: this.mode === 'drive' ? this.consumptionAvg : null,
      rangeKm: this.mode === 'drive' ? range : null,
      enduranceMin: endurance,
      outOfFuel: this.outOfFuel || fuelL <= 0,
      lowFuel: fuelL < this.fuel.capacityL * 0.12,
      refuel: this.fuel.refuel,
      refuelPumpedL: this.fuel.pumpedL,
      coolantC: this.coolantC,
      oilC: this.oilC,
      oilBar: this.oilBar,
      mode: this.mode,
      gearMode: this.gearMode,
      driveControl: this.driveControl,
      targetSpeedKmh: this.targetSpeedKmh,
      dynoPhase: this.dynoPhase,
      dynoTargetRpm: this.dynoTargetRpm,
      dynoLoadNm: this.dynoLoad,
      combusting: this.combusting,
      time: this.time,
      message: this.message,
      blowOffAt: this.blowOffAt,
    };
  }
}
