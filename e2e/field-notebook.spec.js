import { test, expect } from '@playwright/test';
test('local property report keeps text and photos after reload and generates offline PDF', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 426, height: 812 });
  async function mount() {
    await page.evaluate(async () => {
      const React = (await import('/node_modules/.vite/deps/react.js')).default;
      const { createRoot } = (await import('/node_modules/.vite/deps/react-dom_client.js')).default;
      const { default: FieldNotebook } = await import('/src/components/FieldNotebook.jsx');
      document.getElementById('root').style.display = 'none';
      const host = document.createElement('div'); document.body.append(host);
      createRoot(host).render(React.createElement(FieldNotebook, { user: { uid: 'offline-report-test', email: 'test@example.test' }, technicianName: 'Test technician' }));
    });
  }
  await page.goto('./'); await mount();
  await page.getByRole('button', { name: 'Novo relat\u00f3rio local' }).click();
  await page.getByLabel('Nome da propriedade', { exact: true }).fill('Propriedade offline');
  await page.getByLabel('Relat\u00f3rio e testes realizados').fill('Visita e testes realizados no local.');
  const image = await page.evaluate(async () => { const c = document.createElement('canvas'); c.width = 100; c.height = 80; c.getContext('2d').fillRect(0, 0, 100, 80); return Array.from(new Uint8Array(await (await new Promise(r => c.toBlob(r, 'image/png'))).arrayBuffer())); });
  await page.getByLabel('Selecionar fotos locais da visita').setInputFiles({ name: 'property.png', mimeType: 'image/png', buffer: Buffer.from(image) });
  await expect(page.getByAltText('Foto da visita: property.png')).toBeVisible();
  await page.getByRole('button', { name: 'Salvar relat\u00f3rio neste aparelho' }).click();
  await expect(page.getByText('Relat\u00f3rio salvo neste aparelho.', { exact: true })).toBeVisible();
  await page.reload(); await mount();
  await page.getByRole('button', { name: /Propriedade offline/ }).click();
  await expect(page.getByLabel('Relat\u00f3rio e testes realizados')).toHaveValue('Visita e testes realizados no local.');
  await page.getByLabel('Relat\u00f3rio e testes realizados').fill('Teste atualizado e salvo automaticamente.');
  await expect(page.getByText('Relat\u00f3rio salvo neste aparelho.', { exact: true })).toBeVisible();
  await page.reload(); await mount();
  await page.getByRole('button', { name: /Propriedade offline/ }).click();
  await expect(page.getByLabel('Relat\u00f3rio e testes realizados')).toHaveValue('Teste atualizado e salvo automaticamente.');
  await expect(page.getByAltText('Foto da visita: property.png')).toBeVisible();
  await page.getByText('Guia da visita e fotos neste aparelho', { exact: true }).click();
  await expect(page.getByRole('button', { name: 'Baixar guia da visita em PDF' })).toBeEnabled();
  await page.route('https://**/*', route => route.abort());
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Baixar guia da visita em PDF' }).click();
  const file = await download; expect(file.suggestedFilename()).toMatch(/\.pdf$/);
  await file.saveAs(testInfo.outputPath('report-with-local-photo.pdf'));
  await page.screenshot({ path: testInfo.outputPath('local-report-mobile.png'), fullPage: true });
});
