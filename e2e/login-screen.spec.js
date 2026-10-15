import { test, expect } from '@playwright/test';

test('login abre antes do painel e oferece cadastro e recuperação', async ({ page }, testInfo) => {
  for (const viewport of [{ width: 426, height: 812 }, { width: 1440, height: 900 }]) {
    await page.setViewportSize(viewport);
    await page.goto('./');
    await expect(page.getByRole('heading', { name: 'Entrar na minha conta' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Viveiros', exact: true })).toBeHidden();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`login-${viewport.width}.png`), fullPage: true });
  }
  await page.getByRole('button', { name: 'Esqueci minha senha' }).click();
  await expect(page.getByRole('heading', { name: 'Recuperar acesso' })).toBeVisible();
  await expect(page.getByLabel('Senha', { exact: true })).toBeHidden();
  await page.getByRole('button', { name: 'Criar conta gratuita' }).click();
  await expect(page.getByLabel('Confirmar senha')).toBeVisible();
});
