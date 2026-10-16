import test from 'node:test';
import assert from 'node:assert/strict';
import { createSessionVerifier } from '../src/services/verifiedSession.js';

test('renova token antigo quando o perfil já aparece confirmado', async () => {
  const user = { uid: 'a', emailVerified: true };
  const reads = []; let reloads = 0;
  const verify = createSessionVerifier({ currentUser: () => user, refreshUser: async () => { reloads++; }, readToken: async (_, force) => { reads.push(force); return { claims: { email_verified: force } }; } });
  await verify('a');
  assert.deepEqual(reads, [false, true]); assert.equal(reloads, 1);
});
test('token confirmado não provoca renovação desnecessária', async () => {
  const verify = createSessionVerifier({ currentUser: () => ({ uid: 'a' }), refreshUser: () => assert.fail('Não deve recarregar'), readToken: async (_, force) => { assert.equal(force, false); return { claims: { email_verified: true } }; } });
  await verify('a');
});
test('conta sem confirmação continua bloqueada e troca de conta cancela o acesso', async () => {
  let current = { uid: 'a' };
  const verify = createSessionVerifier({ currentUser: () => current, refreshUser: async () => {}, readToken: async () => ({ claims: { email_verified: false } }) });
  await assert.rejects(verify('a'), { code: 'auth/email-not-verified' });
  current = { uid: 'b' };
  await assert.rejects(verify('a'), { code: 'auth/session-changed' });
  current = { uid: 'a' };
  const switching = createSessionVerifier({ currentUser: () => current, refreshUser: async () => { current = { uid: 'b' }; }, readToken: async () => ({ claims: { email_verified: false } }) });
  await assert.rejects(switching('a'), { code: 'auth/session-changed' });
});
