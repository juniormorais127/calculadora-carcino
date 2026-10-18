import { test, expect } from '@playwright/test';

test('portal administrativo separado tem login próprio e links corretos', async ({ page }, testInfo) => {
  for (const width of [426, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('./admin/index.html');
    await expect(page).toHaveTitle('Administração | CarcinoGestão');
    await expect(page.getByRole('heading', { name: 'Acesso administrativo' })).toBeVisible();
    await expect(page.getByLabel('E-mail administrativo')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Criar conta gratuita' })).toBeHidden();
    await expect(page.getByRole('button', { name: 'Viveiros', exact: true })).toBeHidden();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`portal-${width}.png`), fullPage: true });
  }
  await page.getByRole('link', { name: 'Esqueci minha senha' }).click();
  await expect(page.getByRole('heading', { name: 'Recuperar acesso' })).toBeVisible();
});

test('build de produção publica a entrada admin com assets válidos', async ({ browser }) => {
  const context = await browser.newContext({ baseURL: `http://127.0.0.1:4175${process.env.VITE_BASE_PATH || '/'}` });
  try {
    const page = await context.newPage();
    await page.goto('./admin/');
    await expect(page.getByRole('heading', { name: 'Acesso administrativo' })).toBeVisible();
    await page.getByRole('link', { name: 'Site dos produtores' }).click();
    await expect(page.getByRole('heading', { name: 'Entrar na minha conta' })).toBeVisible();
  } finally { await context.close(); }
});
