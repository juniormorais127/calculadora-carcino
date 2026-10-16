import { test, expect } from '@playwright/test';
test('tecnico abre historico com seus pontos normais e assistidos sem visualizar os pontos de colegas', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 426, height: 812 });
  await page.goto('./'); await page.getByRole('heading', { name: 'Entrar na minha conta' }).waitFor();
  await page.route('**/ArcGIS/rest/services/**', route => route.abort());
  await page.evaluate(async () => {
    const React = (await import('/node_modules/.vite/deps/react.js')).default;
    const { createRoot } = (await import('/node_modules/.vite/deps/react-dom_client.js')).default;
    const { default: View } = await import('/src/components/TechnicianVisitMap.jsx');
    window.technicianMapQueries = [];
    const own = { id: 'assisted-own', technicianUid: 'tech', propertyName: 'Propriedade assistida' };
    const api = {
      watchAssistedProducers(mode, uid, next) { window.technicianMapQueries.push([mode, uid]); next([own, { id: 'assisted-colleague', technicianUid: 'colleague', propertyName: 'Propriedade privada do colega' }]); return () => {}; },
      watchAssistedVisits(id, next) { window.technicianMapQueries.push(['visits', id]); next([{ id: 'assisted-visit', technicianUid: 'tech', visitedOn: '2026-10-16', latitude: -10.94, longitude: -37.06, licenseStatus: 'licensed' }]); return () => {}; },
    };
    const visits = [{ id: 'normal', technicianUid: 'tech', ownerUid: 'client', pondId: 1, farmName: 'Fazenda normal', pondName: 'Viveiro 1', latitude: -10.95, longitude: -37.07, licenseStatus: 'unlicensed' }, { id: 'colleague', technicianUid: 'colleague', ownerUid: 'other', pondId: 2, farmName: 'Propriedade privada do colega', latitude: -11, longitude: -38, licenseStatus: 'unknown' }];
    function Fixture() { const [request, setRequest] = React.useState(0); return React.createElement(React.Fragment, null, React.createElement('button', { onClick: () => setRequest(value => value + 1) }, 'Mapa e imagens históricas'), React.createElement(View, { uid: 'tech', visits, api, historyRequest: request })); }
    document.getElementById('root').style.display = 'none'; const host = document.createElement('div'); host.className = 'max-w-4xl p-4'; document.body.appendChild(host); createRoot(host).render(React.createElement(Fixture));
  });
  await expect(page.getByText('2 registro(s) de visita com coordenadas.', { exact: false })).toBeVisible();
  await expect(page.locator('path.leaflet-interactive')).toHaveCount(2);
  expect(await page.evaluate(() => window.technicianMapQueries)).toEqual([['technician', 'tech'], ['visits', 'assisted-own']]);
  await page.getByRole('button', { name: 'Mapa e imagens históricas', exact: true }).click();
  const slider = page.getByRole('slider', { name: 'Data da versão histórica do mapa' });
  await expect(slider).toBeVisible({ timeout: 30000 });
  await slider.fill('0');
  await expect(page.locator('path.leaflet-interactive')).toHaveCount(2);
  await page.locator('path.leaflet-interactive').first().click({ force: true });
  await expect(page.locator('.leaflet-popup-content')).toContainText('Fazenda normal');
  await expect(page.getByText('Propriedade privada do colega', { exact: false })).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath('historico-tecnico-mobile.png'), fullPage: true });
});
