export function technicianMapVisits(uid, visits, producers, assistedVisits) {
  const own = visits.filter(visit => visit.technicianUid === uid);
  for (const producer of producers.filter(item => item.technicianUid === uid)) {
    for (const visit of assistedVisits[producer.id] || []) {
      if (visit.technicianUid !== uid) continue;
      own.push({ ...visit, id: `assisted:${producer.id}:${visit.id}`, recipientUid: `assisted:${producer.id}`, farmName: producer.propertyName, pondName: 'Atendimento assistido', independent: true });
    }
  }
  return own;
}
