import { test as base, expect } from '@playwright/test';

// Isolated UI session: real per-account IndexedDB, no production credentials.
// Authentication itself is covered separately by login/verification tests.
export async function mountProducer(page) {
  await page.evaluate(async () => {
    const React = (await import('/node_modules/.vite/deps/react.js')).default;
    const { createRoot } = (await import('/node_modules/.vite/deps/react-dom_client.js')).default;
    const { AccountContext } = await import('/src/components/AccountProvider.jsx');
    const { default: App } = await import('/src/App.jsx');
    const { default: Updates } = await import('/src/components/AppUpdates.jsx');
    const { getAccountDatabase } = await import('/src/services/db.js');
    const { firestore } = await import('/src/services/firebase.js');
    const source = await (await fetch('/src/services/firebase.js')).text();
    const sdkUrl = source.match(/from\s+["']([^"']*firebase_firestore[^"']*)["']/)[1];
    const { disableNetwork } = await import(sdkUrl);
    await disableNetwork(firestore);
    const database = getAccountDatabase('producer-ui-audit');
    window.auditDatabase = database;
    document.getElementById('root').style.display = 'none';
    document.getElementById('producer-fixture')?.remove();
    const host = document.createElement('div'); host.id = 'producer-fixture'; document.body.append(host);
    const value = { user: { uid: 'producer-ui-audit', email: 'producer@example.invalid', emailVerified: true }, access: { fullName: 'Produtor de Teste', phone: '+5579999999999', role: 'producer' }, accessLoading: false, database, dataVersion: 0, syncStatus: { state: 'local', message: 'Dados de teste neste dispositivo' }, sync() {}, logout() {} };
    createRoot(host).render(React.createElement(Updates, null, React.createElement(AccountContext.Provider, { value }, React.createElement(App))));
  });
  await expect(page.getByRole('navigation', { name: 'Navegação principal' }).filter({ visible: true })).toBeVisible();
}

export const test = base.extend({
  page: async ({ page }, use) => {
    const goto = page.goto.bind(page), reload = page.reload.bind(page);
    page.goto = async (...args) => { const result = await goto(...args); await mountProducer(page); return result; };
    page.reload = async (...args) => { const result = await reload(...args); await mountProducer(page); return result; };
    await use(page);
  },
});
export { expect };
