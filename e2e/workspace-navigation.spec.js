import { test, expect } from '@playwright/test';

for (const role of ['field_technician', 'senior']) {
  test(`todos os tópicos do perfil ${role} abrem sem erro de renderização`, async ({ page }) => {
    await page.setViewportSize({ width: role === 'senior' ? 1440 : 426, height: 900 });
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto('./');
    await page.evaluate(async role => {
      const React = (await import('/node_modules/.vite/deps/react.js')).default;
      const { createRoot } = (await import('/node_modules/.vite/deps/react-dom_client.js')).default;
      const { AccountContext } = await import('/src/components/AccountProvider.jsx');
      const { getAccountDatabase } = await import('/src/services/db.js');
      const { default: Updates } = await import('/src/components/AppUpdates.jsx');
      const { default: Workspace } = role === 'senior' ? await import('/src/components/AdminDashboard.jsx') : await import('/src/components/TechnicianWorkspace.jsx');
      document.getElementById('root').style.display = 'none';
      const host = document.createElement('main'); host.id = 'workspace-fixture'; document.body.append(host);
      const uid = role === 'senior' ? 'Dc2sEKML8Lc66cgj8VvSX4Uhhpk1' : 'technician-navigation';
      const value = { user: { uid, email: 'fixture@example.invalid', emailVerified: true }, access: { role, fullName: 'Pessoa de Teste', phone: '+5579999999999' }, database: getAccountDatabase(uid), syncStatus: { state: 'local' }, technicianIdentity: null };
      createRoot(host).render(React.createElement(Updates, null, React.createElement(AccountContext.Provider, { value }, React.createElement(Workspace))));
    }, role);
    const host = page.locator('#workspace-fixture');
    if (role === 'senior') {
      const buttons = host.getByRole('navigation', { name: 'Administração' }).getByRole('button');
      await expect(buttons).toHaveCount(11);
      const labels = await buttons.allTextContents();
      for (const label of labels) {
        await buttons.filter({ hasText: label }).click();
        await expect(host.getByRole('heading').first()).toBeVisible();
        await expect(host.getByText('Não foi possível abrir esta tela', { exact: true })).toHaveCount(0);
      }
      expect(labels).toHaveLength(11);
    } else {
      const select = host.getByRole('combobox', { name: 'Abrir tópico', exact: true });
      for (const option of ['visits', 'environment', 'licensing', 'map', 'reports', 'profile']) {
        await select.selectOption(option);
        await expect(host.getByRole('heading').first()).toBeVisible();
        await expect(host.getByText('Não foi possível abrir esta tela', { exact: true })).toHaveCount(0);
      }
    }
    expect(errors).toEqual([]);
  });
}

test('erro de renderização mostra recuperação e permite abrir outro conteúdo', async ({ page }) => {
  await page.goto('./');
  await page.evaluate(async () => {
    const React = (await import('/node_modules/.vite/deps/react.js')).default;
    const { createRoot } = (await import('/node_modules/.vite/deps/react-dom_client.js')).default;
    const { default: Boundary } = await import('/src/components/ScreenBoundary.jsx');
    const host = document.createElement('div'); document.body.append(host);
    function Broken() { throw new Error('Falha simulada de teste'); }
    function Fixture() {
      const [broken, setBroken] = React.useState(true); window.openHealthyScreen = () => setBroken(false);
      return React.createElement(Boundary, { key: String(broken) }, broken ? React.createElement(Broken) : React.createElement('p', null, 'Outra tela disponível'));
    }
    createRoot(host).render(React.createElement(Fixture));
  });
  await expect(page.getByRole('heading', { name: 'Não foi possível abrir esta tela' })).toBeVisible();
  await page.evaluate(() => window.openHealthyScreen());
  await expect(page.getByText('Outra tela disponível')).toBeVisible();
});
