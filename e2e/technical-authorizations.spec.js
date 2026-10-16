import { test, expect } from '@playwright/test';
test('auditoria da assistencia mantem pedido pendente ate decisao e permite solicitar ajustes', async ({ page }) => {
  await page.goto('./'); await page.getByRole('heading', { name: 'Entrar na minha conta' }).waitFor();
  await page.evaluate(async () => {
    const React = (await import('/node_modules/.vite/deps/react.js')).default;
    const { createRoot } = (await import('/node_modules/.vite/deps/react-dom_client.js')).default;
    const { AccountContext } = await import('/src/components/AccountProvider.jsx');
    const { default: View } = await import('/src/components/TechnicalAuthorizations.jsx');
    const records = [{ id: 'client~tech', ownerUid: 'client', technicianUid: 'tech', requestedBy: 'client', status: 'pending', active: false, requestNote: 'Atendimento solicitado pelo produtor.' }], listeners = [];
    const emit = () => listeners.forEach(next => next([...records]));
    const api = {
      watchTechnicalAuthorizations(mode, uid, next) { listeners.push(next); emit(); return () => listeners.splice(listeners.indexOf(next), 1); },
      watchAuthorizationHistory(id, next) { next([]); return () => {}; },
      async decideTechnicalAuthorization(user, id, decision, note) { Object.assign(records[0], { status: decision, active: decision === 'approved', auditNote: note }); emit(); },
      async requestTechnicalAuthorization() { Object.assign(records[0], { status: 'pending', active: false }); emit(); },
    };
    function Fixture() { const [mode, setMode] = React.useState('audit'); window.setAuthorizationMode = setMode; return React.createElement(AccountContext.Provider, { value: { user: { uid: mode === 'audit' ? 'reviewer' : 'tech' } } }, React.createElement(View, { key: mode, mode, api })); }
    window.readAuthorizationFixture = () => records[0]; document.getElementById('root').style.display = 'none'; const host = document.createElement('div'); host.className = 'p-4 max-w-3xl'; document.body.appendChild(host); createRoot(host).render(React.createElement(Fixture));
  });
  expect(await page.evaluate(() => window.readAuthorizationFixture().active)).toBe(false);
  await page.getByRole('button', { name: 'Ver pedido e histórico' }).click();
  await page.getByLabel('Justificativa da auditoria').fill('O tecnico precisa detalhar o objetivo do acompanhamento.');
  await page.getByRole('button', { name: 'Solicitar ajustes ao técnico', exact: true }).click();
  expect(await page.evaluate(() => window.readAuthorizationFixture().active)).toBe(false);
  await page.evaluate(() => window.setAuthorizationMode('technician'));
  await page.getByLabel('Situação do pedido').selectOption('all');
  await page.getByRole('button', { name: 'Ver pedido e histórico' }).click();
  await page.getByLabel('Descreva os ajustes ou o novo pedido').fill('Objetivo: conferir localizacao e orientar manejo da propriedade.');
  await page.getByRole('button', { name: 'Reenviar pedido para auditoria' }).click();
  expect(await page.evaluate(() => window.readAuthorizationFixture().active)).toBe(false);
  await page.evaluate(() => window.setAuthorizationMode('audit'));
  await page.getByRole('button', { name: 'Ver pedido e histórico' }).click();
  await page.getByLabel('Justificativa da auditoria').fill('Objetivo detalhado e autorizacao conferida com o produtor.');
  await page.getByRole('button', { name: 'Aprovar assistência' }).click();
  expect(await page.evaluate(() => window.readAuthorizationFixture().active)).toBe(true);
});
