import { test, expect } from '@playwright/test';

test('zoom alto reaproveita imagem anterior quando satelite nao tem cobertura detalhada', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 426, height: 812 });
  await page.goto('./'); await page.getByRole('heading', { name: 'Entrar na minha conta' }).waitFor();
  const png = await page.evaluate(() => { const c = document.createElement('canvas'); c.width = c.height = 256; const ctx = c.getContext('2d'); ctx.fillStyle = '#258444'; ctx.fillRect(0, 0, 256, 256); ctx.fillStyle = '#447acc'; ctx.fillRect(128, 128, 128, 128); return c.toDataURL().split(',')[1]; });
  const zooms = [];
  const pending = []; let holdDetails = true;
  await page.route('**/World_Imagery/MapServer/tile/**', route => {
    const zoom = Number(new URL(route.request().url()).pathname.match(/tile\/(\d+)\//)[1]); zooms.push(zoom);
    if ((zoom === 16 || zoom >= 18) && holdDetails) return new Promise(resolve => pending.push(() => route.fulfill({ status: 404, body: 'No imagery' }).then(resolve)));
    return zoom >= 18 ? route.fulfill({ status: 404, body: 'No imagery' }) : route.fulfill({ status: 200, contentType: 'image/png', body: Buffer.from(png, 'base64') });
  });
  await page.route('https://tile.openstreetmap.org/**', route => route.fulfill({ status: 200, contentType: 'image/png', body: Buffer.from(png, 'base64') }));
  await page.evaluate(async () => {
    const React = (await import('/node_modules/.vite/deps/react.js')).default;
    const { createRoot } = (await import('/node_modules/.vite/deps/react-dom_client.js')).default;
    const { default: Map } = await import('/src/components/TechnicalVisitMap.jsx');
    const { satelliteCrop } = await import('/src/services/satelliteLayer.js');
    window.testSatelliteCrop = satelliteCrop;
    document.getElementById('root').style.display = 'none'; const host = document.createElement('div'); host.className = 'max-w-3xl p-4'; document.body.appendChild(host);
    createRoot(host).render(React.createElement(Map, { visits: [{ id: 'zoom-test', ownerUid: 'client', pondId: 1, farmName: 'Fazenda Rio', pondName: 'Viveiro 1', latitude: -10.95, longitude: -37.07, licenseStatus: 'unlicensed', technicianUid: 'tech', visitedOn: '2026-10-16' }] }));
  });
  await expect(page.locator('canvas.leaflet-tile-loaded').first()).toBeVisible();
  const zoomIn = page.getByRole('button', { name: 'Zoom in' });
  for (let i = 0; i < 6; i++) {
    await zoomIn.click();
    // Leaflet ignores additional clicks during its 250 ms zoom transition.
    await page.waitForTimeout(350);
  }
  await expect(zoomIn).toHaveAttribute('aria-disabled', 'true');
  // The detailed provider requests are still blocked, but cached imagery is
  // already visible in the current level instead of waiting on 404 responses.
  await expect(page.locator('.leaflet-tile-pane .leaflet-tile-container').last().locator('canvas.leaflet-tile-loaded').first()).toBeVisible();
  expect(zooms).not.toContain(6);
  holdDetails = false; await Promise.all(pending.map(release => release()));
  await expect(page.getByText('Ampliando a melhor imagem disponível neste local.', { exact: false })).toBeVisible();
  await expect.poll(() => page.locator('canvas.leaflet-tile-loaded').count()).toBeGreaterThan(0);
  expect(zooms).toContain(19); expect(zooms).toContain(17); expect(Math.max(...zooms)).toBe(19);
  expect(await page.evaluate(() => window.testSatelliteCrop({ z: 19, x: 13, y: 10 }, 17))).toEqual({ x: 64, y: 128, width: 64, height: 64 });
  await expect(page.locator('canvas.leaflet-tile-loaded').first()).toHaveAttribute('width', '256');
  await page.screenshot({ path: testInfo.outputPath('zoom-fallback-mobile.png'), fullPage: true });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.screenshot({ path: testInfo.outputPath('zoom-fallback-desktop.png'), fullPage: true });
  const initialCount = zooms.length;
  await page.getByRole('button', { name: 'Mapa de ruas', exact: true }).click();
  await page.getByRole('button', { name: 'Satélite atual', exact: true }).click();
  await expect(page.locator('canvas.leaflet-tile-loaded').first()).toBeVisible();
  expect(zooms.length).toBe(initialCount);
  await page.getByRole('button', { name: 'Zoom out' }).click();
  await expect(page.locator('canvas.leaflet-tile-loaded').first()).toBeVisible();
});
