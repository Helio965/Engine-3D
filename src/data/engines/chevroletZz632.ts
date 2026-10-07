import type { EngineDefinition } from '../../types/engine';
import { row, src } from '../helpers';

/**
 * Chevrolet Performance ZZ632/1000 Deluxe crate engine (US, P/N 19432060;
 * first release 19432058), sold for off-highway / competition use. It does
 * not belong to any production car: the simulator runs it as a
 * "Crate Engine / Performance Build" on an engine stand / dyno, with a bench
 * fuel cell and no vehicle data.
 */
const S = {
  press: src('gm-zz632-2021', 'Chevrolet Performance Unveils Its Largest, Most Powerful Crate Engine Ever (20/10/2021)', 'General Motors (GM Newsroom)', 'https://news.gm.com/home.detail.html/Pages/news/us/en/2021/oct/1020-crate.html', true),
  product: src('chevrolet-632-page', '632 Big-Block Crate Engine — ZZ632/1000 Deluxe (especificações)', 'Chevrolet Performance Parts', 'https://www.chevrolet.com/performance-parts/crate-engines/big-block-engines/632-engine', true),
  guide: src('chevrolet-zz632-guide', 'ZZ632 Deluxe Engine Specifications / Installation Instructions (P/N 19432058)', 'Chevrolet Performance (GM)', 'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/performance/resources/installation-guides/crate-engines/02-pdf/ZZ632-Deluxe-Engine-Installation-Sheet-Guide.pdf', true),
  dually: src('chevrolet-dually', '1989 Silverado Concept (Development Dually) — galeria da página do motor 632', 'Chevrolet (GM)', 'https://www.chevrolet.com/content/experience-fragments/chevrolet/na/us/en/index/performance/powertrain/engines/new/big-block/632-engine/gallery_silverado/modal/master.html', true),
  chevelle: src('chevrolet-chevelle', '1969 Chevelle SS (montagem Mile High Muscle) — galeria da página do motor 632', 'Chevrolet (GM)', 'https://www.chevrolet.com/content/experience-fragments/chevrolet/na/us/en/index/performance/powertrain/engines/new/big-block/632-engine/gallery_chevelle/gallery-modal/master.html', true),
};

