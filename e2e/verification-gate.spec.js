import { test, expect } from '@playwright/test';

test('serviços só montam após estado de e-mail confirmado', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('heading', { name: 'Entrar na minha conta' }).waitFor();
  await page.evaluate(async () => {
    const React = (await import('/node_modules/.vite/deps/react.js')).default;
    const { createRoot } = (await import('/node_modules/.vite/deps/react-dom_client.js')).default;
    const { AccountContext } = await import('/src/components/AccountProvider.jsx');
    const { default: App } = await import('/src/App.jsx');
    const { getAccountDatabase } = await import('/src/services/db.js');
    document.getElementById('root').style.display = 'none';
    const host = document.createElement('div'); document.body.appendChild(host);
    const user = { uid: 'verification-ui-fixture', email: 'teste@example.com', emailVerified: false };
    const database = getAccountDatabase(user.uid);
    function Fixture() {
      const [, refresh] = React.useState(0);
      window.receiveVerifiedIdentity = () => { user.emailVerified = true; refresh(n => n + 1); };
      return React.createElement(AccountContext.Provider, { value: { user, database, syncStatus: { state: 'synced', message: 'Teste' }, dataVersion: 0 } }, React.createElement(App));
    }
    createRoot(host).render(React.createElement(Fixture));
  });
  await expect(page.getByRole('heading', { name: 'Confirme seu e-mail para continuar' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Biometria', exact: true })).toBeHidden();
  await page.evaluate(() => window.receiveVerifiedIdentity());
  await expect(page.getByRole('button', { name: 'Biometria', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Confirme seu e-mail para continuar' })).toBeHidden();
});
