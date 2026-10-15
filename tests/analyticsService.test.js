import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAnalyticsStore, ANALYTICS_KEY } from '../src/services/analyticsService.js';

function fixture() {
  const values = new Map();
  const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
  let date = new Date(2026, 9, 15, 12);
  return { values, storage, store: createAnalyticsStore(() => storage, () => date), setDate: value => { date = value; } };
}

test('acessos resistem ao efeito duplicado e contam uma nova abertura', () => {
  const { store, storage } = fixture();
  store.iniciarAcesso(); store.iniciarAcesso();
  store.pagina('dashboard'); store.pagina('dashboard');
  assert.equal(store.resumo().acessos, 1);
  assert.equal(store.resumo().paginas.dashboard, 1);
  const other = createAnalyticsStore(() => storage, () => new Date(2026, 9, 15, 12));
  other.iniciarAcesso();
  assert.equal(store.resumo().acessos, 2);
});

test('cliques reais são separados por vendedor e canal; navegação volta a contar', () => {
  const { store } = fixture();
  store.contato('vendedor-ce-1', 'whatsapp'); store.contato('vendedor-ce-1', 'whatsapp');
  store.contato('vendedor-rn-1', 'telefone');
  store.pagina('mercado'); store.pagina('estatisticas'); store.pagina('mercado');
  assert.deepEqual(store.resumo().contatos, { 'vendedor-ce-1:whatsapp': 2, 'vendedor-rn-1:telefone': 1 });
  assert.equal(store.resumo().paginas.mercado, 2);
});

test('eventos arbitrários e informações pessoais não são armazenados', () => {
  const { store, values } = fixture();
  store.pagina('Fazenda do produtor'); store.contato('telefone-pessoal', 'whatsapp');
  store.contato('vendedor-ce-1', 'email-do-produtor');
  assert.equal(values.size, 0);
});

test('período usa dias locais, descarta dados após 90 dias e limpeza preserva a fazenda', () => {
  const { store, storage, setDate } = fixture();
  storage.setItem('fazenda', 'preservar');
  store.contato('vendedor-ce-1', 'telefone');
  setDate(new Date(2026, 9, 16, 0, 1));
  assert.equal(Object.keys(store.resumo(1).contatos).length, 0);
  assert.equal(store.resumo(7).contatos['vendedor-ce-1:telefone'], 1);
  setDate(new Date(2027, 0, 14));
  store.contato('vendedor-ce-1', 'whatsapp');
  assert.equal(store.resumo(90).contatos['vendedor-ce-1:telefone'], undefined);
  assert(!storage.getItem(ANALYTICS_KEY).includes('2026-10-15'));
  assert(store.limpar()); assert.equal(storage.getItem('fazenda'), 'preservar');
  assert.equal(store.resumo().acessos, 0);
});

test('armazenamento bloqueado ou corrompido não interrompe contatos', () => {
  const blocked = createAnalyticsStore(() => { throw new Error('blocked'); });
  assert.equal(blocked.contato('vendedor-ce-1', 'whatsapp'), false);
  assert.equal(blocked.resumo().disponivel, false);
  const { storage, store } = fixture();
  storage.setItem(ANALYTICS_KEY, '{broken');
  assert.equal(store.resumo().disponivel, false);
  assert.equal(store.contato('vendedor-ce-1', 'whatsapp'), true);
  assert.equal(store.resumo().contatos['vendedor-ce-1:whatsapp'], 1);
});
