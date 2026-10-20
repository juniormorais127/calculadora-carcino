import { test, expect } from './fixtures/producer.js';

test('guia de doenças exibe foto clínica e fonte ABCC ao clicar na doença, com ampliação em modal', async ({ page }) => {
  await page.goto('./');

  // 1. Navegar até a aba Sanidade & BPM
  const nav = page.getByRole('navigation', { name: 'Navegação principal' }).filter({ visible: true });
  await nav.getByRole('button', { name: 'Sanidade & BPM', exact: true }).click();

  // 2. Verificar que o Guia de Doenças está ativo e exibe as fotos clínicas e fontes ABCC
  await expect(page.getByRole('button', { name: 'Guia de Doenças' })).toBeVisible();

  // WSSV já inicia expandido: deve mostrar foto e citação da ABCC
  const fotoWssv = page.locator('img[src*="images/doencas/wssv.jpg"]');
  await expect(fotoWssv).toBeVisible();
  await expect(page.getByText(/Fonte:.*ABCC/i).first()).toBeVisible();

  // 3. Clicar em outra doença (ex: Mionecrose Infecciosa - IMNV)
  const botaoImnv = page.getByRole('button', { name: /Mionecrose Infecciosa/i });
  await botaoImnv.click();

  // Foto do IMNV e fonte da ABCC devem ficar visíveis
  const fotoImnv = page.locator('img[src*="images/doencas/imnv.png"]');
  await expect(fotoImnv).toBeVisible();
  await expect(page.getByText(/Dr\. Arun K\. Dhar.*ABCC/i)).toBeVisible();

  // 4. Clicar na foto ou no botão "Ampliar Foto" para abrir o modal lightbox
  await page.getByRole('button', { name: 'Ampliar Foto', exact: true }).click();

  // O modal deve ser exibido com role="dialog"
  const modal = page.getByRole('dialog');
  await expect(modal).toBeVisible();
  await expect(modal.locator('img[src*="images/doencas/imnv.png"]')).toBeVisible();
  await expect(modal.getByText(/Dr\. Arun K\. Dhar.*ABCC/i)).toBeVisible();

  // 5. Fechar modal clicando no botão fechar (X)
  await page.getByRole('button', { name: 'Fechar visualização' }).click();
  await expect(modal).not.toBeVisible();
});
