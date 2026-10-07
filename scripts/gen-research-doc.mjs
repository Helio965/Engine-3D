// Generates docs/engine-research.md from the engine data files (src/data),
// so the research document and the app always show the same figures.
// Usage: npm run docs:research
import { build } from 'esbuild';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dir = mkdtempSync(join(tmpdir(), 'engine-lab-doc-'));
const out = join(dir, 'engines.mjs');
await build({ entryPoints: [join(root, 'src/data/engines.ts')], bundle: true, format: 'esm', platform: 'node', outfile: out, logLevel: 'error' });
const { ENGINES } = await import(pathToFileURL(out).href);
rmSync(dir, { recursive: true, force: true });

const STATUS = { official: 'Oficial', reputable: 'Fonte confiável', estimated: 'Estimado', unconfirmed: 'Não confirmado' };
const nf = (n, d = 0) => n.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
const cell = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
const st = (s) => (s ? STATUS[s] : '');

function architecture(e) {
  if (e.layout === 'inline') return `${e.cylinders} cilindros em linha`;
  if (e.layout === 'w') return `W${e.cylinders}: dois blocos VR${e.cylinders / 2} de ${e.vrAngleDeg}° a ${e.bankAngleDeg}°`;
  return `V${e.cylinders} a ${e.bankAngleDeg}°`;
}

function aspiration(e) {
  if (e.turbo) {
    const t = e.turbo;
    return [`${t.count} turbos (${t.arrangement === 'sequential' ? 'sequenciais' : 'em paralelo'})`, `${nf(t.maxBoostBar, 2)} bar`, t.maxBoostStatus];
  }
  if (e.supercharger) {
    const s = e.supercharger;
    return [`Compressor ${s.type} de ${nf(s.displacementL, 2)} L, acionamento ${nf(s.driveRatio, 2)}:1`, `${nf(s.maxBoostBar, 2)} bar`, s.maxBoostStatus];
  }
  return ['Aspirado (sem turbo nem compressor)', '—', null];
}

/** Section heading, and its GitHub anchor. */
const title = (def, i) => `${i + 1}. ${def.manufacturer} ${def.vehicle}${def.isCrateEngine ? ' — Crate Engine / Performance Build' : ''}`;
const slug = (h) => h.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, '').replace(/\s/g, '-');

function engineSection(def, i) {
  const e = def.engine;
  const p = def.performance;
  const dt = def.drivetrain;
  const vs = def.vehicleSpec;
  const srcIndex = new Map(def.sources.map((s, k) => [s.id, k + 1]));
  const refs = (ids) => (ids ?? []).map((id) => `[${srcIndex.get(id)}]`).join(' ');
  const spec = (label) => def.specs.find((r) => r.label === label)?.value;
  const [asp, boost, boostStatus] = aspiration(e);
  const torqueRpm = Array.isArray(p.torqueRpm) ? `${nf(p.torqueRpm[0])}–${nf(p.torqueRpm[1])} rpm` : `${nf(p.torqueRpm)} rpm`;
  const L = [];
  L.push(`## ${title(def, i)}`, '');
  L.push(`**Versão escolhida:** ${def.generation} · ano ${def.year} · ${def.marketVersion}`, '');
  L.push('### Resumo (valores usados no simulador)', '');
  L.push('| Campo | Valor | Situação |', '|---|---|---|');
  const rows = [
    ['Fabricante', def.manufacturer],
    ['Veículo', def.isCrateEngine ? `${def.vehicle} (motor de caixa, sem carro de produção)` : def.vehicle],
    ['Ano', def.year],
    ['Motor / código', `${e.name} — ${e.code}`],
    ['Arquitetura', architecture(e)],
    ['Cilindros', e.cylinders],
    ['Cilindrada', `${nf(e.displacementCc)} cm³`],
    ['Diâmetro × curso', `${nf(e.boreMm, 2)} × ${nf(e.strokeMm, 2)} mm`],
    ['Biela', `${nf(e.rodLengthMm, 1)} mm`, e.rodLengthStatus],
    ['Aspiração', asp],
    ['Pressão máxima', boost, boostStatus],
    ['Potência', `${nf(p.powerPs)} PS / ${nf(p.powerKw, p.powerKw % 1 ? 1 : 0)} kW / ${nf(p.powerHp)} hp a ${nf(p.powerRpm)} rpm`],
    ['Torque', `${nf(p.torqueNm)} N·m a ${torqueRpm}`],
    ['Marcha lenta', `${nf(p.idleRpm)} rpm`, p.idleStatus],
    ['Faixa de rotação', `${nf(p.idleRpm)}–${nf(p.revLimitRpm)} rpm`],
    ['Faixa vermelha / corte', `${nf(p.redlineRpm)} / ${nf(p.revLimitRpm)} rpm`],
    ['Transmissão', dt ? dt.transmission : 'Não se aplica (vendido sem câmbio)'],
    ['Marchas e relações', dt ? `${dt.ratios.length}: ${dt.ratios.map((r) => nf(r, 3)).join(' · ')}${dt.finalDrive !== 1 ? ` · final ${nf(dt.finalDrive, 3)}` : ' (relações totais)'}` : '—', dt?.ratiosStatus],
    ['Aletas no volante', dt ? (dt.paddleShift ? 'Sim' : 'Não') : '—'],
    ['Velocidade máxima', vs ? `${nf(vs.topSpeedKmh)} km/h${vs.topSpeedLimited ? ' (limitada)' : ''}${vs.topSpeedNote ? ` — ${vs.topSpeedNote}` : ''}` : 'Não se aplica'],
    ['Tanque', `${nf(def.fuel.capacityL)} L — ${def.fuel.label}`, def.fuel.capacityStatus],
    ['Combustível', def.fuel.fuelType],
    ['Posição do motor', vs ? vs.enginePosition : 'Motor de bancada'],
    ['Ordem de ignição', e.firingOrder ? e.firingOrder.join('-') : `Não confirmada${e.unconfirmedFiringOrder ? ` (animação: ${e.unconfirmedFiringOrder.join('-')}, relato não confirmado)` : ' (animação ilustrativa)'}`, e.firingOrderStatus],
    ['Virabrequim', e.crankType],
    ['Lubrificação', spec('Lubrificação') ?? `${e.lubrication === 'dry' ? 'Cárter seco' : 'Cárter úmido'}${def.estimates.some((x) => x.startsWith('Lubrificação')) ? ' (não documentada; valor de simulação)' : ''}`],
    ['Painel', def.dashboard.reference],
    ['Traços visuais', def.visual.summary],
  ];
  for (const [k, v, s] of rows) L.push(`| ${cell(k)} | ${cell(v)} | ${st(s)} |`);
  L.push('', '### Ficha verificada (painel ENGINE SPECS)', '');
  L.push('| Item | Valor | Situação | Fontes | Observação |', '|---|---|---|---|---|');
  for (const r of def.specs) L.push(`| ${cell(r.label)} | ${cell(r.value)} | ${st(r.status)} | ${refs(r.sources)} | ${cell(r.note ?? '')} |`);
  L.push('', '### Estimativas usadas pela simulação', '');
  for (const x of def.estimates) L.push(`- ${x}`);
  if (def.notes?.length) {
    L.push('', '### Versão, discrepâncias e decisões', '');
    for (const x of def.notes) L.push(`- ${x}`);
  }
  L.push('', '### Fontes', '');
  def.sources.forEach((s, k) => L.push(`${k + 1}. ${s.title} — ${s.publisher}${s.official ? ' **(oficial)**' : ''} — <${s.url}>`));
  L.push('');
  return L.join('\n');
}

