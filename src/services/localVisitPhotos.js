import Dexie, { liveQuery } from 'dexie';
const databases = new Map();
function localDatabase(uid) {
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(uid)) throw new Error('Conta inválida para fotos locais.');
  if (!databases.has(uid)) { const db = new Dexie(`CarcinoGestao-visit-photos-${uid}`); db.version(1).stores({ photos: '&key,updatedAt' }); databases.set(uid, db); }
  return databases.get(uid);
}
export async function readLocalVisitPhotos(uid, key) { return (await localDatabase(uid).photos.get(key))?.files || []; }
export function watchLocalVisitPhotos(uid, key, next, error) {
  const subscription = liveQuery(() => readLocalVisitPhotos(uid, key)).subscribe({ next, error });
  return () => subscription.unsubscribe();
}
export async function saveLocalVisitPhotos(uid, key, files) {
  await localDatabase(uid).photos.put({ key, files, updatedAt: Date.now() });
}
export async function bindLocalVisitPhotos(uid, draftKey, reportKey) {
  const db = localDatabase(uid);
  await db.transaction('rw', db.photos, async () => {
    const draft = await db.photos.get(draftKey);
    if (draft) { await db.photos.put({ ...draft, key: reportKey }); await db.photos.delete(draftKey); }
  });
}
export async function validateVisitPhotoFiles(files) {
  if (files.length > 8) throw new Error('Escolha no máximo 8 fotos por visita.');
  if (files.reduce((sum, file) => sum + file.size, 0) > 40 * 1024 * 1024) throw new Error('As fotos desta visita devem somar no máximo 40 MB.');
  const accepted = [];
  for (const file of files) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 8 * 1024 * 1024) throw new Error('Use fotos JPG, PNG ou WebP de até 8 MB cada.');
    const bitmap = await createImageBitmap(file).catch(() => { throw new Error('Uma das fotos não pôde ser aberta. Escolha outra imagem.'); });
    bitmap.close(); accepted.push({ name: file.name.slice(0, 200), type: file.type, blob: file });
  }
  return accepted;
}
