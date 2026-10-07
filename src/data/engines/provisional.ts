import type { CylinderSlot, EngineDefinition } from '../../types/engine';
import { calibratedDragArea, row, src, tireRadius } from '../helpers';

/**
 * PROVISIONAL architecture data used while the verified research is being
 * compiled. Every figure here is replaced by the verified data file of each
 * engine; nothing in this file is shown as an official specification.
 */

const vMap = (_perBank: number, aNums: number[], bNums: number[]): CylinderSlot[] => [
  ...aNums.map((n, i) => ({ number: n, row: 0, slot: i })),
  ...bNums.map((n, i) => ({ number: n, row: 1, slot: i })),
];

const placeholderSource = src('provisional', 'Dados provisórios (aguardando pesquisa verificada)', 'Engine Lab', 'https://github.com/Helio965/Engine-3D', true);

function base(over: Partial<EngineDefinition> & Pick<EngineDefinition, 'id' | 'manufacturer' | 'vehicle' | 'engine' | 'performance' | 'dashboard' | 'soundProfile' | 'headline'>): EngineDefinition {
  return {
    generation: '',
    year: 2010,
    marketVersion: '',
    isCrateEngine: false,
    drivetrain: null,
    vehicleSpec: null,
    fuel: { capacityL: 70, capacityStatus: 'estimated', label: 'Tanque', fuelType: 'Gasolina' },
    visual: { summary: '', accent: '#ff6a1f' },
    specs: [row('Status', 'Dados provisórios', 'estimated')],
    sources: [placeholderSource],
    estimates: ['Dados provisórios — aguardando pesquisa verificada'],
    ...over,
  } as EngineDefinition;
}

const T = (size: string) => tireRadius(size);

export const provisionalM5 = base({
  id: 'bmw-m5-e60',
  manufacturer: 'BMW',
  vehicle: 'M5 E60',
  headline: '5.0 V10 S85',
  engine: {
    name: 'BMW S85B50', code: 'S85B50', layout: 'v', cylinders: 10, bankAngleDeg: 90, displacementCc: 4999, boreMm: 92, strokeMm: 75.2, rodLengthMm: 140, rodLengthStatus: 'estimated',
    compressionRatio: 12, valvesPerCylinder: 4, valvetrain: 'dohc', aspiration: 'na', firingOrder: [1, 6, 5, 10, 2, 7, 3, 8, 4, 9], firingOrderStatus: 'estimated',
    cylinderMap: vMap(5, [1, 2, 3, 4, 5], [6, 7, 8, 9, 10]), crankType: 'split-pin', lubrication: 'wet', fuelSystem: 'port', inertiaKgM2: 0.2,
  },
  performance: { powerPs: 507, powerHp: 500, powerKw: 373, powerRpm: 7750, torqueNm: 520, torqueRpm: 6100, idleRpm: 700, idleStatus: 'estimated', redlineRpm: 8250, revLimitRpm: 8250 },
  drivetrain: { transmission: 'SMG III 7', kind: 'smg', ratios: [3.985, 2.652, 1.806, 1.392, 1.159, 1.0, 0.833], reverseRatio: 3.985, finalDrive: 3.62, ratiosStatus: 'estimated', paddleShift: true, driveLayout: 'RWD', rearTire: '285/35 ZR19', tireRadiusM: T('285/35 ZR19'), shiftTimeS: 0.2, efficiency: 0.88 },
  vehicleSpec: { topSpeedKmh: 250, topSpeedLimited: true, curbWeightKg: 1830, dragAreaM2: 0.7, rollingResistance: 0.012, fuelTankL: 70, fuelType: 'Gasolina', enginePosition: 'Dianteiro' },
  dashboard: { style: 'e60', speedoMaxKmh: 330, speedoUnit: 'kmh', speedoMaxNative: 330, tachMaxRpm: 9000, tachRedlineStartRpm: 8250, hasShiftLights: false, reference: 'Provisório.' },
  soundProfile: 'v10-na',
});

