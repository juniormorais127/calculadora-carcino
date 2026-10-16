import test from 'node:test';
import assert from 'node:assert/strict';
import { validateTechnicianIdentity, hasTechnicianIdentity } from '../src/services/technicianIdentity.js';
const value = { fullName: 'Ana Maria Silva', creaNumber: 'CREA-SE 123456', photoDataUrl: 'data:image/png;base64,YWJj', employmentType: 'private', organizationName: '' };
test('identificacao exige nome completo, CREA e foto local sem SVG ou URL externa', () => {
  assert.equal(hasTechnicianIdentity(value), true);
  assert.equal(validateTechnicianIdentity({ ...value, fullName: ' Ana  Maria Silva ' }).fullName, 'Ana Maria Silva');
  for (const invalid of [{ fullName: 'Ana' }, { photoDataUrl: '' }, { photoDataUrl: 'https://example.com/photo.jpg' }, { photoDataUrl: 'data:image/svg+xml;base64,YWJj' }]) assert.throws(() => validateTechnicianIdentity({ ...value, ...invalid }));
  assert.equal(hasTechnicianIdentity(null), false);
  assert.throws(() => validateTechnicianIdentity({ ...value, employmentType: 'organization', organizationName: '' }));
  assert.equal(validateTechnicianIdentity({ ...value, employmentType: 'organization', organizationName: 'Senar' }).organizationName, 'Senar');
});

test('CREA pode ficar vazio sem bloquear a identificacao', () => { assert.equal(validateTechnicianIdentity({ ...value, creaNumber: '' }).creaNumber, ''); });
