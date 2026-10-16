export function adminMapExportRecords(points, visits, inspections, producers, assistedVisits, filter = 'all') {
  const records = [
    ...points.map(point => ({ ...point, id: `ponto:${point.id}`, exportSource: 'Ponto atual do mapa' })),
    ...visits.map(visit => ({ ...visit, id: `visita:${visit.id}`, exportSource: 'Histórico de visita técnica' })),
    ...inspections.map(visit => ({ ...visit, id: `campo:${visit.id}`, farmName: visit.propertyName, pondName: 'Registro de campo', exportSource: 'Histórico de registro de campo' })),
  ];
  for (const producer of producers) {
    for (const visit of assistedVisits[producer.id] || []) records.push({ ...visit, id: `assistido:${producer.id}:${visit.id}`, farmName: producer.propertyName, pondName: 'Atendimento assistido', clientName: producer.fullName, clientPhone: producer.phone, address: producer.address, city: producer.city, state: producer.state, clientEmail: producer.email, technicianName: producer.technicianName, auditStatus: producer.auditStatus, exportSource: 'Histórico de atendimento assistido' });
  }
  return records.filter(item => filter === 'all' || item.licenseStatus === filter);
}
