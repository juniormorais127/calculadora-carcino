import { test, expect } from './fixtures/producer.js';

test('exclui primeira, intermediária e última biometria sem reaparecer após reabrir', async ({ page }) => {
  await page.goto('./');
  await page.evaluate(async () => {
    const db = window.auditDatabase;
    await db.viveiros.add({ id: 1, nome: 'Viveiro Teste', areaM2: 1000, qtdPovoada: 10000, status: 'ativo' });
    await db.biometrias.bulkAdd([1, 2, 3, 4].map(id => ({ id, viveiroId: 1, data: `2026-10-0${id}`, pesoMedioG: id * 2, sobrevivenciaEstimada: 85, biomassaKg: 10 * id, ganhoSemanalG: 1, ganhoDiarioG: 0.1 })));
  });
  await page.reload();
  const nav = page.getByRole('navigation', { name: 'Navegação principal' }).filter({ visible: true });
  await nav.getByRole('button', { name: 'Biometria', exact: true }).click();
  for (const id of [1, 3, 4, 2]) {
    const row = page.getByRole('row').filter({ has: page.getByRole('cell', { name: `2026-10-0${id}`, exact: true }) });
    page.once('dialog', dialog => dialog.accept());
    await row.getByRole('button').click();
    await expect(row).toHaveCount(0);
    expect(await page.evaluate(id => window.auditDatabase.biometrias.get(id), id)).toBeUndefined();
  }
  await page.reload();
  await nav.getByRole('button', { name: 'Biometria', exact: true }).click();
  await expect(page.getByText(/Nenhuma biometria cadastrada para este viveiro/)).toBeVisible();
});

test('dados antigos com peso em texto e área ausente permitem navegar e lançar nova pesagem', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('./');
  await page.evaluate(async () => {
    await window.auditDatabase.viveiros.add({ id: 1, nome: 'Viveiro Antigo', qtdPovoada: 10000, status: 'ativo' });
    await window.auditDatabase.biometrias.add({ id: 1, viveiroId: 1, data: '2026-10-01', pesoMedioG: '2', biomassaKg: 20, sobrevivenciaEstimada: 90 });
  });
  await page.reload();
  const nav = page.getByRole('navigation', { name: 'Navegação principal' }).filter({ visible: true });
  await expect(page.getByText('Área: não informada')).toBeVisible();
  await nav.getByRole('button', { name: 'Viveiros', exact: true }).click();
  await expect(page.getByText('Área não informada')).toBeVisible();
  await nav.getByRole('button', { name: 'Biometria', exact: true }).click();
  await page.getByRole('button', { name: 'Nova Biometria', exact: true }).click();
  await expect(page.locator('input[type=number]').first()).toHaveValue('3.2');
  await page.getByRole('button', { name: 'Gravar Biometria', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Lançar Biometria Semanal' })).toBeHidden();
  await expect(page.getByRole('cell', { name: '3.2 g', exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});
