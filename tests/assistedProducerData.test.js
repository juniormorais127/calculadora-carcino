import test from 'node:test';
import assert from 'node:assert/strict';
import { validateAssistedProducer, normalizeActivationCode, newActivationCode } from '../src/services/assistedProducerData.js';
import { propertyNameKey } from '../src/services/propertyDirectory.js';
import { assistedMapPoints } from '../src/services/assistedMap.js';
const input = { fullName: '', privateAlias: 'Seu Zé', phone: '(79) 99999-9999', propertyName: 'Fazenda São João', address: 'Povoado do Rio, s/n', city: 'Aracaju', state: 'SE', presentialConsent: true };
test('cadastro assistido aceita apelido privado sem nome e sem email, mas exige endereco e consentimento', () => {
  const value = validateAssistedProducer(input);
  assert.equal(value.fullName, ''); assert.equal(value.privateAlias, 'Seu Zé'); assert.equal(value.email, ''); assert.equal(value.marketingConsent, false); assert.equal(value.phone, '+5579999999999');
  assert.throws(() => validateAssistedProducer({ ...input, privateAlias: '' }));
  assert.throws(() => validateAssistedProducer({ ...input, address: '' }));
  assert.throws(() => validateAssistedProducer({ ...input, presentialConsent: false }));
  assert.throws(() => validateAssistedProducer({ ...input, propertyName: ' ' }));
  assert.throws(() => validateAssistedProducer({ ...input, state: 'XX' }));
  assert.throws(() => validateAssistedProducer({ ...input, latitude: 91, longitude: -37 }));
  assert.equal(validateAssistedProducer({ ...input, fullName: 'José Silva', privateAlias: '', marketingConsent: true }).marketingConsent, true);
});
test('reserva de nome ignora caixa, acentos, sinais e espacos; codigo tem 128 bits aleatorios', () => {
  for (const name of ['  Fazenda São João ', 'FAZENDA SAO JOAO', 'fazenda  sao-joao']) assert.equal(propertyNameKey(name), 'fazenda-sao-joao');
  assert.throws(() => propertyNameKey('---'));
  const a = newActivationCode(), b = newActivationCode(); assert.match(a, /^[a-f0-9]{32}$/); assert.notEqual(a, b);
  assert.equal(normalizeActivationCode(a.toUpperCase()), a); assert.throws(() => normalizeActivationCode('1234'));
});
test('mapa assistido usa avaliacao mais recente sem expor apelido ou notas privadas', () => {
  const points = assistedMapPoints([{ id: 'a', propertyName: 'Fazenda Rio', latitude: -11, longitude: -37, auditStatus: 'pending', technicianUid: 'tech', privateAlias: 'Privado' }], { a: [{ visitedOn: '2026-10-15', licenseStatus: 'unlicensed', latitude: -11.1, longitude: -37.1 }, { visitedOn: '2026-10-14', licenseStatus: 'licensed' }] });
  assert.equal(points[0].licenseStatus, 'unlicensed'); assert.equal(points[0].latitude, -11.1); assert.equal(points[0].auditStatus, 'pending'); assert.equal(points[0].privateAlias, undefined);
});
