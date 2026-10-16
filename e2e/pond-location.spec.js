import { test, expect } from '@playwright/test';

test('GPS e coordenadas manuais persistem no viveiro e podem ser corrigidos ou removidos', async ({ page, context }, testInfo) => {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: -10.9472, longitude: -37.0731, accuracy: 12 });
  await page.goto('./');
  await page.getByRole('heading', { name: 'Entrar na minha conta' }).waitFor();
  await page.evaluate(async () => {
    const React = (await import('/node_modules/.vite/deps/react.js')).default;
    const { createRoot } = (await import('/node_modules/.vite/deps/react-dom_client.js')).default;
    const { AccountContext } = await import('/src/components/AccountProvider.jsx');
    const { default: List } = await import('/src/components/ViveirosList.jsx');
    const { getAccountDatabase } = await import('/src/services/db.js');
    const database = getAccountDatabase('pond-location-test');
    await database.viveiros.clear();
    document.getElementById('root').style.display = 'none';
    const host = document.createElement('div'); host.className = 'p-4'; document.body.appendChild(host);
    window.readPonds = () => database.viveiros.toArray();
    function Fixture() {
      const [viveiros, setViveiros] = React.useState([]);
      return React.createElement(AccountContext.Provider, { value: { database } }, React.createElement(List, { viveiros, onReload: async () => setViveiros(await database.viveiros.toArray()) }));
    }
    createRoot(host).render(React.createElement(Fixture));
  });
  await page.getByRole('button', { name: 'Novo Viveiro', exact: true }).click();
  await page.getByRole('button', { name: 'Usar GPS do celular' }).click();
  await expect(page.getByLabel('Latitude', { exact: true })).toHaveValue('-10.9472');
  await expect(page.getByText(/aproximadamente 12 m/)).toBeVisible();
  for (const width of [426, 1440]) {
    await page.setViewportSize({ width, height: 812 });
    await page.screenshot({ path: testInfo.outputPath(`gps-${width}.png`), fullPage: true });
  }
  await page.getByRole('button', { name: 'Salvar Viveiro', exact: true }).click();
  await expect(page.getByRole('link', { name: /Ver localiza/ })).toHaveAttribute('href', /query=-10.9472,-37.0731/);
  expect((await page.evaluate(() => window.readPonds()))[0].locationAccuracyM).toBe(12);
  await page.getByRole('button', { name: 'Editar', exact: true }).click();
  await page.getByLabel('Latitude', { exact: true }).fill('91');
  await page.getByRole('button', { name: /Salvar Altera/ }).click();
  await expect(page.getByRole('alert')).toContainText('-90');
  await page.getByLabel('Latitude', { exact: true }).fill('0');
  await page.getByLabel('Longitude', { exact: true }).fill('-37,1');
  await page.getByRole('button', { name: /Salvar Altera/ }).click();
  await expect(page.getByRole('link', { name: /Ver localiza/ })).toHaveAttribute('href', /query=0,-37.1/);
  expect((await page.evaluate(() => window.readPonds()))[0].locationAccuracyM).toBeNull();
  await page.getByRole('button', { name: 'Editar', exact: true }).click();
  await context.clearPermissions();
  await page.evaluate(() => { navigator.geolocation.getCurrentPosition = (_, fail) => fail({ code: 1 }); });
  await page.getByRole('button', { name: 'Usar GPS do celular' }).click();
  await expect(page.getByRole('alert')).toContainText('Permita');
  await expect(page.getByLabel('Latitude', { exact: true })).toHaveValue('0');
  await page.getByLabel('Latitude', { exact: true }).fill('');
  await page.getByLabel('Longitude', { exact: true }).fill('');
  await page.getByRole('button', { name: /Salvar Altera/ }).click();
  await expect(page.getByRole('link', { name: /Ver localiza/ })).toBeHidden();
  expect((await page.evaluate(() => window.readPonds()))[0].latitude).toBeNull();
});
