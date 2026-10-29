import { PALETTE as C } from './palette.js';

// Sprites pixel art definidos como mapas de caracteres.
// '.' es transparente; el resto se resuelve con la paleta de cada sprite.
// El constructor añade un contorno oscuro de 1 px automáticamente.

export const OUTLINE = C.ink;

// Halo de los especiales y del jefe; el mismo color marca su etiqueta.
export const ZOMBIE_ACCENTS = {
  masked: C.bone,
  splitter: C.sick,
  shifter: C.cold,
  boss: C.rust,
  crate: C.flame,
};

export const ZOMBIE_PALETTES = {
  walker: {
    h: C.earth, s: C.lichen, S: C.moss, e: C.salmon, m: C.blood, w: C.bone,
    t: C.cold, T: C.slate, b: C.rust, p: C.mud, P: C.earth, f: C.ink,
  },
  runner: {
    h: C.moss, s: C.sick, S: C.lichen, e: C.flame, m: C.blood, w: C.bone,
    t: C.rust, T: C.blood, b: C.ink, p: C.slate, P: C.night, f: C.ink,
  },
  brute: {
    h: C.ink, s: C.lichen, S: C.moss, e: C.salmon, m: C.blood, w: C.bone,
    t: C.mud, T: C.earth, b: C.rust, p: C.slate, P: C.night, f: C.ink,
  },
  // Capucha oscura que le tapa media cara.
  masked: {
    h: C.slate, s: C.moss, S: C.slate, e: C.bone, m: C.blood, w: C.bone,
    t: C.slate, T: C.night, b: C.rust, p: C.night, P: C.ink, f: C.ink,
  },
  // Hinchado y en carne viva: revienta en corredores.
  splitter: {
    h: C.blood, s: C.salmon, S: C.rust, e: C.flame, m: C.blood, w: C.bone,
    t: C.moss, T: C.slate, b: C.sick, p: C.earth, P: C.night, f: C.ink,
  },
  // Mutante con brillo químico.
  shifter: {
    h: C.night, s: C.cold, S: C.slate, e: C.flame, m: C.night, w: C.bone,
    t: C.slate, T: C.night, b: C.cold, p: C.earth, P: C.night, f: C.ink,
  },
  boss: {
    h: C.ink, s: C.lichen, S: C.moss, e: C.flame, m: C.blood, w: C.bone,
    t: C.blood, T: C.ink, r: C.bone, b: C.rust, p: C.earth, P: C.night,
    f: C.ink, k: C.bone,
  },
  crate: { k: C.mud, w: C.earth, r: C.flame },
};

export const WALKER = {
  body: [
    '.....hhhh....',
    '....hhhhhh...',
    '....sssshhh..',
    '....esesSSh..',
    '....sssssSS..',
    '....mwmmsSS..',
    '.....sssSS...',
    '......sS.....',
    '....tttttTT..',
    'sssstbtttTT..',
    'SSSStttbttT..',
    '....ttttttT..',
    '....tbtttTT..',
    '....tttttTT..',
    '....pppppPP..',
  ],
  legs: [
    ['....ppp.PPP..', '...ppp...PP..', '...pp....PP..', '..fff....fff.'],
    ['.....pppPP...', '.....ppPP....', '.....ppPP....', '....fffff....'],
    ['....pp..PPP..', '....pp...PP..', '...ppp...PP..', '..fff....fff.'],
  ],
};

export const BRUTE = {
  body: [
    '......hhhhh......',
    '.....hhhhhhh.....',
    '.....sssssshh....',
    '.....esessSSh....',
    '.....ssssssSS....',
    '.....mwmwmsSS....',
    '......sssssS.....',
    '....ttttttttTT...',
    'ssssstttbtttTTT..',
    'ssssstttbbttTTT..',
    'SSSSStttttttTTT..',
    '....tttttttttTT..',
    '....ttbttttttTT..',
    '....ttttttttTTT..',
    '....pppppppPPP...',
  ],
  legs: [
    ['....pppp..PPPP...', '....pppp...PPPP..', '...pppp....PPPP..', '...ppp......PPP..', '..fffff....fffff.'],
    ['......ppppPPP....', '......ppppPPP....', '......pppPPPP....', '......ppp.PPP....', '.....ffff.ffff...'],
    ['....ppp...PPPP...', '....ppp....PPP...', '...pppp....PPP...', '...ppp......PPP..', '..fffff....fffff.'],
  ],
};

