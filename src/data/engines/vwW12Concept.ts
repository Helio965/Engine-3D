import type { CylinderSlot, EngineDefinition } from '../../types/engine';
import { row, src, tireRadius, calibratedDragArea } from '../helpers';

/**
 * Volkswagen W12 Syncro — the first W12 sports-car study (Italdesign
 * Giugiaro, Tokyo Motor Show, October 1997): a non-homologated show car with
 * the first 5.6 L W12, two 2.8 L VR6 modules on a common crankshaft. The 1998
 * Roadster, the 2001 W12 Coupé/Nardò (6.0 L, 600 PS) and the production 6.0
 * W12 (Phaeton, Bentley) are not mixed in.
 *
 * VW published very little about this car: gear ratios, tyres, weight, tank
 * and top speed are unknown, so the driving simulation uses clearly labelled
 * placeholders.
 */
export function w12CylinderMap(): CylinderSlot[] {
  // Simulator convention (concept numbering not published): 1–6 in VR bank A,
  // 7–12 in VR bank B, front to rear, alternating the two staggered rows.
  const out: CylinderSlot[] = [];
  for (let i = 0; i < 6; i++) out.push({ number: i + 1, row: i % 2 === 0 ? 0 : 1, slot: i });
  for (let i = 0; i < 6; i++) out.push({ number: i + 7, row: i % 2 === 0 ? 3 : 2, slot: i });
  return out;
}

const S = {
  italdesign: src('italdesign-w12', 'W12 Syncro — página do projeto', 'Italdesign Giugiaro S.p.A.', 'https://www.italdesign.it/project/w12-syncro/', true),
  vwoa: src('vw-media-1664', '#TBT — Celebrating 20 years of world-record history with the Volkswagen W12 Nardò', 'Volkswagen of America Media', 'https://media.vw.com/releases/1664', true),
  supercars: src('supercars-w12', '20th Anniversary of Volkswagen W12 Nardò Record (reproduz o texto da VW of America)', 'Supercars.net', 'https://www.supercars.net/blog/20th-anniversary-of-volkswagen-w12-nardo-record/'),
  motor1: src('motor1-w12', 'Volkswagen W12: The record-breaking concept that was never born', 'Motor1.com', 'https://www.motor1.com/news/750057/volkswagen-w12-concept-story/'),
  ucp: src('ucp-w12', '1997 Volkswagen W12 Syncro Concept Specifications', 'Ultimatecarpage.com', 'https://www.ultimatecarpage.com/spec/757/Volkswagen-W12-Syncro-Concept.html'),
  archivio: src('archivio-w12', '1997 Volkswagen W12 Syncro (Italdesign)', 'ArchivioPrototipi.it', 'http://www.archivioprototipi.it/europa/volkswagen/w12.html'),
  wiki: src('wiki-vw-w12', 'Volkswagen W12 (série de conceitos; usado como ponteiro)', 'Wikipedia', 'https://en.wikipedia.org/wiki/Volkswagen_W12'),
  carrozzieri: src('carrozzieri-w12', 'Volkswagen W12 Syncro', 'Carrozzieri Italiani', 'https://www.carrozzieri-italiani.com/?p=52772'),
};

// Placeholders (not published for the 1997 study)
const SIM_TIRE = '285/35 ZR19';
const SIM_MASS = 1450;
const SIM_VMAX = 300;

