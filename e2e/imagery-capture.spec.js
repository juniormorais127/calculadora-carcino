import { test, expect } from '@playwright/test';

test('historical capture metadata follows the displayed release and never substitutes the publication date', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 426, height: 812 });
  await page.goto('./');
  const png = await page.evaluate(() => { const c = document.createElement('canvas'); c.width = c.height = 256; c.getContext('2d').fillRect(0, 0, 256, 256); return c.toDataURL().split(',')[1]; });
  await page.route('**/World_Imagery/**/tile/**', route => route.fulfill({ contentType: 'image/png', body: Buffer.from(png, 'base64') }));
  let date = 1073088000000;
  const queries = [];
  await page.route('https://metadata.maptiles.arcgis.com/**', route => {
    queries.push(route.request().url());
    return route.fulfill({ json: { features: [{ attributes: { SRC_DATE2: date, NICE_DESC: 'Test provider', SRC_DESC: 'Test sensor', SAMP_RES: 1, SRC_ACC: 5 } }] } });
  });
  await page.evaluate(async () => {
    const React = (await import('/node_modules/.vite/deps/react.js')).default;
    const { createRoot } = (await import('/node_modules/.vite/deps/react-dom_client.js')).default;
    const { default: Map } = await import('/src/components/TechnicalVisitMap.jsx');
    document.getElementById('root').style.display = 'none';
    const host = document.createElement('div'); host.className = 'p-4 max-w-4xl'; document.body.append(host);
    createRoot(host).render(React.createElement(Map, { visits: [{ id: 'test', latitude: -10.95, longitude: -37.07, farmName: 'Fixture' }] }));
  });
  await expect(page.getByRole('button', { name: 'Satélite atual', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Comparar imagens históricas', exact: true }).click();
  const slider = page.getByRole('slider', { name: 'Data da versão histórica do mapa' });
  await page.getByLabel('Consultar mapa até a data', { exact: true }).fill('2014-02-20');
  await page.getByRole('button', { name: 'Carregar data', exact: true }).click();
  await expect(page.getByText('Versão exibida: publicada em 2014-02-20.', { exact: false })).toBeVisible();
  await expect(page.locator('canvas.leaflet-tile-loaded').first()).toBeVisible();
  const check = page.getByRole('button', { name: 'Consultar captura no centro do mapa', exact: true });
  await check.click();
  await expect(page.getByText('Data de captura informada pelo provedor: 03/01/2004', { exact: true })).toBeVisible();
  expect(queries.at(-1)).toContain('World_Imagery_Metadata_2014_r01');
  const geometry = JSON.parse(new URL(queries.at(-1)).searchParams.get('geometry'));
  expect(geometry.x).toBeCloseTo(-37.07, 4);
  expect(geometry.y).toBeCloseTo(-10.95, 4);
  await page.screenshot({ path: testInfo.outputPath('capture-mobile.png'), fullPage: true });
  date = Date.UTC(2040, 0, 1);
  await check.click();
  await expect(page.getByText('Data de captura informada pelo provedor: não disponível para este ponto', { exact: true })).toBeVisible();
  await slider.fill(await slider.getAttribute('max'));
  await expect(page.getByText('Data de captura informada pelo provedor:', { exact: false })).toHaveCount(0);
  await page.route('https://metadata.maptiles.arcgis.com/**', route => route.abort());
  await check.click();
  await expect(page.getByText(/A data da publicação não será usada como substituta/)).toBeVisible();
});
