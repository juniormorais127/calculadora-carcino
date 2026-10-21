import { DATA_TABLES, normalizeData } from './cloudData.js';

const canonical = value => Array.isArray(value) ? '[' + value.map(canonical).join(',') + ']'
  : value && typeof value === 'object' ? '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + canonical(value[key])).join(',') + '}' : JSON.stringify(value);
const same = (a, b) => canonical(a) === canonical(b);
function fields(base, local, cloud, table) {
  const result = { ...cloud };
  const coordinateKeys = ['latitude', 'longitude', 'locationAccuracyM', 'locationCapturedAt'];
  const coordinateConflict = table === 'viveiros' && coordinateKeys.some(key => !same(local[key], base[key])) && coordinateKeys.some(key => !same(cloud[key], base[key]));
  for (const key of new Set([...Object.keys(base), ...Object.keys(local)])) {
    if ((table && key === 'id') || same(local[key], base[key]) || (coordinateConflict && coordinateKeys.includes(key))) continue;
    if (same(cloud[key], base[key])) {
      if (key in local) result[key] = local[key]; else delete result[key];
    } else if ([base[key], local[key], cloud[key]].every(value => value && typeof value === 'object' && !Array.isArray(value))) {
      result[key] = fields(base[key], local[key], cloud[key]);
    }
  }
  return result;
}

// Last shared snapshot distinguishes offline changes from stale copies.
// Conflicting values/deletions on the server win; independent edits survive.
export function mergeCloudData(baseInput, localInput, cloudInput) {
  const base = normalizeData(baseInput), local = normalizeData(localInput), cloud = normalizeData(cloudInput);
  const result = { versao: 1 }, pondIds = new Map();
  for (const table of DATA_TABLES) {
    const key = row => table === 'configuracoes' ? row.chave : row.id;
    const bases = new Map(base[table].map(row => [key(row), row]));
    const locals = new Map(local[table].map(row => [key(row), row]));
    const remotes = new Map(cloud[table].map(row => [key(row), row]));
    let nextId = 1;
    for (const rows of [base[table], local[table], cloud[table]]) for (const row of rows) nextId = Math.max(nextId, row.id + 1);
    const output = [];
    for (const id of new Set([...bases.keys(), ...locals.keys(), ...remotes.keys()])) {
      const before = bases.get(id), original = locals.get(id), remote = remotes.get(id);
      const localRow = original && table !== 'viveiros' && table !== 'configuracoes' && pondIds.has(original.viveiroId)
        ? { ...original, viveiroId: pondIds.get(original.viveiroId) } : original;
      if (before) {
        if (!remote) continue; // Cloud deletion must never be resurrected.
        if (!localRow) { if (!same(remote, before)) output.push(remote); continue; }
        output.push(fields(before, localRow, remote, table));
      } else if (localRow && remote) {
        if (same(localRow, remote)) output.push(remote);
        else if (table === 'configuracoes') output.push(remote);
        else {
          output.push(remote);
          if (!Number.isSafeInteger(nextId)) throw new Error('Não foi possível reservar um identificador local.');
          const assigned = nextId++;
          output.push({ ...localRow, id: assigned });
          if (table === 'viveiros') pondIds.set(localRow.id, assigned);
        }
      } else if (remote || localRow) output.push(remote || localRow);
    }
    // Different new configuration keys may still carry the same numeric ID.
    const used = new Set();
    result[table] = output.map(row => {
      if (used.has(row.id)) row = { ...row, id: nextId++ };
      used.add(row.id); return row;
    });
  }
  const existing = new Set(result.viveiros.map(row => row.id));
  for (const table of ['biometrias', 'qualidadeAgua', 'registrosAlimentacao']) result[table] = result[table].filter(row => existing.has(row.viveiroId));
  return normalizeData(result);
}
