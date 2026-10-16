import test from 'node:test';
import assert from 'node:assert/strict';
import { parsePondLocation } from '../src/services/pondLocation.js';
test('coordenadas aceitam zero, limites e virgula decimal sem transformar vazio em zero', () => {
  assert.deepEqual(parsePondLocation('', ''), { latitude: null, longitude: null });
  assert.deepEqual(parsePondLocation('0', '-180'), { latitude: 0, longitude: -180 });
  assert.deepEqual(parsePondLocation('-10,9472', '-37.0731'), { latitude: -10.9472, longitude: -37.0731 });
  for (const pair of [['91', '0'], ['0', '-181'], ['', '1'], ['1', ''], ['NaN', '0'], ['0x10', '0']]) assert.throws(() => parsePondLocation(...pair));
});