const header = `# Pesquisa dos motores — ENGINE LAB

> Arquivo gerado por \`npm run docs:research\` a partir de \`src/data/engines/*.ts\`. Não edite à mão: altere os dados e gere de novo.

## Método

- Fontes oficiais primeiro (sites, comunicados, fichas técnicas e manuais dos fabricantes); depois fontes reconhecidas (revistas com ficha de teste, catálogos, reproduções de comunicados). Wikipedia só como ponteiro para fontes primárias.
- Cada configuração usa **uma única versão** de carro. Dados de outras versões (Super Sport, Speciale, Competizione, Nardò, Redeye, motor W12 de produção…) não são misturados; quando aparecem, estão só nas discrepâncias.
- Situação de cada dado: **Oficial** (fabricante), **Fonte confiável** (fonte reconhecida, coerente com os dados oficiais), **Estimado** (valor de simulação, não publicado) e **Não confirmado** (nenhuma fonte confiável encontrada).
- Valores que o simulador precisa mas que não foram publicados (marcha lenta, relações do 812 e do W12, massa do 458, pneus e tanque do W12…) aparecem sempre como estimativa, na tela e aqui.

## Imagens de referência recebidas

1. Lexus LFA — não está entre as 9 configurações pedidas; não foi usado.
2. Bugatti Tourbillon V16 — não é um W16; não foi usado (as duas Bugatti usam a imagem do W16 do Chiron).
3. Nissan RB26DETT · 4. BMW S85 V10 · 5. HEMI supercharged do Hellcat · 6. Chevrolet ZZ632 · 7. Ferrari F136 (458) · 8. Ferrari F140 (812).
9. VW W12 — a tampa preta e prateada da foto é a do W12 6.0 de produção; o motor 5.6 do estudo de 1997 é representado com essa tampa só como ilustração.
10. Bugatti Chiron W16 (vista lateral).

Nenhum vídeo foi recebido; a análise visual usou apenas as imagens.

## Configurações

${ENGINES.map((d, i) => `${i + 1}. [${d.manufacturer} ${d.vehicle}](#${slug(title(d, i))})`).join('\n')}
`;

writeFileSync(join(root, 'docs/engine-research.md'), header + '\n' + ENGINES.map(engineSection).join('\n'));
console.log(`docs/engine-research.md: ${ENGINES.length} configurações`);
