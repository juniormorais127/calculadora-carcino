import { test, expect } from '@playwright/test';

test('new producer, local persistence, backup and offline reload', async ({ page, context, browserName }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('requestfailed', request => errors.push(`${request.url()}: ${request.failure()?.errorText}`));
  test.skip(browserName !== 'chromium', 'Service worker emulation verified in Chromium');
  const base = process.env.VITE_BASE_PATH || '/';
  await page.goto(`http://127.0.0.1:4175${base}`);
  const first = page.getByRole('button', { name: 'Cadastrar primeiro viveiro', exact: true });
  await expect(first).toBeVisible();
  await first.click();
  await page.getByRole('button', { name: 'Salvar Viveiro', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Viveiro 01', exact: true })).toBeVisible();
  const nav = page.getByRole('navigation', { name: 'Navegação principal' }).filter({ visible: true });
  await nav.getByRole('button', { name: 'Sanidade & BPM', exact: true }).click();
  await page.getByRole('button', { name: 'Checklist BPM ABCC' }).click();
  const check = page.getByRole('checkbox').first();
  await check.check();
  await expect(check).toBeChecked();
  await nav.getByRole('button', { name: 'Ajustes', exact: true }).click();
  const downloaded = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Baixar Arquivo de Backup (JSON)' }).click();
  const download = await downloaded;
  const stream = await download.createReadStream();
  let json = '';
  for await (const chunk of stream) json += chunk.toString();
  const backup = JSON.parse(json);
  expect(backup.viveiros).toHaveLength(1);
  expect(backup.configuracoes.find(row => row.chave === 'checklistBPM')).toBeTruthy();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise(resolve => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }));
    }
  });
  await context.setOffline(true);
  await page.reload();
  expect(errors).toEqual([]);
  await nav.getByRole('button', { name: 'Viveiros', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Viveiro 01', exact: true })).toBeVisible();
  await nav.getByRole('button', { name: 'Sanidade & BPM', exact: true }).click();
  await page.getByRole('button', { name: 'Checklist BPM ABCC' }).click();
  await expect(page.getByRole('checkbox').first()).toBeChecked();
});
