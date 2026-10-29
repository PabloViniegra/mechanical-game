import { PALETTE as C } from './palette.js';
import { BOSS } from './config.js';

// Escenarios por tramo de oleadas: cambian tras cada jefe (ver BOSS.every).
// skyline: 'city' | 'forest' | 'dunes' | 'peaks'. props: sprites de suelo (o rocas si es null).
export const MAPS = [
  {
    name: 'Cementerio',
    sky: [C.ink, C.night, C.slate],
    ground: [C.slate, C.night, C.ink],
    silhouette: C.ink,
    skyline: 'city',
    fence: true,
    props: ['tomb', 'cross'],
    orb: { outer: C.dust, inner: C.bone },
    grass: [C.moss, C.lichen],
    mist: C.moss,
  },
  {
    name: 'Bosque muerto',
    sky: [C.ink, C.night, C.moss],
    ground: [C.moss, C.night, C.ink],
    silhouette: C.ink,
    skyline: 'forest',
    fence: false,
    props: null,
    orb: { outer: C.lichen, inner: C.sick },
    grass: [C.lichen, C.sick],
    mist: C.lichen,
  },
  {
    name: 'Yermo en llamas',
    sky: [C.blood, C.earth, C.ember],
    ground: [C.mud, C.earth, C.ink],
    silhouette: C.ink,
    skyline: 'dunes',
    fence: false,
    props: null,
    orb: { outer: C.rust, inner: C.flame },
    grass: [C.mud, C.dust],
    mist: C.earth,
  },
  {
    name: 'Páramo helado',
    sky: [C.ink, C.night, C.cold],
    ground: [C.cold, C.slate, C.night],
    silhouette: C.night,
    skyline: 'peaks',
    fence: false,
    props: null,
    orb: { outer: C.cold, inner: C.bone },
    grass: [C.bone, C.cold],
    mist: C.cold,
  },
];

// Índice del escenario de una oleada; el mismo para todas las que siguen a un jefe.
export const mapIndex = (wave) => Math.floor((wave - 1) / BOSS.every) % MAPS.length;
