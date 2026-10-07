import type { CylinderSlot, EngineDefinition } from '../../types/engine';
import { row, src, tireRadius, calibratedDragArea } from '../helpers';

/**
 * W16 cylinder map. Bugatti does not publish its cylinder numbering, so this
 * numbering is the simulator's own convention (documented in the UI):
 * 1–8 in VR8 block A, 9–16 in block B, front to rear, alternating the two
 * staggered rows of each VR block.
 */
export function w16CylinderMap(): CylinderSlot[] {
  const out: CylinderSlot[] = [];
  for (let i = 0; i < 8; i++) out.push({ number: i + 1, row: i % 2 === 0 ? 0 : 1, slot: i });
  for (let i = 0; i < 8; i++) out.push({ number: i + 9, row: i % 2 === 0 ? 3 : 2, slot: i });
  return out;
}

const S = {
  w16: src('bugatti-w16-2022', 'Bugatti W16 engine – the last of its kind (2022)', 'Bugatti Newsroom', 'https://newsroom.bugatti.com/api/en/press-releases/pdf/bugatti-w16-engine-the-last-of-its-kind', true),
  genius: src('bugatti-veyron-genius', 'The engineering genius behind the Bugatti Veyron', 'Bugatti Newsroom', 'https://newsroom.bugatti.com/en/press-releases/the-engineering-genius-behind-the-bugatti-veyron', true),
  record407: src('bugatti-407', '407 km/h – a milestone in automotive history', 'Bugatti Newsroom', 'https://newsroom.bugatti.com/en/press-releases/407-kmh-a-milestone-in-automotive-history', true),
  final: src('bugatti-final-veyron', 'Final Bugatti Veyron 16.4 sold to a customer in Europe (2011)', 'Bugatti Newsroom', 'https://newsroom.bugatti.com/api/en/press-releases/pdf/final-bugatti-veyron-16-4-sold-to-a-customer-in-europe', true),
  geneva2015: src('bugatti-geneva-2015', 'Geneva Motor Show 2015: Bugatti celebrates the Veyron', 'Bugatti Newsroom', 'https://newsroom.bugatti.com/api/en/press-releases/pdf/geneva-international-motor-show-2015', true),
  dsg: src('bugatti-dsg-2004', "The world's first twin-clutch gearbox with seven speeds (2004)", 'Bugatti Newsroom', 'https://newsroom.bugatti.com/api/en/press-releases/pdf/the-world-s-first-twin-clutch-gearbox-with-seven-speeds', true),
  facts: src('bugatti-veyron-factsheet', 'Bugatti Veyron 16.4 / Grand Sport – technical specifications (EU fact sheet)', 'Bugatti (hosted by The Bugatti Revue)', 'https://bugattirevue.com/revue73/centenaire/facts-EU.pdf', true),
  cd: src('car-and-driver-2008', 'Bugatti Veyron 16.4 road test data panel (Dec 2008)', 'Car and Driver', 'https://www.manualshelf.com/manual/bugatti/16-bugatti-veyron-4/user-manual.html'),
  brochure: src('bugatti-revue-eb164', 'EB 16/4 Veyron – early Bugatti brochure data', 'The Bugatti Revue', 'https://www.bugattirevue.com/revue16/16-4.htm'),
  whichcar: src('whichcar-w16', "Bugatti's W16 engine explained", 'WhichCar / Wheels', 'https://www.whichcar.com.au/features/geek-speak-bugattis-lethal-w16'),
  wiki: src('wiki-veyron', 'Bugatti Veyron (used only as a pointer to primary sources)', 'Wikipedia', 'https://en.wikipedia.org/wiki/Bugatti_Veyron'),
};

const TIRE = 'PAX 365/710 ZR540A';
const radius = tireRadius(TIRE);

