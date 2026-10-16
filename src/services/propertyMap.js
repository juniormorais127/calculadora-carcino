const nameKey = value => String(value || '').trim().toLocaleLowerCase('pt-BR');
const time = value => value.createdAt?.toMillis?.() || 0;
export function buildPropertyMap(farms, visits, inspections) {
  const reports = [...visits, ...inspections.map(item => ({ ...item, independent: true }))].sort((a, b) => (b.visitedOn || '').localeCompare(a.visitedOn || '') || time(b) - time(a));
  const points = [];
  const matched = new Set();
  let withoutLocation = 0;
  for (const farm of farms) {
    const candidates = reports.filter(report => report.independent ? report.recipientUid === farm.ownerUid || (report.clientEmail === farm.ownerEmail && nameKey(report.propertyName) === nameKey(farm.name)) : report.ownerUid === farm.ownerUid);
    candidates.forEach(report => { if (report.independent) matched.add(report.id); });
    const latest = candidates[0];
    let count = 0;
    for (const pond of farm.ponds || []) {
      if (!Number.isFinite(pond.latitude) || !Number.isFinite(pond.longitude)) continue;
      count++;
      points.push({ id: `farm:${farm.ownerUid}:${pond.id}`, ownerUid: farm.ownerUid, clientEmail: farm.ownerEmail || '', farmName: farm.name, pondId: pond.id, pondName: pond.name,
        latitude: pond.latitude, longitude: pond.longitude, licenseStatus: latest?.licenseStatus || 'unknown', status: latest?.status || 'registered', technicianUid: latest?.technicianUid || 'registry', visitedOn: latest?.visitedOn || 'Sem visita registrada' });
    }
    if (!count) withoutLocation++;
  }
  const seen = new Set();
  for (const report of reports.filter(item => item.independent && !matched.has(item.id))) {
    const key = `${report.recipientUid || report.clientEmail}/${nameKey(report.propertyName)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (!Number.isFinite(report.latitude) || !Number.isFinite(report.longitude)) continue;
    points.push({ ...report, id: `inspection:${report.id}`, farmName: report.propertyName, pondId: null, pondName: 'Registro técnico sem vínculo com o cadastro' });
  }
  return { points, withoutLocation };
}
