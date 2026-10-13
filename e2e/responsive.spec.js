import { test, expect } from '@playwright/test';

const sizes = [
  { width: 320, height: 640 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 844, height: 390 },
  { width: 1440, height: 900 },
];

async function expectNoOverflow(page) {
  const dimensions = await page.evaluate(() => ({
    content: document.documentElement.scrollWidth,
    viewport: document.documentElement.clientWidth,
  }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport + 1);
}

for (const size of sizes) {
  test(`pages fit ${size.width}x${size.height}`, async ({ page }) => {
    await page.setViewportSize(size);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/');
    await expect(page.getByText('Carregando banco de dados local...')).toBeHidden();
    const nav = page.getByRole('navigation', { name: 'Navegação principal' }).filter({ visible: true });
    for (const name of ['Painel', 'Viveiros', 'Biometria', 'Água', 'Cálculos', 'Sanidade & BPM', 'Ajustes']) {
      await nav.getByRole('button', { name, exact: true }).click();
      await expectNoOverflow(page);
      if (['Viveiros', 'Biometria', 'Água'].includes(name)) {
        const addName = { Viveiros: 'Novo Viveiro', Biometria: 'Nova Biometria', 'Água': 'Nova Medição' }[name];
        await page.getByRole('button', { name: addName, exact: true }).click();
        await expectNoOverflow(page);
        await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
      }
      if (name === 'Cálculos') {
        for (const calc of ['Tratamento de Água', 'Calagem de Solo', 'Amônia Tóxica (NH3)', 'Povoamento & Metas']) {
          await page.getByRole('button', { name: calc, exact: true }).click();
          await expectNoOverflow(page);
        }
      }
      if (name === 'Sanidade & BPM') {
        await page.getByRole('button', { name: 'Checklist BPM ABCC' }).click();
        await expectNoOverflow(page);
        const checkbox = page.getByRole('checkbox').first();
        await checkbox.focus();
        await page.keyboard.press('Space');
        await expect(checkbox).toBeChecked();
        await page.getByRole('button', { name: 'Novidades & Futuro' }).click();
        await expectNoOverflow(page);
        await page.getByRole('button', { name: 'Guia de Doenças' }).click();
        const card = page.locator('button[aria-expanded]').first();
        await card.focus();
        const before = await card.getAttribute('aria-expanded');
        await page.keyboard.press('Enter');
        await expect(card).toHaveAttribute('aria-expanded', before === 'true' ? 'false' : 'true');
      }
    }
    expect(errors).toEqual([]);
  });
}