export const chevroletZz632: EngineDefinition = {
  id: 'chevrolet-zz632',
  manufacturer: 'Chevrolet Performance',
  vehicle: 'ZZ632/1000 Deluxe',
  generation: 'Big-block Gen VI, bloco tall deck',
  year: 2022,
  marketVersion: 'EUA — Crate Engine / Performance Build (uso off-road / competição), P/N 19432060',
  isCrateEngine: true,
  headline: '10.4 V8 BIG-BLOCK ASPIRADO',
  engine: {
    name: 'ZZ632/1000 Deluxe Big-Block V8',
    code: 'P/N 19432060 (lançamento: 19432058)',
    layout: 'v',
    cylinders: 8,
    bankAngleDeg: 90,
    displacementCc: 10348,
    boreMm: 116.84,
    strokeMm: 120.65,
    rodLengthMm: 166,
    rodLengthStatus: 'estimated',
    compressionRatio: 12,
    valvesPerCylinder: 2,
    valvetrain: 'ohv',
    aspiration: 'na',
    firingOrder: [1, 8, 7, 2, 6, 5, 4, 3],
    firingOrderStatus: 'official',
    // GM convention: odd cylinders on the left bank, even on the right, front to rear
    cylinderMap: [
      ...[1, 3, 5, 7].map((n, i) => ({ number: n, row: 0, slot: i })),
      ...[2, 4, 6, 8].map((n, i) => ({ number: n, row: 1, slot: i })),
    ],
    crankType: 'Cruzado (V8 de ignição regular), aço forjado 4340, balanceamento interno',
    lubrication: 'wet',
    fuelSystem: 'Injeção multiponto, 8 injetores de 86 lb/h, corpo de borboleta único estilo 4500, 58 psi',
    inertiaKgM2: 0.3,
  },
  performance: {
    powerPs: 1018,
    powerHp: 1004,
    powerKw: 748.7,
    powerRpm: 6600,
    torqueNm: 1188,
    torqueRpm: 5600,
    idleRpm: 1050,
    idleStatus: 'official',
    redlineRpm: 7000,
    revLimitRpm: 7000,
  },
  drivetrain: null,
  vehicleSpec: null,
  fuel: { capacityL: 30, capacityStatus: 'estimated', label: 'Célula de combustível de bancada', fuelType: 'Gasolina premium 93 (R+M)/2, máx. E10' },
  dashboard: {
    style: 'crate',
    speedoMaxKmh: 0,
    speedoUnit: 'kmh',
    speedoMaxNative: 0,
    tachMaxRpm: 8000,
    tachRedlineStartRpm: 7000,
    hasShiftLights: true,
    reference:
      'NÃO OFICIAL: motor de caixa sem painel de fábrica. Painel digital genérico de bancada/dinamômetro: barra de rotação até 8.000 rpm com faixa vermelha a partir de 7.000 (máxima recomendada pela Chevrolet), luzes de troca, AFR/lambda, MAP em kPa, temperatura da água, pressão de óleo e de combustível, tensão e TPS. Cores: fundo preto, laranja Chevrolet Performance e vermelho na faixa de 7.000+.',
  },
  soundProfile: 'v8-cross-bigblock',
  visual: {
    summary: 'Big-block V8 laranja com tampas de válvulas "632", coletor de admissão alto de alumínio, filtro de ar redondo e suporte de motor (não vai instalado em carro de série).',
    accent: '#e0601a',
  },
  specs: [
    row('Tipo', 'Crate Engine / Performance Build — não pertence a carro de série', 'official', [S.press.id, S.product.id]),
    row('Configuração', 'V8 big-block, comando no bloco (OHV), 2 válvulas por cilindro', 'official', [S.press.id, S.product.id]),
    row('Ângulo entre bancadas', '90°', 'estimated', undefined, 'Não declarado nos documentos do ZZ632; todos os big-block Chevrolet são V8 a 90°'),
    row('Cilindrada', '10.348 cm³ (632 pol³)', 'official', [S.press.id, S.product.id]),
    row('Diâmetro × curso', '116,84 × 120,65 mm (4,600 × 4,750 pol)', 'official', [S.press.id, S.product.id, S.guide.id]),
    row('Taxa de compressão', '12,0:1', 'official', [S.press.id, S.guide.id]),
    row('Comando', 'Rolete hidráulico em aço tarugo, balancins 1,8:1, corrente dupla', 'official', [S.product.id, S.guide.id]),
    row('Válvulas', 'Titânio, 2,450 pol admissão / 1,800 pol escape', 'official', [S.product.id, S.guide.id]),
    row('Aspiração', 'Aspirado (sem turbo nem compressor)', 'official', [S.press.id]),
    row('Potência', '1.004 hp (748,7 kW / 1.018 PS) a 6.600 rpm', 'official', [S.press.id, S.product.id], 'Com gasolina 93 octanas e a calibração da ECU incluída'),
    row('Torque', '876 lb-ft (1.188 N·m) a 5.600 rpm', 'official', [S.press.id, S.product.id]),
    row('Rotação máxima recomendada', '7.000 rpm', 'official', [S.press.id, S.product.id, S.guide.id]),
    row('Marcha lenta', '≈ 1.050 rpm', 'official', [S.guide.id]),
    row('Ordem de ignição', '1-8-7-2-6-5-4-3', 'official', [S.guide.id], 'Ordem estilo LS, não a 1-8-4-3-6-5-7-2 tradicional dos big-block'),
    row('Virabrequim', 'Aço forjado 4340, balanceamento interno', 'official', [S.product.id, S.guide.id], 'Geometria cruzada inferida pela ordem de ignição'),
    row('Lubrificação', 'Cárter úmido de 8 qt com defletor', 'official', [S.product.id, S.guide.id]),
    row('Combustível', 'Gasolina premium, mín. 93 (R+M)/2, máx. 10% de etanol', 'official', [S.product.id, S.guide.id]),
    row('Biela', 'Não confirmado (aço forjado 4340 H-beam)', 'unconfirmed', [S.guide.id], 'Comprimento não publicado; a simulação usa 166 mm (estimado)'),
    row('Veículos de demonstração', 'Silverado 1989 "Development Dually" (4L85-E) e Chevelle SS 1969 de oficina parceira', 'official', [S.dually.id, S.chevelle.id], 'Sem dados de relação final, pneus ou peso publicados; por isso não há modo de condução'),
    row('Câmbio, velocidade, tanque', 'Não se aplica / não confirmado', 'unconfirmed', undefined, 'O motor é vendido sem câmbio e sem veículo'),
  ],
  sources: Object.values(S),
  estimates: [
    'Célula de combustível de bancada de 30 L (simulação; não há tanque de veículo)',
    'Comprimento de biela (166 mm)',
    'Corte de rotação a 7.000 rpm (a Chevrolet publica só a máxima recomendada)',
    'Painel digital de bancada (não oficial) e escala de 8.000 rpm',
    'Inércia rotativa',
  ],
  notes: [
    'Sem veículo de produção: disponíveis apenas os modos Neutro e Dinamômetro.',
    'A ordem de ignição oficial 1-8-7-2-6-5-4-3 corrige a ordem big-block tradicional citada no briefing.',
  ],
};
