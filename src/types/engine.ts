/**
 * Core data model for every engine/vehicle configuration in Engine Lab.
 *
 * Two kinds of numbers live here:
 *  - verified specifications (shown to the user, each with a status + sources);
 *  - simulation parameters (used by the physics). When a simulation parameter is
 *    not published by a reliable source it is flagged in `estimates`, and the UI
 *    never presents it as an official figure.
 */

export type EngineId =
  | 'bugatti-veyron'
  | 'bugatti-chiron'
  | 'nissan-skyline-r34'
  | 'bmw-m5-e60'
  | 'dodge-challenger-hellcat'
  | 'chevrolet-zz632'
  | 'ferrari-458-italia'
  | 'ferrari-812-superfast'
  | 'vw-w12-concept';

export type LayoutKind = 'inline' | 'v' | 'w';
export type Aspiration = 'na' | 'turbo' | 'supercharged';
export type Valvetrain = 'dohc' | 'ohv';
export type Lubrication = 'wet' | 'dry';

/** Confidence level of a published figure. */
export type FactStatus = 'official' | 'reputable' | 'estimated' | 'unconfirmed';

export interface SourceRef {
  id: string;
  title: string;
  publisher: string;
  url: string;
  official: boolean;
}

/** One row of the ENGINE SPECS panel. */
export interface SpecRow {
  label: string;
  value: string;
  status: FactStatus;
  sources?: string[];
  note?: string;
}

/** Position of one cylinder in the block. */
export interface CylinderSlot {
  /** Manufacturer cylinder number (1-based). */
  number: number;
  /**
   * Row index. Inline: always 0. V: 0 = bank A, 1 = bank B.
   * W (two VR banks): 0..3 from bank A outer row to bank B outer row.
   */
  row: number;
  /** Axial slot along the crankshaft, 0 = front (accessory drive end). */
  slot: number;
}

export interface TurboSystem {
  count: number;
  arrangement: 'parallel' | 'sequential';
  /** Number of turbos active below `sequentialSwitchRpm` (sequential systems). */
  primaryCount?: number;
  sequentialSwitchRpm?: number;
  /** Peak relative boost (bar above atmosphere). */
  maxBoostBar: number;
  maxBoostStatus: FactStatus;
  /** rpm at which full boost is reached under full load (approximation). */
  fullBoostRpm: number;
  /** Rough spool time constant at 3000 rpm (s). Simulation parameter. */
  spoolTimeS: number;
  /** Turbine shaft speed at full boost (rpm). Simulation parameter. */
  maxShaftRpm: number;
  /** Which cylinders feed each turbo (by cylinder number). */
  feeds: number[][];
}

export interface SuperchargerSystem {
  type: 'twin-screw' | 'roots' | 'centrifugal';
  displacementL: number;
  maxBoostBar: number;
  maxBoostStatus: FactStatus;
  /** Rotor speed / crank speed. */
  driveRatio: number;
  driveRatioStatus: FactStatus;
}

export interface EngineSpec {
  name: string;
  code: string;
  layout: LayoutKind;
  cylinders: number;
  /** Angle between banks (V) or between the two VR banks (W), degrees. */
  bankAngleDeg: number;
  /** Narrow angle inside a VR bank (W engines only), degrees. */
  vrAngleDeg?: number;
  displacementCc: number;
  boreMm: number;
  strokeMm: number;
  rodLengthMm: number;
  rodLengthStatus: FactStatus;
  compressionRatio?: number;
  valvesPerCylinder: number;
  valvetrain: Valvetrain;
  aspiration: Aspiration;
  turbo?: TurboSystem;
  supercharger?: SuperchargerSystem;
  /** Manufacturer firing order, or null when no reliable source confirms it. */
  firingOrder: number[] | null;
  firingOrderStatus: FactStatus;
  /**
   * Order reported only by secondary sources (forums, repair sites) and not
   * confirmed: used for the animation, which is still labelled illustrative.
   */
  unconfirmedFiringOrder?: number[];
  /**
   * Firing intervals in crank degrees between consecutive cylinders of the
   * firing order (length = cylinders). Defaults to even firing (720/n).
   */
  firingIntervalsDeg?: number[];
  cylinderMap: CylinderSlot[];
  /** Axial distance between consecutive crank slots (mm), when published. */
  slotPitchMm?: number;
  /** Axial offset between the two banks of a V engine (mm), when published. */
  bankOffsetMm?: number;
  crankType: string;
  lubrication: Lubrication;
  fuelSystem: string;
  /** Crank + flywheel + clutch rotating inertia (kg·m²). Simulation parameter. */
  inertiaKgM2: number;
  engineWeightKg?: number;
}

