import { _android as android, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
await mkdir('android-evidence', { recursive: true });
const [device] = await android.devices();
if (!device) throw new Error('Android emulator unavailable');
const pkg = 'br.com.carcinogestao.app';
try {
  await device.installApk('apk/CarcinoGestao-teste.apk');
  async function open() {
    await device.shell(`am start -n ${pkg}/.MainActivity`);
    const view = await device.webView({ pkg }, { timeout: 60000 });
    const page = await view.page();
    await expect(page.getByRole('heading', { name: 'Entrar na minha conta' })).toBeVisible({ timeout: 60000 });
    await page.waitForFunction(() => !!window.__androidDiagnostics);
    return page;
  }
  let page = await open();
  await page.evaluate(() => { sessionStorage.setItem('android-origin-check', 'same-app'); window.__androidDiagnostics.showAccount('administrator'); });
  await page.getByRole('link', { name: 'Abrir administra\u00e7\u00e3o', exact: true }).click();
  await page.waitForURL('**/central-operacional/index.html');
  await expect(page.getByRole('heading', { name: 'Acesso administrativo' })).toBeVisible();
  expect(await page.evaluate(() => sessionStorage.getItem('android-origin-check'))).toBe('same-app');
  await page.waitForFunction(() => !!window.__androidDiagnostics);
  await page.evaluate(() => window.__androidDiagnostics.showAdmin('producer'));
  await expect(page.getByRole('heading', { name: 'Acesso restrito' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Usu\u00e1rios e permiss\u00f5es', exact: true })).toHaveCount(0);
  await page.evaluate(() => window.__androidDiagnostics.showAdmin('administrator'));
  await expect(page.getByRole('button', { name: 'Usu\u00e1rios e permiss\u00f5es', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Interesse em compras', exact: true })).toBeVisible();
  await page.evaluate(() => window.__androidDiagnostics.showAdmin('senior'));
  await expect(page.getByRole('button', { name: 'Interesse em compras', exact: true })).toBeVisible();
  await device.screenshot({ path: 'android-evidence/admin-senior.png' });
  await page.getByRole('link', { name: 'Site dos produtores' }).click();
  await expect(page.getByRole('heading', { name: 'Entrar na minha conta' })).toBeVisible();
  await page.waitForFunction(() => !!window.__androidDiagnostics);
  const updateCheck = await page.evaluate(() => window.__androidDiagnostics.realUpdateCheck());
  expect(updateCheck.release.versionCode).toBeGreaterThan(0);
  if (process.env.ANDROID_VERSION_CODE) expect(updateCheck.installed.versionCode).toBe(Number(process.env.ANDROID_VERSION_CODE));
  await page.evaluate(() => window.__androidDiagnostics.showUpdates('equal'));
  await expect(page.getByText('Seu aplicativo est\u00e1 atualizado.', { exact: true })).toBeVisible();
  await expect(page.getByRole('status', { name: 'Atualiza\u00e7\u00e3o do aplicativo', exact: true })).toHaveCount(0);
  await page.evaluate(() => window.__androidDiagnostics.showUpdates('newer'));
  const updateNotice = page.getByRole('status', { name: 'Atualiza\u00e7\u00e3o do aplicativo', exact: true });
  await expect(updateNotice).toBeVisible();
  await updateNotice.getByText('Como instalar a atualiza\u00e7\u00e3o', { exact: true }).click();
  await expect(updateNotice.getByText(/Downloads/)).toBeVisible();
  await device.screenshot({ path: 'android-evidence/update-notice.png' });
  await page.evaluate(() => window.__androidDiagnostics.showUpdates('older'));
  await expect(page.getByRole('status', { name: 'Atualiza\u00e7\u00e3o do aplicativo', exact: true })).toHaveCount(0);
  await page.evaluate(() => window.__androidDiagnostics.showUpdates('web'));
  await expect(page.getByRole('status', { name: 'Atualiza\u00e7\u00e3o do aplicativo', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Baixar APK Android', exact: true })).toBeEnabled();
  await page.evaluate(() => window.__androidDiagnostics.showMeasurementMap());
  await page.getByRole('button', { name: 'Medir', exact: true }).click();
  const measurementMap = page.getByLabel('Mapa das visitas e do licenciamento', { exact: true });
  // Android WebViews attach without Playwright's hasTouch flag. Dispatch real
  // touch input through CDP rather than locator.tap(), which rejects that flag.
  const touchSession = await page.context().newCDPSession(page);
  for (const x of [70, 220]) {
    await measurementMap.scrollIntoViewIfNeeded();
    const box = await measurementMap.boundingBox();
    await touchSession.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: box.x + x, y: box.y + 100 }] });
    await touchSession.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  }
  await touchSession.detach();
  await expect(page.getByText(/Dist\u00e2ncia total:/)).toBeVisible();
  await page.getByRole('button', { name: 'Concluir medi\u00e7\u00e3o', exact: true }).click();
  await expect(page.getByText(/2 de 200 pontos/)).toBeVisible();
  await device.screenshot({ path: 'android-evidence/map-measurement.png' });
  const written = await page.evaluate(() => window.__androidDiagnostics.write());
  expect(written.count).toBe(1); expect(written.nativeCount).toBe(1); expect(written.otherAccount).toBe(0); expect(written.pdfBytes).toBeGreaterThan(1000);
  await device.screenshot({ path: 'android-evidence/login-phone.png' });
  await device.shell('svc wifi disable'); await device.shell('svc data disable');
  await device.shell(`am force-stop ${pkg}`);
  page = await open();
  const restored = await page.evaluate(() => window.__androidDiagnostics.read());
  expect(restored).toEqual(written);
  await device.screenshot({ path: 'android-evidence/reopened-offline.png' });
  await page.evaluate(() => window.__androidDiagnostics.showNotebook());
  await page.getByRole('button', { name: /Propriedade de teste/ }).click();
  await expect(page.getByAltText('Foto da visita: property-test.jpg')).toBeVisible();
  await device.shell(`pm grant ${pkg} android.permission.ACCESS_COARSE_LOCATION`);
  await device.shell(`pm grant ${pkg} android.permission.ACCESS_FINE_LOCATION`);
  await device.shell('settings put secure location_mode 3');
  await page.getByRole('button', { name: 'Usar GPS do celular' }).click();
  await new Promise(resolve => setTimeout(resolve, 1500));
  execFileSync('adb', ['emu', 'geo', 'fix', '-37.0731', '-10.9472']);
  await expect.poll(async () => Number(await page.getByLabel('Latitude', { exact: true }).inputValue()), { timeout: 30000 }).toBeCloseTo(-10.9472, 4);
  await expect.poll(async () => Number(await page.getByLabel('Longitude', { exact: true }).inputValue())).toBeCloseTo(-37.0731, 4);
  await device.screenshot({ path: 'android-evidence/field-report-offline.png' });
  await page.getByText('Guia da visita e fotos neste aparelho', { exact: true }).click();
  await page.getByRole('button', { name: 'Baixar guia da visita em PDF' }).click();
  await expect.poll(() => page.evaluate(() => window.__androidDiagnostics.documents()), { timeout: 30000 }).toContainEqual(expect.stringMatching(/guia-visita-.*\.pdf/));
  await expect.poll(async () => String(await device.shell('dumpsys activity activities')), { timeout: 15000 }).toContain('ChooserActivity');
  await device.screenshot({ path: 'android-evidence/android-pdf-share.png' });
  await device.shell('input keyevent 4');
  await writeFile('android-evidence/results.json', JSON.stringify({ written, restored, offlineRestart: true, nativeGps: true, nativePdfShare: true, adminNavigation: true, adminRoleGates: true, androidUpdateCheck: updateCheck, updateNoticeVersionGates: true, mapMeasurementTouch: true }, null, 2));
} catch (error) {
  await device.screenshot({ path: 'android-evidence/failure.png' });
  await writeFile('android-evidence/failure.txt', String(error.stack || error));
  throw error;
} finally {
  await device.shell('svc wifi enable'); await device.shell('svc data enable'); await device.close();
}
