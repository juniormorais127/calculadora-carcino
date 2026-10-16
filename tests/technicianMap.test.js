import test from 'node:test';
import assert from 'node:assert/strict';
import { technicianMapVisits } from '../src/services/technicianMap.js';
test('mapa do tecnico une visitas e atendimentos assistidos sem incluir colegas ou dados do cliente', () => {
  const records = technicianMapVisits('tech', [{ id: 'normal', technicianUid: 'tech' }, { id: 'another', technicianUid: 'colleague' }],
    [{ id: 'own', technicianUid: 'tech', propertyName: 'Fazenda Rio', phone: 'privado' }, { id: 'other', technicianUid: 'colleague', propertyName: 'Outra Fazenda' }],
    { own: [{ id: 'a', technicianUid: 'tech', latitude: -11, longitude: -37 }, { id: 'b', technicianUid: 'colleague' }], other: [{ id: 'c', technicianUid: 'colleague' }] });
  assert.equal(records.length, 2); assert.equal(records[1].farmName, 'Fazenda Rio'); assert.equal(records[1].id, 'assisted:own:a'); assert.equal(records[1].phone, undefined);
});
