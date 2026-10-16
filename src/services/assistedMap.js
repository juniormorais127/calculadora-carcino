export function assistedMapPoints(records, visitsByProducer) {
  return records.map(item => {
    const latest = [...(visitsByProducer[item.id] || [])].sort((a, b) => b.visitedOn.localeCompare(a.visitedOn) || (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0))[0];
    const hasVisitLocation = Number.isFinite(latest?.latitude) && Number.isFinite(latest?.longitude);
    return { id: `assisted:${item.id}`, recipientUid: `assisted:${item.id}`, ownerUid: `assisted:${item.id}`, farmName: item.propertyName, pondName: 'Cadastro assistido',
      clientEmail: item.email || '', latitude: hasVisitLocation ? latest.latitude : item.latitude, longitude: hasVisitLocation ? latest.longitude : item.longitude,
      licenseStatus: latest?.licenseStatus || 'unknown', status: latest?.status || 'registered', technicianUid: item.technicianUid,
      visitedOn: latest?.visitedOn || 'Sem visita registrada', auditStatus: item.auditStatus, technicianName: item.technicianName };
  });
}
