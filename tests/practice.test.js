import test from 'node:test';
import assert from 'node:assert/strict';
import { practiceFeedback } from '../js/core/practice.js';

test('la práctica acepta tildes opcionales y prefijos correctos', () => {
  assert.deepEqual(practiceFeedback('uña cadáver', 'uña cadaver'), {
    invalid: false, message: '¡Práctica completada!',
  });
  assert.deepEqual(practiceFeedback('uña cadáver', 'uña ca'), { invalid: false, message: '' });
});

test('la práctica localiza la primera divergencia sin confundir ñ con n', () => {
  const feedback = practiceFeedback('uña cadáver', 'una cadaver');
  assert.equal(feedback.invalid, true);
  assert.match(feedback.message, /Posición 2.*«ñ»/);
  assert.match(practiceFeedback('uña cadáver', 'uñaxcadaver').message, /Posición 4.*un espacio/);
});

test('la práctica distingue texto sobrante y se recupera al corregirlo', () => {
  assert.match(practiceFeedback('uña', 'uña x').message, /Sobra texto desde la posición 4/);
  assert.equal(practiceFeedback('uña', 'uña').invalid, false);
});
