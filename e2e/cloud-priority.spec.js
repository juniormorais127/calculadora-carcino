import { test, expect } from '@playwright/test';

test('reconecta e envia alterações offline, recebe nuvem em tempo real e não repete gravações', async ({ page }) => {
  await page.goto('./');
  await page.evaluate(async () => {
    const React = (await import('/node_modules/.vite/deps/react.js')).default;
    const { createRoot } = (await import('/node_modules/.vite/deps/react-dom_client.js')).default;
    const { default: Provider, useAccount } = await import('/src/components/AccountProvider.jsx');
    const { firestore } = await import('/src/services/firebase.js');
    const source = await (await fetch('/src/services/firebase.js')).text();
    const { disableNetwork } = await import(source.match(/from\s+["']([^"']*firebase_firestore[^"']*)["']/)[1]);
    await disableNetwork(firestore);
    window.connected = true; Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => window.connected });
    const empty = { versao: 1, viveiros: [{ id: 1, nome: 'Nuvem inicial', areaM2: 1000 }], biometrias: [], qualidadeAgua: [], registrosAlimentacao: [], configuracoes: [] };
    window.serverState = { revision: 1, data: empty }; window.serverReads = 0; window.serverWrites = 0;
    let listener = () => {};
    const remote = {
      read: async () => { window.serverReads++; if (!window.connected) throw new Error('offline'); return structuredClone(window.serverState); },
      write: async (data, revision) => {
        if (!window.connected) throw new Error('offline');
        if (revision !== window.serverState.revision) throw Object.assign(new Error(), { code: 'sync/conflict' });
        window.serverWrites++; window.serverState = { revision: revision + 1, data: structuredClone(data) }; listener(window.serverState.revision); return revision + 1;
      },
      watchChanges(next) { listener = next; return () => { listener = () => {}; }; },
    };
    window.changeCloudName = name => { window.serverState.data.viveiros[0].nome = name; window.serverState.revision++; listener(window.serverState.revision); };
    function Probe() {
      const { user, database, markLocalReady, syncStatus } = useAccount();
      window.syncDatabase = database;
      React.useEffect(() => { markLocalReady(); }, [markLocalReady]);
      return React.createElement('section', { id: 'cloud-probe', 'data-sync-state': syncStatus.state }, syncStatus.message);
    }
    const host = document.createElement('div'); document.body.append(host);
    createRoot(host).render(React.createElement(Provider, {
      observeAuth: (_auth, next) => { next({ uid: 'auto-cloud-fixture', email: 'fixture@example.invalid', emailVerified: true }); return () => {}; },
      createRemote: () => remote,
    }, React.createElement(Probe)));
  });
  await expect(page.locator('#cloud-probe')).toHaveAttribute('data-sync-state', 'synced');
  await page.evaluate(async () => {
    window.connected = false; window.dispatchEvent(new Event('offline'));
    await window.syncDatabase.biometrias.add({ id: 1, viveiroId: 1, pesoMedioG: 5, data: '2026-10-20' });
    window.changeCloudName('Editado em outro aparelho');
  });
  await expect(page.locator('#cloud-probe')).toHaveAttribute('data-sync-state', 'pending');
  await page.evaluate(() => { window.connected = true; window.dispatchEvent(new Event('online')); });
  await expect(page.locator('#cloud-probe')).toHaveAttribute('data-sync-state', 'synced');
  expect(await page.evaluate(() => window.serverState.data.biometrias[0].pesoMedioG)).toBe(5);
  expect(await page.evaluate(async () => (await window.syncDatabase.viveiros.get(1)).nome)).toBe('Editado em outro aparelho');
  await page.evaluate(() => window.changeCloudName('Nova atualização remota'));
  await expect.poll(() => page.evaluate(async () => (await window.syncDatabase.viveiros.get(1)).nome)).toBe('Nova atualização remota');
  await expect(page.locator('#cloud-probe')).toHaveAttribute('data-sync-state', 'synced');
  const writes = await page.evaluate(() => window.serverWrites);
  const reads = await page.evaluate(() => window.serverReads);
  await page.waitForTimeout(2200);
  expect(await page.evaluate(() => window.serverWrites)).toBe(writes);
  expect(await page.evaluate(() => window.serverReads)).toBeLessThanOrEqual(reads + 1);
});
