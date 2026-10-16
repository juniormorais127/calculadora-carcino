import test from 'node:test';
import assert from 'node:assert/strict';
import { ADMIN_UID, isAdmin, periodBounds, summarizeEvents } from '../src/services/purchaseMetrics.js';

test('conta visitas, contatos e contas distintas sem somar duplicados como pessoas', () => {
  const event = (uid, kind, targetId = 'adm', name = 'ADM') => ({ uid, kind, targetId, targetName: name, category: 'Ração', occurredAt: Date.parse('2026-10-16T12:00:00-03:00') });
  const result = summarizeEvents([event('a', 'view'), event('a', 'view'), event('b', 'view'), event('a', 'brand'), event('a', 'brand'), event('b', 'brand'), event('a', 'whatsapp', 'seller', 'Vendedor'), event('b', 'phone', 'seller', 'Vendedor')]);
  assert.deepEqual([result.views, result.visitors, result.interests, result.interested, result.contacts, result.contacting], [3, 2, 5, 2, 2, 2]);
  assert.deepEqual([result.rows[0].clicks, result.rows[0].users], [3, 2]);
  assert.equal(result.days[0].interests, 5);
});
test('período inclui dia completo no horário de Fortaleza e funciona vazio', () => {
  const bounds = periodBounds('2026-10-16', '2026-10-16');
  assert.equal(bounds.end - bounds.start, 86400000 - 1);
  const result = summarizeEvents([{ uid: 'a', kind: 'view', occurredAt: bounds.start - 1 }]);
  assert.equal(result.days[0].day, '2026-10-15');
  assert.equal(summarizeEvents([]).interested, 0);
});
test('apenas o UID administrativo permite acessar o painel', () => {
  assert.equal(isAdmin({ uid: ADMIN_UID }), true);
  assert.equal(isAdmin({ uid: 'outro', email: 'juniormorais127@gmail.com' }), false);
  assert.equal(isAdmin(null), false);
});