export const provisionalHellcat = base({
  id: 'dodge-challenger-hellcat',
  manufacturer: 'Dodge',
  vehicle: 'Challenger SRT Hellcat',
  headline: '6.2 V8 HEMI SUPERCHARGED',
  engine: {
    name: 'Supercharged 6.2L HEMI V8', code: 'Hellcat', layout: 'v', cylinders: 8, bankAngleDeg: 90, displacementCc: 6166, boreMm: 103.9, strokeMm: 90.9, rodLengthMm: 155.5, rodLengthStatus: 'estimated',
    compressionRatio: 9.5, valvesPerCylinder: 2, valvetrain: 'ohv', aspiration: 'supercharged',
    supercharger: { type: 'twin-screw', displacementL: 2.38, maxBoostBar: 0.8, maxBoostStatus: 'estimated', driveRatio: 2.36, driveRatioStatus: 'estimated' },
    firingOrder: [1, 8, 4, 3, 6, 5, 7, 2], firingOrderStatus: 'estimated', cylinderMap: vMap(4, [1, 3, 5, 7], [2, 4, 6, 8]), crankType: 'cross-plane', lubrication: 'wet', fuelSystem: 'port', inertiaKgM2: 0.24,
  },
  performance: { powerPs: 717, powerHp: 707, powerKw: 527, powerRpm: 6000, torqueNm: 881, torqueRpm: 4800, idleRpm: 700, idleStatus: 'estimated', redlineRpm: 6200, revLimitRpm: 6200 },
  drivetrain: { transmission: '8HP90', kind: 'automatic', ratios: [4.71, 3.14, 2.1, 1.67, 1.29, 1.0, 0.84, 0.67], reverseRatio: 3.3, finalDrive: 2.62, ratiosStatus: 'estimated', paddleShift: true, driveLayout: 'RWD', rearTire: '275/40 ZR20', tireRadiusM: T('275/40 ZR20'), shiftTimeS: 0.22, efficiency: 0.85 },
  vehicleSpec: { topSpeedKmh: 320, topSpeedLimited: false, curbWeightKg: 2018, dragAreaM2: calibratedDragArea(527, 320, 2018, 0.85), rollingResistance: 0.012, fuelTankL: 70, fuelType: 'Gasolina', enginePosition: 'Dianteiro' },
  dashboard: { style: 'hellcat', speedoMaxKmh: 322, speedoUnit: 'mph', speedoMaxNative: 200, tachMaxRpm: 7000, tachRedlineStartRpm: 6200, hasShiftLights: false, reference: 'Provisório.' },
  soundProfile: 'v8-cross-supercharged',
});

export const provisionalZz632 = base({
  id: 'chevrolet-zz632',
  manufacturer: 'Chevrolet Performance',
  vehicle: 'ZZ632/1000',
  headline: '10.4 V8 BIG-BLOCK ASPIRADO',
  isCrateEngine: true,
  engine: {
    name: 'ZZ632/1000 Big-Block V8', code: 'ZZ632/1000', layout: 'v', cylinders: 8, bankAngleDeg: 90, displacementCc: 10354, boreMm: 116.84, strokeMm: 120.65, rodLengthMm: 170, rodLengthStatus: 'estimated',
    compressionRatio: 12, valvesPerCylinder: 2, valvetrain: 'ohv', aspiration: 'na', firingOrder: [1, 8, 4, 3, 6, 5, 7, 2], firingOrderStatus: 'estimated',
    cylinderMap: vMap(4, [1, 3, 5, 7], [2, 4, 6, 8]), crankType: 'cross-plane', lubrication: 'wet', fuelSystem: 'port', inertiaKgM2: 0.3,
  },
  performance: { powerPs: 1018, powerHp: 1004, powerKw: 749, powerRpm: 6600, torqueNm: 1188, torqueRpm: 5600, idleRpm: 900, idleStatus: 'estimated', redlineRpm: 7000, revLimitRpm: 7000 },
  fuel: { capacityL: 30, capacityStatus: 'estimated', label: 'Célula de combustível de bancada', fuelType: 'Gasolina' },
  dashboard: { style: 'crate', speedoMaxKmh: 0, speedoUnit: 'kmh', speedoMaxNative: 0, tachMaxRpm: 8000, tachRedlineStartRpm: 7000, hasShiftLights: true, reference: 'Provisório.' },
  soundProfile: 'v8-cross-bigblock',
});

