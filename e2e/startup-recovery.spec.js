import { test, expect } from '@playwright/test';

test('sessão que não responde oferece recuperação e aceita resposta tardia sem recarregar', async ({ page }) => {
  await page.goto('./');
  await page.clock.install();
  await page.evaluate(async () => {
    const React = (await import('/node_modules/.vite/deps/react.js')).default;
    const { createRoot } = (await import('/node_modules/.vite/deps/react-dom_client.js')).default;
    const { default: Provider } = await import('/src/components/AccountProvider.jsx');
    document.getElementById('root').style.display = 'none';
    const host = document.createElement('div'); document.body.append(host);
    createRoot(host).render(React.createElement(Provider, {
      syncProduction: false,
      observeAuth: (_auth, next) => { window.finishAuth = next; return () => {}; },
    }, React.createElement('p', null, 'Sessão recuperada')));
  });
  await expect(page.getByText('Preparando o acesso ao CarcinoGestão…').last()).toBeVisible();
  await page.waitForFunction(() => typeof window.finishAuth === 'function');
  await page.clock.fastForward(12500);
  await expect(page.getByRole('heading', { name: 'Não foi possível concluir o acesso' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Tentar novamente', exact: true })).toBeEnabled();
  await page.evaluate(() => window.finishAuth(null));
  await expect(page.getByText('Sessão recuperada')).toBeVisible();
});
