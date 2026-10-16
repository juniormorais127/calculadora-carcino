import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPropertyMap } from '../src/services/propertyMap.js';
test('mapa administrativo inclui todos os cadastros com ponto e distingue licenca ausente de nao verificada', () => {
  const farms = ['a', 'b', 'c'].map(uid => ({ ownerUid: uid, ownerEmail: `${uid}@example.com`, name: `Fazenda ${uid}`, ponds: [{ id: 1, name: 'V1', latitude: 0, longitude: -37 }] }));
  farms.push({ ownerUid: 'empty', name: 'Sem GPS', ponds: [] });
  const visits = [{ ownerUid: 'a', visitedOn: '2026-10-16', licenseStatus: 'licensed', status: 'accepted' }];
  const inspections = [{ id: 'inspection', clientEmail: 'b@example.com', propertyName: 'Fazenda b', visitedOn: '2026-10-16', licenseStatus: 'unlicensed', status: 'pending' }];
  const result = buildPropertyMap(farms, visits, inspections);
  assert.equal(result.points.length, 3);
  assert.equal(result.withoutLocation, 1);
  assert.deepEqual(result.points.map(point => point.licenseStatus), ['licensed', 'unlicensed', 'unknown']);
  assert.equal(result.points[0].latitude, 0);
});
