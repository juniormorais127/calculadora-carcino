export const ANDROID_APP_ID = 'br.com.carcinogestao.app';
export const ANDROID_RELEASE_URL = 'https://juniormorais127.github.io/calculadora-carcino/android-release.json';
export function validateAndroidRelease(value) {
  if (value?.schema !== 1 || value.appId !== ANDROID_APP_ID || !Number.isSafeInteger(value.versionCode) || value.versionCode < 1 || value.versionCode > 2100000000 || typeof value.versionName !== 'string' || !value.versionName.trim() || value.versionName.length > 60 || !/^https:\/\/github\.com\/juniormorais127\/calculadora-carcino\/releases\/download\/[a-zA-Z0-9._-]+\/CarcinoGestao-teste\.apk$/.test(value.downloadUrl || '')) throw new Error('Informação de atualização inválida.');
  return { schema: 1, appId: value.appId, versionCode: value.versionCode, versionName: value.versionName, downloadUrl: value.downloadUrl };
}
export function normalizeInstalledApp(info) {
  const versionCode = Number(info.build);
  if (info.id !== ANDROID_APP_ID || !Number.isSafeInteger(versionCode) || versionCode < 1) throw new Error('Não foi possível identificar a versão instalada.');
  return { versionCode, versionName: String(info.version) };
}
export const hasAndroidUpdate = (installed, release) => !!installed && !!release && release.versionCode > installed.versionCode;