// Abominación: dos cabezas de alto, costillas al aire y púas de hueso.
export const BOSS = {
  body: [
    '.......kk...kk.......',
    '.......hhhhhhh.......',
    '......hhhhhhhhh......',
    '......ssssssshh......',
    '......eseesssSS......',
    '......sssssssSS......',
    '......mwmwmwmSS......',
    '.......sssssSS.......',
    '....kttttttttttTk....',
    '..ssstttrrtrrttTTSS..',
    '.ssssttrttrttrtTTSSS.',
    '.ssssttrrtrrtttTTSSS.',
    '.SSSStttbtttttTTTSSS.',
    '.SS..tttttbbtttTT.SS.',
    '.ss..ttttttttttTT.ss.',
    '.sS..ttttbttttTTT.sS.',
    '.ww..ttttttttttTT.ww.',
    '.....ppppppppPPPP....',
  ],
  legs: [
    ['.....pppp....PPPP....', '....pppp......PPPP...', '....ppp.......PPP....', '...pppp.......PPPP...', '..ffffff.....ffffff..'],
    ['.......ppppPPPP......', '.......pppppPPP......', '.......pppp.PPP......', '.......ppp..PPP......', '......fffff.ffff.....'],
    ['.....ppp....PPPPP....', '.....ppp.....PPPP....', '....pppp......PPP....', '....ppp.......PPPP...', '..ffffff.....ffffff..'],
  ],
};

export const PLAYER = {
  rows: [
    '....hhhh........',
    '...hhhhhh.......',
    '..rrrrrrrr......',
    '...hsssses......',
    '...hssssss......',
    '....sssms.......',
    '.....sss........',
    '...cccccc.......',
    '..ccccccsssgggGG',
    '..cCcccccggggg..',
    '..cCcccccc.gg...',
    '..cCcccccc......',
    '...cccccc.......',
    '...jjjjjj.......',
    '...jjj.jjj......',
    '...jjj.jjj......',
    '...jj...jj......',
    '..bbb...bbb.....',
  ],
  palette: {
    h: C.earth, r: C.rust, s: C.dust, e: C.ink, m: C.mud, c: C.moss,
    C: C.slate, g: C.night, G: C.lichen, j: C.cold, b: C.earth,
  },
};

export const MUZZLE = {
  rows: ['.y...', 'yWWy.', 'WWWWy', 'yWWy.', '.y...'],
  palette: { y: C.ember, W: C.flame },
};

export const BARRICADE = {
  whole: ['ww...ww', 'wWw.wWw', '.wWwWw.', '..wWw..', '.wWwWw.', 'wWw.wWw', 'ww...ww'],
  broken: ['.......', '.......', '.......', '..w....', '.wW.w..', 'wWw.wWw', 'ww...ww'],
  palette: { w: C.mud, W: C.earth },
};

export const TOMB = {
  stone: ['.ggg.', 'ggGgg', 'gGGGg', 'ggGgg', 'ggggg', 'ggggg'],
  cross: ['.g.', 'ggg', '.g.', '.g.', '.g.'],
  palette: { g: C.slate, G: C.night },
};


// Tamaño en píxeles de un sprite ya construido (incluye el contorno de 1 px).
export const spriteSize = (rows, outline = true) => ({
  w: Math.max(...rows.map((r) => r.length)) + (outline ? 2 : 0),
  h: rows.length + (outline ? 2 : 0),
});

// Sin piernas: la caja no anda, así que sus tres fotogramas son iguales.
export const CRATE = {
  body: [
    'kkkkkkkkk',
    'kwwwwwwwk',
    'kwwwrwwwk',
    'kwwrrrwwk',
    'kwwwrwwwk',
    'kwwwwwwwk',
    'kkkkkkkkk',
  ],
  legs: [[], [], []],
};