export const vwW12Concept: EngineDefinition = {
  id: 'vw-w12-concept',
  manufacturer: 'Volkswagen',
  vehicle: 'W12 Syncro (estudo 1997)',
  generation: 'Primeiro estudo W12 (cupê W12 Syncro, Italdesign), Tóquio 1997',
  year: 1997,
  marketVersion: 'Carro-conceito / protótipo funcional (sem homologação)',
  isCrateEngine: false,
  headline: '5.6 W12 ASPIRADO',
  engine: {
    name: 'Volkswagen W12 5.6 (dois módulos VR6 2.8)',
    code: 'Não confirmado',
    layout: 'w',
    cylinders: 12,
    bankAngleDeg: 72,
    vrAngleDeg: 15,
    displacementCc: 5584,
    boreMm: 81,
    strokeMm: 90.3,
    rodLengthMm: 164,
    rodLengthStatus: 'estimated',
    valvesPerCylinder: 4,
    valvetrain: 'dohc',
    aspiration: 'na',
    firingOrder: null,
    firingOrderStatus: 'unconfirmed',
    firingIntervalsDeg: new Array(12).fill(60),
    cylinderMap: w12CylinderMap(),
    crankType: 'Virabrequim único comum aos dois módulos VR6 (7 mancais); geometria dos moentes não publicada',
    lubrication: 'wet',
    fuelSystem: 'Injeção multiponto (sistema não confirmado)',
    inertiaKgM2: 0.2,
  },
  performance: {
    powerPs: 420,
    powerHp: 414,
    powerKw: 309,
    powerRpm: 5800,
    torqueNm: 530,
    torqueRpm: 3000,
    idleRpm: 750,
    idleStatus: 'estimated',
    redlineRpm: 6500,
    revLimitRpm: 6700,
  },
  drivetrain: {
    transmission: '6 marchas sequencial, tração integral Syncro',
    kind: 'manual',
    ratios: [3.5, 2.2, 1.55, 1.2, 0.98, 0.82],
    reverseRatio: 3.2,
    finalDrive: 3.3,
    ratiosStatus: 'unconfirmed',
    paddleShift: false,
    driveLayout: 'Integral permanente Syncro',
    rearTire: SIM_TIRE,
    tireRadiusM: tireRadius(SIM_TIRE),
    shiftTimeS: 0.35,
    efficiency: 0.84,
  },
  vehicleSpec: {
    topSpeedKmh: SIM_VMAX,
    topSpeedLimited: false,
    topSpeedNote: 'Velocidade máxima do estudo de 1997 não publicada; 300 km/h é só um parâmetro de simulação.',
    curbWeightKg: SIM_MASS,
    dragAreaM2: calibratedDragArea(309, SIM_VMAX, SIM_MASS, 0.84),
    rollingResistance: 0.012,
    fuelTankL: 90,
    fuelType: 'Gasolina',
    enginePosition: 'Central longitudinal (visível sob a cobertura de vidro)',
  },
  fuel: { capacityL: 90, capacityStatus: 'unconfirmed', label: 'Tanque (capacidade não publicada)', fuelType: 'Gasolina' },
  dashboard: {
    style: 'w12concept',
    speedoMaxKmh: 320,
    speedoUnit: 'kmh',
    speedoMaxNative: 320,
    tachMaxRpm: 8000,
    tachRedlineStartRpm: 6500,
    hasShiftLights: false,
    reference:
      'GENÉRICO: não há foto legível nem descrição do painel do W12 Syncro de 1997. Painel neutro no estilo VW do fim dos anos 1990 (mostradores pretos, números brancos, ponteiros vermelhos), sem copiar o Nardò de 2001 nem o Phaeton.',
  },
  soundProfile: 'w12-na',
  visual: {
    summary: 'W12 largo e curto (dois VR6 a 72°) exposto sob a cobertura de vidro traseira; a tampa preta/prateada "W12" da imagem de referência é do motor de produção e aparece só como ilustração.',
    accent: '#f2c200',
  },
  specs: [
    row('Configuração', 'W12: dois módulos VR6 estreitos sobre um virabrequim comum', 'official', [S.vwoa.id, S.supercars.id]),
    row('Ângulos', '72° entre os módulos, 15° dentro de cada VR6', 'reputable', [S.motor1.id, S.ucp.id, S.wiki.id]),
    row('Cilindrada', '5.584 cm³ (anunciado como 5,6 L)', 'reputable', [S.ucp.id, S.archivio.id], 'Exatamente 2 × 2.792 cm³ do VR6 2.8'),
    row('Diâmetro × curso', '81,0 × 90,3 mm (derivado do VR6 2.8)', 'estimated', [S.vwoa.id], 'Não publicado; reproduz 5.584 cm³'),
    row('Válvulas', '48 (4 por cilindro), DOHC', 'reputable', [S.ucp.id, S.wiki.id]),
    row('Aspiração', 'Aspirado', 'reputable', [S.ucp.id]),
    row('Potência', '420 PS (309 kW / 414 hp)', 'reputable', [S.motor1.id, S.wiki.id, S.supercars.id], '414 hp no texto oficial da VW of America'),
    row('Rotação da potência máxima', '5.800 rpm', 'reputable', [S.ucp.id], 'Fonte única'),
    row('Torque', '530 N·m a 3.000 rpm', 'reputable', [S.motor1.id, S.ucp.id], 'Rotação de fonte única'),
    row('Marcha lenta / faixa vermelha / corte', '≈ 750 / 6.500 / 6.700 rpm', 'estimated', undefined, 'Não publicados; valores de simulação'),
    row('Câmbio', '6 marchas sequencial', 'official', [S.vwoa.id, S.supercars.id]),
    row('Tração', 'Integral permanente Syncro', 'official', [S.italdesign.id, S.vwoa.id]),
    row('Relações, pneus, peso, tanque', 'Não publicados', 'unconfirmed', undefined, 'A simulação usa valores estimados'),
    row('Velocidade máxima', 'Não confirmada', 'unconfirmed', undefined, 'Os 357 km/h citados são do W12 Nardò de 2001'),
    row('Ordem de ignição', 'Não confirmada', 'unconfirmed', undefined, 'A ordem do W12 6.0 de produção não vale para este motor; animação ilustrativa'),
    row('Posição do motor', 'Central longitudinal, deixado à vista', 'reputable', [S.ucp.id, S.italdesign.id]),
    row('Carroceria', 'Italdesign Giugiaro, 4.400 × 1.920 × 1.100 mm', 'reputable', [S.ucp.id, S.carrozzieri.id]),
  ],
  sources: Object.values(S),
  estimates: [
    'Diâmetro e curso derivados do VR6 2.8; biela de 164 mm',
    'Marcha lenta, faixa vermelha e corte',
    'Relações de marcha, pneu (285/35 R19), massa (1.450 kg) e tanque (90 L) — não publicados',
    'Velocidade máxima de simulação (300 km/h) e Cd·A calibrado',
    'Numeração e ordem de ignição dos cilindros (ilustrativas, intervalos de 60°)',
    'Lubrificação (não documentada para o 5.6)',
    'Painel genérico (não há referência do painel real)',
  ],
  notes: [
    'Versão: W12 Syncro amarelo de 1997. O Roadster de 1998 (tração traseira) e o W12 Nardò de 2001 (6.0, 600 PS) não foram misturados.',
    'A imagem de referência enviada mostra a tampa do W12 6.0 de produção, não o motor do estudo de 1997.',
  ],
};
