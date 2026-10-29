export const WORDS = {
  short: [
    'ojo', 'pie', 'mano', 'boca', 'bala', 'luna', 'fosa', 'muro', 'lodo', 'sed',
    'pus', 'gris', 'tos', 'rata', 'caos', 'hedor', 'miedo', 'grito', 'carne', 'diente',
    'uña', 'peste', 'vena', 'herida', 'zarpa', 'hueso', 'lápida', 'noche', 'yugo', 'kilo',
    'frío', 'lobo', 'piel', 'ruina', 'sangre', 'moho', 'rabia', 'garra', 'cruz', 'velo',
    'humo', 'bruma', 'mugre', 'hambre', 'cieno', 'dedo', 'codo', 'nuca', 'labio', 'tripa',
    'soga', 'fuego', 'llama', 'brasa', 'pozo', 'cueva', 'ruido', 'eco', 'rayo', 'trueno',
    'olor', 'cofre', 'llave', 'reja', 'verja', 'piedra', 'polvo', 'barro', 'vidrio', 'cable',
    'mapa', 'faro', 'búho', 'buitre', 'mosca', 'larva', 'ajo', 'cera', 'vela', 'pala',
    'pico', 'daga', 'arco', 'mazo', 'red', 'jaula', 'ñu', 'queja', 'sapo', 'vaho',
  ],
  medium: [
    'cerebro', 'tumba', 'gemido', 'cripta', 'veneno', 'pantano', 'muerte', 'podrido',
    'oscuro', 'sótano', 'huesos', 'virus', 'búnker', 'linterna', 'machete', 'hacha',
    'cuervo', 'sombra', 'ataúd', 'cadáver', 'zombi', 'infección', 'antídoto', 'refugio',
    'mordisco', 'horda', 'víctima', 'calavera', 'esqueleto', 'ceniza', 'niebla', 'aullido',
    'escopeta', 'jeringa', 'quimera', 'xilófono', 'whisky', 'fantasma', 'gusanos', 'tiniebla',
    'hospital', 'gasolina', 'granja', 'iglesia', 'campana', 'susurro', 'lamento', 'alarido',
    'cicatriz', 'vendaje', 'botiquín', 'bengala', 'munición', 'cartucho', 'revólver', 'pistola',
    'ballesta', 'cuchillo', 'martillo', 'palanca', 'tablones', 'candado', 'cerrojo', 'túnel',
    'azotea', 'escalera', 'ventana', 'persiana', 'mochila', 'conserva', 'brújula', 'mutante',
    'carroña', 'pútrido', 'escombros', 'chatarra', 'hoguera', 'sepulcro', 'mausoleo', 'panteón',
    'ermita', 'espectro', 'demonio', 'maldición', 'ritual', 'hechizo', 'cadena', 'grillete',
    'guadaña', 'tormenta', 'relámpago', 'eclipse', 'epidemia', 'pandemia', 'osamenta', 'dinamita',
    'mutación', 'cráneo', 'vísceras', 'pezuña', 'antorcha', 'trampa', 'emboscada', 'jauría',
  ],
  long: [
    'apocalipsis', 'supervivencia', 'contagio', 'cementerio', 'putrefacción', 'cuarentena',
    'escalofrío', 'pesadilla', 'madrugada', 'abominación', 'necrópolis', 'desesperación',
    'barricada', 'exterminio', 'motosierra', 'francotirador', 'resurrección', 'hemorragia',
    'laboratorio', 'helicóptero', 'zarzamora', 'inquietante', 'deambulando', 'carnicería',
    'ambulancia', 'alcantarilla', 'cantimplora', 'superviviente', 'descomposición', 'enfermedad',
    'devastación', 'catástrofe', 'evacuación', 'emergencia', 'radiación', 'contaminación',
    'desinfección', 'inmunidad', 'aislamiento', 'trinchera', 'fortificación', 'artillería',
    'ametralladora', 'lanzallamas', 'explosivo', 'carroñero', 'sepulturero', 'enterrador',
    'embalsamado', 'crematorio', 'escalofriante', 'terrorífico', 'espeluznante', 'desenterrar',
    'tambaleante', 'hambriento', 'despedazado', 'ensangrentado', 'irreconocible', 'murciélago',
  ],
};

