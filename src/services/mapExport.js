const fields = [
  ['ID', 'id', 'Identificador', 120], ['ORIGEM', 'source', 'Origem do registro', 50],
  ['FAZENDA', 'property', 'Propriedade', 200], ['VIVEIRO', 'pond', 'Viveiro ou local', 160],
  ['PRODUTOR', 'client', 'Produtor', 160], ['ENDERECO', 'address', 'Endereço', 254],
  ['MUNICIPIO', 'city', 'Município', 100], ['UF', 'state', 'Estado', 2],
  ['EMAIL', 'email', 'E-mail do produtor', 180], ['CELULAR', 'phone', 'Contato informado do produtor', 24], ['TECNICO', 'technician', 'Técnico', 160],
  ['TEC_UID', 'technicianUid', 'Código do técnico', 128], ['DATA', 'date', 'Data da visita', 32],
  ['SITUACAO', 'status', 'Situação do aceite', 80], ['LICENCA', 'license', 'Licenciamento declarado', 80],
  ['NUM_LIC', 'licenseNumber', 'Número da licença', 120], ['LIC_INICIO', 'licenseStart', 'Cadastro da licença', 10], ['LIC_FIM', 'licenseEnd', 'Vencimento da licença', 10],
  ['AUDITORIA', 'audit', 'Situação da auditoria', 80], ['RELATORIO', 'report', 'Relatório compartilhado', 254],
  ['LATITUDE', 'latitude', 'Latitude WGS84', 19, 'N'], ['LONGITUDE', 'longitude', 'Longitude WGS84', 19, 'N'],
];
const encoder = new TextEncoder();
const statusLabels = { pending: 'Aguardando aceite do produtor', accepted: 'Aceito pelo produtor', rejected: 'Contestado pelo produtor', registered: 'Cadastro sem avaliação técnica' };
const licenseLabels = { licensed: 'Licenciada (declarado)', unlicensed: 'Não licenciada (declarado)', unknown: 'Não verificado' };
const auditLabels = { pending: 'Pendente', approved: 'Aprovado', rejected: 'Recusado', changes_requested: 'Ajustes solicitados' };
export function exportableMapRecords(records) {
  return records.filter(item => Number.isFinite(item.latitude) && Math.abs(item.latitude) <= 90 && Number.isFinite(item.longitude) && Math.abs(item.longitude) <= 180).map(item => ({
    // Explicit allowlist: private notes, nicknames and photo data never enter.
    id: String(item.id || ''), source: item.exportSource || (item.independent ? 'Registro de campo' : 'Visita técnica'),
    property: String(item.farmName || item.propertyName || item.name || ''), pond: String(item.pondName || ''),
    client: String(item.clientName || ''), address: String(item.address || ''), city: String(item.city || ''), state: String(item.state || ''),
    email: String(item.clientEmail || item.ownerEmail || ''), phone: String(item.clientPhone || ''), technician: String(item.technicianName || item.technicianEmail || item.technicianUid || ''), technicianUid: String(item.technicianUid || ''),
    date: String(item.visitedOn || ''), status: statusLabels[item.status] || String(item.status || ''),
    license: licenseLabels[item.licenseStatus] || licenseLabels.unknown, licenseNumber: String(item.licenseNumber || ''), licenseStart: String(item.licenseRegisteredOn || ''), licenseEnd: String(item.licenseExpiresOn || ''),
    audit: auditLabels[item.auditStatus] || '', report: String(item.summary || ''), latitude: item.latitude, longitude: item.longitude,
  }));
}
const xml = value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '');
export function mapKml(records, title = 'CarcinoGestão — locais e visitas') {
  const rows = exportableMapRecords(records);
  if (!rows.length) throw new Error('Não há registros com coordenadas válidas para exportar.');
  return `<?xml version="1.0" encoding="UTF-8"?><kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>${xml(title)}</name>${rows.map(row => `<Placemark><name>${xml([row.property, row.pond, row.date].filter(Boolean).join(' · '))}</name><description>${xml(fields.map(([, key, label]) => `${label}: ${row[key]}`).join('\n'))}</description><ExtendedData>${fields.map(([field, key, label]) => `<Data name="${field}"><displayName>${xml(label)}</displayName><value>${xml(row[key])}</value></Data>`).join('')}</ExtendedData><Point><coordinates>${row.longitude},${row.latitude},0</coordinates></Point></Placemark>`).join('')}</Document></kml>`;
}
function shapeHeader(view, words, bounds) {
  view.setInt32(0, 9994); view.setInt32(24, words); view.setInt32(28, 1000, true); view.setInt32(32, 1, true);
  bounds.forEach((value, index) => view.setFloat64(36 + index * 8, value, true));
}
function utf8Cell(value, width) {
  const bytes = encoder.encode(String(value || ''));
  if (bytes.length <= width) return bytes;
  let end = width;
  while (end > 0 && (bytes[end] & 0xc0) === 0x80) end--;
  return bytes.subarray(0, end);
}
export function shapefileParts(records, now = new Date()) {
  const rows = exportableMapRecords(records);
  if (!rows.length) throw new Error('Não há registros com coordenadas válidas para exportar.');
  const bounds = rows.reduce((box, row) => [Math.min(box[0], row.longitude), Math.min(box[1], row.latitude), Math.max(box[2], row.longitude), Math.max(box[3], row.latitude)], [Infinity, Infinity, -Infinity, -Infinity]);
  const shp = new Uint8Array(100 + rows.length * 28), shx = new Uint8Array(100 + rows.length * 8), shape = new DataView(shp.buffer), index = new DataView(shx.buffer);
  shapeHeader(shape, shp.length / 2, bounds); shapeHeader(index, shx.length / 2, bounds);
  rows.forEach((row, i) => { const offset = 100 + i * 28; shape.setInt32(offset, i + 1); shape.setInt32(offset + 4, 10); shape.setInt32(offset + 8, 1, true); shape.setFloat64(offset + 12, row.longitude, true); shape.setFloat64(offset + 20, row.latitude, true); index.setInt32(100 + i * 8, offset / 2); index.setInt32(104 + i * 8, 10); });
  const headerLength = 32 + fields.length * 32 + 1, recordLength = 1 + fields.reduce((n, field) => n + field[3], 0);
  const dbf = new Uint8Array(headerLength + rows.length * recordLength + 1), db = new DataView(dbf.buffer);
  dbf[0] = 3; dbf[1] = now.getUTCFullYear() - 1900; dbf[2] = now.getUTCMonth() + 1; dbf[3] = now.getUTCDate(); db.setUint32(4, rows.length, true); db.setUint16(8, headerLength, true); db.setUint16(10, recordLength, true);
  fields.forEach(([name, , , width, type = 'C'], i) => { const offset = 32 + i * 32; dbf.set(encoder.encode(name), offset); dbf[offset + 11] = type.charCodeAt(0); dbf[offset + 16] = width; dbf[offset + 17] = type === 'N' ? 10 : 0; });
  dbf[headerLength - 1] = 13;
  rows.forEach((row, i) => { let offset = headerLength + i * recordLength; dbf[offset++] = 32; for (const [, key, , width, type] of fields) { dbf.fill(32, offset, offset + width); const value = type === 'N' ? encoder.encode(row[key].toFixed(10).padStart(width)) : utf8Cell(row[key], width); dbf.set(value, offset); offset += width; } });
  dbf[dbf.length - 1] = 26;
  const csvCell = value => `"${String(typeof value === 'string' && /^[=+@-]/.test(value) ? `'${value}` : value).replace(/"/g, '""')}"`;
  const csv = '\ufeff' + [fields.map(field => csvCell(field[2])).join(';'), ...rows.map(row => fields.map(([, key]) => csvCell(row[key])).join(';'))].join('\r\n');
  return {
    'visitas.shp': shp, 'visitas.shx': shx, 'visitas.dbf': dbf,
    'visitas.prj': encoder.encode('GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS 84",6378137,298.257223563]],PRIMEM["Greenwich",0],UNIT["degree",0.0174532925199433],AUTHORITY["EPSG","4326"]]'),
    'visitas.cpg': encoder.encode('UTF-8'), 'detalhes_completos.csv': encoder.encode(csv),
    'LEIA-ME.txt': encoder.encode('CarcinoGestão — exportação de pontos e visitas\nCoordenadas: WGS84 / EPSG:4326; X = longitude, Y = latitude.\nMantenha SHP, SHX, DBF, PRJ e CPG juntos para importar. Não são polígonos nem limites de imóveis.\nAtributos DBF possuem limites de tamanho. O CSV traz os textos completos; relacione pelo identificador do registro. KML também preserva os textos completos.\nLicenciamento é declarado pelo técnico; consulte a situação de aceite/auditoria.\nSem fotos, apelidos ou anotações privadas.\n' + fields.map(([name, , label]) => `${name}: ${label}`).join('\n')),
  };
}
export async function mapShapefileZip(records) {
  const { zip } = await import('fflate');
  const parts = shapefileParts(records);
  return new Promise((resolve, reject) => zip(parts, { level: 1 }, (error, data) => error ? reject(error) : resolve(data)));
}
