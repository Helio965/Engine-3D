import type { CameraPresetName, FlowKind, ViewMode } from '../state/appStore';

/** Guided "EXPLORE ENGINE" tour: each step sets the view, the camera and the clock. */
export interface TourStep {
  id: string;
  title: string;
  text: string;
  view: ViewMode;
  camera: CameraPresetName;
  timeScale: number;
  flows?: FlowKind[];
  /** Only for engines with forced induction. */
  forcedOnly?: boolean;
  highlight?: 'turbos' | 'supercharger';
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'intake',
    title: '1. Admissão',
    text: 'O pistão desce do PMS ao PMI com a válvula de admissão aberta. A depressão no cilindro aspira o ar (e, na injeção indireta, o combustível pulverizado no duto). Observe as válvulas de admissão abrindo enquanto as de escape permanecem fechadas.',
    view: 'internals',
    camera: 'intake',
    timeScale: 0.04,
    flows: ['air'],
  },
  {
    id: 'compression',
    title: '2. Compressão',
    text: 'Com as duas válvulas fechadas, o pistão sobe e comprime a mistura ar-combustível. A pressão e a temperatura sobem — por isso a taxa de compressão é limitada pela octanagem da gasolina.',
    view: 'pistons',
    camera: 'pistons',
    timeScale: 0.04,
  },
  {
    id: 'combustion',
    title: '3. Combustão',
    text: 'Perto do PMS a vela produz a centelha. A frente de chama queima a mistura e a pressão empurra o pistão para baixo: é o único tempo que produz trabalho. O brilho dentro do cilindro marca esse instante, seguindo a ordem de ignição do motor.',
    view: 'pistons',
    camera: 'pistons',
    timeScale: 0.025,
  },
  {
    id: 'exhaust',
    title: '4. Escape',
    text: 'A válvula de escape abre um pouco antes do PMI; o pistão sobe e expulsa os gases queimados para o coletor. Perto do PMS há um breve cruzamento de válvulas (overlap), quando admissão e escape ficam abertas juntas.',
    view: 'internals',
    camera: 'exhaust',
    timeScale: 0.04,
    flows: ['exhaust'],
  },
  {
    id: 'crank',
    title: '5. Virabrequim',
    text: 'As bielas convertem o movimento alternado dos pistões em rotação. A posição de cada moente (ângulo dos colos) define quando cada cilindro chega ao PMS — e, com a ordem de ignição, a "voz" e o equilíbrio do motor.',
    view: 'pistons',
    camera: 'crankshaft',
    timeScale: 0.1,
  },
  {
    id: 'boost',
    title: 'Sobrealimentação',
    text: 'Turbos usam a energia dos gases de escape para girar o compressor; o supercharger é acionado por correia a partir do virabrequim. Ambos aumentam a massa de ar admitida por ciclo — e, com mais combustível, mais torque.',
    view: 'complete',
    camera: 'induction',
    timeScale: 1,
    forcedOnly: true,
    flows: ['air'],
  },
  {
    id: 'torque',
    title: '6. Transmissão de torque',
    text: 'O torque sai pela traseira do virabrequim, passa pelo volante do motor e pela embreagem até o câmbio, onde cada marcha multiplica o torque e reduz a rotação. No modo CONDUÇÃO, velocidade, marcha, relação final e pneu definem a rotação.',
    view: 'complete',
    camera: 'rear',
    timeScale: 1,
  },
];
