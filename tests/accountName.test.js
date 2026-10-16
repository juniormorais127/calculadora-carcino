import test from 'node:test';
import assert from 'node:assert/strict';
import { validateAccountName } from '../src/services/accountName.js';
test('nome da conta exige nome completo e normaliza espacos antes de fixar', () => {
  assert.equal(validateAccountName(' Ana  Maria Silva '), 'Ana Maria Silva');
  assert.throws(() => validateAccountName('Ana'));
  assert.throws(() => validateAccountName(''));
});
