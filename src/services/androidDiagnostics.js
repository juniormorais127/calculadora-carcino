// Included only in explicit test APK builds. Uses synthetic local records, never Firebase.
import { saveLocalVisitPhotos, readLocalVisitPhotos } from './localVisitPhotos.js';
import { saveLocalReport, listLocalReports } from './fieldNotebook.js';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { jsPDF } from 'jspdf';
import { blobBase64 } from './deviceFiles.js';
import React from 'react';
import { createRoot } from 'react-dom/client';
import FieldNotebook from '../components/FieldNotebook.jsx';
import AccountView from '../components/AccountView.jsx';
import AdminPortal from '../components/AdminPortal.jsx';
import { AccountContext } from '../components/AccountProvider.jsx';
import { getAccountDatabase } from './db.js';
import AppUpdatesProvider, { AppUpdateNotice, AndroidDownloadSettings } from '../components/AppUpdates.jsx';
import { androidUpdateApi } from './androidUpdates.js';
import TechnicalVisitMap from '../components/TechnicalVisitMap.jsx';
let diagnosticRoot, host;
function mount(element) {
  diagnosticRoot?.unmount();
  document.getElementById('root').style.display = 'none';
  if (!host) { host = document.createElement('div'); host.style.padding = '16px'; document.body.append(host); }
  diagnosticRoot = createRoot(host); diagnosticRoot.render(element);
}
function accountFixture(role) {
  // Only a synthetic UI fixture: never signs in, grants roles, or changes Firestore.
  return { user: { uid: 'android-admin-test', email: 'test@example.test', emailVerified: true }, access: { role, fullName: 'Test account', phone: '+5579999999999' }, accessLoading: false, database: getAccountDatabase('android-admin-test'), metadata: { accounts: { get: async () => null } }, syncStatus: { state: 'local', message: 'Test fixture' }, logout: async () => {}, sync: async () => {} };
}
window.__androidDiagnostics = {
  showMeasurementMap() {
    mount(React.createElement(TechnicalVisitMap, { visits: [{ id: 'measurement-test', farmName: 'Test property', latitude: -10.95, longitude: -37.07, licenseStatus: 'licensed' }] }));
  },
  async realUpdateCheck() {
    const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 10000);
    try { return { installed: await androidUpdateApi.installed(), release: await androidUpdateApi.release(controller.signal) }; }
    finally { clearTimeout(timer); }
  },
  async showUpdates(mode) {
    const info = await androidUpdateApi.installed();
    const installed = mode === 'web' ? null : info;
    const release = { schema: 1, appId: 'br.com.carcinogestao.app', versionName: info.versionName, versionCode: info.versionCode + (mode === 'equal' ? 0 : mode === 'older' ? -1 : 1), downloadUrl: 'https://github.com/juniormorais127/calculadora-carcino/releases/download/android-teste-1.0.1/CarcinoGestao-teste.apk' };
    const api = { installed: async () => installed, release: async () => release, open: androidUpdateApi.open, onResume: async () => () => {} };
    mount(React.createElement(AppUpdatesProvider, { api }, React.createElement(AppUpdateNotice), React.createElement(AndroidDownloadSettings)));
    return info;
  },
  showAccount(role) { mount(React.createElement(AccountContext.Provider, { value: accountFixture(role) }, React.createElement(AccountView))); },
  showAdmin(role) { mount(React.createElement(AccountContext.Provider, { value: accountFixture(role) }, React.createElement(AdminPortal))); },
  async documents() { return (await Filesystem.readdir({ path: 'CarcinoGestao', directory: Directory.Documents })).files.map(file => file.name); },
  showNotebook() {
    mount(React.createElement(FieldNotebook, { user: { uid: 'android-test', email: 'test@example.test' }, technicianName: 'Test technician' }));
  },
  async write() {
    const canvas = document.createElement('canvas'); canvas.width = 600; canvas.height = 400;
    canvas.getContext('2d').fillRect(0, 0, 600, 400);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg'));
    await saveLocalVisitPhotos('android-test', 'notebook:test', [{ name: 'property-test.jpg', type: blob.type, blob }]);
    await saveLocalReport('android-test', { id: 'test', farmName: 'Propriedade de teste', visitedOn: '2026-10-18', status: 'local', licenseStatus: 'unknown', summary: 'Relatorio local offline', latitude: -10.95, longitude: -37.07 });
    const pdf = new jsPDF(); pdf.text('Relatorio de teste offline', 20, 20); pdf.addImage(canvas.toDataURL('image/jpeg'), 'JPEG', 20, 40, 160, 107);
    await Filesystem.writeFile({ path: 'CarcinoGestao/smoke.pdf', directory: Directory.Documents, data: await blobBase64(pdf.output('blob')), recursive: true });
    return this.read();
  },
  async read() {
    const photos = await readLocalVisitPhotos('android-test', 'notebook:test');
    const { files } = await Filesystem.readdir({ path: 'visit-photos/android-test', directory: Directory.Data });
    const pdf = await Filesystem.stat({ path: 'CarcinoGestao/smoke.pdf', directory: Directory.Documents });
    return { count: photos.length, size: photos[0]?.blob.size, nativeCount: files.length, reports: (await listLocalReports('android-test')).length, otherAccount: (await readLocalVisitPhotos('other-test', 'notebook:test')).length, pdfBytes: pdf.size };
  },
};
