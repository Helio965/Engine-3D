/**
 * Short educational descriptions shown by IDENTIFICAR COMPONENTES.
 * Keyed by the `kind` of each 3D part.
 */
export interface ComponentInfo {
  name: string;
  english: string;
  system: string;
  fn: string;
}

export const COMPONENTS: Record<string, ComponentInfo> = {
  block: { name: 'Bloco do motor', english: 'Engine block', system: 'Estrutura', fn: 'Aloja os cilindros e os mancais do virabrequim; recebe cabeçotes, cárter e acessórios.' },
  head: { name: 'Cabeçote', english: 'Cylinder head', system: 'Estrutura / distribuição', fn: 'Fecha os cilindros; contém câmaras de combustão, dutos, válvulas e (no DOHC) os comandos.' },
  camCover: { name: 'Tampa de válvulas', english: 'Cam / valve cover', system: 'Estrutura', fn: 'Cobre o comando e as válvulas, retendo o óleo de lubrificação.' },
  oilPan: { name: 'Cárter (úmido)', english: 'Oil pan / wet sump', system: 'Lubrificação', fn: 'Reservatório de óleo sob o virabrequim, de onde a bomba aspira o lubrificante.' },
  drySump: { name: 'Cárter seco', english: 'Dry sump', system: 'Lubrificação', fn: 'Cárter raso: bombas de recuperação levam o óleo a um tanque separado, permitindo motor mais baixo e lubrificação estável em curvas.' },
  timingCover: { name: 'Tampa da distribuição', english: 'Timing cover', system: 'Distribuição', fn: 'Protege a corrente/correia que sincroniza comandos e virabrequim (comando gira a metade da rotação).' },
  bellhousing: { name: 'Flange / capa seca', english: 'Bellhousing adapter', system: 'Transmissão', fn: 'Une o motor ao câmbio e envolve volante e embreagem.' },
  crankshaft: { name: 'Virabrequim', english: 'Crankshaft', system: 'Conjunto móvel', fn: 'Transforma o movimento alternado dos pistões em rotação. Os ângulos dos moentes definem a ordem de ignição.' },
  piston: { name: 'Pistão', english: 'Piston', system: 'Conjunto móvel', fn: 'Recebe a pressão da combustão e a transmite à biela; os anéis vedam a câmara.' },
  rod: { name: 'Biela', english: 'Connecting rod', system: 'Conjunto móvel', fn: 'Liga o pino do pistão ao moente do virabrequim.' },
  liner: { name: 'Cilindro', english: 'Cylinder bore / liner', system: 'Estrutura', fn: 'Superfície por onde o pistão desliza. Mostrado transparente nos modos internos.' },
  valve: { name: 'Válvulas e molas', english: 'Valves & springs', system: 'Distribuição', fn: 'Abrem e fecham os dutos de admissão (douradas) e escape (cinza) no tempo certo do ciclo.' },
  camshaft: { name: 'Comando de válvulas', english: 'Camshaft', system: 'Distribuição', fn: 'Seus cames empurram as válvulas; gira a metade da rotação do virabrequim.' },
  sparkPlug: { name: 'Vela de ignição', english: 'Spark plug', system: 'Ignição', fn: 'Gera a centelha que inicia a combustão perto do ponto morto superior.' },
  injector: { name: 'Injetor', english: 'Fuel injector', system: 'Alimentação', fn: 'Pulveriza a quantidade exata de combustível no duto (injeção indireta) ou na câmara (injeção direta).' },
  combustion: { name: 'Combustão', english: 'Combustion', system: 'Ciclo', fn: 'Frente de chama no início do tempo de expansão — o único tempo que produz trabalho.' },
  runner: { name: 'Dutos de admissão', english: 'Intake runners', system: 'Admissão', fn: 'Levam o ar do plenum/borboletas até cada cilindro; o comprimento afina a curva de torque.' },
  plenum: { name: 'Plenum / coletor', english: 'Intake plenum', system: 'Admissão', fn: 'Câmara que distribui o ar aos dutos de admissão.' },
  throttleBody: { name: 'Corpo de borboleta', english: 'Throttle body', system: 'Admissão', fn: 'Regula a passagem de ar — é o que o pedal do acelerador controla.' },
  airFilter: { name: 'Filtro de ar', english: 'Air filter', system: 'Admissão', fn: 'Retém partículas antes que o ar chegue ao motor.' },
  intercooler: { name: 'Intercooler / resfriador de ar', english: 'Charge-air cooler', system: 'Indução forçada', fn: 'Resfria o ar comprimido, aumentando a densidade e afastando a detonação.' },
  turbo: { name: 'Turbocompressor', english: 'Turbocharger', system: 'Indução forçada', fn: 'A turbina (lado quente) é girada pelos gases de escape e aciona o compressor (lado frio), que pressuriza o ar de admissão.' },
  supercharger: { name: 'Supercharger (compressor)', english: 'Supercharger', system: 'Indução forçada', fn: 'Compressor volumétrico acionado por correia: dois rotores helicoidais comprimem o ar sem atraso de resposta.' },
  headers: { name: 'Coletores de escape', english: 'Exhaust headers', system: 'Escape', fn: 'Conduzem os gases de cada cilindro; o agrupamento e o comprimento dos tubos moldam o som e o torque.' },
  exhaustManifold: { name: 'Coletor de escape', english: 'Exhaust manifold', system: 'Escape', fn: 'Reúne os gases de vários cilindros rumo ao turbo ou ao escapamento.' },
  heatShield: { name: 'Proteção térmica', english: 'Heat shield', system: 'Escape', fn: 'Isola o calor do escape das peças vizinhas.' },
  beltDrive: { name: 'Correia de acessórios', english: 'Accessory belt', system: 'Acessórios', fn: 'Transmite rotação do virabrequim para bomba d’água, alternador e compressor do A/C.' },
  crankPulley: { name: 'Polia / amortecedor', english: 'Crank pulley / damper', system: 'Acessórios', fn: 'Aciona a correia e amortece vibrações torcionais do virabrequim.' },
  waterPump: { name: 'Bomba d’água', english: 'Water pump', system: 'Arrefecimento', fn: 'Circula o líquido de arrefecimento pelo bloco, cabeçotes e radiador.' },
  alternator: { name: 'Alternador', english: 'Alternator', system: 'Elétrico', fn: 'Gera energia elétrica e recarrega a bateria.' },
  acCompressor: { name: 'Compressor do A/C', english: 'A/C compressor', system: 'Acessórios', fn: 'Comprime o gás refrigerante do ar-condicionado.' },
  idler: { name: 'Polia intermediária', english: 'Idler pulley', system: 'Acessórios', fn: 'Guia a correia e garante o ângulo de abraçamento.' },
  tensioner: { name: 'Tensor', english: 'Belt tensioner', system: 'Acessórios', fn: 'Mantém a tensão correta da correia.' },
  superchargerPulley: { name: 'Polia do supercharger', english: 'Supercharger pulley', system: 'Indução forçada', fn: 'Recebe a rotação do virabrequim; a relação de polias define a rotação dos rotores.' },
  oilFilter: { name: 'Filtro de óleo', english: 'Oil filter', system: 'Lubrificação', fn: 'Filtra o óleo antes que ele chegue aos mancais.' },
  fuelRail: { name: 'Flauta de combustível', english: 'Fuel rail', system: 'Alimentação', fn: 'Distribui combustível pressurizado aos injetores.' },
  fuelTank: { name: 'Tanque de combustível', english: 'Fuel tank', system: 'Alimentação', fn: 'Capacidade específica de cada veículo; o nível cai conforme o consumo simulado.' },
  fuelPump: { name: 'Bomba de combustível', english: 'Fuel pump', system: 'Alimentação', fn: 'Bomba elétrica no tanque que pressuriza a linha de alimentação.' },
  fuelLine: { name: 'Linha de combustível', english: 'Fuel line', system: 'Alimentação', fn: 'Leva o combustível do tanque, passando pelo filtro, até a flauta dos injetores.' },
  fuelDispenser: { name: 'Bomba de abastecimento', english: 'Fuel dispenser', system: 'Abastecimento', fn: 'Bico e mangueira usados na animação de abastecimento.' },
  coilPack: { name: 'Bobina de ignição', english: 'Ignition coil', system: 'Ignição', fn: 'Eleva a tensão para dezenas de milhares de volts para a vela.' },
  flywheel: { name: 'Volante do motor', english: 'Flywheel', system: 'Transmissão', fn: 'Armazena energia cinética e serve de face para a embreagem.' },
  catalyst: { name: 'Catalisador', english: 'Catalytic converter', system: 'Escape', fn: 'Converte CO, HC e NOx em gases menos nocivos.' },
};

export function componentInfo(kind: string): ComponentInfo {
  return COMPONENTS[kind] ?? { name: kind, english: kind, system: '—', fn: '' };
}
