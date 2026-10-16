import test from 'node:test';
import assert from 'node:assert/strict';
import { validateTechnicalVisit, validateVisitReport, validateIndependentVisit } from '../src/services/technicalVisitData.js';
const visit = { visitedOn: '2026-10-16', notes: 'Visita para conferir a localização do viveiro.', latitude: '-10,9', longitude: '-37.1' };
test('visita exige relato e datas reais; licenciamento exige número e período completo', () => {
  const value = validateTechnicalVisit(visit);
  assert.equal(value.location.latitude, -10.9);
  assert.equal(value.license, null);
  for (const changes of [{ notes: '' }, { visitedOn: '2026-02-30' }, { licenseNumber: 'ABC' }, { licenseNumber: 'ABC', licenseRegisteredOn: '2026-10-16', licenseExpiresOn: '2026-10-15' }]) {
    assert.throws(() => validateTechnicalVisit({ ...visit, ...changes }));
  }
  assert.deepEqual(validateTechnicalVisit({ ...visit, licenseNumber: 'ABC-123', licenseRegisteredOn: '2026-10-16', licenseExpiresOn: '2027-10-16' }).license, { number: 'ABC-123', registeredOn: '2026-10-16', expiresOn: '2027-10-16' });
});
test('relatorio compartilhado e anotacoes privadas sao campos separados', () => {
  const input = { ...visit, summary: visit.notes, privateNotes: 'Reservado ao tecnico', licenseStatus: 'unlicensed', correctLocation: true };
  const result = validateVisitReport(input);
  assert.equal(result.notes, visit.notes);
  assert.equal(result.privateNotes, 'Reservado ao tecnico');
  assert.equal(result.license, null);
  assert.throws(() => validateVisitReport({ ...input, latitude: '', longitude: '' }));
  assert.throws(() => validateVisitReport({ ...input, licenseStatus: 'licensed' }));
});
test('registro independente exige contato e propriedade sem exigir autorizacao nem alterar cadastro', () => {
  const data = { ...visit, summary: visit.notes, clientEmail: 'CLIENT@example.com', propertyName: 'Fazenda Teste', licenseStatus: 'unlicensed' };
  const result = validateIndependentVisit(data);
  assert.equal(result.clientEmail, 'client@example.com');
  assert.equal(result.licenseStatus, 'unlicensed');
  assert.equal(validateIndependentVisit({ ...data, clientEmail: '' }).clientEmail, '');
  assert.equal(validateIndependentVisit({ ...data, clientEmail: '', recipientUid: 'client' }).recipientUid, 'client');
  assert.equal(validateIndependentVisit({ ...data, recipientUid: 'client' }).clientEmail, '');
  assert.throws(() => validateIndependentVisit({ ...data, propertyName: '' }));
});
