import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeCloudData } from '../src/services/cloudMerge.js';
const empty = () => ({ versao: 1, viveiros: [], biometrias: [], qualidadeAgua: [], registrosAlimentacao: [], configuracoes: [] });

test('combina campos independentes, mantém exclusões e dá prioridade à nuvem no mesmo campo', () => {
  const base = { ...empty(), viveiros: [{ id: 1, nome: 'Antes', areaM2: 1000 }, { id: 2, nome: 'Excluir local' }, { id: 3, nome: 'Excluir remoto' }] };
  const local = structuredClone(base), cloud = structuredClone(base);
  local.viveiros[0].areaM2 = 2000; local.viveiros[0].nome = 'Local'; local.viveiros.splice(1, 1);
  cloud.viveiros[0].nome = 'Nuvem'; cloud.viveiros.splice(2, 1);
  const result = mergeCloudData(base, local, cloud);
  assert.deepEqual(result.viveiros, [{ id: 1, nome: 'Nuvem', areaM2: 2000 }]);
});

test('IDs de novos viveiros em dois aparelhos são separados e seus filhos continuam vinculados', () => {
  const local = { ...empty(), viveiros: [{ id: 1, nome: 'Offline' }], biometrias: [{ id: 1, viveiroId: 1, pesoMedioG: 3 }] };
  const cloud = { ...empty(), viveiros: [{ id: 1, nome: 'Remoto' }], biometrias: [{ id: 1, viveiroId: 1, pesoMedioG: 7 }] };
  const result = mergeCloudData(empty(), local, cloud);
  assert.deepEqual(result.viveiros, [{ id: 1, nome: 'Remoto' }, { id: 2, nome: 'Offline' }]);
  assert.deepEqual(result.biometrias, [{ id: 1, viveiroId: 1, pesoMedioG: 7 }, { id: 2, viveiroId: 2, pesoMedioG: 3 }]);
});

test('configurações são identificadas por chave e não criam dois perfis da fazenda', () => {
  const local = { ...empty(), configuracoes: [{ id: 1, chave: 'perfilFazenda', nomeFazenda: 'Local' }, { id: 2, chave: 'checklistBPM', valor: { a: true } }] };
  const cloud = { ...empty(), configuracoes: [{ id: 1, chave: 'perfilFazenda', nomeFazenda: 'Nuvem' }, { id: 2, chave: 'outra', valor: 5 }] };
  const result = mergeCloudData(empty(), local, cloud);
  assert.equal(result.configuracoes.filter(row => row.chave === 'perfilFazenda').length, 1);
  assert.equal(result.configuracoes.find(row => row.chave === 'perfilFazenda').nomeFazenda, 'Nuvem');
  assert.equal(new Set(result.configuracoes.map(row => row.id)).size, 3);
});

test('viveiro apagado na nuvem não reaparece por causa de medições offline', () => {
  const base = { ...empty(), viveiros: [{ id: 1, nome: 'Apagado' }] };
  const local = { ...structuredClone(base), biometrias: [{ id: 1, viveiroId: 1, pesoMedioG: 5 }] };
  const result = mergeCloudData(base, local, empty());
  assert.deepEqual(result.viveiros, []); assert.deepEqual(result.biometrias, []);
});

test('coordenadas são preservadas como par e itens independentes do checklist são combinados', () => {
  const base = { ...empty(), viveiros: [{ id: 1, latitude: -10, longitude: -37 }], configuracoes: [{ id: 1, chave: 'checklistBPM', valor: { a: false, b: false } }] };
  const local = structuredClone(base), cloud = structuredClone(base);
  local.viveiros[0].latitude = null; local.viveiros[0].longitude = null; cloud.viveiros[0].latitude = -11;
  local.configuracoes[0].valor.a = true; cloud.configuracoes[0].valor.b = true;
  const result = mergeCloudData(base, local, cloud);
  assert.equal(result.viveiros[0].latitude, -11); assert.equal(result.viveiros[0].longitude, -37);
  assert.deepEqual(result.configuracoes[0].valor, { a: true, b: true });
});
