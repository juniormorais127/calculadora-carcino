import { _android as android, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
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
  await device.screenshot({ path: 'android-evidence/field-report-offline.png' });
  await writeFile('android-evidence/results.json', JSON.stringify({ written, restored, offlineRestart: true }, null, 2));
} finally {
  await device.shell('svc wifi enable'); await device.shell('svc data enable'); await device.close();
}
