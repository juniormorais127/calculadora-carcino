import { Capacitor } from '@capacitor/core';
import { ANDROID_RELEASE_URL, normalizeInstalledApp, validateAndroidRelease } from './androidRelease.js';
export const androidUpdateApi = {
  async installed() {
    if (Capacitor.getPlatform() !== 'android') return null;
    const { App } = await import('@capacitor/app');
    return normalizeInstalledApp(await App.getInfo());
  },
  async release(signal) {
    const response = await fetch(`${ANDROID_RELEASE_URL}?check=${Date.now()}`, { signal, cache: 'no-store', credentials: 'omit' });
    if (!response.ok) throw new Error('Não foi possível consultar a versão disponível.');
    return validateAndroidRelease(await response.json());
  },
  async open(downloadUrl) {
    // Validate the URL again at the boundary that opens an external application.
    validateAndroidRelease({ schema: 1, appId: 'br.com.carcinogestao.app', versionCode: 1, versionName: 'download', downloadUrl });
    if (Capacitor.getPlatform() === 'android') {
      const { AppLauncher } = await import('@capacitor/app-launcher');
      const result = await AppLauncher.openUrl({ url: downloadUrl });
      if (!result.completed) throw new Error('Não foi possível abrir o navegador. Tente novamente.');
    } else window.open(downloadUrl, '_blank', 'noopener,noreferrer');
  },
  async onResume(next) {
    if (Capacitor.getPlatform() !== 'android') return () => {};
    const { App } = await import('@capacitor/app');
    const listener = await App.addListener('appStateChange', ({ isActive }) => { if (isActive) next(); });
    return () => listener.remove();
  },
};
