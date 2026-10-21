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
  const sync = createCloudSync({ remote, readLocal: async () => structuredClone(state.local), replaceLocal: async (value, expected, meta) => { state.local = structuredClone(value); state.meta = { ...state.meta, ...meta }; },
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

test('permissao recusada preserva registros e baseline e permite nova tentativa', async () => {
  const meta = { revision: 2, baseline: serializeData(data('Antes')) };
  const { state, remote, sync } = fixture(data('Editado'), { revision: 2, data: data('Antes') }, meta);
  const read = remote.read;
  remote.read = async () => { throw Object.assign(new Error('denied'), { code: 'permission-denied' }); };
  await sync.sync();
  assert.equal(state.status.errorCode, 'permission-denied');
  assert.match(state.status.message, /Firebase/);
  assert.equal(state.local.viveiros[0].nome, 'Editado');
  assert.deepEqual(state.meta, meta);
  assert.equal(state.writes, 0);
  remote.read = read;
  await sync.sync();
  assert.equal(state.status.state, 'synced');
  assert.equal(state.cloud.data.viveiros[0].nome, 'Editado');
});
test('mesmo dado alterado nos dois lugares usa nuvem automaticamente e guarda cópia anterior', async () => {
  const { state, sync } = fixture(data('Local'), { revision: 2, data: data('Remoto') }, { revision: 1, baseline: serializeData(data('Antes')) });
  await sync.sync(); assert.equal(state.status.state, 'synced'); assert.equal(state.writes, 0);
  assert.equal(state.local.viveiros[0].nome, 'Remoto'); assert.equal(state.cloud.data.viveiros[0].nome, 'Remoto');
  assert.equal(state.meta.recovery.viveiros[0].nome, 'Local');
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
test('mudança durante leitura é conciliada em nova leitura sem sobrescrever a edição em andamento', async () => {
  const before = data('Antes');
  const { state, remote, sync } = fixture(before, { revision: 2, data: data('Nuvem') }, { revision: 1, baseline: serializeData(before) });
  const read = remote.read;
  let first = true;
  remote.read = async () => { if (first) { first = false; state.local = data('Alterado durante leitura'); } return read(); };
  await sync.sync(); assert.equal(state.status.state, 'synced'); assert.equal(state.local.viveiros[0].nome, 'Nuvem');
  assert.equal(state.meta.recovery.viveiros[0].nome, 'Alterado durante leitura');
});
test('chunks preservam Unicode e ignoram timestamps e flags locais', () => {
  const source = data('Camarão 🦐'.repeat(100));
  source.configuracoes.push({ id: 1, chave: 'baseInicializada' }); source.dataExportacao = 'qualquer';
  const chunks = chunkData(source, 40);
  assert(chunks.every(chunk => chunk.length <= 40));
  assert.deepEqual(JSON.parse(chunks.join('')), normalizeData(source));
  assert.equal(serializeData(source), serializeData({ ...source, dataExportacao: 'outra' }));
});

test('reconexão envia inclusão e exclusão offline junto com edições independentes da nuvem', async () => {
  const base = data('Base'); base.biometrias = [{ id: 1, viveiroId: 1, pesoMedioG: 2 }];
  const local = structuredClone(base); local.biometrias = [{ id: 2, viveiroId: 1, pesoMedioG: 5 }];
  const cloud = structuredClone(base); cloud.viveiros[0].nome = 'Nome atualizado no outro aparelho';
  const { state, sync } = fixture(local, { revision: 2, data: cloud }, { revision: 1, baseline: serializeData(base) });
  await sync.sync();
  assert.equal(state.status.state, 'synced'); assert.equal(state.writes, 1);
  assert.equal(state.local.viveiros[0].nome, cloud.viveiros[0].nome);
  assert.deepEqual(state.cloud.data.biometrias.map(row => row.id), [2]);
  await sync.sync(); assert.equal(state.writes, 1);
});

test('cópia antiga sem baseline compartilhado adota a nuvem e preserva recuperação local', async () => {
  const { state, sync } = fixture(data('Antigo'), { revision: 5, data: data('Oficial') });
  await sync.sync();
  assert.equal(state.status.state, 'synced'); assert.equal(state.writes, 0);
  assert.equal(state.local.viveiros[0].nome, 'Oficial');
  assert.equal(state.meta.recovery.viveiros[0].nome, 'Antigo');
});

test('escrita concorrente refaz a leitura automaticamente, sem pedir escolha de versão', async () => {
  const base = data('Base'), local = data('Editado');
  const { state, remote, sync } = fixture(local, { revision: 1, data: base }, { revision: 1, baseline: serializeData(base) });
  const write = remote.write; let calls = 0;
  remote.write = async (...args) => {
    if (calls++ === 0) { state.cloud = { revision: 2, data: { ...base, qualidadeAgua: [{ id: 1, viveiroId: 1, ph: 8 }] } }; throw Object.assign(new Error(), { code: 'sync/conflict' }); }
    return write(...args);
  };
  await sync.sync();
  assert.equal(state.status.state, 'synced'); assert.equal(state.cloud.data.viveiros[0].nome, 'Editado');
  assert.equal(state.cloud.data.qualidadeAgua.length, 1);
});

test('edição feita durante publicação continua pendente e sobe na próxima passagem', async () => {
  const base = data('Base'), local = data('Local');
  const { state, remote, sync } = fixture(local, { revision: 1, data: base }, { revision: 1, baseline: serializeData(base) });
  const write = remote.write; let first = true;
  remote.write = async (...args) => { const revision = await write(...args); if (first) { first = false; state.local.viveiros[0].areaM2 = 500; } return revision; };
  await sync.sync();
  assert.equal(state.status.state, 'synced'); assert.equal(state.writes, 2);
  assert.equal(state.cloud.data.viveiros[0].areaM2, 500);
});

test('concorrência persistente tem tentativas limitadas e preserva a fila para envio automático', async () => {
  const base = data('Base');
  const { state, remote, sync } = fixture(data('Editado'), { revision: 1, data: base }, { revision: 1, baseline: serializeData(base) });
  let calls = 0;
  remote.write = async () => { calls++; throw Object.assign(new Error(), { code: 'sync/conflict' }); };
  await sync.sync();
  assert.equal(calls, 3); assert.equal(state.status.state, 'pending');
  assert.equal(state.local.viveiros[0].nome, 'Editado');
});

test('base removida na nuvem não é recriada por uma cópia antiga já sincronizada', async () => {
  const before = data('Apagado na nuvem');
  const { state, sync } = fixture(before, { revision: 0, data: null }, { revision: 2, baseline: serializeData(before) });
  await sync.sync();
  assert.equal(state.status.state, 'synced'); assert.equal(state.writes, 0);
  assert.deepEqual(state.local.viveiros, []);
  assert.equal(state.meta.recovery.viveiros[0].nome, 'Apagado na nuvem');
});