export const provisional458 = base({
  id: 'ferrari-458-italia',
  manufacturer: 'Ferrari',
  vehicle: '458 Italia',
  headline: '4.5 V8 ASPIRADO',
  engine: {
    name: 'Ferrari F136 FB', code: 'F136 FB', layout: 'v', cylinders: 8, bankAngleDeg: 90, displacementCc: 4497, boreMm: 94, strokeMm: 81, rodLengthMm: 140, rodLengthStatus: 'estimated',
    compressionRatio: 12.5, valvesPerCylinder: 4, valvetrain: 'dohc', aspiration: 'na', firingOrder: [1, 5, 3, 7, 4, 8, 2, 6], firingOrderStatus: 'estimated',
    cylinderMap: vMap(4, [1, 2, 3, 4], [5, 6, 7, 8]), crankType: 'flat-plane', lubrication: 'dry', fuelSystem: 'direct', inertiaKgM2: 0.13,
  },
  performance: { powerPs: 570, powerHp: 562, powerKw: 419, powerRpm: 9000, torqueNm: 540, torqueRpm: 6000, idleRpm: 900, idleStatus: 'estimated', redlineRpm: 9000, revLimitRpm: 9000 },
  drivetrain: { transmission: 'DCT 7', kind: 'dct', ratios: [3.08, 2.19, 1.63, 1.29, 1.03, 0.84, 0.69], reverseRatio: 2.9, finalDrive: 4.44, ratiosStatus: 'estimated', paddleShift: true, driveLayout: 'RWD', rearTire: '295/35 ZR20', tireRadiusM: T('295/35 ZR20'), shiftTimeS: 0.1, efficiency: 0.88 },
  vehicleSpec: { topSpeedKmh: 325, topSpeedLimited: false, curbWeightKg: 1485, dragAreaM2: calibratedDragArea(419, 325, 1485, 0.88), rollingResistance: 0.012, fuelTankL: 86, fuelType: 'Gasolina', enginePosition: 'Central' },
  dashboard: { style: 'f458', speedoMaxKmh: 340, speedoUnit: 'kmh', speedoMaxNative: 340, tachMaxRpm: 10000, tachRedlineStartRpm: 9000, hasShiftLights: true, reference: 'Provisório.' },
  soundProfile: 'v8-flat-na',
});

