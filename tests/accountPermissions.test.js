import test from 'node:test';
import assert from 'node:assert/strict';
import { expirationMillis, premiumStatus, accountRole, ACCOUNT_ROLES, SENIOR_UID, canManageUser, assignableRoles, isSenior } from '../src/services/accountPermissions.js';

test('hierarquia impede administrador de gerenciar superiores ou promover colegas', () => {
  const admin = { uid: 'admin' };
  const access = { role: 'administrator' };
  for (const role of Object.keys(ACCOUNT_ROLES)) {
    const target = { uid: 'target', role };
    assert.equal(canManageUser(admin, access, target), ['producer', 'field_technician'].includes(role));
    assert.equal(canManageUser({ uid: 'senior' }, { role: 'senior' }, target), true);
    assert.equal(canManageUser({ uid: 'producer' }, { role: 'producer' }, target), false);
  }
  assert.deepEqual(assignableRoles(admin, access, { uid: 'target', role: 'producer' }), ['producer', 'field_technician']);
  assert.equal(canManageUser(admin, access, { uid: SENIOR_UID, role: 'producer' }), false);
  assert.equal(canManageUser(null, access, { uid: 'target', role: 'producer' }), false);
});
test('sênior principal mantém controle mesmo com perfil antigo e tem acesso completo', () => {
  assert.equal(accountRole({ role: 'producer' }, SENIOR_UID), 'senior');
  assert.equal(isSenior({ uid: SENIOR_UID }, null), true);
  assert.deepEqual(assignableRoles({ uid: SENIOR_UID }, null, { uid: SENIOR_UID }), ['senior']);
  assert.equal(premiumStatus({ role: 'senior', premium: false, expiresAt: 1 }), 'Acesso completo');
});

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
