import { test, expect } from '@playwright/test';

test('administrador busca por email, libera e revoga Premium', async ({ page }, testInfo) => {
  await page.goto('./');
  await page.getByRole('heading', { name: 'Entrar na minha conta' }).waitFor();
  await page.evaluate(async () => {
    const React = (await import('/node_modules/.vite/deps/react.js')).default;
    const { createRoot } = (await import('/node_modules/.vite/deps/react-dom_client.js')).default;
    const { AccountContext } = await import('/src/components/AccountProvider.jsx');
    const { default: Panel } = await import('/src/components/AdminUsersView.jsx');
    const { ADMIN_UID } = await import('/src/services/purchaseMetrics.js');
    document.getElementById('root').style.display = 'none';
    const host = document.createElement('div'); host.className = 'max-w-6xl mx-auto px-4'; document.body.appendChild(host);
    const loadUsers = async () => ({ users: [{ uid: 'test-only', email: 'produtor@example.com', premium: false }, { uid: 'other', email: 'outro@example.com', premium: false }], more: false });
    window.savedPermissions = [];
    const savePermission = async (...args) => { window.savedPermissions.push(args); };
    createRoot(host).render(React.createElement(AccountContext.Provider, { value: { user: { uid: ADMIN_UID } } }, React.createElement(Panel, { loadUsers, savePermission })));
  });
  await page.getByLabel('Buscar e-mail').fill('produtor@');
  await expect(page.getByText('outro@example.com', { exact: true })).toBeHidden();
  await page.getByRole('button', { name: 'Editar permissões de produtor@example.com' }).click();
  await page.getByLabel('Perfil do usuário', { exact: true }).selectOption('field_technician');
  for (const width of [426, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`usuarios-${width}.png`), fullPage: true });
  }
  await page.getByLabel('Liberar Premium').check();
  await page.getByRole('button', { name: 'Salvar permissões' }).click();
  await expect(page.getByRole('status')).toContainText('Premium liberado');
  expect(await page.evaluate(() => window.savedPermissions[0].slice(0, 2))).toEqual(['test-only', { role: 'field_technician', premium: true, expiresAt: null }]);
  await expect(page.getByRole('cell', { name: 'Técnico de campo', exact: true })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Premium ativo', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Editar permissões de produtor@example.com' }).click();
  await page.getByLabel('Liberar Premium').uncheck();
  await page.getByRole('button', { name: 'Salvar permissões' }).click();
  await expect(page.getByRole('status')).toContainText('acesso gratuito');
  expect(await page.evaluate(() => window.savedPermissions[1][1])).toEqual({ role: 'field_technician', premium: false, expiresAt: null });
  await page.getByLabel('Filtrar por perfil').selectOption('producer');
  await expect(page.getByText('produtor@example.com', { exact: true })).toBeHidden();
});