// Los brutos de oleadas avanzadas llevan frases «sustantivo + adjetivo»;
// los adjetivos con dos formas concuerdan en género con el sustantivo.
export const PHRASES = {
  nouns: {
    m: [
      'cadáver', 'cerebro', 'esqueleto', 'cuervo', 'ataúd', 'sepulcro', 'gusano', 'hueso',
      'cráneo', 'brazo', 'monstruo', 'vecino', 'cartero', 'payaso', 'cocinero', 'soldado',
      'médico', 'bombero', 'fantasma', 'espectro', 'perro', 'granjero', 'cura', 'abuelo',
    ],
    f: [
      'calavera', 'momia', 'horda', 'bestia', 'criatura', 'mano', 'sombra', 'tumba',
      'cripta', 'enfermera', 'abuela', 'novia', 'monja', 'vecina', 'profesora', 'rata',
      'bruja', 'cabeza', 'jauría', 'reina', 'turista', 'cajera', 'niñera', 'carne',
    ],
  },
  adjectives: [
    ['podrido', 'podrida'], ['hambriento', 'hambrienta'], ['maldito', 'maldita'],
    ['rabioso', 'rabiosa'], ['sediento', 'sedienta'], ['mutilado', 'mutilada'],
    ['viscoso', 'viscosa'], ['furioso', 'furiosa'], ['putrefacto', 'putrefacta'],
    ['sangriento', 'sangrienta'], ['infectado', 'infectada'], ['tuerto', 'tuerta'],
    ['cojo', 'coja'], ['mugriento', 'mugrienta'], ['oxidado', 'oxidada'],
    ['carbonizado', 'carbonizada'], ['ahogado', 'ahogada'], ['descalzo', 'descalza'],
    ['pálido', 'pálida'], ['silencioso', 'silenciosa'],
    'gris', 'verde', 'enorme', 'voraz', 'feroz', 'salvaje', 'inmortal', 'gigante',
    'pestilente', 'errante', 'sonriente', 'triste', 'veloz', 'infernal',
  ],
};

// Oleada a partir de la que aparecen frases y probabilidad de que un bruto la lleve.
export const PHRASE_WAVE = 4;
export const PHRASE_CHANCE = 0.5;

// Castigo por fallo: `keep` es la parte de la racha que se conserva y `cost` los
// puntos que se pierden. Fácil enseña sin hundir; Pesadilla no perdona.
export const DIFFICULTY = {
  facil: { speed: 0.75, lives: 5, spawn: 1.3, keep: 0.5, cost: 0 },
  normal: { speed: 1, lives: 3, spawn: 1, keep: 0, cost: 0 },
  pesadilla: { speed: 1.35, lives: 2, spawn: 0.75, keep: 0, cost: 10 },
};

export const DIFFICULTY_ORDER = ['facil', 'normal', 'pesadilla'];

// `from`: oleada en la que aparece; su probabilidad crece `step` por oleada hasta `cap`.
// El caminante cubre el resto: los topes suman 0,8 para que nunca desaparezca. Los especiales: `masked` oculta la palabra hasta
// fijarlo, `split` es cuántos corredores suelta al morir y `shift` los segundos
// que tarda en cambiar de palabra si no es el objetivo. `name` y `hint` se
// anuncian la primera vez que aparece cada especial en una partida.
export const ZOMBIE_TYPES = {
  walker: { words: 'medium', speed: 1, bonus: 1 },
  brute: { words: 'long', speed: 0.6, bonus: 2, from: 3, step: 0.05, cap: 0.2 },
  runner: { words: 'short', speed: 1.75, bonus: 1, from: 2, step: 0.08, cap: 0.3 },
  masked: { words: 'medium', speed: 0.9, bonus: 2, from: 3, step: 0.04, cap: 0.1, masked: true,
    name: 'Encapuchado', hint: 'Fíjalo para ver su palabra' },
  splitter: { words: 'medium', speed: 0.7, bonus: 2, from: 4, step: 0.04, cap: 0.1, split: 2,
    name: 'Hinchado', hint: 'Revienta en dos corredores' },
  shifter: { words: 'medium', speed: 1.1, bonus: 2, from: 6, step: 0.04, cap: 0.1, shift: 5,
    name: 'Mutante', hint: 'Cambia de palabra si no le apuntas' },
  boss: { words: 'long', speed: 0.3, bonus: 3 },
};

// Jefe cada `every` oleadas: `parts` palabras en la primera aparición y una más
// en cada siguiente. Al llegar a la barricada quita `damage` vidas y retrocede `knockback`.
export const BOSS = { every: 5, parts: 3, damage: 2, knockback: 60, push: 14 };

// La granada se carga con `perKill` por zombi abatido y quita `letters` letras
// a todos los zombis en pantalla.
export const GRENADE = { perKill: 0.1, letters: 2, push: 10 };

// Segundos que tarda un zombi normal en cruzar la pantalla en la oleada 1.
export const CROSS_TIME = 18;

// Ritmo de las oleadas: `size + perWave × oleada` zombis; la velocidad crece
// `speedStep` por oleada y el intervalo entre apariciones baja `spawnStep` hasta
// `spawnMin`. Con palabras de ~7 letras, 1 s de intervalo exige unas 85 PPM
// sostenidas en normal: es el techo, no el punto de partida.
export const WAVES = {
  size: 4, perWave: 2, speedStep: 0.07,
  spawnStart: 2.6, spawnStep: 0.1, spawnMin: 1, firstSpawn: 2.4, bonus: 100,
};
// Altura aproximada del mundo en píxeles de arte; se escala por un entero.
export const PIXEL_HEIGHT = 200;

