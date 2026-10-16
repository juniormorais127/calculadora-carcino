export async function applyAcceptedVisit(database, visit) {
  if (visit.status !== 'accepted') return false;
  return database.transaction('rw', database.viveiros, database.configuracoes, async () => {
    const key = `visitaTecnicaAplicada:${visit.id}`;
    if (await database.configuracoes.where('chave').equals(key).first()) return false;
    const pond = await database.viveiros.get(visit.pondId);
    if (!pond) throw new Error(`O viveiro ${visit.pondName} não está neste aparelho. Sincronize seus dados para aplicar a visita.`);
    if (visit.correctLocation) {
      const same = (a, b) => (a ?? null) === (b ?? null);
      const previous = same(pond.latitude, visit.previousLatitude) && same(pond.longitude, visit.previousLongitude);
      const alreadyApplied = same(pond.latitude, visit.latitude) && same(pond.longitude, visit.longitude);
      if (!previous && !alreadyApplied) throw new Error(`A localização de ${visit.pondName} mudou depois da visita. Confira o cadastro antes de aplicar outro ajuste.`);
      await database.viveiros.update(pond.id, { latitude: visit.latitude, longitude: visit.longitude, locationAccuracyM: null, locationCapturedAt: null, updatedAt: new Date().toISOString() });
    }
    // The technician's licensing assessment stays in the protected visit history.
    await database.configuracoes.add({ chave: key, visitId: visit.id });
    return true;
  });
}

export async function checkVisitApproval(database, visit) {
  const pond = await database.viveiros.get(visit.pondId);
  if (!pond) throw new Error('Sincronize seus viveiros antes de aceitar esta visita.');
  if (visit.correctLocation && ((pond.latitude ?? null) !== visit.previousLatitude || (pond.longitude ?? null) !== visit.previousLongitude)) {
    throw new Error('A localização mudou depois da visita. Recuse a proposta e peça ao técnico uma nova correção com o cadastro atualizado.');
  }
}
