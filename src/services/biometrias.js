import { calculateBiomass } from './calculatorService.js';

async function recalculateGrowth(database, viveiroId) {
  const rows = (await database.biometrias.where('viveiroId').equals(viveiroId).toArray())
    .sort((a, b) => String(a.data).localeCompare(String(b.data)) || a.id - b.id);
  for (let index = 0; index < rows.length; index++) {
    const current = rows[index], previous = rows[index - 1];
    const days = previous ? Math.max(1, Math.round((new Date(current.data) - new Date(previous.data)) / 86400000)) : 1;
    const gain = previous ? (Number(current.pesoMedioG) - Number(previous.pesoMedioG)) / days : 0;
    const ganhoDiarioG = Number.isFinite(gain) ? Number(gain.toFixed(3)) : 0;
    const ganhoSemanalG = Number.isFinite(gain) ? Number((gain * 7).toFixed(2)) : 0;
    if (current.ganhoDiarioG !== ganhoDiarioG || current.ganhoSemanalG !== ganhoSemanalG)
      await database.biometrias.update(current.id, { ganhoDiarioG, ganhoSemanalG });
  }
}

export async function saveBiometria(database, pond, input) {
  const pesoMedioG = Number(input.pesoMedioG), sobrevivenciaEstimada = Number(input.sobrevivenciaEstimada);
  if (!pond || !Number.isFinite(pesoMedioG) || pesoMedioG <= 0 || !Number.isFinite(sobrevivenciaEstimada) || sobrevivenciaEstimada < 0 || sobrevivenciaEstimada > 100)
    throw new Error('Informe peso maior que zero e sobrevivência entre 0 e 100%.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.data) || !Number.isFinite(Date.parse(input.data)) || new Date(input.data).toISOString().slice(0, 10) !== input.data)
    throw new Error('Informe uma data de pesagem válida.');
  const stocked = Number(pond.qtdPovoada) || Number(pond.areaM2) * Number(pond.densidadePovoamento || 10);
  if (!Number.isFinite(stocked) || stocked <= 0) throw new Error('Confira a quantidade povoada e a área no cadastro do viveiro.');
  const camaroesEstimados = Math.round(stocked * sobrevivenciaEstimada / 100);
  return database.transaction('rw', database.biometrias, async () => {
    const id = await database.biometrias.add({ viveiroId: pond.id, data: input.data, pesoMedioG, sobrevivenciaEstimada, camaroesEstimados,
      biomassaKg: calculateBiomass(camaroesEstimados, pesoMedioG), notas: input.notas || '', createdAt: new Date().toISOString() });
    await recalculateGrowth(database, pond.id);
    return id;
  });
}

export async function deleteBiometria(database, id) {
  return database.transaction('rw', database.biometrias, async () => {
    const row = await database.biometrias.get(id);
    if (!row) throw new Error('Esta biometria já foi removida. Atualize a tela.');
    await database.biometrias.delete(id);
    await recalculateGrowth(database, row.viveiroId);
  });
}