export const COMBO_STEP = 15;
export const MAX_MULTIPLIER = 5;

// Mejoras que se eligen al superar cada oleada. `value` es el efecto por nivel y
// `cost` el precio por nivel de las malditas.
export const UPGRADES = {
  frost: { name: 'Niebla helada', desc: 'Los zombis avanzan un 10 % más lento.', max: 3, value: 0.1 },
  armor: { name: 'Barricada reforzada', desc: 'Una vida máxima más, ya recuperada.', max: 3, value: 1 },
  repair: { name: 'Reparación', desc: 'Recupera todas las vidas.', max: Infinity, value: 0 },
  heavy: { name: 'Balas pesadas', desc: 'Cada acierto empuja más al zombi.', max: 3, value: 2 },
  ricochet: { name: 'Rebote', desc: 'Al abatir, la bala arranca una letra a otro zombi.', max: 3, value: 1 },
  autoload: { name: 'Cargador automático', desc: 'La última letra de cada palabra se dispara sola.', max: 1, value: 1 },
  focus: { name: 'Sangre fría', desc: 'Un fallo solo te quita la mitad de la racha que perderías.', max: 1, value: 0.5 },
  bounty: { name: 'Cazarrecompensas', desc: '+25 % de puntos por zombi abatido.', max: 3, value: 0.25 },
  wire: { name: 'Alambre de espino', desc: 'En cada oleada, un zombi más muere en la barricada sin quitarte vida.', max: 2, value: 1 },
  scope: { name: 'Mira telescópica', desc: 'El zombi fijado avanza un 25 % más lento.', max: 2, value: 0.25 },
  flare: { name: 'Bengalas', desc: 'Los encapuchados muestran su palabra.', max: 1, value: 1 },
  steady: { name: 'Pulso firme', desc: 'Recibir un golpe ya no rompe la racha.', max: 1, value: 1 },
  napalm: { name: 'Napalm', desc: 'La granada arranca 2 letras más.', max: 1, value: 2, rarity: 'rare' },
  phoenix: { name: 'Segunda oportunidad', desc: 'La primera vez que caes, vuelves con 2 vidas.', max: 1, value: 2, rarity: 'rare' },
  quickfuse: { name: 'Mecha corta', desc: 'La granada empieza cada oleada cargada.', max: 1, value: 1, rarity: 'rare' },
  adrenaline: {
    name: 'Adrenalina', desc: 'Con una sola vida, los zombis avanzan un 40 % más lento.',
    max: 1, value: 0.4, rarity: 'rare',
  },
  bloodpact: {
    name: 'Pacto de sangre', desc: '+50 % de puntos, pero los zombis son un 15 % más rápidos.',
    max: 2, value: 0.5, cost: 0.15, rarity: 'cursed',
  },
  fury: {
    name: 'Furia', desc: 'La granada se carga el doble de rápido, pero pierdes una vida máxima.',
    max: 1, value: 1, cost: 1, rarity: 'cursed',
  },
  gravedigger: {
    name: 'Trato del sepulturero', desc: 'Recuperas una vida por oleada, pero traen un 25 % más de zombis.',
    max: 1, value: 1, cost: 0.25, rarity: 'cursed',
  },
  frenzy: {
    name: 'Frenesí', desc: 'Multiplicador máximo x7, pero cada fallo te resta 50 puntos.',
    max: 1, value: 2, cost: 50, rarity: 'cursed',
  },
};

// Peso relativo de cada rareza al sortear la oferta y etiqueta de su carta.
export const RARITY = {
  common: { weight: 1, label: '' },
  rare: { weight: 0.35, label: 'Rara' },
  cursed: { weight: 0.5, label: 'Maldita' },
};

export const UPGRADE_CHOICES = 3;

// En modo guiado manda la precisión, no el tiempo de lectura del objetivo.
export const GUIDED = {
  missesPerLife: 3,
  unavailableUpgrades: ['frost', 'heavy', 'wire', 'scope', 'flare', 'adrenaline', 'bloodpact'],
};

export const RECORD_KEY = 'teclado-zombie-record';
export const PROGRESS_KEY = 'teclado-zombie-progress';

// Opciones del jugador; los volúmenes son pasos enteros de 0 a VOLUME_MAX.
export const SETTINGS_KEY = 'teclado-zombie-options';
export const VOLUME_MAX = 10;
export const DEFAULT_SETTINGS = {
  music: 7,
  sfx: 8,
  muted: false,
  shake: true,
  crt: false,
  stats: true,
  guided: false,
  difficulty: 'normal',
};
