import { test, expect } from '@playwright/test';

test('map draws and edits paths and polygons without changing property markers', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 426, height: 812 });
  await page.route('**/ArcGIS/rest/services/**', route => route.abort());
  await page.goto('./');
  await page.evaluate(async () => {
    const React = (await import('/node_modules/.vite/deps/react.js')).default;
    const { createRoot } = (await import('/node_modules/.vite/deps/react-dom_client.js')).default;
    const { default: Map } = await import('/src/components/TechnicalVisitMap.jsx');
    document.getElementById('root').style.display = 'none';
    const host = document.createElement('div'); host.className = 'p-4 max-w-4xl'; document.body.append(host);
    createRoot(host).render(React.createElement(Map, { visits: [{ id: 'fixture', farmName: 'Teste', latitude: -10.95, longitude: -37.07, licenseStatus: 'licensed' }] }));
  });
  const map = page.getByLabel('Mapa das visitas e do licenciamento', { exact: true });
  await page.getByRole('button', { name: 'Caminho', exact: true }).click();
  await map.click({ position: { x: 70, y: 100 } });
  await map.click({ position: { x: 240, y: 100 } });
  await expect(page.getByText(/Distância total:/)).toBeVisible();
  await page.getByRole('button', { name: 'Concluir medição', exact: true }).click();
  await map.click({ position: { x: 240, y: 250 } });
  await expect(page.getByText(/2 de 200 pontos/)).toBeVisible();
  const vertex = page.locator('.leaflet-marker-icon').first();
  const box = await vertex.boundingBox();
  await page.mouse.move(box.x + 16, box.y + 16); await page.mouse.down(); await page.mouse.move(box.x + 36, box.y + 46, { steps: 8 }); await page.mouse.up();
  await expect(page.locator('.leaflet-interactive[fill="#047857"]')).toHaveCount(1);
  page.on('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Polígono / área', exact: true }).click();
  for (const [x, y] of [[70,100],[240,100],[240,250],[70,250]]) await map.click({ position: { x, y } });
  await expect(page.getByText(/Área:.*m².*ha/)).toBeVisible();
  await expect(page.getByText(/Perímetro:/)).toBeVisible();
  await page.getByText('Distância de cada trecho', { exact: true }).click();
  await expect(page.getByText(/Ponto 4 → 1:/)).toBeVisible();
  await page.getByRole('button', { name: 'Concluir medição', exact: true }).click();
  for (const width of [426, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.screenshot({ path: testInfo.outputPath(`measurement-${width}.png`), fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.getByRole('button', { name: 'Desfazer ponto', exact: true }).click();
  await expect(page.getByText(/3 de 200 pontos/)).toBeVisible();
  await page.getByRole('button', { name: 'Limpar medição', exact: true }).click();
  await expect(page.locator('.leaflet-marker-icon')).toHaveCount(0);
  await expect(page.locator('.leaflet-interactive[fill="#047857"]')).toHaveCount(1);
});
