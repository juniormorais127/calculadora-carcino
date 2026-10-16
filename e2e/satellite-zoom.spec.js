import { test, expect } from '@playwright/test';

test('zoom alto reaproveita imagem anterior quando satelite nao tem cobertura detalhada', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 426, height: 812 });
  await page.goto('./'); await page.getByRole('heading', { name: 'Entrar na minha conta' }).waitFor();
  const png = await page.evaluate(() => { const c = document.createElement('canvas'); c.width = c.height = 256; const ctx = c.getContext('2d'); ctx.fillStyle = '#258444'; ctx.fillRect(0, 0, 256, 256); ctx.fillStyle = '#447acc'; ctx.fillRect(128, 128, 128, 128); return c.toDataURL().split(',')[1]; });
  const zooms = [];
  await page.route('https://server.arcgisonline.com/**', route => {
    const zoom = Number(new URL(route.request().url()).pathname.match(/tile\/(\d+)\//)[1]); zooms.push(zoom);
    return zoom >= 18 ? route.fulfill({ status: 404, body: 'No imagery' }) : route.fulfill({ status: 200, contentType: 'image/png', body: Buffer.from(png, 'base64') });
  });
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
  await expect(page.getByText('Ampliando a melhor imagem disponível neste local.', { exact: false })).toBeVisible();
  await expect(zoomIn).toHaveAttribute('aria-disabled', 'true');
  await expect.poll(() => page.locator('canvas.leaflet-tile-loaded').count()).toBeGreaterThan(0);
  expect(zooms).toContain(19); expect(zooms).toContain(17); expect(Math.max(...zooms)).toBe(19);
  expect(await page.evaluate(() => window.testSatelliteCrop({ z: 19, x: 13, y: 10 }, 17))).toEqual({ x: 64, y: 128, width: 64, height: 64 });
  await expect(page.locator('canvas.leaflet-tile-loaded').first()).toHaveAttribute('width', '256');
  await page.screenshot({ path: testInfo.outputPath('zoom-fallback-mobile.png'), fullPage: true });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.screenshot({ path: testInfo.outputPath('zoom-fallback-desktop.png'), fullPage: true });
  await page.getByRole('button', { name: 'Zoom out' }).click();
  await expect(page.locator('canvas.leaflet-tile-loaded').first()).toBeVisible();
});
