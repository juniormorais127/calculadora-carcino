import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('cadastro assistido passa por auditoria, mantem apelido privado e produtor revisa apos ativar', async ({ page }, testInfo) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.route('**/ArcGIS/rest/services/**', route => route.abort());
  await page.route('https://tile.openstreetmap.org/**', route => route.abort());
  await page.setViewportSize({ width: 426, height: 812 });
  await page.goto('./');
  await page.getByRole('heading', { name: 'Entrar na minha conta' }).waitFor();
  await page.evaluate(async () => {
    const React = (await import('/node_modules/.vite/deps/react.js')).default;
    const { createRoot } = (await import('/node_modules/.vite/deps/react-dom_client.js')).default;
    const { AccountContext } = await import('/src/components/AccountProvider.jsx');
    const { default: View } = await import('/src/components/AssistedProducers.jsx');
    const { validateAssistedProducer } = await import('/src/services/assistedProducerData.js');
    const records = [], visits = [], listeners = [], reportListeners = [], audits = [], auditListeners = []; let alias = '', notes = '';
    const stamp = { toMillis: () => Date.now(), toDate: () => new Date() };
    const emit = () => listeners.forEach(item => item.next(records.filter(record => item.mode === 'admin' || record[item.mode === 'technician' ? 'technicianUid' : 'ownerUid'] === item.uid)));
    const api = {
      watchAssistedProducers(mode, uid, next) { const item = { mode, uid, next }; listeners.push(item); emit(); return () => listeners.splice(listeners.indexOf(item), 1); },
      watchAssistedVisits(id, next) { reportListeners.push(next); next([...visits]); return () => reportListeners.splice(reportListeners.indexOf(next), 1); },
      async createAssistedProducer(user, input) { const { privateAlias, ...value } = validateAssistedProducer(input); alias = privateAlias; records.push({ ...value, id: 'fixture-producer', technicianUid: 'tech', technicianName: 'Ana Tecnica', createdAt: stamp, auditStatus: 'pending', ownerUid: null, clientDecision: 'pending', revision: 1, technicianEmail: 'tech@example.com', activationCode: 'a'.repeat(32), activationExpiresAt: stamp, marketingChangedBy: 'tech', marketingChangedAt: stamp }); emit(); },
      async readAssistedAlias() { return alias; },
      watchAssistedAudit(id, next) { auditListeners.push(next); next([...audits]); return () => auditListeners.splice(auditListeners.indexOf(next), 1); },
      async resubmitAssistedProducer(user, id, input) { const { privateAlias, ...value } = validateAssistedProducer(input); alias = privateAlias; Object.assign(records[0], value, { revision: records[0].revision + 1, auditStatus: 'pending', auditNote: '', auditedAt: null }); emit(); },
      async auditAssistedProducer(user, id, approved, note) { const status = typeof approved === 'boolean' ? approved ? 'approved' : 'rejected' : approved; audits.push({ id: String(audits.length), status, note, name: 'Maria Administradora', reviewedAt: stamp, snapshot: { ...records[0] } }); auditListeners.forEach(next => next([...audits])); Object.assign(records[0], { auditStatus: status, auditBy: 'admin', auditName: 'Maria Administradora', auditNote: note, auditedAt: stamp }); emit(); },
      async previewAssistedActivation() { return records[0]; },
      async claimAssistedProducer() { Object.assign(records[0], { ownerUid: 'client', claimedAt: stamp }); emit(); },
      async decideAssistedProducer(user, id, accepted) { Object.assign(records[0], { clientDecision: accepted ? 'accepted' : 'rejected', clientDecidedAt: stamp }); emit(); },
      async submitAssistedVisit(user, id, input) { notes = input.privateNotes; visits.push({ ...input, privateNotes: undefined, id: 'visit1', latitude: Number(input.latitude), longitude: Number(input.longitude), status: 'pending', createdAt: stamp }); reportListeners.forEach(next => next([...visits])); return 'visit1'; },
      async decideAssistedVisit(user, id, visitId, accepted) { visits[0].status = accepted ? 'accepted' : 'rejected'; reportListeners.forEach(next => next([...visits])); },
      async readAssistedPrivateNotes() { return notes; },
      async setAssistedMarketing(user, id, enabled) { Object.assign(records[0], { marketingConsent: enabled, marketingChangedBy: 'client' }); emit(); },
    };
    document.getElementById('root').style.display = 'none'; const host = document.createElement('div'); host.className = 'max-w-4xl mx-auto p-4'; document.body.appendChild(host);
    function Fixture() {
      const [mode, setMode] = React.useState('technician'); window.setAssistedRole = setMode;
      const uid = mode === 'technician' ? 'tech' : mode === 'admin' ? 'admin' : 'client';
      return React.createElement(AccountContext.Provider, { value: { user: { uid, email: `${uid}@example.com` } } }, React.createElement(View, { key: mode, mode, identified: true, api }));
    }
    window.assistedFixtureRecord = () => records[0]; createRoot(host).render(React.createElement(Fixture));
  });
  await page.getByRole('button', { name: 'Cadastrar produtor sem acesso ao aplicativo' }).click();
  const form = page.getByRole('form', { name: 'Cadastrar produtor assistido' });
  await expect(form.getByLabel('Nome da propriedade', { exact: true })).toHaveAttribute('required', '');
  await expect(form.getByRole('checkbox').nth(1)).not.toBeChecked();
  await form.getByLabel('Apelido para meu controle').fill('Seu Ze Reservado');
  await form.getByLabel('Celular com DDD').fill('79999999999');
  await form.getByLabel('Nome da propriedade', { exact: true }).fill('Fazenda do Rio');
  await form.getByLabel('Endereço ou comunidade').fill('Povoado do Rio, sem numero');
  await form.getByLabel('Município', { exact: true }).fill('Aracaju');
  await form.getByLabel('Latitude', { exact: true }).fill('-10.95');
  await form.getByLabel('Longitude', { exact: true }).fill('-37.07');
  await form.getByRole('checkbox').first().check();
  await form.getByRole('button', { name: 'Enviar cadastro para auditoria' }).click();
  await expect(page.getByText('Meu apelido privado:')).toContainText('Seu Ze Reservado');
  expect(await page.evaluate(() => window.assistedFixtureRecord().privateAlias)).toBeUndefined();
  await page.getByRole('button', { name: 'Ver cadastro e atendimentos' }).click();
  await expect(page.getByRole('heading', { name: 'Ativação do produtor' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Registrar atendimento deste produtor' }).click();
  await page.getByLabel('Relatório para o produtor').fill('Conferida a propriedade no atendimento presencial.');
  await page.getByLabel('Anotações privadas do técnico', { exact: true }).fill('Nota que o cliente e o administrador nao podem ler.');
  const png = await page.evaluate(() => { const canvas = document.createElement('canvas'); canvas.width = 100; canvas.height = 100; canvas.getContext('2d').fillRect(0, 0, 100, 100); return canvas.toDataURL('image/png').split(',')[1]; });
  const chooserPromise = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Anexar fotos da propriedade neste aparelho' }).click();
  await (await chooserPromise).setFiles({ name: 'foto-viveiro.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') });
  await expect(page.getByAltText('Foto da visita: foto-viveiro.png')).toBeVisible();
  await page.getByRole('button', { name: 'Salvar atendimento para aceite do produtor' }).click();
  await page.getByText('Guia da visita e fotos neste aparelho', { exact: true }).click();
  await expect(page.getByAltText('Foto da visita: foto-viveiro.png')).toBeVisible();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Baixar guia da visita em PDF' }).click();
  const download = await downloadPromise; await download.saveAs(testInfo.outputPath('guia-visita.pdf'));
  const pdf = await readFile(testInfo.outputPath('guia-visita.pdf'));
  expect(pdf.toString('latin1')).toContain('/Subtype /Image');
  expect(pdf.toString('latin1')).not.toContain('Nota que o cliente e o administrador nao podem ler.');
  await page.evaluate(() => window.setAssistedRole('admin'));
  await page.getByRole('button', { name: 'Ver cadastro e atendimentos' }).click();
  await expect(page.getByText('Seu Ze Reservado')).toHaveCount(0);
  await expect(page.getByText('Nota que o cliente e o administrador nao podem ler.')).toHaveCount(0);
  await page.getByLabel('Justificativa da análise').fill('Conferidos contato, endereco e atendimento do tecnico.');
  await page.getByRole('button', { name: 'Solicitar ajustes ao técnico', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Ativação do produtor' })).toHaveCount(0);
  await page.evaluate(() => window.setAssistedRole('technician'));
  await page.getByRole('button', { name: 'Ver cadastro e atendimentos' }).click();
  await page.getByRole('button', { name: 'Ajustar dados e reenviar para auditoria' }).click();
  await page.getByRole('form', { name: 'Cadastrar produtor assistido' }).getByLabel('Endereço ou comunidade').fill('Povoado do Rio, endereco conferido pelo tecnico');
  await page.getByRole('button', { name: 'Enviar cadastro para auditoria' }).click();
  await page.evaluate(() => window.setAssistedRole('admin'));
  await page.getByRole('button', { name: 'Ver cadastro e atendimentos' }).click();
  await page.getByLabel('Justificativa da análise').fill('Endereco corrigido e dados conferidos novamente.');
  await page.getByRole('button', { name: 'Aprovar cadastro', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Ativação do produtor' })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('auditoria-mobile.png'), fullPage: true });
  await page.evaluate(() => window.setAssistedRole('client'));
  await page.getByLabel('Código de ativação').fill('a'.repeat(32));
  await page.getByRole('button', { name: 'Conferir cadastro' }).click();
  await page.getByRole('button', { name: 'Este cadastro é meu: vincular e revisar' }).click();
  await page.getByRole('button', { name: 'Ver cadastro e atendimentos' }).click();
  await expect(page.getByText('Seu Ze Reservado')).toHaveCount(0);
  await expect(page.getByText('Nota que o cliente e o administrador nao podem ler.')).toHaveCount(0);
  await page.getByRole('button', { name: 'Conferi e aceito os dados' }).click();
  await page.getByRole('button', { name: 'Aceitar atendimento', exact: true }).click();
  await expect(page.getByText('Aceita pelo cliente', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Autorizo receber promoções regionais por WhatsApp' }).click();
  await expect(page.getByRole('button', { name: 'Não quero receber promoções' })).toBeVisible();
  await page.getByRole('button', { name: 'Não quero receber promoções' }).click();
  await expect(page.getByRole('button', { name: 'Autorizo receber promoções regionais por WhatsApp' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.screenshot({ path: testInfo.outputPath('cadastro-cliente-desktop.png'), fullPage: true });
  expect(errors).toEqual([]);
});

test('mapa alterna satelite e ruas e troca versoes historicas sem mover a visualizacao', async ({ page }, testInfo) => {
  await page.goto('./');
  await page.getByRole('heading', { name: 'Entrar na minha conta' }).waitFor();
  const tile = await page.evaluate(() => { const c = document.createElement('canvas'); c.width = c.height = 256; c.getContext('2d').fillRect(0, 0, 256, 256); return c.toDataURL().split(',')[1]; });
  await page.route('**/tile/**', route => route.fulfill({ status: 200, contentType: 'image/png', body: Buffer.from(tile, 'base64') }));
  await page.evaluate(async () => {
    const React = (await import('/node_modules/.vite/deps/react.js')).default;
    const { createRoot } = (await import('/node_modules/.vite/deps/react-dom_client.js')).default;
    const { default: Map } = await import('/src/components/TechnicalVisitMap.jsx');
    document.getElementById('root').style.display = 'none'; const host = document.createElement('div'); host.className = 'max-w-4xl p-4'; document.body.appendChild(host);
    createRoot(host).render(React.createElement(Map, { visits: [{ id: 'map1', farmName: 'Fazenda Rio', pondId: 1, pondName: 'Viveiro 1', latitude: -10.95, longitude: -37.07, licenseStatus: 'unlicensed', technicianUid: 'tech', visitedOn: '2026-10-16' }] }));
  });
  await expect(page.getByRole('button', { name: 'Satélite atual', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('canvas.leaflet-tile-loaded').filter({ visible: true }).first()).toBeVisible({ timeout: 15000 });
  await page.screenshot({ path: testInfo.outputPath('satelite.png'), fullPage: true });
  await page.getByRole('button', { name: 'Mapa de ruas', exact: true }).click();
  await expect(page.locator('.leaflet-tile-pane img').first()).toHaveAttribute('src', /openstreetmap/);
  await page.getByRole('button', { name: 'Comparar imagens históricas' }).click();
  const slider = page.getByRole('slider', { name: 'Data da versão histórica do mapa' });
  await expect(slider).toBeVisible({ timeout: 30000 });
  const transform = await page.locator('.leaflet-map-pane').getAttribute('style');
  await slider.fill('0');
  await expect(page.locator('canvas.leaflet-tile-loaded').filter({ visible: true }).first()).toBeVisible({ timeout: 15000 });
  await page.screenshot({ path: testInfo.outputPath('historico.png'), fullPage: true });
  expect(await page.locator('.leaflet-map-pane').getAttribute('style')).toBe(transform);
  await expect(page.locator('path.leaflet-interactive')).toHaveAttribute('fill', '#be123c');
});
