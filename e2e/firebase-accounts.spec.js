import { test, expect } from '@playwright/test';

// Explicit opt-in: creates disposable accounts and synthetic records in the real
// Spark project, then removes only those accounts and their records in finally.
test.skip(process.env.FIREBASE_LIVE_TEST !== '1', 'Use FIREBASE_LIVE_TEST=1 for the live Firebase integration check.');
const apiKey = 'AIzaSyCZFdPGJMK8XyKLDj2P5awhvYaQ55RW56g';
const root = 'https://firestore.googleapis.com/v1/projects/carcinogestao/databases/(default)/documents/';
async function request(path, account, method = 'GET', body) {
  return fetch(root + path, { method, headers: { ...(account ? { Authorization: `Bearer ${account.idToken}` } : {}), 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
}
async function createAccount() {
  const email = `carcino-test-${crypto.randomUUID()}@example.invalid`;
  const password = `Test-${crypto.randomUUID()}!`;
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  if (!response.ok) throw new Error(`Disposable Firebase signup failed: ${response.status}`);
  return { ...await response.json(), email, password };
}
async function cleanup(account) {
  if (!account) return;
  await request(`accountProfiles/${account.localId}`, account, 'DELETE');
  const manifest = await request(`users/${account.localId}/state/current`, account);
  if (manifest.ok) {
    const fields = (await manifest.json()).fields;
    for (const snapshot of [fields.snapshotId?.stringValue, fields.previousSnapshotId?.stringValue].filter(Boolean)) {
      const result = await request(`users/${account.localId}/snapshots/${snapshot}/chunks?pageSize=500`, account);
      if (result.ok) for (const doc of (await result.json()).documents || []) {
        const path = doc.name.split('/documents/')[1]; await request(path, account, 'DELETE');
      }
    }
    await request(`users/${account.localId}/state/current`, account, 'DELETE');
  }
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:delete?key=${apiKey}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken: account.idToken }),
  });
  if (!response.ok) throw new Error('Could not remove disposable Firebase account.');
}
async function login(page, account) {
  await page.goto('./');
  await page.getByLabel('E-mail', { exact: true }).fill(account.email);
  await page.getByLabel('Senha', { exact: true }).fill(account.password);
  await page.locator('form').getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Minha conta', exact: true })).toBeVisible();
  await expect(page.getByText('Dados salvos na sua conta.', { exact: true })).toBeVisible({ timeout: 45000 });
}
async function addPond(page, name) {
  await page.getByRole('button', { name: 'Viveiros', exact: true }).click();
  await page.getByRole('button', { name: 'Novo Viveiro', exact: true }).click();
  await page.getByPlaceholder('Ex: Viveiro 01 - Berçário').fill(name);
  await page.getByRole('button', { name: 'Salvar Viveiro', exact: true }).click();
  await expect(page.getByText(name, { exact: true })).toBeVisible();
}
test('contas privadas, recuperação em outro aparelho, modo offline e login', async ({ browser }, testInfo) => {
  test.setTimeout(180000);
  let a, b;
  const contexts = [];
  try {
    a = await createAccount(); b = await createAccount();
    const contextA = await browser.newContext({ viewport: { width: 426, height: 812 } }); contexts.push(contextA);
    const pageA = await contextA.newPage();
    const errors = []; pageA.on('pageerror', error => errors.push(error.message));
    await pageA.goto('./');
    await pageA.getByRole('button', { name: 'Criar conta gratuita' }).click();
    await pageA.getByLabel('E-mail', { exact: true }).fill('nao-enviar@example.invalid');
    await pageA.getByLabel('Senha', { exact: true }).fill('SenhaTeste123!');
    await pageA.getByLabel('Confirmar senha').fill('OutraSenha123!');
    await pageA.locator('form').getByRole('button', { name: 'Criar conta', exact: true }).click();
    await expect(pageA.getByRole('alert')).toHaveText('As senhas precisam ser iguais.');
    await pageA.screenshot({ path: testInfo.outputPath('login-mobile.png'), fullPage: true });
    await login(pageA, a);
    await addPond(pageA, 'Privado A');
    await expect(pageA.getByText('Dados salvos na sua conta.', { exact: true })).toBeVisible({ timeout: 45000 });

    // Server-side isolation, independent of what the interface displays.
    expect((await request(`users/${a.localId}/state/current`, b)).status).toBe(403);
    expect((await request(`users/${a.localId}/state/current`)).status).toBe(403);
    expect((await request(`users/${a.localId}/snapshots/invasao/chunks/0`, b, 'PATCH', { fields: { text: { stringValue: 'denied' } } })).status).toBe(403);

    const contextB = await browser.newContext({ viewport: { width: 1440, height: 900 } }); contexts.push(contextB);
    const pageB = await contextB.newPage(); await login(pageB, b);
    await pageB.getByRole('button', { name: 'Viveiros', exact: true }).click();
    await expect(pageB.getByText('Privado A', { exact: true })).toBeHidden();
    await addPond(pageB, 'Privado B');
    await expect(pageB.getByText('Dados salvos na sua conta.', { exact: true })).toBeVisible({ timeout: 45000 });
    await pageB.getByRole('button', { name: 'Minha conta', exact: true }).click();
    await pageB.screenshot({ path: testInfo.outputPath('conta-desktop.png'), fullPage: true });

    const secondA = await browser.newContext({ viewport: { width: 426, height: 812 } }); contexts.push(secondA);
    const device = await secondA.newPage(); await login(device, a);
    await device.getByRole('button', { name: 'Viveiros', exact: true }).click();
    await expect(device.getByText('Privado A', { exact: true })).toBeVisible();
    await expect(device.getByText('Privado B', { exact: true })).toBeHidden();
    await secondA.setOffline(true);
    await addPond(device, 'Criado sem internet A');
    await expect(device.getByText(/Sem internet. Alterações salvas/)).toBeVisible();
    await secondA.setOffline(false);
    await expect(device.getByText('Dados salvos na sua conta.', { exact: true })).toBeVisible({ timeout: 45000 });
    await pageA.getByRole('button', { name: 'Minha conta', exact: true }).click();
    await pageA.getByRole('button', { name: 'Sincronizar agora', exact: true }).click();
    await expect(pageA.getByRole('status').filter({ hasText: 'Dados salvos na sua conta.' }).first()).toBeVisible({ timeout: 45000 });
    await pageA.getByRole('button', { name: 'Viveiros', exact: true }).click();
    await expect(pageA.getByText('Criado sem internet A', { exact: true })).toBeVisible();
    await pageA.getByRole('button', { name: 'Minha conta', exact: true }).click();
    await pageA.getByRole('button', { name: 'Sair da conta', exact: true }).click();
    await expect(pageA.getByRole('heading', { name: 'Entrar na minha conta' })).toBeVisible();
    await expect(pageA.getByRole('button', { name: 'Viveiros', exact: true })).toBeHidden();
    await expect(pageA.getByText('Privado A', { exact: true })).toBeHidden();
    await expect(pageA.getByText('Criado sem internet A', { exact: true })).toBeHidden();
    expect(errors).toEqual([]);
  } finally {
    await Promise.all(contexts.map(context => context.close()));
    await cleanup(a); await cleanup(b);
  }
});

