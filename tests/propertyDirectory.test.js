import test from 'node:test';
import assert from 'node:assert/strict';
import { propertySearchKey } from '../src/services/propertyDirectory.js';
test('busca de propriedade normaliza acentos, caixa e espacos preservando numeros', () => {
  assert.equal(propertySearchKey('  Fazenda São José 12 '), 'fazenda sao jose 12');
});
