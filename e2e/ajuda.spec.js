import { test, expect } from './fixtures/producer.js';

// O canal de suporte do app está sem contato configurado (src/data/contatoSuporte.js),
// então o comportamento esperado é avisar em vez de abrir link quebrado.
test('botão de ajuda no topo abre o relato e protege o envio', async ({ page }) => {
  await page.setViewportSize({ width: 430, height: 900 });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));

  await page.goto('./');
  await expect(page.getByText('Carregando banco de dados local...')).toBeHidden();

  // O botão fica no topo, ao lado do selo de verificação
  await expect(page.getByText('Dados no seu aparelho')).toBeHidden(); // texto oculto no celular
  await page.getByRole('button', { name: 'Ajuda e suporte' }).click();

  const dialogo = page.getByRole('dialog');
  await expect(dialogo).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Ajuda e suporte' })).toBeVisible();

  // Os quatro motivos de contato
  for (const motivo of ['Algo não está funcionando', 'Sugestão de melhoria', 'Dúvida de uso', 'Outro assunto']) {
    await expect(page.getByRole('button', { name: new RegExp(motivo) })).toBeVisible();
  }

  // Sem contato configurado, o app avisa
  await expect(page.getByText(/canal de suporte ainda não foi configurado/i)).toBeVisible();

  // Enviar sem escrever nada é barrado
  await page.getByRole('button', { name: /Enviar no WhatsApp/ }).click();
  await expect(dialogo.getByRole('alert')).toContainText(/escreva o que aconteceu/i);

  // Com o relato escrito, o envio sem canal configurado explica o caminho alternativo
  await page.getByLabel('O que aconteceu?').fill('Toquei em Salvar Medição e a tela ficou em branco.');
  await page.getByRole('button', { name: /Enviar no WhatsApp/ }).click();
  await expect(dialogo.getByRole('alert')).toContainText(/não foi configurado/i);

  // O produtor consegue ver tudo o que vai junto antes de enviar
  await page.getByRole('button', { name: /Ver o que vai junto no relato/ }).click();
  await expect(page.getByText(/Versão:/)).toBeVisible();
  await expect(page.getByText(/nada sai\s+sem você tocar em enviar/i)).toBeVisible();

  // Escolher anexo está disponível e o contador aparece
  await expect(page.getByRole('button', { name: /Escolher arquivo \(0\/3\)/ })).toBeVisible();

  // Fecha com o botão
  await page.getByRole('button', { name: 'Fechar ajuda' }).click();
  await expect(dialogo).toBeHidden();

  expect(errors).toEqual([]);
});
