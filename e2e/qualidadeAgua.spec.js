import { test, expect } from '@playwright/test';

// Protege as correções de qualidade de água: alertas do painel gerados pela
// tabela de referência e nitrito com limite dependente da salinidade.
test('painel alerta pela tabela e nitrito segue a salinidade', async ({ page }) => {
  await page.setViewportSize({ width: 430, height: 1000 });
  await page.goto('./');
  await expect(page.getByText('Carregando banco de dados local...')).toBeHidden();

  const nav = page.getByRole('navigation', { name: 'Navegação principal' }).filter({ visible: true });
  await nav.getByRole('button', { name: 'Ajustes', exact: true }).click();
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Carregar Dados de Exemplo' }).click();

  // Painel: o oxigênio de 4,4 mg/L está na faixa de atenção da tabela (ideal >= 4,5)
  await nav.getByRole('button', { name: 'Painel', exact: true }).click();
  await expect(page.getByText('Atenção nos Viveiros (1)')).toBeVisible();
  await expect(page.getByText(/Oxigênio Dissolvido em nível atenção: 4,4|Oxigênio Dissolvido em nível atenção: 4\.4/)).toBeVisible();
  // O detalhe vem do texto de impacto da própria tabela de referência
  await expect(page.getByText(/suspender arraçoamento/i)).toBeVisible();

  // Água: o card de nitrito mostra o limite correspondente à salinidade (22 ppt)
  await nav.getByRole('button', { name: 'Água', exact: true }).click();
  await expect(page.getByText('Estado geral da última medição:')).toBeVisible();
  await expect(page.getByText(/seguro até 5 mg\/L/)).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Nitrito (N-NO2)' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Obs.' })).toBeVisible();
});
