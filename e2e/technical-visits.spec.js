import { test, expect } from '@playwright/test';

test('tecnico registra visita, cliente aprova ajuste e notas privadas ficam fora do relatorio', async ({ page }, testInfo) => {
  await page.route('https://tile.openstreetmap.org/**', route => route.abort());
  await page.goto('./');
  await page.getByRole('heading', { name: 'Entrar na minha conta' }).waitFor();
  await page.evaluate(async () => {
    const React = (await import('/node_modules/.vite/deps/react.js')).default;
    const { createRoot } = (await import('/node_modules/.vite/deps/react-dom_client.js')).default;
    const { AccountContext } = await import('/src/components/AccountProvider.jsx');
    const { default: View } = await import('/src/components/TechnicalVisitsView.jsx');
    const realApi = await import('/src/services/technicalVisits.js');
    const { getAccountDatabase } = await import('/src/services/db.js');
    const database = getAccountDatabase('technical-ui-client');
    await database.viveiros.clear(); await database.configuracoes.clear();
    await database.viveiros.add({ id: 1, nome: 'Viveiro 1', latitude: -10.9, longitude: -37.1 });
    const grants = [{ id: 'client~tech', ownerUid: 'client', technicianUid: 'tech', active: true }];
    const visits = [], listeners = [];
    const emit = () => listeners.forEach(item => item.next((item.name === 'technicalVisits' ? visits : grants).filter(record => !item.field || record[item.field] === item.uid)));
    window.clearTechnicalGrants = () => { grants.splice(0); emit(); };
    const farm = { ownerUid: 'client', name: 'Fazenda Teste', ponds: [{ id: 1, name: 'Viveiro 1', latitude: -10.9, longitude: -37.1 }] };
    let privateNotes = '';
    const api = {
      watchFieldRecords(name, field, uid, next) { const item = { name, field, uid, next }; listeners.push(item); emit(); return () => listeners.splice(listeners.indexOf(item), 1); },
      async readSharedFarm() { return farm; },
      async authorizeTechnician() {},
      async submitTechnicalVisit(user, farm, pond, input) {
        privateNotes = input.privateNotes;
        visits.push({ ...input, id: 'visit1', ownerUid: 'client', technicianUid: 'tech', technicianEmail: 'tecnico@example.com', farmName: farm.name, pondId: pond.id, pondName: pond.name, latitude: Number(input.latitude), longitude: Number(input.longitude), previousLatitude: pond.latitude, previousLongitude: pond.longitude, status: 'pending' }); emit();
      },
      async decideVisit(id, accepted) { visits.find(item => item.id === id).status = accepted ? 'accepted' : 'rejected'; emit(); },
      applyAcceptedVisit: realApi.applyAcceptedVisit, checkVisitApproval: realApi.checkVisitApproval,
      async readPrivateVisit() { return privateNotes; },
    };
    document.getElementById('root').style.display = 'none';
    const host = document.createElement('div'); host.className = 'max-w-6xl mx-auto px-4'; document.body.appendChild(host);
    function Fixture() {
      const [role, setRole] = React.useState('field_technician'); window.setFieldRole = setRole;
      const uid = role === 'field_technician' ? 'tech' : role === 'administrator' ? 'admin' : 'client';
      return React.createElement(AccountContext.Provider, { value: { user: { uid, email: `${uid}@example.com` }, access: { role }, database } }, React.createElement(View, { key: uid, api, administrative: role === 'administrator' }));
    }
    window.readTechnicalPond = () => database.viveiros.get(1);
    createRoot(host).render(React.createElement(Fixture));
  });
  await expect(page.getByRole('button', { name: 'Meus atendimentos' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('heading', { name: 'Nova visita', exact: true })).toBeVisible();
  await page.getByLabel('Propriedade que vou visitar').selectOption('client');
  await page.getByRole('button', { name: 'Preencher visita', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Registrar visita: Fazenda Teste' })).toBeVisible();
  await expect(page.getByLabel('Nome da propriedade', { exact: true })).toHaveValue('Fazenda Teste');
  await page.getByLabel('Latitude', { exact: true }).fill('-10.95');
  await page.getByLabel('Longitude', { exact: true }).fill('-37.07');
  await page.getByLabel('Situação do licenciamento').selectOption('licensed');
  await page.getByLabel('Número do licenciamento').fill('LIC-123');
  await page.getByLabel('Data de cadastro do licenciamento').fill('2026-10-16');
  await page.getByLabel('Vencimento do licenciamento').fill('2027-10-16');
  await page.getByLabel(/Relatório para aprovação/).fill('Visita realizada para corrigir o ponto de localização do viveiro.');
  await page.getByLabel(/Anotações privadas do técnico/).fill('ANOTACAO EXCLUSIVA DO TECNICO');
  for (const width of [426, 1440]) { await page.setViewportSize({ width, height: 900 }); await page.screenshot({ path: testInfo.outputPath(`visita-${width}.png`), fullPage: true }); }
  await page.getByRole('button', { name: 'Registrar visita e enviar para aceite' }).click();
  await expect(page.getByText(/Aguardando aprovação do cliente/)).toBeVisible();
  expect((await page.evaluate(() => window.readTechnicalPond())).latitude).toBe(-10.9);
  await page.evaluate(() => window.setFieldRole('producer'));
  await expect(page.getByText('ANOTACAO EXCLUSIVA DO TECNICO')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Ver minhas anotações privadas' })).toBeHidden();
  await page.getByRole('button', { name: 'Aceitar relatório e ajustes' }).click();
  await expect(page.getByText('Aceita pelo cliente')).toBeVisible();
  expect((await page.evaluate(() => window.readTechnicalPond())).latitude).toBe(-10.95);
  await page.evaluate(() => window.setFieldRole('field_technician'));
  await page.getByRole('button', { name: 'Meus atendimentos' }).click();
  await page.getByRole('button', { name: 'Ver minhas anotações privadas' }).click();
  await expect(page.getByText('ANOTACAO EXCLUSIVA DO TECNICO')).toBeVisible();
  await page.evaluate(() => window.setFieldRole('administrator'));
  await expect(page.getByRole('heading', { name: 'Visitas e licenciamento' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Ver minhas anotações privadas' })).toBeHidden();
  await expect(page.getByText('ANOTACAO EXCLUSIVA DO TECNICO')).toBeHidden();
  await expect(page.getByText(/LIC-123/)).toBeVisible();
  await page.evaluate(() => { window.clearTechnicalGrants(); window.setFieldRole('field_technician'); });
  await expect(page.getByText(/Nenhuma propriedade disponível para visita/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Preencher visita', exact: true })).toBeHidden();
});
