import { test, expect } from '@playwright/test';

test('assinaturas reais de visitas iniciam sem derrubar a interface', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('./');
  await page.getByRole('heading', { name: 'Entrar na minha conta' }).waitFor();
  const count = await page.evaluate(async () => {
    const { watchFieldRecords } = await import('/src/services/technicalVisits.js');
    const stops = [];
    for (const field of ['ownerUid', 'technicianUid', null]) {
      for (const name of ['technicalVisits', 'fieldAuthorizations']) stops.push(watchFieldRecords(name, field, 'regression-fixture', () => {}, () => {}));
    }
    stops.forEach(stop => stop());
    return stops.length;
  });
  expect(count).toBe(6);
  await expect(page.getByRole('heading', { name: 'Entrar na minha conta' })).toBeVisible();
  expect(errors).toEqual([]);
});

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
    const visits = [], inspections = [], listeners = [];
    const emit = () => listeners.forEach(item => item.next((item.name === 'technicalVisits' ? visits : item.name === 'fieldInspectionReports' ? inspections : grants).filter(record => !item.field || record[item.field] === item.uid)));
    window.clearTechnicalGrants = () => { grants.splice(0); emit(); };
    const farm = { ownerUid: 'client', name: 'Fazenda Teste', ponds: [{ id: 1, name: 'Viveiro 1', latitude: -10.9, longitude: -37.1 }] };
    let privateNotes = '', savedIdentity = null;
    const api = {
      watchFieldRecords(name, field, uid, next) { const item = { name, field, uid, next }; listeners.push(item); emit(); return () => listeners.splice(listeners.indexOf(item), 1); },
      async readSharedFarm() { return farm; },
      async authorizeTechnician() {},
      async saveTechnicianIdentity(user, value) { savedIdentity = value; window.setTechnicalIdentity(value); },
      async readTechnicianIdentity() { return savedIdentity; },
      async submitTechnicalVisit(user, farm, pond, input) {
        privateNotes = input.privateNotes;
        visits.push({ ...input, id: 'visit1', ownerUid: 'client', technicianUid: 'tech', technicianEmail: 'tecnico@example.com', farmName: farm.name, pondId: pond.id, pondName: pond.name, latitude: Number(input.latitude), longitude: Number(input.longitude), previousLatitude: pond.latitude, previousLongitude: pond.longitude, status: 'pending' }); emit();
      },
      async decideVisit(id, accepted) { visits.find(item => item.id === id).status = accepted ? 'accepted' : 'rejected'; emit(); },
      async submitIndependentVisit(user, input) { inspections.push({ ...input, id: 'inspection1', technicianUid: user.uid, technicianEmail: user.email, latitude: Number(input.latitude), longitude: Number(input.longitude), status: 'pending' }); emit(); },
      async decideIndependentVisit(user, id, accepted) { inspections.find(item => item.id === id).status = accepted ? 'accepted' : 'rejected'; emit(); },
      applyAcceptedVisit: realApi.applyAcceptedVisit, checkVisitApproval: realApi.checkVisitApproval,
      async readPrivateVisit() { return privateNotes; },
    };
    document.getElementById('root').style.display = 'none';
    const host = document.createElement('div'); host.className = 'max-w-6xl mx-auto px-4'; document.body.appendChild(host);
    function Fixture() {
      const [identity, setIdentity] = React.useState(null); window.setTechnicalIdentity = setIdentity;
      const [role, setRole] = React.useState('field_technician'); window.setFieldRole = setRole;
      const uid = role === 'field_technician' ? 'tech' : role === 'administrator' ? 'admin' : 'client';
      return React.createElement(AccountContext.Provider, { value: { user: { uid, email: `${uid}@example.com` }, access: { role }, database, technicianIdentity: identity } }, React.createElement(View, { key: uid, api, administrative: role === 'administrator' }));
    }
    window.readTechnicalPond = () => database.viveiros.get(1);
    createRoot(host).render(React.createElement(Fixture));
  });
  await expect(page.getByRole('button', { name: 'Meus atendimentos' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'Registrar visita e notificar produtor' })).toBeDisabled();
  await page.getByLabel('Nome completo do técnico').fill('Ana Maria Silva');
  await page.getByLabel('Número do CREA e UF').fill('CREA-SE 123456');
  const png = await page.evaluate(() => { const canvas = document.createElement('canvas'); canvas.width = 32; canvas.height = 32; canvas.getContext('2d').fillRect(0, 0, 32, 32); return canvas.toDataURL('image/png').split(',')[1]; });
  await page.getByLabel('Foto do técnico (obrigatória)').setInputFiles({ name: 'foto.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') });
  await expect(page.getByRole('img', { name: 'Prévia da foto do técnico' })).toBeVisible();
  await page.getByRole('button', { name: 'Salvar identificação profissional' }).click();
  await expect(page.getByRole('button', { name: 'Registrar visita e notificar produtor' })).toBeEnabled();
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
  await expect(page.locator('article').getByText('Ana Maria Silva', { exact: true })).toBeVisible();
  await expect(page.locator('article').getByText('CREA: CREA-SE 123456', { exact: true })).toBeVisible();
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
  await page.getByRole('button', { name: 'Registrar visita e notificar produtor' }).click();
  await expect(page.getByLabel('Nome da propriedade', { exact: true })).toBeFocused();
  await expect(page.getByRole('heading', { name: 'Registro de campo e notificação ao produtor' })).toBeInViewport();
  await page.getByLabel('Nome da propriedade', { exact: true }).fill('Fazenda Sem Licenca');
  await page.getByRole('button', { name: 'Registrar visita e notificar produtor' }).click();
  await expect(page.getByLabel('Nome da propriedade', { exact: true })).toHaveValue('Fazenda Sem Licenca');
  await page.getByLabel('E-mail do produtor cadastrado no site').fill('client@example.com');
  await page.getByLabel('Latitude', { exact: true }).fill('-11');
  await page.getByLabel('Longitude', { exact: true }).fill('-37');
  await page.getByLabel('Situação do licenciamento').selectOption('unlicensed');
  await page.getByLabel(/Relatório para aprovação/).fill('Na visita nao foi apresentado documento de licenciamento.');
  await page.getByRole('button', { name: 'Registrar visita e enviar para aceite' }).click();
  await expect(page.getByText(/Registro de campo enviado ao cliente/)).toBeVisible();
  await page.evaluate(() => window.setFieldRole('producer'));
  await page.getByRole('button', { name: 'Aceitar registro de campo' }).click();
  await expect(page.getByText(/Registro aceito/)).toBeVisible();
  expect((await page.evaluate(() => window.readTechnicalPond())).latitude).toBe(-10.95);
});
