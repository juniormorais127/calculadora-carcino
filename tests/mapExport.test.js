import test from 'node:test';
import assert from 'node:assert/strict';
import { unzipSync, strFromU8 } from 'fflate';
import { exportableMapRecords, mapKml, shapefileParts, mapShapefileZip } from '../src/services/mapExport.js';
import { adminMapExportRecords } from '../src/services/adminMapExport.js';
const row = { id: 'visit1', farmName: 'Fazenda São João & Filhos', pondName: 'Viveiro <1>', latitude: -10.95, longitude: -37.07, technicianUid: 'tech', technicianName: 'José Técnico', visitedOn: '2026-10-16', status: 'pending', licenseStatus: 'unlicensed', summary: 'Relatório detalhado: '.repeat(100), privateNotes: 'SEGREDO_PRIVADO', privateAlias: 'APELIDO_PRIVADO', photoDataUrl: 'IMAGEM_PRIVADA' };
test('KML preserva dados completos, escapa XML e exporta longitude antes de latitude sem campos privados', () => {
  const kml = mapKml([row, { ...row, latitude: null }]);
  assert.equal((kml.match(/<Placemark>/g) || []).length, 1); assert.match(kml, /-37.07,-10.95,0/); assert.match(kml, /São João &amp; Filhos/); assert.match(kml, /Viveiro &lt;1&gt;/);
  assert.match(kml, new RegExp(row.summary.slice(-20))); assert.doesNotMatch(kml, /SEGREDO_PRIVADO|APELIDO_PRIVADO|IMAGEM_PRIVADA/);
  assert.equal(exportableMapRecords([{ ...row, longitude: 181 }]).length, 0); assert.throws(() => mapKml([]));
});
test('Shapefile tem cabecalhos e indices de pontos validos e DBF em UTF8 com CSV completo', async () => {
  const parts = shapefileParts([row, { ...row, id: 'second', longitude: -38, latitude: -11 }], new Date('2026-10-16'));
  const shp = new DataView(parts['visitas.shp'].buffer), shx = new DataView(parts['visitas.shx'].buffer), dbf = new DataView(parts['visitas.dbf'].buffer);
  assert.equal(shp.getInt32(0), 9994); assert.equal(shp.getInt32(24) * 2, parts['visitas.shp'].length); assert.equal(shp.getInt32(28, true), 1000); assert.equal(shp.getInt32(32, true), 1);
  assert.equal(shp.getFloat64(112, true), -37.07); assert.equal(shp.getFloat64(120, true), -10.95); assert.equal(shx.getInt32(100), 50); assert.equal(shx.getInt32(108), 64); assert.equal(dbf.getUint32(4, true), 2);
  const csv = strFromU8(parts['detalhes_completos.csv']); assert.ok(csv.includes(row.summary)); assert.ok(csv.includes('São João')); assert.doesNotMatch(csv, /SEGREDO_PRIVADO|APELIDO_PRIVADO|IMAGEM_PRIVADA/);
  const zipped = unzipSync(await mapShapefileZip([row])); assert.equal(Object.keys(zipped).length, 7); assert.equal(strFromU8(zipped['visitas.cpg']), 'UTF-8'); assert.match(strFromU8(zipped['visitas.prj']), /4326/);
});
test('administracao exporta pontos e historico respeitando filtro de licenciamento', () => {
  const records = adminMapExportRecords([{ ...row, id: 'point', summary: '' }], [row], [], [{ id: 'producer', propertyName: 'Outra fazenda', technicianName: 'Outro Técnico' }], { producer: [{ ...row, id: 'assisted', licenseStatus: 'licensed' }] }, 'unlicensed');
  assert.equal(records.length, 2); assert.ok(records.every(item => item.licenseStatus === 'unlicensed')); assert.equal(records[1].summary, row.summary);
});