export const provisional812 = base({
  id: 'ferrari-812-superfast',
  manufacturer: 'Ferrari',
  vehicle: '812 Superfast',
  headline: '6.5 V12 ASPIRADO',
  engine: {
    name: 'Ferrari F140 GA', code: 'F140 GA', layout: 'v', cylinders: 12, bankAngleDeg: 65, displacementCc: 6496, boreMm: 94, strokeMm: 78, rodLengthMm: 140, rodLengthStatus: 'estimated',
    compressionRatio: 13.6, valvesPerCylinder: 4, valvetrain: 'dohc', aspiration: 'na', firingOrder: null, firingOrderStatus: 'unconfirmed',
    cylinderMap: vMap(6, [1, 2, 3, 4, 5, 6], [7, 8, 9, 10, 11, 12]), crankType: '6 moentes', lubrication: 'dry', fuelSystem: 'direct', inertiaKgM2: 0.18,
  },
  performance: { powerPs: 800, powerHp: 789, powerKw: 588, powerRpm: 8500, torqueNm: 718, torqueRpm: 7000, idleRpm: 900, idleStatus: 'estimated', redlineRpm: 8900, revLimitRpm: 8900 },
  drivetrain: { transmission: 'DCT 7', kind: 'dct', ratios: [3.08, 2.19, 1.63, 1.29, 1.03, 0.84, 0.69], reverseRatio: 2.9, finalDrive: 3.9, ratiosStatus: 'estimated', paddleShift: true, driveLayout: 'RWD', rearTire: '315/35 ZR20', tireRadiusM: T('315/35 ZR20'), shiftTimeS: 0.1, efficiency: 0.88 },
  vehicleSpec: { topSpeedKmh: 340, topSpeedLimited: false, curbWeightKg: 1630, dragAreaM2: calibratedDragArea(588, 340, 1630, 0.88), rollingResistance: 0.012, fuelTankL: 92, fuelType: 'Gasolina', enginePosition: 'Dianteiro-central' },
  dashboard: { style: 'f812', speedoMaxKmh: 360, speedoUnit: 'kmh', speedoMaxNative: 360, tachMaxRpm: 10000, tachRedlineStartRpm: 8900, hasShiftLights: true, reference: 'Provisório.' },
  soundProfile: 'v12-na',
});

const w12Map = (): CylinderSlot[] => {
  const out: CylinderSlot[] = [];
  for (let i = 0; i < 6; i++) out.push({ number: i + 1, row: i % 2 === 0 ? 0 : 1, slot: i });
  for (let i = 0; i < 6; i++) out.push({ number: i + 7, row: i % 2 === 0 ? 3 : 2, slot: i });
  return out;
};

export const provisionalW12 = base({
  id: 'vw-w12-concept',
  manufacturer: 'Volkswagen',
  vehicle: 'W12 Syncro (estudo)',
  headline: '5.6 W12 ASPIRADO',
  engine: {
    name: 'Volkswagen W12 5.6', code: 'W12', layout: 'w', cylinders: 12, bankAngleDeg: 72, vrAngleDeg: 15, displacementCc: 5600, boreMm: 81, strokeMm: 90.6, rodLengthMm: 164, rodLengthStatus: 'estimated',
    valvesPerCylinder: 4, valvetrain: 'dohc', aspiration: 'na', firingOrder: null, firingOrderStatus: 'unconfirmed', firingIntervalsDeg: new Array(12).fill(60),
    cylinderMap: w12Map(), crankType: '6 moentes', lubrication: 'dry', fuelSystem: 'port', inertiaKgM2: 0.2,
  },
  performance: { powerPs: 420, powerHp: 414, powerKw: 309, powerRpm: 6000, torqueNm: 550, torqueRpm: 3500, idleRpm: 700, idleStatus: 'estimated', redlineRpm: 6500, revLimitRpm: 6500 },
  drivetrain: { transmission: '6 marchas', kind: 'manual', ratios: [3.5, 2.2, 1.5, 1.15, 0.92, 0.76], reverseRatio: 3.2, finalDrive: 3.3, ratiosStatus: 'estimated', paddleShift: false, driveLayout: 'AWD', rearTire: '285/35 ZR19', tireRadiusM: T('285/35 ZR19'), shiftTimeS: 0.45, efficiency: 0.85 },
  vehicleSpec: { topSpeedKmh: 300, topSpeedLimited: false, curbWeightKg: 1450, dragAreaM2: calibratedDragArea(309, 300, 1450, 0.85), rollingResistance: 0.012, fuelTankL: 90, fuelType: 'Gasolina', enginePosition: 'Central' },
  dashboard: { style: 'w12concept', speedoMaxKmh: 340, speedoUnit: 'kmh', speedoMaxNative: 340, tachMaxRpm: 8000, tachRedlineStartRpm: 6500, hasShiftLights: false, reference: 'Provisório.' },
  soundProfile: 'w12-na',
});
