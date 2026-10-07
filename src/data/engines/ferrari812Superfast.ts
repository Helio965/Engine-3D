import type { EngineDefinition } from '../../types/engine';
import { row, src, tireRadius, calibratedDragArea, overallRatioFromSpeed } from '../helpers';

/**
 * Ferrari 812 Superfast coupé, launch specification (Geneva 2017, model year
 * 2018, EU/ROW), as published in Ferrari's press kit. The 812 GTS and the
 * 812 Competizione (F140HD, 830 cv) are not mixed in.
 */
const S = {
  corporate: src('ferrari-812-press', 'The Ferrari 812 Superfast: the new extreme-performance V12 berlinetta', 'Ferrari S.p.A.', 'https://www.ferrari.com/en-EN/corporate/articles/the-ferrari-812-superfast-the-new-extreme-performance-v12-berlinetta', true),
  model: src('ferrari-812-page', 'Ferrari 812 Superfast — página do modelo', 'Ferrari S.p.A.', 'https://www.ferrari.com/en-EN/auto/812-superfast', true),
  kit: src('netcarshow-812', 'Ferrari 812 Superfast (2018) — press kit e ficha técnica completos (reprodução)', 'NetCarShow (material de imprensa Ferrari)', 'https://www.netcarshow.com/ferrari/2018-812_superfast/'),
  foc: src('foc-812', 'The 812 Superfast is Announced (reprodução do comunicado)', "Ferrari Owners' Club UK", 'https://www.ferrariownersclub.co.uk/?p=20648'),
  conceptcarz: src('conceptcarz-812', 'Ferrari 812 Superfast technical specifications', 'conceptcarz.com', 'https://www.conceptcarz.com/s31303/news.aspx'),
  evo: src('evo-812', 'Ferrari 812 Superfast — engine, transmission and technical highlights', 'evo', 'https://evo.co.uk/ferrari/812-superfast/engine-transmission-and-technical-highlights'),
  motorsport: src('motorsport-812', 'Ferrari 812 Superfast (setembro de 2017)', 'Motor Sport Magazine', 'https://www.motorsportmagazine.com/archive/article/september-2017/58/ferrari-812-superfast'),
  wiki: src('wiki-812', 'Ferrari 812 Superfast (usado como ponteiro)', 'Wikipedia', 'https://en.wikipedia.org/wiki/Ferrari_812_Superfast'),
  wards: src('wards-f140hd', 'Ferrari unveils two new V-12 ICE sports models (F140HD com cárter seco)', 'WardsAuto', 'https://www.wardsauto.com/news/ferrari-unveils-two-new-v-12-ice-sports-models/798251/'),
};

const REAR = '315/35 ZR20';
const radius = tireRadius(REAR);
const MAX_RPM = 8900;
/**
 * Ferrari publishes no gear ratios (only "about 6% shorter than the
 * F12berlinetta"). The simulation uses estimated overall ratios from assumed
 * maximum speeds per gear at 8,900 rpm, with 7th reaching ≈ 350 km/h.
 */
const EST_SPEEDS = [98, 140, 185, 230, 275, 315, 350];
const overall = EST_SPEEDS.map((v) => overallRatioFromSpeed(MAX_RPM, v, radius));

