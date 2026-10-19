import test from 'node:test';
import assert from 'node:assert/strict';
import { ANDROID_APP_ID, validateAndroidRelease, normalizeInstalledApp, hasAndroidUpdate } from '../src/services/androidRelease.js';
import { androidBuildVersion } from '../scripts/android-version.mjs';
const release = { schema: 1, appId: ANDROID_APP_ID, versionCode: 1010, versionName: '1.0.2-teste', downloadUrl: 'https://github.com/juniormorais127/calculadora-carcino/releases/download/android-teste-1.0.2-b1010/CarcinoGestao-teste.apk' };
test('only an older installed Android build receives an update; web and newer builds do not', () => {
  const installed = normalizeInstalledApp({ id: ANDROID_APP_ID, build: '1009', version: '1.0.2-teste' });
  assert.equal(hasAndroidUpdate(installed, release), true);
  assert.equal(hasAndroidUpdate({ ...installed, versionCode: 1010 }, release), false);
  assert.equal(hasAndroidUpdate({ ...installed, versionCode: 1011 }, release), false);
  assert.equal(hasAndroidUpdate(null, release), false);
  assert.equal(hasAndroidUpdate(installed, null), false);
});
test('release metadata rejects wrong package, invalid build and untrusted APK addresses', () => {
  assert.deepEqual(validateAndroidRelease(release), release);
  for (const data of [{ ...release, appId: 'other' }, { ...release, versionCode: '1010' }, { ...release, versionCode: -1 }, { ...release, versionCode: 2100000001 }, { ...release, downloadUrl: 'javascript:alert(1)' }, { ...release, downloadUrl: release.downloadUrl.replace('github.com/', 'github.com.evil.example/') }, { ...release, downloadUrl: release.downloadUrl.replace('juniormorais127', 'other') }]) assert.throws(() => validateAndroidRelease(data));
  assert.throws(() => normalizeInstalledApp({ id: ANDROID_APP_ID, build: 'unknown' }));
  assert.throws(() => normalizeInstalledApp({ id: 'other', build: '2' }));
});
test('automatic Android releases use monotonic codes and package version names', () => {
  assert.deepEqual(androidBuildVersion('1.0.2', '12'), { code: 1012, name: '1.0.2-teste' });
  assert.ok(androidBuildVersion('1.0.2', '13').code > androidBuildVersion('1.0.2', '12').code);
  assert.throws(() => androidBuildVersion('not-a-version', '12'));
  assert.throws(() => androidBuildVersion('1.0.2', 'NaN'));
});