export const bugattiVeyron: EngineDefinition = {
  id: 'bugatti-veyron',
  manufacturer: 'Bugatti',
  vehicle: 'Veyron 16.4',
  generation: 'EB 16.4 — cupê original (2005–2011)',
  year: 2006,
  marketVersion: 'Europa (dados métricos, 98 RON)',
  isCrateEngine: false,
  headline: '8.0 W16 QUAD-TURBO',
  engine: {
    name: 'Bugatti W16 8.0 quad-turbo',
    code: 'W16 (código interno não publicado)',
    layout: 'w',
    cylinders: 16,
    bankAngleDeg: 90,
    vrAngleDeg: 15,
    displacementCc: 7993,
    boreMm: 86,
    strokeMm: 86,
    rodLengthMm: 141,
    rodLengthStatus: 'estimated',
    compressionRatio: 9.0,
    valvesPerCylinder: 4,
    valvetrain: 'dohc',
    aspiration: 'turbo',
    turbo: {
      count: 4,
      arrangement: 'parallel',
      maxBoostBar: 1.25,
      maxBoostStatus: 'reputable',
      fullBoostRpm: 3000,
      spoolTimeS: 0.7,
      maxShaftRpm: 140000,
      feeds: [
        [1, 3, 5, 7],
        [2, 4, 6, 8],
        [9, 11, 13, 15],
        [10, 12, 14, 16],
      ],
    },
    firingOrder: null,
    firingOrderStatus: 'unconfirmed',
    firingIntervalsDeg: new Array(16).fill(45),
    cylinderMap: w16CylinderMap(),
    slotPitchMm: 73,
    crankType: 'Virabrequim único, 8 moentes com 2 bielas lado a lado; intervalos de ignição de 45°',
    lubrication: 'dry',
    fuelSystem: 'Injeção multiponto sequencial (indireta)',
    inertiaKgM2: 0.42,
    engineWeightKg: 490,
  },
  performance: {
    powerPs: 1001,
    powerHp: 987,
    powerKw: 736,
    powerRpm: 6000,
    torqueNm: 1250,
    torqueRpm: [2200, 5500],
    idleRpm: 750,
    idleStatus: 'estimated',
    redlineRpm: 6600,
    revLimitRpm: 6700,
  },
  drivetrain: {
    transmission: 'DSG de dupla embreagem 7 marchas (Ricardo)',
    kind: 'dct',
    ratios: [3.18, 2.26, 1.67, 1.29, 1.06, 0.88, 0.8],
    reverseRatio: 3.18,
    finalDrive: 3.64 * 0.71,
    ratiosStatus: 'reputable',
    paddleShift: true,
    driveLayout: 'Tração integral permanente (acoplamento Haldex)',
    rearTire: TIRE,
    tireRadiusM: radius,
    shiftTimeS: 0.15,
    efficiency: 0.85,
  },
  vehicleSpec: {
    topSpeedKmh: 407,
    topSpeedLimited: true,
    topSpeedNote: '407 km/h no modo Top Speed (chave dedicada); 375 km/h nos demais modos',
    curbWeightKg: 1888,
    dragAreaM2: calibratedDragArea(736, 407, 1888, 0.85),
    rollingResistance: 0.012,
    fuelTankL: 100,
    fuelType: 'Gasolina Super Plus 98 RON',
    enginePosition: 'Central-traseiro longitudinal',
  },
  fuel: { capacityL: 100, capacityStatus: 'official', label: 'Tanque', fuelType: 'Gasolina 98 RON' },
  dashboard: {
    style: 'veyron',
    speedoMaxKmh: 450,
    speedoUnit: 'kmh',
    speedoMaxNative: 450,
    tachMaxRpm: 8000,
    tachRedlineStartRpm: 6600,
    hasShiftLights: false,
    reference:
      'Cluster original de cinco mostradores analógicos de fundo preto: conta-giros central 0–8, medidor de potência "POWER" em PS (até 1001) à esquerda, velocímetro em km/h à direita (numerais a cada 30 km/h) e dois mostradores menores. Sem shift light no 16.4 original. Final da escala do velocímetro não confirmado: 450 km/h (= 280 mph do painel americano, múltiplo de 30) usado como estimativa.',
  },
  soundProfile: 'w16-quad-turbo',
  visual: {
    summary: 'W16 extremamente compacto: dois blocos VR8 a 90°, quatro turbos baixos nas laterais, dois tubos de admissão escuros no vale, cabeçotes prateados com tela perfurada.',
    accent: '#3b6fd8',
  },
  specs: [
    row('Configuração', 'W16 — dois blocos VR8 (15°) a 90°', 'official', [S.geneva2015.id, S.w16.id]),
    row('Cilindrada', '7.993 cm³', 'official', [S.facts.id, S.final.id]),
    row('Diâmetro × curso', '86,0 × 86,0 mm', 'reputable', [S.brochure.id, S.cd.id], '86 × 86 mm reproduz exatamente a cilindrada oficial'),
    row('Taxa de compressão', '9,0:1', 'reputable', [S.cd.id]),
    row('Válvulas', '64 (4 por cilindro), 4 comandos variáveis', 'official', [S.geneva2015.id, S.final.id]),
    row('Aspiração', '4 turbocompressores em paralelo (dois por lado), intercooler ar-água', 'official', [S.w16.id]),
    row('Pressão de turbo', '1,25 bar (18,1 psi)', 'reputable', [S.cd.id]),
    row('Potência', '1.001 PS (736 kW / 987 hp) a 6.000 rpm', 'official', [S.facts.id, S.final.id]),
    row('Torque', '1.250 N·m entre 2.200 e 5.500 rpm', 'official', [S.facts.id]),
    row('Faixa vermelha', '6.600 rpm', 'reputable', [S.cd.id]),
    row('Limitador (simulação)', '6.700 rpm', 'estimated', undefined, 'Não publicado; valor usado só pela simulação'),
    row('Marcha lenta', '≈ 750 rpm', 'estimated', undefined, 'Não publicado; valor típico'),
    row('Câmbio', 'DSG 7 marchas (Ricardo), aletas no volante', 'official', [S.dsg.id]),
    row('Relações', '3,18 · 2,26 · 1,67 · 1,29 · 1,06 · 0,88 · 0,80', 'reputable', [S.cd.id]),
    row('Relação final', '3,64 × 0,71 (transferência) = 2,584 efetiva', 'reputable', [S.cd.id]),
    row('Ordem de ignição', '1-14-9-4-7-12-15-6-13-8-3-16-11-2-5-10 (não mapeada)', 'unconfirmed', [S.whichcar.id], 'Fonte secundária e sem numeração de cilindros publicada: a animação usa uma sequência ilustrativa com intervalos de 45° (estes, oficiais)'),
    row('Lubrificação', 'Cárter seco', 'official', [S.geneva2015.id]),
    row('Velocidade máxima', '407 km/h (modo Top Speed)', 'official', [S.record407.id, S.facts.id]),
    row('0–100 km/h', '2,5 s', 'official', [S.final.id]),
    row('Tanque', '100 L', 'official', [S.facts.id]),
    row('Combustível', 'Super Plus 98 RON', 'official', [S.facts.id]),
    row('Peso do motor', '≈ 490 kg (Bugatti 2015) — 2022 cita ≈ 400 kg', 'official', [S.geneva2015.id, S.w16.id]),
    row('Peso do veículo', '1.888 kg', 'reputable', [S.wiki.id]),
    row('Posição do motor', 'Central longitudinal, câmbio à frente do motor', 'official', [S.dsg.id]),
  ],
  sources: Object.values(S),
  estimates: [
    'Comprimento de biela (141 mm) — não publicado; razão biela/curso típica',
    'Marcha lenta (750 rpm) e limitador (6.700 rpm)',
    'Inércia rotativa, tempo de enchimento dos turbos e rotação das turbinas',
    'Cd·A calibrado para fechar 407 km/h com 736 kW',
    'Numeração e ordem de ignição usadas na animação (ilustrativas, intervalos oficiais de 45°)',
  ],
  notes: [
    'Configuração original 16.4 (1.001 PS). Super Sport / Grand Sport Vitesse (1.200 PS, 1.500 N·m) não são misturados.',
    'A imagem de referência enviada mostra um W16 de Chiron; o Veyron tem turbos 69% menores e tubos de admissão escuros.',
  ],
};
