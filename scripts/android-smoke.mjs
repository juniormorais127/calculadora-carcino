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
  await expect(page.getByLabel('Latitude', { exact: true })).toHaveValue(/-10\.9472/, { timeout: 30000 });
  await expect(page.getByLabel('Longitude', { exact: true })).toHaveValue(/-37\.0731/);
  await device.screenshot({ path: 'android-evidence/field-report-offline.png' });
  await page.getByText('Guia da visita e fotos neste aparelho', { exact: true }).click();
  await page.getByRole('button', { name: 'Baixar guia da visita em PDF' }).click();
  await expect.poll(() => page.evaluate(() => window.__androidDiagnostics.documents()), { timeout: 30000 }).toContainEqual(expect.stringMatching(/guia-visita-.*\.pdf/));
  await expect.poll(async () => String(await device.shell('dumpsys activity activities')), { timeout: 15000 }).toContain('ChooserActivity');
  await device.screenshot({ path: 'android-evidence/android-pdf-share.png' });
  await device.shell('input keyevent 4');
  await writeFile('android-evidence/results.json', JSON.stringify({ written, restored, offlineRestart: true, nativeGps: true, nativePdfShare: true }, null, 2));
} finally {
  await device.shell('svc wifi enable'); await device.shell('svc data enable'); await device.close();
}
