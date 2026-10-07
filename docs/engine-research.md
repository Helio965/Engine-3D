# Pesquisa dos motores — ENGINE LAB

> Arquivo gerado por `npm run docs:research` a partir de `src/data/engines/*.ts`. Não edite à mão: altere os dados e gere de novo.

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

1. [Bugatti Veyron 16.4](#1-bugatti-veyron-164)
2. [Bugatti Chiron](#2-bugatti-chiron)
3. [Nissan Skyline GT-R R34 V-spec](#3-nissan-skyline-gt-r-r34-v-spec)
4. [BMW M5 E60](#4-bmw-m5-e60)
5. [Dodge / SRT Challenger SRT Hellcat](#5-dodge--srt-challenger-srt-hellcat)
6. [Chevrolet Performance ZZ632/1000 Deluxe](#6-chevrolet-performance-zz6321000-deluxe--crate-engine--performance-build)
7. [Ferrari 458 Italia](#7-ferrari-458-italia)
8. [Ferrari 812 Superfast](#8-ferrari-812-superfast)
9. [Volkswagen W12 Syncro (estudo 1997)](#9-volkswagen-w12-syncro-estudo-1997)

## 1. Bugatti Veyron 16.4

**Versão escolhida:** EB 16.4 — cupê original (2005–2011) · ano 2006 · Europa (dados métricos, 98 RON)

### Resumo (valores usados no simulador)

| Campo | Valor | Situação |
|---|---|---|
| Fabricante | Bugatti |  |
| Veículo | Veyron 16.4 |  |
| Ano | 2006 |  |
| Motor / código | Bugatti W16 8.0 quad-turbo — W16 (código interno não publicado) |  |
| Arquitetura | W16: dois blocos VR8 de 15° a 90° |  |
| Cilindros | 16 |  |
| Cilindrada | 7.993 cm³ |  |
| Diâmetro × curso | 86,00 × 86,00 mm |  |
| Biela | 141,0 mm | Estimado |
| Aspiração | 4 turbos (em paralelo) |  |
| Pressão máxima | 1,25 bar | Fonte confiável |
| Potência | 1.001 PS / 736 kW / 987 hp a 6.000 rpm |  |
| Torque | 1.250 N·m a 2.200–5.500 rpm |  |
| Marcha lenta | 750 rpm | Estimado |
| Faixa de rotação | 750–6.700 rpm |  |
| Faixa vermelha / corte | 6.600 / 6.700 rpm |  |
| Transmissão | DSG de dupla embreagem 7 marchas (Ricardo) |  |
| Marchas e relações | 7: 3,180 · 2,260 · 1,670 · 1,290 · 1,060 · 0,880 · 0,800 · final 2,584 | Fonte confiável |
| Aletas no volante | Sim |  |
| Velocidade máxima | 407 km/h (limitada) — 407 km/h no modo Top Speed (chave dedicada); 375 km/h nos demais modos |  |
| Tanque | 100 L — Tanque | Oficial |
| Combustível | Gasolina 98 RON |  |
| Posição do motor | Central-traseiro longitudinal |  |
| Ordem de ignição | Não confirmada (animação ilustrativa) | Não confirmado |
| Virabrequim | Virabrequim único, 8 moentes com 2 bielas lado a lado; intervalos de ignição de 45° |  |
| Lubrificação | Cárter seco |  |
| Painel | Cluster original de cinco mostradores analógicos de fundo preto: conta-giros central 0–8, medidor de potência "POWER" em PS (até 1001) à esquerda, velocímetro em km/h à direita (numerais a cada 30 km/h) e dois mostradores menores. Sem shift light no 16.4 original. Final da escala do velocímetro não confirmado: 450 km/h (= 280 mph do painel americano, múltiplo de 30) usado como estimativa. |  |
| Traços visuais | W16 extremamente compacto: dois blocos VR8 a 90°, quatro turbos baixos nas laterais, dois tubos de admissão escuros no vale, cabeçotes prateados com tela perfurada. |  |

### Ficha verificada (painel ENGINE SPECS)

| Item | Valor | Situação | Fontes | Observação |
|---|---|---|---|---|
| Configuração | W16 — dois blocos VR8 (15°) a 90° | Oficial | [5] [1] |  |
| Cilindrada | 7.993 cm³ | Oficial | [7] [4] |  |
| Diâmetro × curso | 86,0 × 86,0 mm | Fonte confiável | [9] [8] | 86 × 86 mm reproduz exatamente a cilindrada oficial |
| Taxa de compressão | 9,0:1 | Fonte confiável | [8] |  |
| Válvulas | 64 (4 por cilindro), 4 comandos variáveis | Oficial | [5] [4] |  |
| Aspiração | 4 turbocompressores em paralelo (dois por lado), intercooler ar-água | Oficial | [1] |  |
| Pressão de turbo | 1,25 bar (18,1 psi) | Fonte confiável | [8] |  |
| Potência | 1.001 PS (736 kW / 987 hp) a 6.000 rpm | Oficial | [7] [4] |  |
| Torque | 1.250 N·m entre 2.200 e 5.500 rpm | Oficial | [7] |  |
| Faixa vermelha | 6.600 rpm | Fonte confiável | [8] |  |
| Limitador (simulação) | 6.700 rpm | Estimado |  | Não publicado; valor usado só pela simulação |
| Marcha lenta | ≈ 750 rpm | Estimado |  | Não publicado; valor típico |
| Câmbio | DSG 7 marchas (Ricardo), aletas no volante | Oficial | [6] |  |
| Relações | 3,18 · 2,26 · 1,67 · 1,29 · 1,06 · 0,88 · 0,80 | Fonte confiável | [8] |  |
| Relação final | 3,64 × 0,71 (transferência) = 2,584 efetiva | Fonte confiável | [8] |  |
| Ordem de ignição | 1-14-9-4-7-12-15-6-13-8-3-16-11-2-5-10 (não mapeada) | Não confirmado | [10] | Fonte secundária e sem numeração de cilindros publicada: a animação usa uma sequência ilustrativa com intervalos de 45° (estes, oficiais) |
| Lubrificação | Cárter seco | Oficial | [5] |  |
| Velocidade máxima | 407 km/h (modo Top Speed) | Oficial | [3] [7] |  |
| 0–100 km/h | 2,5 s | Oficial | [4] |  |
| Tanque | 100 L | Oficial | [7] |  |
| Combustível | Super Plus 98 RON | Oficial | [7] |  |
| Peso do motor | ≈ 490 kg (Bugatti 2015) — 2022 cita ≈ 400 kg | Oficial | [5] [1] |  |
| Peso do veículo | 1.888 kg | Fonte confiável | [11] |  |
| Posição do motor | Central longitudinal, câmbio à frente do motor | Oficial | [6] |  |

### Estimativas usadas pela simulação

- Comprimento de biela (141 mm) — não publicado; razão biela/curso típica
- Marcha lenta (750 rpm) e limitador (6.700 rpm)
- Inércia rotativa, tempo de enchimento dos turbos e rotação das turbinas
- Cd·A calibrado para fechar 407 km/h com 736 kW
- Numeração e ordem de ignição usadas na animação (ilustrativas, intervalos oficiais de 45°)

### Versão, discrepâncias e decisões

- Configuração original 16.4 (1.001 PS). Super Sport / Grand Sport Vitesse (1.200 PS, 1.500 N·m) não são misturados.
- A imagem de referência enviada mostra um W16 de Chiron; o Veyron tem turbos 69% menores e tubos de admissão escuros.
- Curso: 86,0 mm (folheto Bugatti, bate com 7.993 cm³) × 86,05 mm (Wikipedia alemã) × 86,1 mm (Car and Driver).
- Faixa de torque: 2.200–5.500 rpm (ficha técnica Bugatti) × 2.200–5.000 rpm (comunicados de 2019 e 2025).
- Peso do motor: 490 kg (Bugatti 2015) × cerca de 400 kg (Bugatti 2022).

### Fontes

1. Bugatti W16 engine – the last of its kind (2022) — Bugatti Newsroom **(oficial)** — <https://newsroom.bugatti.com/api/en/press-releases/pdf/bugatti-w16-engine-the-last-of-its-kind>
2. The engineering genius behind the Bugatti Veyron — Bugatti Newsroom **(oficial)** — <https://newsroom.bugatti.com/en/press-releases/the-engineering-genius-behind-the-bugatti-veyron>
3. 407 km/h – a milestone in automotive history — Bugatti Newsroom **(oficial)** — <https://newsroom.bugatti.com/en/press-releases/407-kmh-a-milestone-in-automotive-history>
4. Final Bugatti Veyron 16.4 sold to a customer in Europe (2011) — Bugatti Newsroom **(oficial)** — <https://newsroom.bugatti.com/api/en/press-releases/pdf/final-bugatti-veyron-16-4-sold-to-a-customer-in-europe>
5. Geneva Motor Show 2015: Bugatti celebrates the Veyron — Bugatti Newsroom **(oficial)** — <https://newsroom.bugatti.com/api/en/press-releases/pdf/geneva-international-motor-show-2015>
6. The world's first twin-clutch gearbox with seven speeds (2004) — Bugatti Newsroom **(oficial)** — <https://newsroom.bugatti.com/api/en/press-releases/pdf/the-world-s-first-twin-clutch-gearbox-with-seven-speeds>
7. Bugatti Veyron 16.4 / Grand Sport – technical specifications (EU fact sheet) — Bugatti (hosted by The Bugatti Revue) **(oficial)** — <https://bugattirevue.com/revue73/centenaire/facts-EU.pdf>
8. Bugatti Veyron 16.4 road test data panel (Dec 2008) — Car and Driver — <https://www.manualshelf.com/manual/bugatti/16-bugatti-veyron-4/user-manual.html>
9. EB 16/4 Veyron – early Bugatti brochure data — The Bugatti Revue — <https://www.bugattirevue.com/revue16/16-4.htm>
10. Bugatti's W16 engine explained — WhichCar / Wheels — <https://www.whichcar.com.au/features/geek-speak-bugattis-lethal-w16>
11. Bugatti Veyron (used only as a pointer to primary sources) — Wikipedia — <https://en.wikipedia.org/wiki/Bugatti_Veyron>

## 2. Bugatti Chiron

**Versão escolhida:** Chiron cupê original (2016) · ano 2016 · Europa (km/h, 1.103 kW)

### Resumo (valores usados no simulador)

| Campo | Valor | Situação |
|---|---|---|
| Fabricante | Bugatti |  |
| Veículo | Chiron |  |
| Ano | 2016 |  |
| Motor / código | Bugatti W16 8.0 quad-turbo (geração Chiron) — W16 (código interno não publicado) |  |
| Arquitetura | W16: dois blocos VR8 de 15° a 90° |  |
| Cilindros | 16 |  |
| Cilindrada | 7.993 cm³ |  |
| Diâmetro × curso | 86,00 × 86,00 mm |  |
| Biela | 141,0 mm | Estimado |
| Aspiração | 4 turbos (sequenciais) |  |
| Pressão máxima | 1,85 bar | Fonte confiável |
| Potência | 1.500 PS / 1.103 kW / 1.479 hp a 6.700 rpm |  |
| Torque | 1.600 N·m a 2.000–6.000 rpm |  |
| Marcha lenta | 650 rpm | Fonte confiável |
| Faixa de rotação | 650–6.800 rpm |  |
| Faixa vermelha / corte | 6.700 / 6.800 rpm |  |
| Transmissão | DSG de dupla embreagem 7 marchas (Ricardo) |  |
| Marchas e relações | 7: 9,726 · 5,836 · 4,377 · 3,367 · 2,736 · 2,245 · 2,040 (relações totais) | Estimado |
| Aletas no volante | Sim |  |
| Velocidade máxima | 420 km/h (limitada) — Limitada eletronicamente a 420 km/h (modo Top Speed); 380 km/h nos demais modos |  |
| Tanque | 100 L — Tanque | Oficial |
| Combustível | Gasolina 98 RON |  |
| Posição do motor | Central-traseiro longitudinal |  |
| Ordem de ignição | Não confirmada (animação ilustrativa) | Não confirmado |
| Virabrequim | Virabrequim único, 8 moentes com 2 bielas cada; intervalos de ignição de 45° |  |
| Lubrificação | Cárter seco |  |
| Painel | Velocímetro analógico central até 500 km/h (250 km/h às 12 h), ladeado por duas telas TFT: à esquerda conta-giros digital em arco azul, à direita medidor de potência em tempo real; tela IPS menor abaixo. Fim de escala do conta-giros digital não publicado. |  |
| Traços visuais | W16 quase cúbico: carcaça de admissão prateada no topo com dois intercoolers ar-água, dutos de carbono, tubos polidos e quatro turbos 69% maiores lado a lado nas laterais. |  |

### Ficha verificada (painel ENGINE SPECS)

| Item | Valor | Situação | Fontes | Observação |
|---|---|---|---|---|
| Configuração | W16 — dois blocos VR8 a 90° | Oficial | [1] [3] |  |
| Cilindrada | 7.993 cm³ | Oficial | [2] |  |
| Diâmetro × curso | 86,0 × 86,0 mm | Fonte confiável | [11] | Bugatti não publica para o Chiron; coincide com a cilindrada oficial |
| Válvulas | 64 (4 por cilindro) | Oficial | [2] |  |
| Aspiração | 4 turbos em dois estágios: 2 ativos desde a lenta, os outros 2 entram a ≈ 3.800 rpm | Oficial | [1] [3] |  |
| Pressão de turbo | ≈ 1,85 bar | Fonte confiável | [9] | Não publicado pela Bugatti; valor de teste de imprensa |
| Potência | 1.500 PS (1.103 kW / 1.479 hp) a 6.700 rpm | Oficial | [2] |  |
| Torque | 1.600 N·m entre 2.000 e 6.000 rpm | Oficial | [1] [2] |  |
| Rotação máxima de troca | 6.700 rpm | Oficial | [2] [5] |  |
| Limitador (simulação) | 6.800 rpm | Estimado | [5] | Estimado a partir do Pur Sport (+200 rpm) |
| Marcha lenta | ≈ 650 rpm | Fonte confiável | [10] |  |
| Câmbio | DSG 7 marchas (Ricardo), aletas no volante | Oficial | [1] |  |
| Velocidade por marcha a 6.700 rpm | 90 · 150 · 200 · 260 · 320 · 390 km/h · 7ª limitada a 420 | Oficial | [2] |  |
| Relações | Não publicadas — relações totais derivadas das velocidades oficiais por marcha | Estimado | [2] |  |
| Injeção | Duplex, 32 injetores | Oficial | [3] |  |
| Intercooler | Ar-água, dois trocadores no motor | Oficial | [1] |  |
| Ordem de ignição | Não confirmada (Bugatti: “assimétrica”, intervalos de 45°) | Não confirmado | [3] |  |
| Lubrificação | Cárter seco | Fonte confiável | [11] |  |
| Velocidade máxima | 420 km/h (limitada) | Oficial | [1] [2] |  |
| 0–100 km/h | 2,4 s | Oficial | [2] |  |
| Tanque | 100 L | Oficial | [2] |  |
| Combustível | Super Plus 98 RON | Fonte confiável | [8] |  |
| Peso do motor | ≈ 400 kg | Oficial | [3] |  |
| Peso do veículo | 1.995 kg (DIN) | Oficial | [2] |  |

### Estimativas usadas pela simulação

- Relações de marcha individuais (derivadas das velocidades oficiais por marcha; 7ª estimada)
- Comprimento de biela (141 mm), limitador (6.800 rpm)
- Área frontal (≈ 2,1 m²) usada com o Cd oficial de 0,36
- Inércia rotativa e dinâmica dos turbos
- Ordem de ignição da animação (ilustrativa, intervalos oficiais de 45°)

### Versão, discrepâncias e decisões

- Chiron original 2016 (1.500 PS). Chiron Sport, Pur Sport e Super Sport não são misturados.
- 0–100 km/h: 2,4 s na ficha final × menos de 2,5 s na ficha preliminar de 2016.
- Turbos: a Bugatti descreve dois turbos do mesmo tamanho por lado em funcionamento sequencial; algumas reportagens falam em turbos de tamanhos diferentes.
- Rotação máxima de troca 6.700 rpm; o corte exato (6.700–6.800 rpm) não foi confirmado.
- Velocímetro de 500 km/h no carro europeu; os carros dos EUA usam escala em mph.

### Fontes

1. Geneva Motor Show 2016: Bugatti Chiron — world premiere (press kit) — Bugatti Newsroom **(oficial)** — <https://newsroom.bugatti.com/api/en/press-releases/pdf/geneva-international-motor-show-2016>
2. Bugatti Chiron — technical specifications (media kit) — Bugatti Newsroom **(oficial)** — <https://bugatti-newsroom.imgix.net/66703700d9bf8f4b7ce9211c/211122_BU_Chiron%20ENG.pdf>
3. Bugatti W16 engine – the last of its kind (2022) — Bugatti Newsroom **(oficial)** — <https://newsroom.bugatti.com/api/en/press-releases/pdf/bugatti-w16-engine-the-last-of-its-kind>
4. 0-400-0 km/h in 42 seconds: Bugatti Chiron sets world record (2017) — Bugatti Newsroom **(oficial)** — <https://newsroom.bugatti.com/api/en/press-releases/pdf/0-400-0-km-h-in-42-seconds-bugatti-chiron-sets-world-record>
5. Bugatti Chiron Pur Sport — a pure driving machine (2020) — Bugatti Newsroom **(oficial)** — <https://newsroom.bugatti.com/api/en/press-releases/pdf/bugatti-chiron-pur-sport-a-pure-driving-machine>
6. Bugatti press photo: Chiron instrument cluster (testing) — Bugatti Newsroom **(oficial)** — <https://bugatti-newsroom.imgix.net/b2999d0928154672b5312bca76515e07/07_bugatti_chiron_testing.jpg>
7. Bugatti press image: W16 engine and DSG powertrain (side view) — Bugatti Newsroom **(oficial)** — <https://bugatti-newsroom.imgix.net/702ba3c4297a44f294eaab118bb3c6c9/04_engine_sideview.png>
8. Bugatti Chiron — Technische Daten (preliminary data sheet, 2016-17) — Bugatti (hosted by The Bugatti Revue) — <https://www.bugattirevue.com/revue56/chiron-specs-de.pdf>
9. The 2017 Bugatti Chiron: a randomized hyper-review — The Drive — <https://www.thedrive.com/new-cars/8705/the-2018-bugatti-chiron-a-randomized-hyper-review-of-the-1500-hp-2-5-million-hypercar>
10. 2017 Bugatti Chiron first drive review — Motor Authority — <https://www.motorauthority.com/news/1109559_2017-bugatti-chiron-first-drive-review-the-king-of-the-exotics>
11. Bugatti W16 engine (used only as a pointer to primary sources) — Wikipedia — <https://en.wikipedia.org/wiki/Bugatti_W16_engine>

## 3. Nissan Skyline GT-R R34 V-spec

**Versão escolhida:** BNR34 (GF-BNR34), 1999–2002 · ano 1999 · Japão (JDM), V-spec, volante à direita

### Resumo (valores usados no simulador)

| Campo | Valor | Situação |
|---|---|---|
| Fabricante | Nissan |  |
| Veículo | Skyline GT-R R34 V-spec |  |
| Ano | 1999 |  |
| Motor / código | Nissan RB26DETT — RB26DETT |  |
| Arquitetura | 6 cilindros em linha |  |
| Cilindros | 6 |  |
| Cilindrada | 2.568 cm³ |  |
| Diâmetro × curso | 86,00 × 73,70 mm |  |
| Biela | 121,5 mm | Fonte confiável |
| Aspiração | 2 turbos (em paralelo) |  |
| Pressão máxima | 0,91 bar | Fonte confiável |
| Potência | 280 PS / 206 kW / 276 hp a 6.800 rpm |  |
| Torque | 392 N·m a 4.400 rpm |  |
| Marcha lenta | 900 rpm | Estimado |
| Faixa de rotação | 900–8.000 rpm |  |
| Faixa vermelha / corte | 8.000 / 8.000 rpm |  |
| Transmissão | Getrag 233 manual de 6 marchas |  |
| Marchas e relações | 6: 3,827 · 2,360 · 1,685 · 1,312 · 1,000 · 0,793 · final 3,545 | Fonte confiável |
| Aletas no volante | Não |  |
| Velocidade máxima | 180 km/h (limitada) — Limitador japonês de 180 km/h (acordo da indústria). Velocidade sem limitador não publicada pela Nissan. |  |
| Tanque | 65 L — Tanque | Fonte confiável |
| Combustível | Gasolina premium |  |
| Posição do motor | Dianteiro longitudinal |  |
| Ordem de ignição | 1-5-3-6-2-4 | Fonte confiável |
| Virabrequim | Seis em linha, moentes a 120° (pares 1/6, 2/5, 3/4), 7 mancais |  |
| Lubrificação | Cárter úmido |  |
| Painel | Painel analógico sob capuz: conta-giros grande no centro (0–10 ×1000, estimado), velocímetro de 180 km/h à esquerda (JDM), manômetro de turbo à direita, pequenos marcadores de combustível e temperatura. Fundos pretos, números brancos, ponteiros vermelho-alaranjados. MFD colorido de 5,8" no console central com leituras de turbo (até 1,2 bar), óleo, água, borboleta e tensão. |  |
| Traços visuais | Seis em linha longo, tampas de comando vermelhas enrugadas, cobertura das bobinas no meio, plenum com seis borboletas no lado da admissão e dois turbos no lado do escape. |  |

### Ficha verificada (painel ENGINE SPECS)

| Item | Valor | Situação | Fontes | Observação |
|---|---|---|---|---|
| Configuração | 6 cilindros em linha, DOHC 24V, biturbo com intercooler | Oficial | [1] [3] |  |
| Cilindrada | 2.568 cm³ | Oficial | [1] |  |
| Diâmetro × curso | 86,0 × 73,7 mm | Fonte confiável | [4] | Reproduz a cilindrada oficial (2.568,7 cm³) |
| Biela | 121,5 mm (centro a centro) | Fonte confiável | [9] | Comprimento de bielas de reposição com medida original; sem documento Nissan |
| Taxa de compressão | 8,5:1 | Fonte confiável | [3] |  |
| Aspiração | 2 turbos em paralelo (dianteiro: cil. 1–3, traseiro: 4–6), intercooler frontal | Fonte confiável | [3] [5] | A divisão 1–3 / 4–6 é o arranjo conhecido do RB26, não verificado em fonte primária |
| Pressão de turbo | ≈ 0,91 bar (685 mmHg) | Fonte confiável | [5] | Valor de revista, não publicado pela Nissan |
| Potência | 280 PS (206 kW / 276 hp) a 6.800 rpm | Oficial | [1] [3] | Limite voluntário japonês de 280 PS; a potência real é considerada maior |
| Torque | 392 N·m (40,0 kgfm) a 4.400 rpm | Oficial | [1] [3] |  |
| Marcha lenta | ≈ 900 rpm | Estimado |  | Não publicada; valor típico da família RB |
| Faixa vermelha / corte | ≈ 8.000 rpm | Estimado |  | Não publicados; estimados por fotos do painel |
| Ordem de ignição | 1-5-3-6-2-4 | Fonte confiável | [8] |  |
| Câmbio | Getrag 233, manual de 6 marchas | Fonte confiável | [3] [6] |  |
| Relações | 3,827 · 2,360 · 1,685 · 1,312 · 1,000 · 0,793 | Fonte confiável | [4] [7] |  |
| Ré | 3,240 | Estimado | [7] | Uma única listagem de fórum, não verificada |
| Relação final | 3,545 | Fonte confiável | [4] [7] |  |
| Tração | Integral ATTESA E-TS Pro, LSD traseiro ativo (V-spec) | Fonte confiável | [3] [6] |  |
| Pneus | 245/40 ZR18 (dianteiros e traseiros) | Oficial | [1] |  |
| Velocidade máxima | 180 km/h (limitador JDM) | Fonte confiável | [6] |  |
| Peso | 1.560 kg (V-spec) | Oficial | [1] [3] |  |
| Tanque | 65 L | Fonte confiável | [3] |  |
| Combustível | Gasolina sem chumbo premium | Fonte confiável | [3] |  |
| Lubrificação | Cárter úmido | Estimado |  | Arranjo conhecido do RB26; não verificado em fonte primária |
| Posição do motor | Dianteiro longitudinal | Fonte confiável | [3] |  |
| 0–100 km/h | Não confirmado | Não confirmado |  | A Nissan não publicou tempo de aceleração |

### Estimativas usadas pela simulação

- Marcha lenta (900 rpm), faixa vermelha e corte (8.000 rpm)
- Escala do conta-giros (10.000 rpm) e início da faixa vermelha no painel
- Relação de ré (3,240)
- Inércia rotativa, tempo de enchimento e rotação dos turbos
- Cd·A calibrado para ≈ 250 km/h sem limitador (a Nissan não publica)

### Versão, discrepâncias e decisões

- Versão escolhida: GT-R V-spec japonês de 1999. O V-spec II e o Nür (2002) não são misturados; o Nür tem velocímetro de 300 km/h.
- A página Heritage "Skyline GT-R (1999: BNR34)" é o carro de corrida JGTC (2.708 cm³, 500 PS) e não foi usada.
- Torque: 392 N·m oficial (40,0 kgfm); o JB Skyline cita 397 N·m, que não corresponde a 40,0 kgfm.
- Peso: 1.540 kg no GT-R padrão e 1.560 kg no V-spec (usado).

### Fontes

1. Skyline GT-R V-spec II (2000: BNR34) — Nissan Heritage Collection — Nissan Motor Co., Ltd. **(oficial)** — <https://www.nissan-global.com/EN/HERITAGE_COLLECTION/280_skyline_gt-r_v-spec_ii.html>
2. Nissan Heritage Collection — lista Skyline — Nissan Motor Co., Ltd. **(oficial)** — <https://www.nissan-global.com/EN/HERITAGE_COLLECTION/skyline.html>
3. Skyline GT-R V-spec GF-BNR34 (1999.01–2000.08) — ficha de catálogo — Gulliver (221616.com) — <https://221616.com/catalog/nissan/skyline/199805_200208/1501419/>
4. R34 GT-R Specifications — JB Skyline (referência de entusiastas) — <https://www.jbskyline.net/r34/gtr/specs/>
5. 日産RB26DETTをいまこそ振り返る (retrospectiva RB26DETT) — Best Car Web (Kodansha) — <https://bestcarweb.jp/feature/column/390620?prd=2>
6. Nissan Skyline GT-R (usado como ponteiro) — Wikipedia — <https://en.wikipedia.org/wiki/Nissan_Skyline_GT-R>
7. R34 gearbox / diff ratios (fórum) — SAU (Skylines Australia) — <https://sau.com.au/forums/topic/480711-r34-gearbox-diff-ratios>
8. RB20/25/26 Engine (base de conhecimento ECU) — Haltech — <https://support.haltech.com/portal/en/kb/articles/rb-engine>
9. Brian Crower RB26DETT rods 4.783 in / 121,5 mm (comprimento original) — Real Street Performance / Brian Crower — <https://www.realstreetperformance.com/brian-crower-625-h-beam-rods-skyline-rb26dett-r32-r33-r34.html>
10. Nismo Heritage Parts reproduz o painel do R34 GT-R — paultan.org — <https://paultan.org/2022/08/24/gismo-heritage-parts-r34-skyline-gtr/>
11. NISMO reproduces Silvia S15 and Skyline R34 gauge clusters — Japanese Nostalgic Car — <https://japanesenostalgiccar.com/nismo-reproduction-silvia-s15-and-skyline-r34-gauge-clusters>
12. Nissan reproducing NISMO gauges for Skyline GT-R, Silvia — AutoIndustriya — <https://www.autoindustriya.com/auto-industry-news/nissan-reproducing-nismo-gauges-for-skyline-gt-r-silvia.html>

## 4. BMW M5 E60

**Versão escolhida:** E60 sedã (4ª geração do M5), 2005–2010 · ano 2005 · Europa (UK/UE, EU4), SMG III com aletas

### Resumo (valores usados no simulador)

| Campo | Valor | Situação |
|---|---|---|
| Fabricante | BMW |  |
| Veículo | M5 E60 |  |
| Ano | 2005 |  |
| Motor / código | BMW M S85 5.0 V10 — S85B50 |  |
| Arquitetura | V10 a 90° |  |
| Cilindros | 10 |  |
| Cilindrada | 4.999 cm³ |  |
| Diâmetro × curso | 92,00 × 75,20 mm |  |
| Biela | 140,7 mm | Oficial |
| Aspiração | Aspirado (sem turbo nem compressor) |  |
| Pressão máxima | — |  |
| Potência | 507 PS / 373 kW / 500 hp a 7.750 rpm |  |
| Torque | 520 N·m a 6.100 rpm |  |
| Marcha lenta | 800 rpm | Estimado |
| Faixa de rotação | 800–8.250 rpm |  |
| Faixa vermelha / corte | 8.250 / 8.250 rpm |  |
| Transmissão | SMG III Getrag 247, 7 marchas sequencial automatizado (Drivelogic) |  |
| Marchas e relações | 7: 3,985 · 2,652 · 1,806 · 1,392 · 1,159 · 1,000 · 0,833 · final 3,620 | Oficial |
| Aletas no volante | Sim |  |
| Velocidade máxima | 250 km/h (limitada) — Limitada eletronicamente a 250 km/h. Fontes secundárias citam 305 km/h com o M Driver’s Package (não confirmado pela BMW). |  |
| Tanque | 70 L — Tanque | Oficial |
| Combustível | Gasolina 98 RON |  |
| Posição do motor | Dianteiro longitudinal |  |
| Ordem de ignição | 1-6-5-10-2-7-3-8-4-9 | Oficial |
| Virabrequim | Aço forjado 42CrMo4, 6 mancais, 5 moentes comuns a 72° com duas bielas cada (ignição irregular 90°/54°) |  |
| Lubrificação | Cárter quase seco, duas bombas elétricas de retorno |  |
| Painel | Dois mostradores redondos de fundo preto com números brancos e ponteiros vermelhos M, anel "corona" branco. Velocímetro à esquerda (330 km/h, estimado) com combustível embaixo; conta-giros à direita (9.000 rpm, estimado) com campo de pré-aviso amarelo/vermelho móvel conforme a temperatura do óleo e marcador de temperatura do óleo embaixo; no centro, LCD com nível de óleo e indicador de marcha/programa SMG. Luzes de troca só no Head-Up Display (M-view). |  |
| Traços visuais | V10 a 90° longo e estreito, cobertura preta em duas peças com logotipos M e V10, dez borboletas individuais, coletores 5-em-1 em aço inox fora de cada bancada. |  |

### Ficha verificada (painel ENGINE SPECS)

| Item | Valor | Situação | Fontes | Observação |
|---|---|---|---|---|
| Configuração | V10 a 90°, bloco de alumínio com bedplate, offset de bancadas 17 mm, espaçamento 98 mm | Oficial | [1] [3] |  |
| Cilindrada | 4.999 cm³ | Oficial | [1] [2] |  |
| Diâmetro × curso | 92,0 × 75,2 mm | Oficial | [1] [2] |  |
| Biela | 140,7 mm, aço 70MnVS4 fraturada | Oficial | [3] |  |
| Taxa de compressão | 12,0:1 | Oficial | [2] [3] |  |
| Válvulas | 40 (4 por cilindro), duplo VANOS de alta pressão | Oficial | [1] [3] |  |
| Aspiração | Aspirado (sem turbo nem compressor) | Oficial | [3] |  |
| Potência | 507 PS (373 kW / 500 hp) a 7.750 rpm | Oficial | [1] [2] | Parte em P400 (400 PS); o botão POWER libera P500 |
| Torque | 520 N·m a 6.100 rpm (450 N·m a partir de 3.500 rpm) | Oficial | [1] [2] [3] |  |
| Rotação máxima | 8.250 rpm (corte) | Oficial | [1] [3] |  |
| Marcha lenta | ≈ 800 rpm | Estimado |  | Não publicada pela BMW |
| Ordem de ignição | 1-6-5-10-2-7-3-8-4-9 | Oficial | [1] |  |
| Virabrequim | 5 moentes comuns a 72°, 2 bielas por moente, 6 mancais | Oficial | [3] [1] | Intervalos de ignição 90°/54° derivados (não declarados pela BMW) |
| Lubrificação | Cárter quase seco, duas bombas elétricas de retorno | Oficial | [1] [3] |  |
| Câmbio | SMG III Getrag 247, 7 marchas, aletas no volante | Oficial | [1] [4] |  |
| Relações | 3,985 · 2,652 · 1,806 · 1,392 · 1,159 · 1,000 · 0,833 | Oficial | [1] [2] |  |
| Ré | 3,985 | Oficial | [1] [2] |  |
| Relação final | 3,62 | Oficial | [2] |  |
| Pneus | 255/40 ZR19 dianteiros, 285/35 ZR19 traseiros | Oficial | [1] [2] |  |
| Velocidade máxima | 250 km/h (limitada) | Oficial | [1] [2] |  |
| 0–100 km/h | 4,7 s | Oficial | [2] | ST505 cita 4,6 s |
| Peso | 1.830 kg (UE, com 75 kg de motorista e bagagem) | Oficial | [2] [1] | DIN: 1.755 kg |
| Peso do motor | 240 kg | Oficial | [1] [3] |  |
| Tanque | 70 L | Oficial | [1] [2] |  |
| Combustível | Gasolina premium 98 RON | Oficial | [2] |  |
| Painel | Velocímetro 330 km/h e conta-giros 9.000 rpm | Estimado | [5] [7] | Final das escalas não confirmado pela BMW |

### Estimativas usadas pela simulação

- Marcha lenta (800 rpm)
- Final das escalas do painel (330 km/h, 9.000 rpm)
- Intervalos de ignição 90°/54°, derivados dos moentes comuns a 72° e do V a 90°
- Inércia rotativa e eficiência da transmissão
- Cd·A calibrado para ≈ 305 km/h sem limitador (fonte secundária)

### Versão, discrepâncias e decisões

- Simulação usa o modo P500 (507 PS); o carro parte em P400 (400 PS).
- O motor não é split-pin: a BMW descreve cinco moentes a 72° com duas bielas cada, o que dá ignição irregular.
- 0–100 km/h: 4,7 s na ficha do Reino Unido × 4,6 s no manual ST505.
- Peso: 1.830 kg pela norma UE (com 75 kg de motorista e bagagem) × 1.755 kg DIN.

### Fontes

1. BMW Technical Training ST505 — E60 M5 Complete Vehicle (S85B50, MS S65, SMG 3) — BMW Group (arquivado em archive.org) **(oficial)** — <https://ia600902.us.archive.org/26/items/BMWTechnicalTrainingDocuments/ST505%20E60%20M5%20Complete%20Vehicle/E60_M5_Complete_Vehicle.pdf>
2. The new BMW M5 — 10. Technical specifications (Media information 05/2005) — BMW Group PressClub UK **(oficial)** — <https://www.press.bmwgroup.com/united-kingdom/article/attachment/T0013049EN_GB/29973>
3. The new BMW M5 — 2. Heart of pure gold: the new V10 engine — BMW Group PressClub UK **(oficial)** — <https://www.press.bmwgroup.com/united-kingdom/article/attachment/T0013049EN_GB/29967>
4. The new BMW M5 — 3. New seven-speed transmission (SMG III) — BMW Group PressClub UK **(oficial)** — <https://www.press.bmwgroup.com/united-kingdom/article/attachment/T0013049EN_GB/29968>
5. The new BMW M5 — 5. Exterior, interior and equipment — BMW Group PressClub UK **(oficial)** — <https://www.press.bmwgroup.com/united-kingdom/article/attachment/T0013049EN_GB/29969>
6. The new BMW M5 — 8. Standard equipment — BMW Group PressClub UK **(oficial)** — <https://www.press.bmwgroup.com/united-kingdom/article/attachment/T0013049EN_GB/29971>
7. BMW Technical Training ST402 — E6x Driver Information Systems — BMW Group (arquivado em archive.org) **(oficial)** — <https://ia801005.us.archive.org/11/items/BMWTechnicalTrainingDocuments/ST402%20Body%20Electronics%20III/09%20E6x%20Driver%20Information.pdf>

## 5. Dodge / SRT Challenger SRT Hellcat

**Versão escolhida:** 3ª geração (plataforma LC), reestilização 2015 · ano 2015 · EUA, ano-modelo 2015, TorqueFlite 8 marchas com aletas

### Resumo (valores usados no simulador)

| Campo | Valor | Situação |
|---|---|---|
| Fabricante | Dodge / SRT |  |
| Veículo | Challenger SRT Hellcat |  |
| Ano | 2015 |  |
| Motor / código | Supercharged 6.2-liter HEMI Hellcat V8 — Não confirmado (FCA usa só o nome) |  |
| Arquitetura | V8 a 90° |  |
| Cilindros | 8 |  |
| Cilindrada | 6.166 cm³ |  |
| Diâmetro × curso | 103,90 × 90,90 mm |  |
| Biela | 158,6 mm | Estimado |
| Aspiração | Compressor twin-screw de 2,38 L, acionamento 2,36:1 |  |
| Pressão máxima | 0,80 bar | Oficial |
| Potência | 717 PS / 527 kW / 707 hp a 6.000 rpm |  |
| Torque | 881 N·m a 4.800 rpm |  |
| Marcha lenta | 650 rpm | Estimado |
| Faixa de rotação | 650–6.200 rpm |  |
| Faixa vermelha / corte | 6.200 / 6.200 rpm |  |
| Transmissão | TorqueFlite 8HP90 automática de 8 marchas |  |
| Marchas e relações | 8: 4,710 · 3,140 · 2,100 · 1,670 · 1,290 · 1,000 · 0,840 · 0,670 · final 2,620 | Oficial |
| Aletas no volante | Sim |  |
| Velocidade máxima | 320 km/h — 199 mph (320 km/h) declarados pela Dodge segundo a imprensa; não confirmado se há limitador. |  |
| Tanque | 70 L — Tanque | Oficial |
| Combustível | Gasolina premium 91 AKI |  |
| Posição do motor | Dianteiro longitudinal |  |
| Ordem de ignição | 1-8-4-3-6-5-7-2 | Fonte confiável |
| Virabrequim | Cruzado (moentes a 90°), aço forjado com superfícies temperadas por indução |  |
| Lubrificação | Cárter úmido, 8 jatos de óleo nos pistões |  |
| Painel | Dois mostradores redondos côncavos com ponteiros de cubo coberto, inspirados no painel "tic-toc-tach" de 1971, em moldura de alumínio estampado, com TFT central de 7". Grafismo "Dark Radar Red" exclusivo do Hellcat. Velocímetro até 200 mph (oficial) e conta-giros até 7.000 rpm (teste de imprensa). Posição esquerda/direita dos mostradores não verificada. |  |
| Traços visuais | HEMI V8 com bloco laranja, compressor twin-screw preto de 2,38 L dominando o vale, borboleta à frente do compressor e polia própria na correia. |  |

### Ficha verificada (painel ENGINE SPECS)

| Item | Valor | Situação | Fontes | Observação |
|---|---|---|---|---|
| Configuração | V8 a 90°, comando no bloco (OHV), 2 válvulas por cilindro | Fonte confiável | [7] |  |
| Cilindrada | 6.166 cm³ (370 pol³) | Fonte confiável | [7] | Reproduz a cilindrada calculada a partir de 103,9 × 90,9 mm |
| Diâmetro × curso | 103,9 × 90,9 mm | Fonte confiável | [7] |  |
| Taxa de compressão | 9,5:1 | Fonte confiável | [7] |  |
| Compressor | Twin-screw de 2,38 L/rev, relação de acionamento 2,36:1, máx. 14.600 rpm, intercoolers integrados | Oficial | [1] |  |
| Pressão do compressor | 0,80 bar (80 kPa / 11,6 psi) | Oficial | [1] [6] |  |
| Potência | 707 hp SAE (527 kW / 717 PS) a 6.000 rpm | Oficial | [1] [5] | Rotação da potência máxima: ficha técnica reproduzida (reputable). A chave preta limita a 500 hp |
| Torque | 650 lb-ft (881 N·m) a 4.800 rpm | Oficial | [1] [5] | Rotação do torque máximo: ficha técnica reproduzida (reputable) |
| Rotação máxima | 6.200 rpm | Fonte confiável | [7] |  |
| Marcha lenta | ≈ 650 rpm | Estimado |  | Não publicada pela FCA |
| Ordem de ignição | 1-8-4-3-6-5-7-2 | Fonte confiável | [11] | Ordem padrão do HEMI de 3ª geração; não confirmada em documento FCA |
| Câmbio | TorqueFlite 8HP90, 8 marchas, aletas no volante | Oficial | [1] [7] |  |
| Relações | 4,71 · 3,14 · 2,10 · 1,67 · 1,29 · 1,00 · 0,84 · 0,67 | Oficial | [1] |  |
| Ré | 3,30 | Oficial | [1] |  |
| Relação final | 2,62 | Oficial | [1] |  |
| Pneus | 275/40 ZR20 (dianteiros e traseiros) | Oficial | [2] [3] |  |
| Velocidade máxima | 199 mph (320 km/h) declarados | Fonte confiável | [9] [8] |  |
| 1/4 de milha | 11,2 s a 125 mph (pneus de série) | Oficial | [3] |  |
| 0–100 km/h | Não confirmado | Não confirmado |  | A FCA publicou apenas o tempo de 1/4 de milha |
| Peso | ≈ 2.014 kg (4.439 lb, automático) | Fonte confiável | [8] |  |
| Tanque | 70 L (18,5 galões) | Oficial | [6] |  |
| Combustível | Gasolina premium 91 octanas (AKI) | Fonte confiável | [7] |  |
| Lubrificação | Cárter úmido, 8 jatos de óleo nos pistões | Oficial | [1] | "Cárter úmido" é inferido (nenhum cárter seco é mencionado) |
| Biela | Não confirmado | Não confirmado |  | A FCA só informa bielas forjadas em pó; a simulação usa 158,6 mm (estimado) |

### Estimativas usadas pela simulação

- Marcha lenta (650 rpm)
- Comprimento de biela (158,6 mm)
- Início da faixa vermelha no painel (6.200 rpm)
- Inércia rotativa e eficiência da transmissão
- Cd·A calibrado para 320 km/h com 527 kW

### Versão, discrepâncias e decisões

- Configuração com câmbio automático de 8 marchas. O manual Tremec TR-6060 não tem relações oficiais confirmadas e não foi usado.
- Dados de diâmetro, curso, compressão e rotações vêm de uma reprodução da ficha FCA do Charger SRT Hellcat 2015 (mesmo motor); por isso aparecem como "reputable".
- Torque a 4.800 rpm (ficha FCA reproduzida) × 4.000 rpm (resumo da AP); 4.800 rpm usado.
- O peso de 4.575 lb da ficha reproduzida é do Charger (4 portas) e não foi usado.
- O código do motor (frequentemente citado como ESD) não foi confirmado pela FCA.

### Fontes

1. New Supercharged 6.2-liter HEMI with 707 Horsepower… (2015 Challenger SRT press kit, engenharia) — FCA US / Stellantis North America Media **(oficial)** — <https://media.stellantisnorthamerica.com/newsrelease.do?id=15663>
2. Press Kit: 2015 Dodge Challenger SRT — Dodge Unleashes Most Powerful Muscle Car Ever — FCA US / Stellantis North America Media **(oficial)** — <https://media.stellantisnorthamerica.com/newsrelease.do?id=15825>
3. 2015 Dodge Challenger SRT Hellcat: 1/4 de milha em 11,2 s — FCA US / Stellantis North America Media **(oficial)** — <https://media.stellantisnorthamerica.com/newsrelease.do?id=15790>
4. The Beast is Unleashed: 2015 Dodge Challenger SRT Hellcat On Way To Dealerships — FCA US / Stellantis North America Media **(oficial)** — <https://media.stellantisnorthamerica.com/newsrelease.do?id=16204>
5. Dodge Challenger SRT Hellcat Is The Most Powerful Muscle Car Ever — 707 hp! — FCA US / Stellantis North America Media **(oficial)** — <https://media.stellantisnorthamerica.com/newsrelease.do?id=15779>
6. 2015 Dodge Challenger SRT by the numbers — FCA US / Stellantis North America (blog) **(oficial)** — <https://blog.stellantisnorthamerica.com/2014/05/23/2015-dodge-challenger-srt-by-the-numbers/>
7. 2015 Dodge Charger SRT Hellcat — reprodução da ficha técnica FCA (mesmo motor) — Motortopia — <https://www.motortopia.com/?p=63385>
8. Fact sheet: 2015 Dodge Challenger SRT Hellcat — Associated Press via Fox Business — <https://www.foxbusiness.com/markets/fact-sheet-2015-dodge-challenger-srt-hellcat>
9. 2015 Dodge Challenger SRT Hellcat Test Drive — Fox News Autos — <https://www.foxnews.com/auto/2015-dodge-challenger-srt-hellcat-test-drive.amp>
10. Hades: Dodge Unleashes 707-Horse Challenger Hellcat — Test Drive — Consumer Guide Automotive — <https://blog.consumerguide.com/hades-dodge-unleashes-707-horse-challenger-hellcat-test-drive/>
11. Dodge 6.2L firing order — ReRev — <https://rerev.com/firing-orders/dodge/6-2l/>

## 6. Chevrolet Performance ZZ632/1000 Deluxe — Crate Engine / Performance Build

**Versão escolhida:** Big-block Gen VI, bloco tall deck · ano 2022 · EUA — Crate Engine / Performance Build (uso off-road / competição), P/N 19432060

### Resumo (valores usados no simulador)

| Campo | Valor | Situação |
|---|---|---|
| Fabricante | Chevrolet Performance |  |
| Veículo | ZZ632/1000 Deluxe (motor de caixa, sem carro de produção) |  |
| Ano | 2022 |  |
| Motor / código | ZZ632/1000 Deluxe Big-Block V8 — P/N 19432060 (lançamento: 19432058) |  |
| Arquitetura | V8 a 90° |  |
| Cilindros | 8 |  |
| Cilindrada | 10.348 cm³ |  |
| Diâmetro × curso | 116,84 × 120,65 mm |  |
| Biela | 166,0 mm | Estimado |
| Aspiração | Aspirado (sem turbo nem compressor) |  |
| Pressão máxima | — |  |
| Potência | 1.018 PS / 748,7 kW / 1.004 hp a 6.600 rpm |  |
| Torque | 1.188 N·m a 5.600 rpm |  |
| Marcha lenta | 1.050 rpm | Oficial |
| Faixa de rotação | 1.050–7.000 rpm |  |
| Faixa vermelha / corte | 7.000 / 7.000 rpm |  |
| Transmissão | Não se aplica (vendido sem câmbio) |  |
| Marchas e relações | — |  |
| Aletas no volante | — |  |
| Velocidade máxima | Não se aplica |  |
| Tanque | 30 L — Célula de combustível de bancada | Estimado |
| Combustível | Gasolina premium 93 (R+M)/2, máx. E10 |  |
| Posição do motor | Motor de bancada |  |
| Ordem de ignição | 1-8-7-2-6-5-4-3 | Oficial |
| Virabrequim | Cruzado (V8 de ignição regular), aço forjado 4340, balanceamento interno |  |
| Lubrificação | Cárter úmido de 8 qt com defletor |  |
| Painel | NÃO OFICIAL: motor de caixa sem painel de fábrica. Painel digital genérico de bancada/dinamômetro: barra de rotação até 8.000 rpm com faixa vermelha a partir de 7.000 (máxima recomendada pela Chevrolet), luzes de troca, AFR/lambda, MAP em kPa, temperatura da água, pressão de óleo e de combustível, tensão e TPS. Cores: fundo preto, laranja Chevrolet Performance e vermelho na faixa de 7.000+. |  |
| Traços visuais | Big-block V8 laranja com tampas de válvulas "632", coletor de admissão alto de alumínio, filtro de ar redondo e suporte de motor (não vai instalado em carro de série). |  |

### Ficha verificada (painel ENGINE SPECS)

| Item | Valor | Situação | Fontes | Observação |
|---|---|---|---|---|
| Tipo | Crate Engine / Performance Build — não pertence a carro de série | Oficial | [1] [2] |  |
| Configuração | V8 big-block, comando no bloco (OHV), 2 válvulas por cilindro | Oficial | [1] [2] |  |
| Ângulo entre bancadas | 90° | Estimado |  | Não declarado nos documentos do ZZ632; todos os big-block Chevrolet são V8 a 90° |
| Cilindrada | 10.348 cm³ (632 pol³) | Oficial | [1] [2] |  |
| Diâmetro × curso | 116,84 × 120,65 mm (4,600 × 4,750 pol) | Oficial | [1] [2] [3] |  |
| Taxa de compressão | 12,0:1 | Oficial | [1] [3] |  |
| Comando | Rolete hidráulico em aço tarugo, balancins 1,8:1, corrente dupla | Oficial | [2] [3] |  |
| Válvulas | Titânio, 2,450 pol admissão / 1,800 pol escape | Oficial | [2] [3] |  |
| Aspiração | Aspirado (sem turbo nem compressor) | Oficial | [1] |  |
| Potência | 1.004 hp (748,7 kW / 1.018 PS) a 6.600 rpm | Oficial | [1] [2] | Com gasolina 93 octanas e a calibração da ECU incluída |
| Torque | 876 lb-ft (1.188 N·m) a 5.600 rpm | Oficial | [1] [2] |  |
| Rotação máxima recomendada | 7.000 rpm | Oficial | [1] [2] [3] |  |
| Marcha lenta | ≈ 1.050 rpm | Oficial | [3] |  |
| Ordem de ignição | 1-8-7-2-6-5-4-3 | Oficial | [3] | Ordem estilo LS, não a 1-8-4-3-6-5-7-2 tradicional dos big-block |
| Virabrequim | Aço forjado 4340, balanceamento interno | Oficial | [2] [3] | Geometria cruzada inferida pela ordem de ignição |
| Lubrificação | Cárter úmido de 8 qt com defletor | Oficial | [2] [3] |  |
| Combustível | Gasolina premium, mín. 93 (R+M)/2, máx. 10% de etanol | Oficial | [2] [3] |  |
| Biela | Não confirmado (aço forjado 4340 H-beam) | Não confirmado | [3] | Comprimento não publicado; a simulação usa 166 mm (estimado) |
| Veículos de demonstração | Silverado 1989 "Development Dually" (4L85-E) e Chevelle SS 1969 de oficina parceira | Oficial | [4] [5] | Sem dados de relação final, pneus ou peso publicados; por isso não há modo de condução |
| Câmbio, velocidade, tanque | Não se aplica / não confirmado | Não confirmado |  | O motor é vendido sem câmbio e sem veículo |

### Estimativas usadas pela simulação

- Célula de combustível de bancada de 30 L (simulação; não há tanque de veículo)
- Comprimento de biela (166 mm)
- Corte de rotação a 7.000 rpm (a Chevrolet publica só a máxima recomendada)
- Painel digital de bancada (não oficial) e escala de 8.000 rpm
- Inércia rotativa

### Versão, discrepâncias e decisões

- Sem veículo de produção: disponíveis apenas os modos Neutro e Dinamômetro.
- A ordem de ignição oficial 1-8-7-2-6-5-4-3 corrige a ordem big-block tradicional citada no briefing.
- O part number do briefing (19433031) não aparece em nenhum documento Chevrolet; o atual é 19432060 (lançamento 19432058).
- Cilindrada: 10.348 cm³ (comunicado) × 631,5 pol³ / 10,35 L (guia de instalação).

### Fontes

1. Chevrolet Performance Unveils Its Largest, Most Powerful Crate Engine Ever (20/10/2021) — General Motors (GM Newsroom) **(oficial)** — <https://news.gm.com/home.detail.html/Pages/news/us/en/2021/oct/1020-crate.html>
2. 632 Big-Block Crate Engine — ZZ632/1000 Deluxe (especificações) — Chevrolet Performance Parts **(oficial)** — <https://www.chevrolet.com/performance-parts/crate-engines/big-block-engines/632-engine>
3. ZZ632 Deluxe Engine Specifications / Installation Instructions (P/N 19432058) — Chevrolet Performance (GM) **(oficial)** — <https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/performance/resources/installation-guides/crate-engines/02-pdf/ZZ632-Deluxe-Engine-Installation-Sheet-Guide.pdf>
4. 1989 Silverado Concept (Development Dually) — galeria da página do motor 632 — Chevrolet (GM) **(oficial)** — <https://www.chevrolet.com/content/experience-fragments/chevrolet/na/us/en/index/performance/powertrain/engines/new/big-block/632-engine/gallery_silverado/modal/master.html>
5. 1969 Chevelle SS (montagem Mile High Muscle) — galeria da página do motor 632 — Chevrolet (GM) **(oficial)** — <https://www.chevrolet.com/content/experience-fragments/chevrolet/na/us/en/index/performance/powertrain/engines/new/big-block/632-engine/gallery_chevelle/gallery-modal/master.html>

## 7. Ferrari 458 Italia

**Versão escolhida:** 458 Italia cupê (2009–2015) · ano 2010 · Europa (CV, homologação ECE+EUDC)

### Resumo (valores usados no simulador)

| Campo | Valor | Situação |
|---|---|---|
| Fabricante | Ferrari |  |
| Veículo | 458 Italia |  |
| Ano | 2010 |  |
| Motor / código | Ferrari F136 4.5 V8 — F136 FB |  |
| Arquitetura | V8 a 90° |  |
| Cilindros | 8 |  |
| Cilindrada | 4.497 cm³ |  |
| Diâmetro × curso | 94,00 × 81,00 mm |  |
| Biela | 140,0 mm | Estimado |
| Aspiração | Aspirado (sem turbo nem compressor) |  |
| Pressão máxima | — |  |
| Potência | 570 PS / 419 kW / 562 hp a 9.000 rpm |  |
| Torque | 540 N·m a 6.000 rpm |  |
| Marcha lenta | 1.000 rpm | Estimado |
| Faixa de rotação | 1.000–9.000 rpm |  |
| Faixa vermelha / corte | 9.000 / 9.000 rpm |  |
| Transmissão | F1 de dupla embreagem 7 marchas (Getrag 7DCL750) com E-Diff 3 |  |
| Marchas e relações | 7: 3,080 · 2,190 · 1,630 · 1,290 · 1,030 · 0,840 · 0,690 · final 5,140 | Fonte confiável |
| Aletas no volante | Sim |  |
| Velocidade máxima | 325 km/h — Oficial: mais de 325 km/h, atingida em 7ª marcha (sem limitador publicado). |  |
| Tanque | 86 L — Tanque | Fonte confiável |
| Combustível | Gasolina sem chumbo |  |
| Posição do motor | Central-traseiro longitudinal |  |
| Ordem de ignição | Não confirmada (animação: 1-8-3-6-4-5-2-7, relato não confirmado) | Não confirmado |
| Virabrequim | Plano (180°), virabrequim "flat-plane" |  |
| Lubrificação | Cárter seco com recuperação em vários estágios |  |
| Painel | Conta-giros analógico central 0–10 (×1000) com faixa vermelha a partir de 9.000 rpm e indicador de marcha digital; fundo amarelo (opcional na época, muito comum). TFT esquerda: combustível, temperaturas de água e óleo, pressão de óleo, computador de bordo e manettino. TFT direita: velocímetro digital (padrão) e infotenimento. LEDs de troca no aro do volante eram opcionais. Escala do velocímetro virtual não publicada (340 km/h usado). |  |
| Traços visuais | V8 a 90° de virabrequim plano: um plenum vermelho enrugado com a inscrição Ferrari sobre cada bancada, seção central de alumínio aletada com as válvulas de geometria variável, coletores tubulares de inox e motor visível sob o vidro traseiro. |  |

### Ficha verificada (painel ENGINE SPECS)

| Item | Valor | Situação | Fontes | Observação |
|---|---|---|---|---|
| Configuração | V8 a 90°, 4 comandos, 32 válvulas, comando variável na admissão e no escape | Oficial | [1] | 32 válvulas e DOHC: fontes secundárias |
| Cilindrada | 4.497 cm³ | Oficial | [1] | Comunicado de 2009 e AMS citam 4.499 cm³ |
| Diâmetro × curso | 94,0 × 81,0 mm | Fonte confiável | [5] [2] | Reproduz 4.497 cm³ |
| Taxa de compressão | 12,5:1 | Oficial | [1] [3] |  |
| Injeção | Direta (GDI) com injeção dividida, 200 bar | Oficial | [1] |  |
| Aspiração | Aspirado, coletor de geometria variável | Oficial | [1] |  |
| Potência | 570 CV (419 kW / 562 hp) a 9.000 rpm | Oficial | [1] [3] | Inclui 5 CV de efeito de ar dinâmico |
| Torque | 540 N·m a 6.000 rpm (mais de 80% a partir de 3.250 rpm) | Oficial | [1] [3] |  |
| Rotação máxima | 9.000 rpm | Oficial | [1] |  |
| Marcha lenta | ≈ 1.000 rpm | Estimado |  | Não publicada pela Ferrari |
| Virabrequim | Plano (flat-plane) | Fonte confiável | [8] [5] |  |
| Ordem de ignição | 1-8-3-6-4-5-2-7 (relatada em fórum) | Não confirmado | [10] | Numeração Ferrari "desce a direita, sobe a esquerda"; usada só na animação |
| Lubrificação | Cárter seco com recuperação em vários estágios | Oficial | [1] [5] |  |
| Câmbio | F1 de dupla embreagem, 7 marchas, aletas | Oficial | [1] |  |
| Relações | 3,08 · 2,19 · 1,63 · 1,29 · 1,03 · 0,84 · 0,69 | Fonte confiável | [3] | Wikipedia cita 2,18 para a 2ª |
| Ré / final | 2,79 / 5,14 | Fonte confiável | [3] |  |
| Pneus | 235/35 ZR20 dianteiros, 295/35 ZR20 traseiros | Oficial | [1] [3] |  |
| Velocidade máxima | Mais de 325 km/h | Oficial | [1] |  |
| 0–100 km/h | Menos de 3,4 s | Oficial | [1] |  |
| Peso | Seco: 1.380 kg (com opcionais) | Oficial | [1] | Peso em ordem de marcha não confirmado; simulação usa 1.485 kg (estimado) |
| Tanque | 86 L | Fonte confiável | [9] |  |
| Combustível | Gasolina sem chumbo | Oficial | [1] | Octanagem não confirmada |
| Posição do motor | Central-traseiro longitudinal | Oficial | [1] [3] |  |

### Estimativas usadas pela simulação

- Marcha lenta (1.000 rpm)
- Comprimento de biela (140 mm)
- Massa de simulação (1.485 kg) a partir do peso seco oficial
- Ordem de ignição da animação (relato de fórum, não confirmado)
- Escala do velocímetro virtual (340 km/h)
- Cd·A calibrado para 325 km/h com 419 kW

### Versão, discrepâncias e decisões

- A cor do fundo do conta-giros era opcional (amarelo, vermelho ou branco); o amarelo é usado aqui.
- O 458 Speciale (605 CV) e o 458 Spider não foram misturados.
- Cilindrada: 4.497 cm³ (ferrari.com) × 4.499 cm³ (comunicado de 2009 e auto motor und sport).
- Potência em kW: 419 (Ferrari, AMS) × 425 em uma reprodução de comunicado (provável erro).
- O velocímetro digital fica na TFT direita (o briefing indicava a esquerda); os LEDs de troca no volante eram opcionais.

### Fontes

1. Ferrari 458 Italia — página oficial com ficha técnica — Ferrari S.p.A. **(oficial)** — <https://www.ferrari.com/en-US/auto/458-italia>
2. Ferrari 458 Italia — General data (compilação dos comunicados Ferrari de 2009) — Mitorosso.com — <https://mitorosso.com/?p=1864>
3. Ferrari 458 Italia im Test: Technische Daten — auto motor und sport — <https://www.auto-motor-und-sport.de/test/ferrari-458-italia-im-test-ein-rennwagen-der-auch-alltag-kann/technische-daten/>
4. Ferrari 458 (usado como ponteiro) — Wikipedia — <https://en.wikipedia.org/wiki/Ferrari_458>
5. Ferrari F136 engine (usado como ponteiro) — Wikipedia — <https://en.wikipedia.org/wiki/Ferrari_F136_engine>
6. Ferrari 458 Coupe (2010-2016) interior, tech and comfort — Parkers — <https://www.parkers.co.uk/ferrari/458/review/interior/>
7. Ferrari 458 Italia interior details (reprodução do comunicado Ferrari de 2009) — Carscoops — <https://www.carscoops.com/?p=183403>
8. Ferrari officially announces the 458 Italia (reprodução do comunicado) — Automotive Addicts — <https://www.automotiveaddicts.com/5830/ferrari-officially-announces-the-458-italia>
9. Ferrari 458 Italia 2dr Auto — specifications — Top Gear — <https://www.topgear.com/car-reviews/ferrari/italia-2dr-auto/spec>
10. 458 Engine Bank 1 and Bank 2 (fórum) — FerrariChat — <https://www.ferrarichat.com/forum/threads/458-engine-bank-1-and-bank-2.644205>

## 8. Ferrari 812 Superfast

**Versão escolhida:** 812 Superfast cupê (2017–2024) · ano 2018 · Europa / ROW, especificação de lançamento (NEDC)

### Resumo (valores usados no simulador)

| Campo | Valor | Situação |
|---|---|---|
| Fabricante | Ferrari |  |
| Veículo | 812 Superfast |  |
| Ano | 2018 |  |
| Motor / código | Ferrari F140 6.5 V12 — F140 GA |  |
| Arquitetura | V12 a 65° |  |
| Cilindros | 12 |  |
| Cilindrada | 6.496 cm³ |  |
| Diâmetro × curso | 94,00 × 78,00 mm |  |
| Biela | 140,0 mm | Estimado |
| Aspiração | Aspirado (sem turbo nem compressor) |  |
| Pressão máxima | — |  |
| Potência | 800 PS / 588 kW / 789 hp a 8.500 rpm |  |
| Torque | 718 N·m a 7.000 rpm |  |
| Marcha lenta | 900 rpm | Estimado |
| Faixa de rotação | 900–8.900 rpm |  |
| Faixa vermelha / corte | 8.900 / 8.900 rpm |  |
| Transmissão | F1 de dupla embreagem 7 marchas, transeixo traseiro com E-Diff |  |
| Marchas e relações | 7: 12,159 · 8,511 · 6,441 · 5,181 · 4,333 · 3,783 · 3,405 (relações totais) | Não confirmado |
| Aletas no volante | Sim |  |
| Velocidade máxima | 340 km/h — Oficial: mais de 340 km/h (sem limitador mencionado). |  |
| Tanque | 92 L — Tanque | Oficial |
| Combustível | Gasolina premium |  |
| Posição do motor | Dianteiro-central longitudinal |  |
| Ordem de ignição | Não confirmada (animação ilustrativa) | Não confirmado |
| Virabrequim | Não publicado (V12 a 65°; ignição regular a 60° assumida na simulação) |  |
| Lubrificação | Cárter seco |  |
| Painel | Conta-giros analógico central (0–10 ×1000, estimado) com marcha digital, ponteiro vermelho e faixa vermelha perto do topo; fundo amarelo (opcional, comum). TFT esquerda: velocidade, computador de bordo, pneus e manettino. TFT direita: infotenimento e dados do motor (óleo, água). LEDs de troca no aro de carbono do volante (opcionais). Escala do velocímetro virtual não confirmada (360 km/h usado). |  |
| Traços visuais | V12 a 65° longo e baixo atrás do eixo dianteiro: dois plenums vermelhos com a inscrição Ferrari sobre as bancadas, cobertura central clara "V12 6.5", coletores 6-em-1 de inox e cárter seco raso. |  |

### Ficha verificada (painel ENGINE SPECS)

| Item | Valor | Situação | Fontes | Observação |
|---|---|---|---|---|
| Configuração | V12 a 65°, aspirado, 48 válvulas | Oficial | [3] | Válvulas e DOHC: fontes secundárias |
| Cilindrada | 6.496 cm³ | Oficial | [3] [1] |  |
| Diâmetro × curso | 94 × 78 mm | Oficial | [3] |  |
| Taxa de compressão | 13,64:1 | Oficial | [3] [6] |  |
| Injeção | Direta a 350 bar | Oficial | [3] [1] |  |
| Potência | 800 cv (588 kW / 789 hp) a 8.500 rpm | Oficial | [3] [1] |  |
| Torque | 718 N·m a 7.000 rpm (80% disponível a 3.500 rpm) | Oficial | [3] [1] |  |
| Rotação máxima | 8.900 rpm | Oficial | [3] [6] |  |
| Marcha lenta | ≈ 900 rpm | Estimado |  | Não publicada pela Ferrari |
| Ordem de ignição / virabrequim | Não confirmados | Não confirmado |  | A animação usa sequência ilustrativa com intervalos regulares de 60° |
| Lubrificação | Cárter seco | Fonte confiável | [9] | Padrão da família F140; não declarado no material do 812 |
| Câmbio | F1 de dupla embreagem, 7 marchas, aletas | Oficial | [3] [7] |  |
| Relações | Não publicadas (≈ 6% mais curtas que as do F12berlinetta) | Não confirmado | [3] | A simulação usa relações estimadas |
| Pneus | 275/35 ZR20 dianteiros, 315/35 ZR20 traseiros | Oficial | [3] |  |
| Velocidade máxima | Mais de 340 km/h | Oficial | [3] [1] |  |
| 0–100 / 0–200 km/h | 2,9 s / 7,9 s | Oficial | [3] [1] |  |
| Peso | 1.630 kg em ordem de marcha (seco: 1.525 kg com opcionais) | Oficial | [3] |  |
| Tanque | 92 L | Oficial | [3] |  |
| Posição do motor | Dianteiro-central longitudinal | Fonte confiável | [3] |  |

### Estimativas usadas pela simulação

- Relações de marcha (não publicadas): velocidades máximas por marcha assumidas, 7ª ≈ 350 km/h a 8.900 rpm
- Marcha lenta (900 rpm) e comprimento de biela (140 mm)
- Ordem de ignição e geometria do virabrequim (ilustrativas, 60°)
- Escala do conta-giros (10.000 rpm) e do velocímetro virtual (360 km/h)
- Cd·A calibrado para 340 km/h com 588 kW

### Versão, discrepâncias e decisões

- O 812 GTS e o 812 Competizione (830 cv, 9.500 rpm) não foram misturados.
- Compressão 13,64:1 (ficha Ferrari); 13,6:1 é o mesmo valor arredondado.
- Pneu traseiro oficial 315/35 ZR20; o conceptcarz lista 255/35 ZR20 por engano.

### Fontes

1. The Ferrari 812 Superfast: the new extreme-performance V12 berlinetta — Ferrari S.p.A. **(oficial)** — <https://www.ferrari.com/en-EN/corporate/articles/the-ferrari-812-superfast-the-new-extreme-performance-v12-berlinetta>
2. Ferrari 812 Superfast — página do modelo — Ferrari S.p.A. **(oficial)** — <https://www.ferrari.com/en-EN/auto/812-superfast>
3. Ferrari 812 Superfast (2018) — press kit e ficha técnica completos (reprodução) — NetCarShow (material de imprensa Ferrari) — <https://www.netcarshow.com/ferrari/2018-812_superfast/>
4. The 812 Superfast is Announced (reprodução do comunicado) — Ferrari Owners' Club UK — <https://www.ferrariownersclub.co.uk/?p=20648>
5. Ferrari 812 Superfast technical specifications — conceptcarz.com — <https://www.conceptcarz.com/s31303/news.aspx>
6. Ferrari 812 Superfast — engine, transmission and technical highlights — evo — <https://evo.co.uk/ferrari/812-superfast/engine-transmission-and-technical-highlights>
7. Ferrari 812 Superfast (setembro de 2017) — Motor Sport Magazine — <https://www.motorsportmagazine.com/archive/article/september-2017/58/ferrari-812-superfast>
8. Ferrari 812 Superfast (usado como ponteiro) — Wikipedia — <https://en.wikipedia.org/wiki/Ferrari_812_Superfast>
9. Ferrari unveils two new V-12 ICE sports models (F140HD com cárter seco) — WardsAuto — <https://www.wardsauto.com/news/ferrari-unveils-two-new-v-12-ice-sports-models/798251/>

## 9. Volkswagen W12 Syncro (estudo 1997)

**Versão escolhida:** Primeiro estudo W12 (cupê W12 Syncro, Italdesign), Tóquio 1997 · ano 1997 · Carro-conceito / protótipo funcional (sem homologação)

### Resumo (valores usados no simulador)

| Campo | Valor | Situação |
|---|---|---|
| Fabricante | Volkswagen |  |
| Veículo | W12 Syncro (estudo 1997) |  |
| Ano | 1997 |  |
| Motor / código | Volkswagen W12 5.6 (dois módulos VR6 2.8) — Não confirmado |  |
| Arquitetura | W12: dois blocos VR6 de 15° a 72° |  |
| Cilindros | 12 |  |
| Cilindrada | 5.584 cm³ |  |
| Diâmetro × curso | 81,00 × 90,30 mm |  |
| Biela | 164,0 mm | Estimado |
| Aspiração | Aspirado (sem turbo nem compressor) |  |
| Pressão máxima | — |  |
| Potência | 420 PS / 309 kW / 414 hp a 5.800 rpm |  |
| Torque | 530 N·m a 3.000 rpm |  |
| Marcha lenta | 750 rpm | Estimado |
| Faixa de rotação | 750–6.700 rpm |  |
| Faixa vermelha / corte | 6.500 / 6.700 rpm |  |
| Transmissão | 6 marchas sequencial, tração integral Syncro |  |
| Marchas e relações | 6: 3,500 · 2,200 · 1,550 · 1,200 · 0,980 · 0,820 · final 3,300 | Não confirmado |
| Aletas no volante | Não |  |
| Velocidade máxima | 300 km/h — Velocidade máxima do estudo de 1997 não publicada; 300 km/h é só um parâmetro de simulação. |  |
| Tanque | 90 L — Tanque (capacidade não publicada) | Não confirmado |
| Combustível | Gasolina |  |
| Posição do motor | Central longitudinal (visível sob a cobertura de vidro) |  |
| Ordem de ignição | Não confirmada (animação ilustrativa) | Não confirmado |
| Virabrequim | Virabrequim único comum aos dois módulos VR6 (7 mancais); geometria dos moentes não publicada |  |
| Lubrificação | Cárter úmido (não documentada; valor de simulação) |  |
| Painel | GENÉRICO: não há foto legível nem descrição do painel do W12 Syncro de 1997. Painel neutro no estilo VW do fim dos anos 1990 (mostradores pretos, números brancos, ponteiros vermelhos), sem copiar o Nardò de 2001 nem o Phaeton. |  |
| Traços visuais | W12 largo e curto (dois VR6 a 72°) exposto sob a cobertura de vidro traseira; a tampa preta/prateada "W12" da imagem de referência é do motor de produção e aparece só como ilustração. |  |

### Ficha verificada (painel ENGINE SPECS)

| Item | Valor | Situação | Fontes | Observação |
|---|---|---|---|---|
| Configuração | W12: dois módulos VR6 estreitos sobre um virabrequim comum | Oficial | [2] [3] |  |
| Ângulos | 72° entre os módulos, 15° dentro de cada VR6 | Fonte confiável | [4] [5] [7] |  |
| Cilindrada | 5.584 cm³ (anunciado como 5,6 L) | Fonte confiável | [5] [6] | Exatamente 2 × 2.792 cm³ do VR6 2.8 |
| Diâmetro × curso | 81,0 × 90,3 mm (derivado do VR6 2.8) | Estimado | [2] | Não publicado; reproduz 5.584 cm³ |
| Válvulas | 48 (4 por cilindro), DOHC | Fonte confiável | [5] [7] |  |
| Aspiração | Aspirado | Fonte confiável | [5] |  |
| Potência | 420 PS (309 kW / 414 hp) | Fonte confiável | [4] [7] [3] | 414 hp no texto oficial da VW of America |
| Rotação da potência máxima | 5.800 rpm | Fonte confiável | [5] | Fonte única |
| Torque | 530 N·m a 3.000 rpm | Fonte confiável | [4] [5] | Rotação de fonte única |
| Marcha lenta / faixa vermelha / corte | ≈ 750 / 6.500 / 6.700 rpm | Estimado |  | Não publicados; valores de simulação |
| Câmbio | 6 marchas sequencial | Oficial | [2] [3] |  |
| Tração | Integral permanente Syncro | Oficial | [1] [2] |  |
| Relações, pneus, peso, tanque | Não publicados | Não confirmado |  | A simulação usa valores estimados |
| Velocidade máxima | Não confirmada | Não confirmado |  | Os 357 km/h citados são do W12 Nardò de 2001 |
| Ordem de ignição | Não confirmada | Não confirmado |  | A ordem do W12 6.0 de produção não vale para este motor; animação ilustrativa |
| Posição do motor | Central longitudinal, deixado à vista | Fonte confiável | [5] [1] |  |
| Carroceria | Italdesign Giugiaro, 4.400 × 1.920 × 1.100 mm | Fonte confiável | [5] [8] |  |

### Estimativas usadas pela simulação

- Diâmetro e curso derivados do VR6 2.8; biela de 164 mm
- Marcha lenta, faixa vermelha e corte
- Relações de marcha, pneu (285/35 R19), massa (1.450 kg) e tanque (90 L) — não publicados
- Velocidade máxima de simulação (300 km/h) e Cd·A calibrado
- Numeração e ordem de ignição dos cilindros (ilustrativas, intervalos de 60°)
- Lubrificação (não documentada para o 5.6)
- Painel genérico (não há referência do painel real)

### Versão, discrepâncias e decisões

- Versão: W12 Syncro amarelo de 1997. O Roadster de 1998 (tração traseira) e o W12 Nardò de 2001 (6.0, 600 PS) não foram misturados.
- A imagem de referência enviada mostra a tampa do W12 6.0 de produção, não o motor do estudo de 1997.
- O ArchivioPrototipi lista 600 cv para o W12 Syncro: é o número do W12 Nardò de 2001 e foi rejeitado.
- Torque a 3.000 rpm (Ultimatecarpage) × 4.500 rpm (fonte não identificada); 3.000 rpm usado.

### Fontes

1. W12 Syncro — página do projeto — Italdesign Giugiaro S.p.A. **(oficial)** — <https://www.italdesign.it/project/w12-syncro/>
2. #TBT — Celebrating 20 years of world-record history with the Volkswagen W12 Nardò — Volkswagen of America Media **(oficial)** — <https://media.vw.com/releases/1664>
3. 20th Anniversary of Volkswagen W12 Nardò Record (reproduz o texto da VW of America) — Supercars.net — <https://www.supercars.net/blog/20th-anniversary-of-volkswagen-w12-nardo-record/>
4. Volkswagen W12: The record-breaking concept that was never born — Motor1.com — <https://www.motor1.com/news/750057/volkswagen-w12-concept-story/>
5. 1997 Volkswagen W12 Syncro Concept Specifications — Ultimatecarpage.com — <https://www.ultimatecarpage.com/spec/757/Volkswagen-W12-Syncro-Concept.html>
6. 1997 Volkswagen W12 Syncro (Italdesign) — ArchivioPrototipi.it — <http://www.archivioprototipi.it/europa/volkswagen/w12.html>
7. Volkswagen W12 (série de conceitos; usado como ponteiro) — Wikipedia — <https://en.wikipedia.org/wiki/Volkswagen_W12>
8. Volkswagen W12 Syncro — Carrozzieri Italiani — <https://www.carrozzieri-italiani.com/?p=52772>
