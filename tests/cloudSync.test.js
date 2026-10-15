import test from 'node:test';
import assert from 'node:assert/strict';
import { createCloudSync } from '../src/services/cloudSync.js';
import { normalizeData, serializeData, chunkData } from '../src/services/cloudData.js';

const data = name => ({ versao: 1, viveiros: name ? [{ id: 1, nome: name }] : [], biometrias: [], qualidadeAgua: [], registrosAlimentacao: [], configuracoes: [] });
function fixture(local = data(), cloud = { revision: 0, data: null }, meta) {
  const state = { local, cloud, meta, writes: 0, status: null };
  const remote = {
    read: async () => structuredClone(state.cloud),
    write: async (value, revision) => {
      if (state.cloud.revision !== revision) throw Object.assign(new Error(), { code: 'sync/conflict' });
      state.cloud = { revision: revision + 1, data: structuredClone(value) }; state.writes++; return revision + 1;
    },
  };
  const sync = createCloudSync({ remote, readLocal: async () => structuredClone(state.local), replaceLocal: async value => { state.local = structuredClone(value); },
    readMeta: async () => state.meta, saveMeta: async value => { state.meta = { ...state.meta, ...value }; }, onStatus: value => { state.status = value; } });
  return { state, remote, sync };
}
test('nova conta recupera os dados da nuvem, sem escrever uma base vazia', async () => {
  const { state, sync } = fixture(data(), { revision: 3, data: data('Meu viveiro') });
  await sync.sync(); assert.equal(state.local.viveiros[0].nome, 'Meu viveiro'); assert.equal(state.writes, 0); assert.equal(state.meta.revision, 3);
});
test('salva alterações e exclusões; repetir sincronização não cria gravações', async () => {
  const { state, sync } = fixture(data('Local'));
  await sync.sync(); await sync.sync(); assert.equal(state.writes, 1);
  state.local = data(); await sync.sync(); assert.equal(state.writes, 2); assert.deepEqual(state.cloud.data.viveiros, []);
});
test('offline preserva mudanças, que são enviadas ao reconectar', async () => {
  const { state, remote, sync } = fixture(data('Offline'));
  const read = remote.read; remote.read = async () => { throw new Error('offline'); };
  await sync.sync(); assert.equal(state.status.state, 'pending'); assert.equal(state.local.viveiros[0].nome, 'Offline');
  remote.read = read; await sync.sync(); assert.equal(state.cloud.data.viveiros[0].nome, 'Offline');
});
test('alterações concorrentes não sobrescrevem a nuvem nem o aparelho', async () => {
  const { state, sync } = fixture(data('Local'), { revision: 2, data: data('Remoto') }, { revision: 1, baseline: serializeData(data('Antes')) });
  await sync.sync(); assert.equal(state.status.state, 'conflict'); assert.equal(state.writes, 0);
  assert.equal(state.local.viveiros[0].nome, 'Local'); assert.equal(state.cloud.data.viveiros[0].nome, 'Remoto');
  await sync.useCloud(); assert.equal(state.local.viveiros[0].nome, 'Remoto'); assert.equal(state.meta.recovery.viveiros[0].nome, 'Local');
});
test('publicação com resposta perdida é reconhecida pelo conteúdo', async () => {
  const { state, sync } = fixture(data('Igual'), { revision: 2, data: data('Igual') }, { revision: 1, baseline: serializeData(data('Antes')) });
  await sync.sync(); assert.equal(state.status.state, 'synced'); assert.equal(state.meta.revision, 2); assert.equal(state.writes, 0);
});
test('trocar de conta cancela a aplicação de uma leitura antiga', async () => {
  const { state, remote, sync } = fixture(data(), { revision: 1, data: data('Outra conta') });
  let resolve;
  remote.read = () => new Promise(done => { resolve = done; });
  const pending = sync.sync();
  while (!resolve) await Promise.resolve();
  sync.stop(); resolve({ revision: 1, data: data('Outra conta') }); await pending;
  assert.deepEqual(state.local.viveiros, []); assert.equal(state.meta, undefined);
});
test('mudança durante leitura é preservada e sinaliza conflito', async () => {
  const before = data('Antes');
  const { state, remote, sync } = fixture(before, { revision: 2, data: data('Nuvem') }, { revision: 1, baseline: serializeData(before) });
  const read = remote.read;
  remote.read = async () => { state.local = data('Alterado durante leitura'); return read(); };
  await sync.sync(); assert.equal(state.status.state, 'conflict'); assert.equal(state.local.viveiros[0].nome, 'Alterado durante leitura');
});
test('chunks preservam Unicode e ignoram timestamps e flags locais', () => {
  const source = data('Camarão 🦐'.repeat(100));
  source.configuracoes.push({ id: 1, chave: 'baseInicializada' }); source.dataExportacao = 'qualquer';
  const chunks = chunkData(source, 40);
  assert(chunks.every(chunk => chunk.length <= 40));
  assert.deepEqual(JSON.parse(chunks.join('')), normalizeData(source));
  assert.equal(serializeData(source), serializeData({ ...source, dataExportacao: 'outra' }));
});