export interface PerformanceSpec {
  powerPs: number;
  powerHp: number;
  powerKw: number;
  powerRpm: number;
  torqueNm: number;
  /** Peak torque rpm, or [from, to] for a plateau. */
  torqueRpm: number | [number, number];
  /** Other published full-load torque points (e.g. "450 N·m from 3,500 rpm"). */
  publishedTorquePoints?: { rpm: number; nm: number }[];
  idleRpm: number;
  idleStatus: FactStatus;
  /** Start of the red zone on the tachometer. */
  redlineRpm: number;
  /** Fuel-cut limiter. */
  revLimitRpm: number;
}

export type GearboxKind = 'manual' | 'dct' | 'automatic' | 'smg';

export interface DrivetrainSpec {
  transmission: string;
  kind: GearboxKind;
  ratios: number[];
  reverseRatio: number;
  finalDrive: number;
  ratiosStatus: FactStatus;
  paddleShift: boolean;
  driveLayout: string;
  rearTire: string;
  /** Dynamic rolling radius (m) derived from the tire size. */
  tireRadiusM: number;
  /** Time with interrupted/reduced torque during a shift (s). */
  shiftTimeS: number;
  /** Drivetrain efficiency (0..1). Simulation parameter. */
  efficiency: number;
}

export interface VehicleSpec {
  topSpeedKmh: number;
  topSpeedLimited: boolean;
  topSpeedNote?: string;
  curbWeightKg: number;
  /** Aerodynamic drag area Cd·A (m²). Simulation parameter. */
  dragAreaM2: number;
  rollingResistance: number;
  fuelTankL: number;
  fuelType: string;
  enginePosition: string;
}

export type DashboardStyle =
  | 'veyron'
  | 'chiron'
  | 'r34'
  | 'e60'
  | 'hellcat'
  | 'crate'
  | 'f458'
  | 'f812'
  | 'w12concept';

export interface DashboardConfig {
  style: DashboardStyle;
  speedoMaxKmh: number;
  /** Speedometer native unit of the real cluster. */
  speedoUnit: 'kmh' | 'mph';
  speedoMaxNative: number;
  tachMaxRpm: number;
  tachRedlineStartRpm: number;
  hasShiftLights: boolean;
  /** Short description of the real cluster this dash is inspired by. */
  reference: string;
}

export type SoundProfile =
  | 'w16-quad-turbo'
  | 'i6-twin-turbo'
  | 'v10-na'
  | 'v8-cross-supercharged'
  | 'v8-cross-bigblock'
  | 'v8-flat-na'
  | 'v12-na'
  | 'w12-na';

export interface VisualStyle {
  /** Short visual summary used by the selector card and tooltips. */
  summary: string;
  accent: string;
}

export interface EngineDefinition {
  id: EngineId;
  manufacturer: string;
  vehicle: string;
  generation: string;
  year: number;
  marketVersion: string;
  /** True for crate engines that are not tied to a production car. */
  isCrateEngine: boolean;
  /** Short headline used in cards, e.g. "8.0 W16 QUAD-TURBO". */
  headline: string;
  engine: EngineSpec;
  performance: PerformanceSpec;
  /** null when there is no documented vehicle (crate engine). */
  drivetrain: DrivetrainSpec | null;
  vehicleSpec: VehicleSpec | null;
  /** Fuel supply used by the simulation (crate engine: bench fuel cell). */
  fuel: { capacityL: number; capacityStatus: FactStatus; label: string; fuelType: string };
  dashboard: DashboardConfig;
  soundProfile: SoundProfile;
  visual: VisualStyle;
  specs: SpecRow[];
  sources: SourceRef[];
  /** Human readable list of simulation parameters that are estimates. */
  estimates: string[];
  notes?: string[];
}
