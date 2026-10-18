// Included only in explicit test APK builds. Uses synthetic local records, never Firebase.
import { saveLocalVisitPhotos, readLocalVisitPhotos } from './localVisitPhotos.js';
import { saveLocalReport, listLocalReports } from './fieldNotebook.js';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { jsPDF } from 'jspdf';
import { blobBase64 } from './deviceFiles.js';
import React from 'react';
import { createRoot } from 'react-dom/client';
import FieldNotebook from '../components/FieldNotebook.jsx';
window.__androidDiagnostics = {
  showNotebook() {
    document.getElementById('root').style.display = 'none';
    const host = document.createElement('div'); host.style.padding = '16px'; document.body.append(host);
    createRoot(host).render(React.createElement(FieldNotebook, { user: { uid: 'android-test', email: 'test@example.test' }, technicianName: 'Test technician' }));
  },
  async write() {
    const canvas = document.createElement('canvas'); canvas.width = 600; canvas.height = 400;
    canvas.getContext('2d').fillRect(0, 0, 600, 400);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg'));
    await saveLocalVisitPhotos('android-test', 'notebook:test', [{ name: 'property-test.jpg', type: blob.type, blob }]);
    await saveLocalReport('android-test', { id: 'test', farmName: 'Propriedade de teste', summary: 'Relatorio local offline', latitude: -10.95, longitude: -37.07 });
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