export const ferrari812Superfast: EngineDefinition = {
  id: 'ferrari-812-superfast',
  manufacturer: 'Ferrari',
  vehicle: '812 Superfast',
  generation: '812 Superfast cupê (2017–2024)',
  year: 2018,
  marketVersion: 'Europa / ROW, especificação de lançamento (NEDC)',
  isCrateEngine: false,
  headline: '6.5 V12 ASPIRADO F140',
  engine: {
    name: 'Ferrari F140 6.5 V12',
    code: 'F140 GA',
    layout: 'v',
    cylinders: 12,
    bankAngleDeg: 65,
    displacementCc: 6496,
    boreMm: 94,
    strokeMm: 78,
    rodLengthMm: 140,
    rodLengthStatus: 'estimated',
    compressionRatio: 13.64,
    valvesPerCylinder: 4,
    valvetrain: 'dohc',
    aspiration: 'na',
    firingOrder: null,
    firingOrderStatus: 'unconfirmed',
    // even 60° firing assumed (crank geometry not published)
    firingIntervalsDeg: new Array(12).fill(60),
    cylinderMap: [
      ...[1, 2, 3, 4, 5, 6].map((n, i) => ({ number: n, row: 0, slot: i })),
      ...[7, 8, 9, 10, 11, 12].map((n, i) => ({ number: n, row: 1, slot: i })),
    ],
    crankType: 'Não publicado (V12 a 65°; ignição regular a 60° assumida na simulação)',
    lubrication: 'dry',
    fuelSystem: 'Injeção direta a 350 bar, dutos de admissão de geometria variável',
    inertiaKgM2: 0.18,
  },
  performance: {
    powerPs: 800,
    powerHp: 789,
    powerKw: 588,
    powerRpm: 8500,
    torqueNm: 718,
    torqueRpm: 7000,
    idleRpm: 900,
    idleStatus: 'estimated',
    redlineRpm: 8900,
    revLimitRpm: 8900,
  },
  drivetrain: {
    transmission: 'F1 de dupla embreagem 7 marchas, transeixo traseiro com E-Diff',
    kind: 'dct',
    ratios: overall,
    reverseRatio: overall[0],
    finalDrive: 1,
    ratiosStatus: 'unconfirmed',
    paddleShift: true,
    driveLayout: 'Traseira, transeixo, E-Diff',
    rearTire: REAR,
    tireRadiusM: radius,
    shiftTimeS: 0.08,
    efficiency: 0.88,
  },
  vehicleSpec: {
    topSpeedKmh: 340,
    topSpeedLimited: false,
    topSpeedNote: 'Oficial: mais de 340 km/h (sem limitador mencionado).',
    curbWeightKg: 1630,
    dragAreaM2: calibratedDragArea(588, 340, 1630, 0.88),
    rollingResistance: 0.012,
    fuelTankL: 92,
    fuelType: 'Gasolina premium sem chumbo',
    enginePosition: 'Dianteiro-central longitudinal',
  },
  fuel: { capacityL: 92, capacityStatus: 'official', label: 'Tanque', fuelType: 'Gasolina premium' },
  dashboard: {
    style: 'f812',
    speedoMaxKmh: 360,
    speedoUnit: 'kmh',
    speedoMaxNative: 360,
    tachMaxRpm: 10000,
    tachRedlineStartRpm: 9000,
    hasShiftLights: true,
    reference:
      'Conta-giros analógico central (0–10 ×1000, estimado) com marcha digital, ponteiro vermelho e faixa vermelha perto do topo; fundo amarelo (opcional, comum). TFT esquerda: velocidade, computador de bordo, pneus e manettino. TFT direita: infotenimento e dados do motor (óleo, água). LEDs de troca no aro de carbono do volante (opcionais). Escala do velocímetro virtual não confirmada (360 km/h usado).',
  },
  soundProfile: 'v12-na',
  visual: {
    summary: 'V12 a 65° longo e baixo atrás do eixo dianteiro: dois plenums vermelhos com a inscrição Ferrari sobre as bancadas, cobertura central clara "V12 6.5", coletores 6-em-1 de inox e cárter seco raso.',
    accent: '#d40000',
  },
  specs: [
    row('Configuração', 'V12 a 65°, aspirado, 48 válvulas', 'official', [S.kit.id], 'Válvulas e DOHC: fontes secundárias'),
    row('Cilindrada', '6.496 cm³', 'official', [S.kit.id, S.corporate.id]),
    row('Diâmetro × curso', '94 × 78 mm', 'official', [S.kit.id]),
    row('Taxa de compressão', '13,64:1', 'official', [S.kit.id, S.evo.id]),
    row('Injeção', 'Direta a 350 bar', 'official', [S.kit.id, S.corporate.id]),
    row('Potência', '800 cv (588 kW / 789 hp) a 8.500 rpm', 'official', [S.kit.id, S.corporate.id]),
    row('Torque', '718 N·m a 7.000 rpm (80% disponível a 3.500 rpm)', 'official', [S.kit.id, S.corporate.id]),
    row('Rotação máxima', '8.900 rpm', 'official', [S.kit.id, S.evo.id]),
    row('Marcha lenta', '≈ 900 rpm', 'estimated', undefined, 'Não publicada pela Ferrari'),
    row('Ordem de ignição / virabrequim', 'Não confirmados', 'unconfirmed', undefined, 'A animação usa sequência ilustrativa com intervalos regulares de 60°'),
    row('Lubrificação', 'Cárter seco', 'reputable', [S.wards.id], 'Padrão da família F140; não declarado no material do 812'),
    row('Câmbio', 'F1 de dupla embreagem, 7 marchas, aletas', 'official', [S.kit.id, S.motorsport.id]),
    row('Relações', 'Não publicadas (≈ 6% mais curtas que as do F12berlinetta)', 'unconfirmed', [S.kit.id], 'A simulação usa relações estimadas'),
    row('Pneus', '275/35 ZR20 dianteiros, 315/35 ZR20 traseiros', 'official', [S.kit.id]),
    row('Velocidade máxima', 'Mais de 340 km/h', 'official', [S.kit.id, S.corporate.id]),
    row('0–100 / 0–200 km/h', '2,9 s / 7,9 s', 'official', [S.kit.id, S.corporate.id]),
    row('Peso', '1.630 kg em ordem de marcha (seco: 1.525 kg com opcionais)', 'official', [S.kit.id]),
    row('Tanque', '92 L', 'official', [S.kit.id]),
    row('Posição do motor', 'Dianteiro-central longitudinal', 'reputable', [S.kit.id]),
  ],
  sources: Object.values(S),
  estimates: [
    'Relações de marcha (não publicadas): velocidades máximas por marcha assumidas, 7ª ≈ 350 km/h a 8.900 rpm',
    'Marcha lenta (900 rpm) e comprimento de biela (140 mm)',
    'Ordem de ignição e geometria do virabrequim (ilustrativas, 60°)',
    'Escala do conta-giros (10.000 rpm) e do velocímetro virtual (360 km/h)',
    'Cd·A calibrado para 340 km/h com 588 kW',
  ],
  notes: [
    'O 812 GTS e o 812 Competizione (830 cv, 9.500 rpm) não foram misturados.',
    'Compressão 13,64:1 (ficha Ferrari); 13,6:1 é o mesmo valor arredondado.',
    'Pneu traseiro oficial 315/35 ZR20; o conceptcarz lista 255/35 ZR20 por engano.',
  ],
};
