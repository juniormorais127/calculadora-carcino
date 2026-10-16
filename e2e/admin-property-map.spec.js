import { test, expect } from '@playwright/test';

test('mapa administrativo mostra cadastros licenciados em verde e nao licenciados em vermelho', async ({ page }, testInfo) => {
  await page.route('https://tile.openstreetmap.org/**', route => route.abort());
  await page.goto('./');
  await page.getByRole('heading', { name: 'Entrar na minha conta' }).waitFor();
  await page.evaluate(async () => {
    const React = (await import('/node_modules/.vite/deps/react.js')).default;
    const { createRoot } = (await import('/node_modules/.vite/deps/react-dom_client.js')).default;
    const { default: View } = await import('/src/components/AdminPropertyMap.jsx');
    const farms = ['a', 'b', 'c'].map((id, index) => ({ ownerUid: id, ownerEmail: `${id}@example.com`, name: `Propriedade ${id}`, ponds: [{ id: 1, name: 'Viveiro 1', latitude: -10 - index, longitude: -37 }] }));
    const reports = [{ id: 'r1', clientEmail: 'b@example.com', propertyName: 'Propriedade b', visitedOn: '2026-10-16', licenseStatus: 'unlicensed', status: 'pending' }];
    const visits = [{ ownerUid: 'a', visitedOn: '2026-10-16', licenseStatus: 'licensed', status: 'accepted' }];
    const subscribe = (name, field, uid, next) => { next(name === 'fieldFarms' ? farms : name === 'technicalVisits' ? visits : reports); return () => {}; };
    document.getElementById('root').style.display = 'none';
    const host = document.createElement('div'); host.className = 'max-w-6xl mx-auto px-4'; document.body.appendChild(host);
    createRoot(host).render(React.createElement(View, { subscribe }));
  });
  await expect(page.locator('.leaflet-interactive[fill="#047857"]')).toHaveCount(1);
  await expect(page.locator('.leaflet-interactive[fill="#be123c"]')).toHaveCount(1);
  await expect(page.locator('.leaflet-interactive[fill="#475569"]')).toHaveCount(1);
  for (const width of [426, 1440]) { await page.setViewportSize({ width, height: 900 }); await page.screenshot({ path: testInfo.outputPath(`mapa-${width}.png`), fullPage: true }); }
  await page.getByLabel('Filtrar licenciamento').selectOption('unlicensed');
  await expect(page.locator('.leaflet-interactive[fill="#be123c"]')).toHaveCount(1);
  await expect(page.locator('.leaflet-interactive[fill="#047857"]')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Propriedade b · Viveiro 1' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Propriedade a · Viveiro 1' })).toBeHidden();
});
