import { test, expect } from '@playwright/test';

test('link inválido permite solicitar nova recuperação', async ({ page }) => {
  await page.goto('./?mode=resetPassword&oobCode=invalid-test-code');
  await expect(page.getByRole('alert')).toContainText('Este link expirou');
  await expect(page).not.toHaveURL(/oobCode/);
  await page.getByRole('link', { name: 'Solicitar novo link' }).click();
  await expect(page.getByRole('heading', { name: 'Recuperar acesso' })).toBeVisible();
});

test('nova senha é validada e enviada com o código do link', async ({ page }, testInfo) => {
  let saved;
  await page.route('**/accounts:resetPassword?*', async route => {
    const data = route.request().postDataJSON();
    if (data.newPassword) saved = data;
    await route.fulfill({ json: { email: 'produtor@example.com', requestType: 'PASSWORD_RESET' } });
  });
  await page.setViewportSize({ width: 426, height: 812 });
  await page.goto('./?mode=resetPassword&oobCode=test-only-code');
  await expect(page.getByLabel('Nova senha', { exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('recuperacao-mobile.png'), fullPage: true });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.screenshot({ path: testInfo.outputPath('recuperacao-desktop.png'), fullPage: true });
  await page.getByLabel('Nova senha', { exact: true }).fill('NovaSenha123!');
  await page.getByLabel('Confirmar nova senha', { exact: true }).fill('Diferente123!');
  await page.getByRole('button', { name: 'Salvar nova senha' }).click();
  await expect(page.getByRole('alert')).toHaveText('As senhas precisam ser iguais.');
  expect(saved).toBeUndefined();
  await page.getByLabel('Confirmar nova senha', { exact: true }).fill('NovaSenha123!');
  await page.getByRole('button', { name: 'Salvar nova senha' }).click();
  await expect(page.getByRole('heading', { name: 'Senha redefinida' })).toBeVisible();
  expect(saved).toMatchObject({ oobCode: 'test-only-code', newPassword: 'NovaSenha123!' });
  await page.getByRole('link', { name: 'Voltar ao acesso' }).click();
  await expect(page.getByRole('heading', { name: 'Entrar na minha conta' })).toBeVisible();
});
