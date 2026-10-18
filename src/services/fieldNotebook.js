import Dexie from 'dexie';
const databases = new Map();
function notebook(uid) {
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(uid)) throw new Error('Conta inválida.');
  if (!databases.has(uid)) { const db = new Dexie(`CarcinoGestao-field-notebook-${uid}`); db.version(1).stores({ reports: '&id,updatedAt' }); databases.set(uid, db); }
  return databases.get(uid);
}
export const listLocalReports = uid => notebook(uid).reports.orderBy('updatedAt').reverse().toArray();
export async function saveLocalReport(uid, report) { const value = { ...report, updatedAt: Date.now() }; await notebook(uid).reports.put(value); return value; }
