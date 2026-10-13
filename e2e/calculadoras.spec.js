import { test, expect } from '@playwright/test';

// Abas adicionadas na expansão agronômica (calibre, crescimento, íons, aeração, bioflocos).
// Cada uma precisa renderizar sem erro de runtime e sem estourar a largura da tela.
const ABAS = [
  { nome: 'Calibre & Despesca', esperado: /Classificação comercial e projeção/i },
  { nome: 'Crescimento & Índices', esperado: /curva de crescimento de referência/i },
  { nome: 'Balanço Iônico', esperado: /Alvos calculados e correção/i },
  { nome: 'Aeração & Sistema', esperado: /Dimensionamento de aeração/i },
  { nome: 'Bioflocos (C:N)', esperado: /Demanda diária de carbono/i },
];

test('abas novas de calculadora renderizam com os dados de exemplo', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  const errors = [];
  page.on('pageerror', error => errors.push(error.message));

  await page.goto('./');
  await expect(page.getByText('Carregando banco de dados local...')).toBeHidden();

  const nav = page.getByRole('navigation', { name: 'Navegação principal' }).filter({ visible: true });
  await nav.getByRole('button', { name: 'Ajustes', exact: true }).click();
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Carregar Dados de Exemplo' }).click();

  await nav.getByRole('button', { name: 'Cálculos', exact: true }).click();

  for (const aba of ABAS) {
    const seletorMobile = page.getByRole('button', { name: /trocar calculadora/i });
    if (await seletorMobile.isVisible()) {
      await seletorMobile.click();
    }
    await page.getByRole('button', { name: aba.nome, exact: true }).click();
    await expect(page.getByText(aba.esperado)).toBeVisible();

    const dimensoes = await page.evaluate(() => ({
      conteudo: document.documentElement.scrollWidth,
      viewport: document.documentElement.clientWidth,
    }));
    expect(dimensoes.conteudo, `aba "${aba.nome}" estourou a largura`).toBeLessThanOrEqual(dimensoes.viewport + 1);
  }

  expect(errors).toEqual([]);
});