test('métricas gravam por conta, reenviam offline e negam leitura geral', async ({ browser }) => {
  test.setTimeout(120000);
  let a, b, context;
  const ids = [];
  try {
    a = await createAccount(); b = await createAccount();
    context = await browser.newContext();
    const page = await context.newPage();
    await login(page, a);
    await expect.poll(async () => (await request(`accountProfiles/${a.localId}`, a)).status, { timeout: 15000 }).toBe(200);
    expect((await request(`accountProfiles/${a.localId}`, b)).status).toBe(403);
    expect((await request('accountProfiles?pageSize=10', a)).status).toBe(403);
    const promote = await request(`accountProfiles/${a.localId}?updateMask.fieldPaths=premium`, a, 'PATCH', { fields: { premium: { booleanValue: true } } });
    expect(promote.status).toBe(403);
    const promoteRole = await request(`accountProfiles/${a.localId}?updateMask.fieldPaths=role`, a, 'PATCH', { fields: { role: { stringValue: 'field_technician' } } });
    expect(promoteRole.status).toBe(403);
    const profile = (await (await request(`accountProfiles/${a.localId}`, a)).json()).fields;
    expect(profile.email.stringValue).toBe(a.email);
    expect(profile.premium.booleanValue).toBe(false);
    expect(profile.role.stringValue).toBe('producer');
    const id = await page.evaluate(async () => {
      const { trackPurchase } = await import('/src/services/purchaseTracking.js');
      return trackPurchase('brand', { id: 'test-only', name: 'Métrica temporária', category: 'Ração' });
    });
    ids.push(id);
    await expect.poll(async () => (await request(`purchaseEvents/${id}`, a)).status, { timeout: 45000 }).toBe(200);
    expect((await request(`purchaseEvents/${id}`, b)).status).toBe(403);
    expect((await request('purchaseEvents?pageSize=10', a)).status).toBe(403);
    expect((await request(`purchaseEvents/${id}`)).status).toBe(403);
    await context.setOffline(true);
    const offlineId = await page.evaluate(async () => {
      const { trackPurchase } = await import('/src/services/purchaseTracking.js');
      return trackPurchase('product', { id: 'test-product', name: 'Produto temporário', category: 'Insumos' });
    });
    ids.push(offlineId);
    expect((await request(`purchaseEvents/${offlineId}`, a)).status).toBe(404);
    await context.setOffline(false);
    await expect.poll(async () => (await request(`purchaseEvents/${offlineId}`, a)).status, { timeout: 45000 }).toBe(200);
    await page.evaluate(async () => (await import('/src/services/purchaseTracking.js')).flushPurchaseEvents());
    const before = (await (await request(`purchaseEvents/${id}`, a)).json()).updateTime;
    await page.evaluate(async () => (await import('/src/services/purchaseTracking.js')).flushPurchaseEvents());
    expect((await (await request(`purchaseEvents/${id}`, a)).json()).updateTime).toBe(before);
  } finally {
    if (context) await context.close();
    if (a) for (const id of ids) if (id) await request(`purchaseEvents/${id}`, a, 'DELETE');
    await cleanup(a); await cleanup(b);
  }
});

test('portal administrativo recusa conta comum e permite sair', async ({ browser }) => {
  let account, context;
  try {
    account = await createAccount();
    context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('./admin/');
    await page.getByLabel('E-mail administrativo').fill(account.email);
    await page.getByLabel('Senha', { exact: true }).fill(account.password);
    await page.getByRole('button', { name: 'Entrar no painel' }).click();
    await expect(page.getByRole('heading', { name: 'Acesso restrito' })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Administração', exact: true })).toBeHidden();
    await page.getByRole('button', { name: 'Entrar com outra conta' }).click();
    await expect(page.getByRole('heading', { name: 'Acesso administrativo' })).toBeVisible();
  } finally {
    if (context) await context.close();
    await cleanup(account);
  }
});
