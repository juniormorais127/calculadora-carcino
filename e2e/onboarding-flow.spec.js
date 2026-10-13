import { test, expect } from '@playwright/test';

test.describe('Fluxo Guiado de Primeiro Cadastro (Onboarding sem Viveiros)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('./');
    await expect(page.getByText('Carregando banco de dados local...')).toBeHidden();

    // Limpar o banco de dados para simular primeiro acesso zerado
    await page.evaluate(async () => {
      const req = indexedDB.deleteDatabase("CalculadoraCarcinoDB");
      await new Promise((resolve) => {
        req.onsuccess = resolve;
        req.onerror = resolve;
        req.onblocked = resolve;
      });
    });

    await page.reload();
    await expect(page.getByText('Carregando banco de dados local...')).toBeHidden();
  });

  test('clicar em + Biometria sem viveiros abre modal orientativo e apos cadastrar viveiro abre tela de biometria', async ({ page }) => {
    // 1. Verificar que o botão + Biometria NÃO está disabled
    const btnBiometria = page.getByRole('button', { name: '+ Biometria' });
    await expect(btnBiometria).toBeVisible();
    await expect(btnBiometria).toBeEnabled();

    // 2. Clicar em + Biometria
    await btnBiometria.click();

    // 3. Modal de orientação deve abrir explicando a necessidade do viveiro
    await expect(page.getByRole('heading', { name: /Cadastre um Viveiro para Lançar Biometria/i })).toBeVisible();
    await expect(page.getByText('Fluxo Automático em 2 Passos:')).toBeVisible();

    // 4. Clicar no botão para cadastrar o viveiro agora
    const btnCadastrarAgora = page.getByRole('button', { name: 'Cadastrar Viveiro Agora' });
    await expect(btnCadastrarAgora).toBeVisible();
    await btnCadastrarAgora.click();

    // 5. Deve ir para a tela de viveiros com o modal de novo viveiro aberto e banner de Passo 1 de 2
    await expect(page.getByRole('heading', { name: 'Cadastrar Novo Viveiro' })).toBeVisible();
    await expect(page.getByText(/Passo 1 de 2/i)).toBeVisible();
    await expect(page.getByText(/Salvar e Ir para Biometria/i)).toBeVisible();

    // 6. Preencher nome e salvar o viveiro
    const inputNome = page.getByPlaceholder('Ex: Viveiro 01 - Berçário');
    await inputNome.fill('Viveiro Pioneiro 01');

    await page.getByRole('button', { name: 'Salvar e Ir para Biometria' }).click();

    // 7. Sistema deve transicionar AUTOMATICAMENTE para a Biometria com modal aberto
    await expect(page.getByText(/Viveiro cadastrado com sucesso! Preencha agora os dados da primeira pesagem/i)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Lançar Biometria Semanal' })).toBeVisible();

    // 8. O novo viveiro já deve estar selecionado no dropdown
    const selectViveiro = page.locator('select').first();
    await expect(selectViveiro).toContainText('Viveiro Pioneiro 01');

    // 9. Informar os dados da biometria
    const inputPeso = page.locator('input[type="number"]').first();
    await inputPeso.fill('12.5');

    // 10. Gravar a biometria
    await page.getByRole('button', { name: 'Gravar Biometria' }).click();

    // 11. Modal fecha e registro aparece na tabela e no card de peso
    await expect(page.getByRole('heading', { name: 'Lançar Biometria Semanal' })).toBeHidden();
    await expect(page.getByRole('cell', { name: '12.5 g' })).toBeVisible();
  });

  test('clicar em + Qualidade Água sem viveiros abre modal orientativo e apos cadastrar viveiro abre medicao de agua', async ({ page }) => {
    // 1. Clicar em + Qualidade Água
    const btnAgua = page.getByRole('button', { name: '+ Qualidade Água' });
    await expect(btnAgua).toBeVisible();
    await expect(btnAgua).toBeEnabled();
    await btnAgua.click();

    // 2. Modal deve abrir
    await expect(page.getByRole('heading', { name: /Cadastre um Viveiro para Lançar Qualidade da Água/i })).toBeVisible();

    // 3. Clicar em Cadastrar Viveiro Agora
    await page.getByRole('button', { name: 'Cadastrar Viveiro Agora' }).click();

    // 4. Modal de viveiro aberto com Passo 1 de 2
    await expect(page.getByRole('heading', { name: 'Cadastrar Novo Viveiro' })).toBeVisible();
    await expect(page.getByText(/Salvar e Ir para Qualidade da Água/i)).toBeVisible();

    // 5. Salvar viveiro
    await page.getByRole('button', { name: 'Salvar e Ir para Qualidade da Água' }).click();

    // 6. Deve abrir AUTOMATICAMENTE o modal de qualidade da água
    await expect(page.getByText(/Viveiro cadastrado com sucesso! Preencha agora a medição dos parâmetros de qualidade da água/i)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Lançar Medição de Qualidade de Água' })).toBeVisible();

    // 7. Salvar medição
    await page.getByRole('button', { name: 'Salvar Medição' }).click();
    await expect(page.getByRole('heading', { name: 'Lançar Medição de Qualidade de Água' })).toBeHidden();
  });
});
