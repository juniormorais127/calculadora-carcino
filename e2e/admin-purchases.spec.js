import { test, expect } from '@playwright/test';

async function mount(page, admin = true) {
  await page.goto('./');
  await page.getByRole('heading', { name: 'Entrar na minha conta' }).waitFor();
  await page.evaluate(async admin => {
    const React = (await import('/node_modules/.vite/deps/react.js')).default;
    const { createRoot } = (await import('/node_modules/.vite/deps/react-dom_client.js')).default;
    const { AccountContext } = await import('/src/components/AccountProvider.jsx');
    const { default: Panel } = await import('/src/components/AdminPurchasesView.jsx');
    const { ADMIN_UID } = await import('/src/services/purchaseMetrics.js');
    document.getElementById('root').style.display = 'none';
    const host = document.createElement('div'); host.className = 'max-w-6xl mx-auto px-4'; document.body.appendChild(host);
    const event = (uid, kind, targetId = 'adm', targetName = 'ADM') => ({ uid, kind, targetId, targetName, category: 'Ração', occurredAt: Date.now() });
    const rows = [event('a', 'view'), event('b', 'view'), event('a', 'brand'), event('a', 'brand'), event('b', 'brand'), event('a', 'whatsapp', 'seller', 'Vendedor Teste')];
    const readPage = async () => ({ size: rows.length, docs: rows.map((data, i) => ({ id: String(i), data: () => data })) });
    createRoot(host).render(React.createElement(AccountContext.Provider, { value: { user: { uid: admin ? ADMIN_UID : 'other' } } }, React.createElement(Panel, { readPage })));
  }, admin);
}
test('painel calcula métricas, filtra e exporta sem expor identidades', async ({ page }, testInfo) => {
  await mount(page);
  await expect(page.getByRole('cell', { name: 'Interesse em marca', exact: true })).toBeVisible();
  const brand = page.getByRole('row').filter({ hasText: 'Interesse em marca' });
  await expect(brand.getByRole('cell').nth(2)).toHaveText('3');
  await expect(brand.getByRole('cell').nth(3)).toHaveText('2');
  for (const width of [426, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`admin-${width}.png`), fullPage: true });
  }
  await page.getByRole('combobox', { name: 'Ação', exact: true }).selectOption('whatsapp');
  await expect(page.getByRole('row').filter({ hasText: 'Interesse em marca' })).toBeHidden();
  await expect(page.getByRole('row').filter({ hasText: 'Vendedor Teste' })).toBeVisible();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar CSV' }).click();
  expect((await download).suggestedFilename()).toBe('interesse-compras.csv');
});
test('conta comum não acessa o painel', async ({ page }) => {
  await mount(page, false);
  await expect(page.getByRole('alert')).toHaveText('Área restrita à administração.');
  await expect(page.getByRole('button', { name: 'Exportar CSV' })).toBeHidden();
});
