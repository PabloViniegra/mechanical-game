import { fold } from './utils.js';

export function practiceFeedback(expected, input) {
  const goal = fold(expected);
  const value = fold(input);
  const mismatch = [...value].findIndex((letter, i) => letter !== goal[i]);
  if (mismatch !== -1) {
    const letter = goal[mismatch];
    const next = letter === ' ' ? 'un espacio' : `«${letter}»`;
    return {
      invalid: true,
      message: letter === undefined
        ? `Sobra texto desde la posición ${mismatch + 1}. Bórralo para terminar.`
        : `Posición ${mismatch + 1}: se esperaba ${next}. Corrige esa posición para seguir.`,
    };
  }
  return { invalid: false, message: value === goal ? '¡Práctica completada!' : '' };
}
