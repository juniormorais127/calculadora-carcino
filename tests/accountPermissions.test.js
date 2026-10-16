import test from 'node:test';
import assert from 'node:assert/strict';
import { expirationMillis, premiumStatus, accountRole, ACCOUNT_ROLES } from '../src/services/accountPermissions.js';

test('perfil padrão é produtor e técnico não ganha Premium automaticamente', () => {
  assert.equal(accountRole(null), 'producer');
  assert.equal(accountRole({ premium: true }), 'producer');
  assert.equal(accountRole({ role: 'admin' }), 'producer');
  assert.equal(ACCOUNT_ROLES[accountRole({ role: 'field_technician' })], 'Técnico de campo');
  assert.equal(premiumStatus({ role: 'field_technician', premium: false }), 'Gratuito');
});

test('premium precisa de liberação e respeita validade', () => {
  assert.equal(premiumStatus(null), 'Gratuito');
  assert.equal(premiumStatus({ premium: false, expiresAt: 999999 }, 1), 'Gratuito');
  assert.equal(premiumStatus({ premium: true, expiresAt: null }), 'Premium ativo');
  assert.equal(premiumStatus({ premium: true, expiresAt: { toMillis: () => 100 } }, 100), 'Expirado');
  assert.equal(premiumStatus({ premium: true, expiresAt: 101 }, 100), 'Premium ativo');
});
test('validade inclui o dia inteiro em Fortaleza', () => {
  assert.equal(new Date(expirationMillis('2026-10-20')).toISOString(), '2026-10-21T02:59:59.999Z');
  assert.equal(expirationMillis(''), null);
  assert.throws(() => expirationMillis('invalida'));
});
