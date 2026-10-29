// Tema del menú: órgano gótico y clave en Re menor armónico, sintetizado al vuelo.
// Cada fila es un compás de 16 semicorcheas. '-' alarga la nota anterior y '.' es silencio.
// Todas las pistas deben tener los mismos compases.
export const MENU_TUNE = {
  bpm: 84,
  tracks: {
    // Arpegios disminuidos para entrar con ritmo y luego mordentes sobre el bajo de lamento.
    organ: [
      'D5 . F5 . G#5 . B5 . D6 - - - . . . .',
      'C#6 - - - A#5 - G5 - E5 - - - C#5 - - -',
      'D5 . A5 . A#5 . A5 . G#5 . A5 . F5 - E5 -',
      'D5 - - - - - - - - - - - . . . .',
      'D5 C#5 D5 - - - - - A4 - - - F4 - - -',
      'E5 D5 E5 - - - - - D5 - - - B4 - - -',
      'F5 E5 F5 - - - G5 - A#5 - - - A5 - G5 -',
      'F5 - E5 - D5 - C#5 - - - - - . . . .',
    ],
    harpsichord: [
      '. F4 . B4 . F4 . B4 . G#4 . D5 . G#4 . D5',
      '. E4 . G4 . E4 . G4 . C#4 . E4 . G4 . A#4',
      '. F4 . A4 . F4 . A4 . E4 . A4 . C#4 . E4',
      'D4 F4 G#4 B4 D5 . . . . . . . . . . .',
      'D4 F4 A4 F4 D4 F4 A4 F4 D4 F4 A4 F4 D4 F4 A4 F4',
      'C4 E4 G4 E4 C4 E4 G4 E4 B3 D4 G4 D4 B3 D4 G4 D4',
      'A#3 D4 G4 D4 A#3 D4 G4 D4 A#3 D4 G4 D4 A#3 D4 G4 D4',
      'A3 C#4 E4 G4 A3 C#4 E4 G4 A3 C#4 E4 G4 A4 G4 E4 C#4',
    ],
    // Bajo caminante y luego de lamento, que desciende por semitonos de Re a La.
    bass: [
      'D2 . D3 . D2 . D3 . G#2 . G#3 . G#2 . G#3 .',
      'C#2 . C#3 . C#2 . C#3 . E2 . E3 . A#2 . A#3 .',
      'D2 . D3 . D2 . D3 . A2 . A3 . A2 . A3 .',
      'D2 - - - - - - - - - - - - - - -',
      'D3 - - - - - - - C#3 - - - - - - -',
      'C3 - - - - - - - B2 - - - - - - -',
      'A#2 - - - - - - - - - - - - - - -',
      'A2 - - - - - - - A2 - - - - - - -',
    ],
    // Campana de difuntos al empezar cada sección.
    bell: [
      'D5 . . . . . . . . . . . . . . .',
      '. . . . . . . . . . . . . . . .',
      '. . . . . . . . . . . . . . . .',
      'D5 . . . . . . . A4 . . . . . . .',
      'D5 . . . . . . . . . . . . . . .',
      '. . . . . . . . . . . . . . . .',
      '. . . . . . . . . . . . . . . .',
      'A4 . . . . . . . . . . . . . . .',
    ],
  },
};
