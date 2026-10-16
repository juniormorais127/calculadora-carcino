import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizePhone } from '../src/services/accountPhone.js';
test('celular brasileiro com DDD e internacional ficam em formato E164', () => {
  assert.equal(normalizePhone('(79) 99999-1234'), '+5579999991234');
  assert.equal(normalizePhone('5579999991234'), '+5579999991234');
  assert.equal(normalizePhone('+351 912345678'), '+351912345678');
  for (const value of ['', '999991234', '799999123', 'abc79999991234', '+012345678']) assert.throws(() => normalizePhone(value));
});
