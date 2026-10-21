import { test, expect } from '@playwright/test';
import { mountProducer, navigateProduction } from './fixtures/producer.js';

test('produtor preserva cadastro, checklist e backup após reabrir', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('./');
  await mountProducer(page);
  const first = page.getByRole('button', { name: 'Cadastrar primeiro viveiro', exact: true });
  await expect(first).toBeVisible();
  await first.click();
  await page.getByRole('button', { name: 'Salvar Viveiro', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Viveiro 01', exact: true })).toBeVisible();
  const nav = page.getByRole('navigation', { name: 'Navegação principal' }).filter({ visible: true });
  await navigateProduction(page, 'Sanidade & BPM');
  await page.getByRole('button', { name: 'Checklist BPM ABCC' }).click();
  const check = page.getByRole('checkbox').first();
  await check.check();
  await expect(check).toBeChecked();
  await navigateProduction(page, 'Ajustes');
  const downloaded = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Baixar Arquivo de Backup (JSON)' }).click();
  const download = await downloaded;
  const stream = await download.createReadStream();
  let json = '';
  for await (const chunk of stream) json += chunk.toString();
  const backup = JSON.parse(json);
  expect(backup.viveiros).toHaveLength(1);
  expect(backup.configuracoes.find(row => row.chave === 'checklistBPM')).toBeTruthy();
  await page.reload();
  await mountProducer(page);
  expect(errors).toEqual([]);
  await navigateProduction(page, 'Viveiros');
  await expect(page.getByRole('heading', { name: 'Viveiro 01', exact: true })).toBeVisible();
  await navigateProduction(page, 'Sanidade & BPM');
  await page.getByRole('button', { name: 'Checklist BPM ABCC' }).click();
  await expect(page.getByRole('checkbox').first()).toBeChecked();
});

test('build de produção reabre a entrada offline sem tela branca', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium', 'Service worker verified in Chromium');
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:4175${process.env.VITE_BASE_PATH || '/'}`);
  await expect(page.getByRole('heading', { name: 'Entrar na minha conta' })).toBeVisible();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) await new Promise(resolve => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }));
  });
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Entrar na minha conta' })).toBeVisible();
  expect(errors).toEqual([]);
});
