export const DATA_TABLES = ['viveiros', 'biometrias', 'qualidadeAgua', 'registrosAlimentacao', 'configuracoes'];

// Exclude local initialization flags and export timestamps from cloud comparison.
export function normalizeData(data) {
  const result = { versao: 1 };
  for (const table of DATA_TABLES) {
    if (!Array.isArray(data[table])) throw new Error('Dados de produção inválidos.');
    result[table] = data[table].filter(row => table !== 'configuracoes' || row.chave !== 'baseInicializada')
      .map(row => JSON.parse(JSON.stringify(row))).sort((a, b) => a.id - b.id);
  }
  return result;
}
function canonical(value) {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + canonical(value[key])).join(',') + '}';
  return JSON.stringify(value);
}
export const serializeData = data => canonical(normalizeData(data));
export const isEmptyData = data => DATA_TABLES.every(table => normalizeData(data)[table].length === 0);

// Unicode-safe chunks, well below Firestore's document limit even with escaping.
export function chunkData(data, limit = 120000) {
  const text = serializeData(data);
  const chunks = [];
  let chunk = '';
  for (const char of text) {
    if (chunk.length + char.length > limit) { chunks.push(chunk); chunk = ''; }
    chunk += char;
  }
  if (chunk) chunks.push(chunk);
  return chunks;
}
