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
    window.savedContacts = [];
    const saveContact = async (...args) => { window.savedContacts.push(args); };
    createRoot(host).render(React.createElement(AccountContext.Provider, { value: { user: { uid: ADMIN_UID } } }, React.createElement(Panel, { loadUsers, savePermission, saveContact })));
  });
  await page.getByLabel('Buscar e-mail').fill('produtor@');
  await expect(page.getByText('outro@example.com', { exact: true })).toBeHidden();
  await page.getByRole('button', { name: 'Editar contato de produtor@example.com' }).click();
  await page.getByLabel('Celular com DDD').fill('(79) 99999-4321');
  await page.getByRole('button', { name: 'Salvar celular' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Celular atualizado' })).toBeVisible();
  expect(await page.evaluate(() => window.savedContacts[0].slice(0, 2))).toEqual(['test-only', '+5579999994321']);
  await expect(page.getByRole('link', { name: '+5579999994321' })).toBeVisible();
  await page.getByRole('button', { name: 'Fechar contato' }).click();
  await page.getByRole('button', { name: 'Editar permissões de produtor@example.com' }).click();
  await page.getByLabel('Perfil do usuário', { exact: true }).selectOption('field_technician');
  for (const width of [426, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`usuarios-${width}.png`), fullPage: true });
  }
  await page.getByLabel('Liberar Premium').check();
  await page.getByLabel('Autorizar suporte técnico e auditar cadastros assistidos').check();
  await page.getByRole('button', { name: 'Salvar permissões' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Premium liberado' })).toBeVisible();
  expect(await page.evaluate(() => window.savedPermissions[0].slice(0, 2))).toEqual(['test-only', { role: 'field_technician', premium: true, expiresAt: null, canAuthorizeTechnicalSupport: true }]);
  await expect(page.getByRole('cell', { name: 'Técnico de campo', exact: true })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Premium ativo', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Editar permissões de produtor@example.com' }).click();
  await page.getByLabel('Liberar Premium').uncheck();
  await page.getByLabel('Autorizar suporte técnico e auditar cadastros assistidos').uncheck();
  await page.getByRole('button', { name: 'Salvar permissões' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'acesso gratuito' })).toBeVisible();
  expect(await page.evaluate(() => window.savedPermissions[1][1])).toEqual({ role: 'field_technician', premium: false, expiresAt: null, canAuthorizeTechnicalSupport: false });
  await page.getByLabel('Filtrar por perfil').selectOption('producer');
  await expect(page.getByText('produtor@example.com', { exact: true })).toBeHidden();
});

test('administrador só pode editar produtores e técnicos', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('heading', { name: 'Entrar na minha conta' }).waitFor();
  await page.evaluate(async () => {
    const React = (await import('/node_modules/.vite/deps/react.js')).default;
    const { createRoot } = (await import('/node_modules/.vite/deps/react-dom_client.js')).default;
    const { AccountContext } = await import('/src/components/AccountProvider.jsx');
    const { default: Panel } = await import('/src/components/AdminUsersView.jsx');
    document.getElementById('root').style.display = 'none';
    const host = document.createElement('div'); host.className = 'max-w-6xl mx-auto px-4'; document.body.appendChild(host);
    const loadUsers = async () => ({ users: ['producer', 'field_technician', 'administrator', 'senior'].map(role => ({ uid: role, email: `${role}@example.com`, role, premium: false })), more: false });
    createRoot(host).render(React.createElement(AccountContext.Provider, { value: { user: { uid: 'delegated' }, access: { role: 'administrator' } } }, React.createElement(Panel, { loadUsers })));
  });
  await expect(page.getByRole('button', { name: 'Editar permissões de administrator@example.com' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Editar permissões de senior@example.com' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Editar permissões de field_technician@example.com' })).toBeEnabled();
  await page.getByRole('button', { name: 'Editar permissões de producer@example.com' }).click();
  await expect(page.locator('#account-role option')).toHaveCount(2);
  await expect(page.locator('#account-role option[value=administrator]')).toHaveCount(0);
  await expect(page.locator('#account-role option[value=senior]')).toHaveCount(0);
});
