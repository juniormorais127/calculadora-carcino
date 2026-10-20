import { test, expect } from '@playwright/test';

async function mountProbe(page) {
  await page.goto('./');
  await page.evaluate(async () => {
    const React = (await import('/node_modules/.vite/deps/react.js')).default;
    const { createRoot } = (await import('/node_modules/.vite/deps/react-dom_client.js')).default;
    const { getAccountDatabase } = await import('/src/services/db.js');
    const { default: useLocal } = await import('/src/components/useLocalProduction.js');
    const database = getAccountDatabase('slow-local-fixture');
    await database.viveiros.add({ id: 1, nome: 'Viveiro preservado' });
    const transaction = database.transaction.bind(database);
    database.transaction = (...args) => new Promise((resolve, reject) => {
      window.completeLocalRead = () => transaction(...args).then(resolve, reject);
    });
    window.localReadyCount = 0;
    function Probe() {
      const state = useLocal(database, 0, () => { window.localReadyCount++; });
      return React.createElement('section', { id: 'local-probe' },
        state.error ? React.createElement('p', { role: 'alert' }, state.error) : null,
        state.loading ? React.createElement('p', null, 'Leitura local em andamento') : null,
        state.hasData ? React.createElement('p', null, state.viveiros[0].nome) : null,
        React.createElement('button', { onClick: state.retry }, 'Reabrir conexão local'));
    }
    const host = document.createElement('div'); document.body.append(host);
    createRoot(host).render(React.createElement(Probe));
  });
  await page.waitForFunction(() => typeof window.completeLocalRead === 'function');
}

test('leitura bloqueada deixa de girar em 5 segundos e recupera ao receber os dados', async ({ page }) => {
  await page.clock.install();
  await mountProbe(page);
  expect(await page.evaluate(() => window.localReadyCount)).toBe(0);
  await page.clock.fastForward(5100);
  await expect(page.locator('#local-probe').getByRole('alert')).toContainText('O armazenamento local demorou');
  await expect(page.getByText('Leitura local em andamento', { exact: true })).toHaveCount(0);
  await page.evaluate(() => window.completeLocalRead());
  await expect(page.getByText('Viveiro preservado', { exact: true })).toBeVisible();
  await expect(page.locator('#local-probe').getByRole('alert')).toHaveCount(0);
  expect(await page.evaluate(() => window.localReadyCount)).toBe(1);
});

test('nova tentativa reabre a conexão sem excluir registros e ignora resposta anterior', async ({ page }) => {
  await mountProbe(page);
  await page.evaluate(() => { window.previousLocalRead = window.completeLocalRead; });
  await page.getByRole('button', { name: 'Reabrir conexão local' }).click();
  await page.waitForFunction(() => window.previousLocalRead !== window.completeLocalRead);
  await page.evaluate(() => window.completeLocalRead());
  await expect(page.getByText('Viveiro preservado', { exact: true })).toBeVisible();
  await page.evaluate(() => window.previousLocalRead());
  expect(await page.evaluate(() => window.localReadyCount)).toBe(1);
});