// Arte de cada tipo de zombi; los especiales reutilizan siluetas con otra paleta.
export const ZOMBIE_ART = {
  walker: WALKER,
  runner: WALKER,
  brute: BRUTE,
  masked: WALKER,
  splitter: BRUTE,
  shifter: WALKER,
  boss: BOSS,
  crate: CRATE,
};

// Fuente bitmap de las etiquetas: mayúsculas de 5 px de alto, anchura variable.
// Va en el mismo búfer que los sprites para que el texto comparta su rejilla.
export const GLYPH_H = 5;
export const FONT = {
  A: ['.##.', '#..#', '####', '#..#', '#..#'],
  B: ['###.', '#..#', '###.', '#..#', '###.'],
  C: ['.###', '#...', '#...', '#...', '.###'],
  D: ['###.', '#..#', '#..#', '#..#', '###.'],
  E: ['####', '#...', '###.', '#...', '####'],
  F: ['####', '#...', '###.', '#...', '#...'],
  G: ['.###', '#...', '#.##', '#..#', '.###'],
  H: ['#..#', '#..#', '####', '#..#', '#..#'],
  I: ['###', '.#.', '.#.', '.#.', '###'],
  J: ['...#', '...#', '...#', '#..#', '.##.'],
  K: ['#..#', '#.#.', '##..', '#.#.', '#..#'],
  L: ['#...', '#...', '#...', '#...', '####'],
  M: ['#...#', '##.##', '#.#.#', '#...#', '#...#'],
  N: ['#..#', '##.#', '#.##', '#..#', '#..#'],
  O: ['.##.', '#..#', '#..#', '#..#', '.##.'],
  P: ['###.', '#..#', '###.', '#...', '#...'],
  Q: ['.##.', '#..#', '#..#', '#.#.', '.#.#'],
  R: ['###.', '#..#', '###.', '#.#.', '#..#'],
  S: ['.###', '#...', '.##.', '...#', '###.'],
  T: ['###', '.#.', '.#.', '.#.', '.#.'],
  U: ['#..#', '#..#', '#..#', '#..#', '.##.'],
  V: ['#...#', '#...#', '.#.#.', '.#.#.', '..#..'],
  W: ['#...#', '#...#', '#.#.#', '##.##', '#...#'],
  X: ['#..#', '#..#', '.##.', '#..#', '#..#'],
  Y: ['#.#', '#.#', '.#.', '.#.', '.#.'],
  Z: ['####', '...#', '.##.', '#...', '####'],
  0: ['.##.', '#..#', '#..#', '#..#', '.##.'],
  1: ['.#', '##', '.#', '.#', '.#'],
  2: ['###.', '...#', '.##.', '#...', '####'],
  3: ['###.', '...#', '.##.', '...#', '###.'],
  4: ['#..#', '#..#', '####', '...#', '...#'],
  5: ['####', '#...', '###.', '...#', '###.'],
  6: ['.##.', '#...', '###.', '#..#', '.##.'],
  7: ['####', '...#', '..#.', '.#..', '.#..'],
  8: ['.##.', '#..#', '.##.', '#..#', '.##.'],
  9: ['.##.', '#..#', '.###', '...#', '.##.'],
  '+': ['...', '.#.', '###', '.#.', '...'],
  '?': ['###.', '...#', '.##.', '....', '.#..'],
  ' ': ['..', '..', '..', '..', '..'],
};

// Letras con signo: la base de FONT y hasta dos filas encima (una sola deja un
// hueco que la separa de la letra).
export const MARK_H = 2;
export const FONT_MARKS = {
  'Á': ['A', '..#.'], 'É': ['E', '..#.'], 'Í': ['I', '.#.'], 'Ó': ['O', '..#.'], 'Ú': ['U', '..#.'],
  'Ü': ['U', '#..#'], 'Ñ': ['N', '.#.#', '#.#.'],
};
