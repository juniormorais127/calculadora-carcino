import { test, expect } from './fixtures/producer.js';

test('exclusão de água preserva os demais registros e exclusão do viveiro remove seus vínculos', async ({ page }) => {
  await page.goto('./');
  await page.evaluate(async () => {
    const db = window.auditDatabase;
    await db.viveiros.bulkAdd([1, 2].map(id => ({ id, nome: `Viveiro ${id}`, areaM2: 1000, qtdPovoada: 10000, status: 'ativo' })));
    await db.qualidadeAgua.bulkAdd([1, 2, 3].map(id => ({ id, viveiroId: 1, data: `2026-10-0${id}`, horario: 'Manhã', oxigenio: 5, temperatura: 28, ph: 8, salinidade: 20, alcalinidade: 120 })));
    await db.biometrias.bulkAdd([1, 2].map(id => ({ id, viveiroId: id, data: '2026-10-01', pesoMedioG: 5, biomassaKg: 50 })));
    await db.registrosAlimentacao.bulkAdd([1, 2].map(id => ({ id, viveiroId: id, quantidadeKg: 2 })));
  });
  await page.reload();
  const nav = page.getByRole('navigation', { name: 'Navegação principal' }).filter({ visible: true });
  await nav.getByRole('button', { name: 'Água', exact: true }).click();
  for (const id of [1, 3]) {
    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: `Excluir medição de 2026-10-0${id}`, exact: true }).click();
    await expect(page.getByRole('button', { name: `Excluir medição de 2026-10-0${id}`, exact: true })).toHaveCount(0);
  }
  expect(await page.evaluate(() => window.auditDatabase.qualidadeAgua.toCollection().primaryKeys())).toEqual([2]);
  await nav.getByRole('button', { name: 'Viveiros', exact: true }).click();
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Excluir', exact: true }).first().click();
  await expect(page.getByRole('heading', { name: 'Viveiro 1', exact: true })).toHaveCount(0);
  const records = await page.evaluate(async () => {
    const db = window.auditDatabase;
    return { ponds: await db.viveiros.toCollection().primaryKeys(), bio: await db.biometrias.toCollection().primaryKeys(), feed: await db.registrosAlimentacao.toCollection().primaryKeys(), water: await db.qualidadeAgua.count() };
  });
  expect(records).toEqual({ ponds: [2], bio: [2], feed: [2], water: 0 });
});

test('calculadora usa a última pesagem e a última água quando há duas medições no mesmo dia', async ({ page }) => {
  await page.goto('./');
  await page.evaluate(async () => {
    const db = window.auditDatabase;
    await db.viveiros.add({ id: 1, nome: 'Viveiro Teste', areaM2: 1000, qtdPovoada: 10000, status: 'ativo' });
    await db.biometrias.bulkAdd([{ id: 1, viveiroId: 1, data: '2026-10-01', pesoMedioG: 2, biomassaKg: 20 }, { id: 2, viveiroId: 1, data: '2026-10-01', pesoMedioG: 8, biomassaKg: 80 }]);
    await db.qualidadeAgua.bulkAdd([{ id: 1, viveiroId: 1, data: '2026-10-01', temperatura: 25, oxigenio: 3 }, { id: 2, viveiroId: 1, data: '2026-10-01', temperatura: 29, oxigenio: 6 }]);
  });
  await page.reload();
  await page.getByRole('navigation', { name: 'Navegação principal' }).filter({ visible: true }).getByRole('button', { name: 'Cálculos', exact: true }).click();
  await expect(page.getByRole('spinbutton', { name: '1. Biomassa Total Estimada', exact: true })).toHaveValue('80');
  await expect(page.getByRole('spinbutton', { name: '2. Peso Médio Atual do Camarão', exact: true })).toHaveValue('8');
});

test('falha de armazenamento na biometria mantém formulário aberto e permite tentar novamente', async ({ page }) => {
  await page.goto('./');
  await page.evaluate(async () => {
    await window.auditDatabase.viveiros.add({ id: 1, nome: 'Viveiro Teste', areaM2: 1000, qtdPovoada: 10000, status: 'ativo' });
  });
  await page.reload();
  const nav = page.getByRole('navigation', { name: 'Navegação principal' }).filter({ visible: true });
  await nav.getByRole('button', { name: 'Biometria', exact: true }).click();
  await page.getByRole('button', { name: 'Nova Biometria', exact: true }).click();
  await page.evaluate(() => {
    const table = window.auditDatabase.biometrias;
    const add = table.add.bind(table); window.restoreBiometriaWrites = () => { table.add = add; };
    table.add = async () => { throw new Error('Espaço indisponível no teste'); };
  });
  await page.getByRole('button', { name: 'Gravar Biometria', exact: true }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Espaço indisponível no teste' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Lançar Biometria Semanal' })).toBeVisible();
  await page.evaluate(() => window.restoreBiometriaWrites());
  await page.getByRole('button', { name: 'Gravar Biometria', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Lançar Biometria Semanal' })).toBeHidden();
  expect(await page.evaluate(() => window.auditDatabase.biometrias.count())).toBe(1);
});
