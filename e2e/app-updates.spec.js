import { test, expect } from '@playwright/test';
test('Android settings offer APK without blocking the web; version warnings only appear for older native builds', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 426, height: 812 });
  await page.goto('./');
  async function mount(build, available = 10, failure = false) {
    await page.evaluate(async ({ build, available, failure }) => {
      const React = (await import('/node_modules/.vite/deps/react.js')).default;
      const { createRoot } = (await import('/node_modules/.vite/deps/react-dom_client.js')).default;
      const { default: Provider, AppUpdateNotice, AndroidDownloadSettings } = await import('/src/components/AppUpdates.jsx');
      window.updateTestRoot?.unmount(); document.getElementById('root').style.display = 'none';
      let host = document.getElementById('update-test-host'); if (!host) { host = document.createElement('div'); host.id = 'update-test-host'; host.className = 'p-4'; document.body.append(host); }
      window.updateDownloads = [];
      const release = { versionCode: available, versionName: '1.0.2-teste', downloadUrl: 'https://github.com/juniormorais127/calculadora-carcino/releases/download/test/CarcinoGestao-teste.apk' };
      const api = { installed: async () => build === null ? null : ({ versionCode: build, versionName: '1.0.2-teste' }), release: async () => { if (failure) throw new Error('offline'); return release; }, open: async url => { window.updateDownloads.push(url); }, onResume: async () => () => {} };
      window.updateTestRoot = createRoot(host);
      window.updateTestRoot.render(React.createElement(Provider, { api }, React.createElement(AppUpdateNotice), React.createElement('p', null, 'Sistema web funcionando'), React.createElement(AndroidDownloadSettings)));
    }, { build, available, failure });
  }
  await mount(null);
  await expect(page.getByRole('button', { name: 'Baixar APK Android', exact: true })).toBeEnabled();
  await expect(page.getByRole('region', { name: 'Atualiza\u00e7\u00e3o do aplicativo' })).toHaveCount(0);
  await expect(page.getByText('Atualiza\u00e7\u00e3o do aplicativo dispon\u00edvel', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Baixar APK Android', exact: true }).click();
  expect(await page.evaluate(() => window.updateDownloads.length)).toBe(1);
  await mount(9);
  const notice = page.getByRole('status', { name: 'Atualiza\u00e7\u00e3o do aplicativo', exact: true });
  await expect(notice).toBeVisible();
  await notice.getByText('Como instalar a atualiza\u00e7\u00e3o', { exact: true }).click();
  await expect(notice.getByText(/Downloads/)).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('update-notice-mobile.png'), fullPage: true });
  await mount(10);
  await expect(page.getByText('Seu aplicativo est\u00e1 atualizado.', { exact: true })).toBeVisible();
  await expect(page.getByText('Atualiza\u00e7\u00e3o do aplicativo dispon\u00edvel', { exact: true })).toHaveCount(0);
  await mount(11);
  await expect(page.getByRole('button', { name: 'Baixar APK Android', exact: true })).toBeDisabled();
  await mount(9, 10, true);
  await expect(page.getByText(/N\u00e3o foi poss\u00edvel verificar a atualiza\u00e7\u00e3o agora/)).toBeVisible();
  await expect(page.getByText('Atualiza\u00e7\u00e3o do aplicativo dispon\u00edvel', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Sistema web funcionando', { exact: true })).toBeVisible();
});
