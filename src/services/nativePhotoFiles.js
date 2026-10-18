import { blobBase64 } from './deviceFiles.js';
// Injected filesystem makes failures/rollback testable without an Android bridge.
export function nativePhotoFiles(filesystem, directory, encode = blobBase64) {
  return {
    async write(uid, files) {
      const created = [], entries = [];
      try {
        for (const file of files) {
          const path = `visit-photos/${uid}/${crypto.randomUUID()}.bin`;
          await filesystem.writeFile({ path, directory, recursive: true, data: await encode(file.blob) });
          created.push(path); entries.push({ name: file.name, type: file.type, path });
        }
        return entries;
      } catch (error) { await Promise.allSettled(created.map(path => filesystem.deleteFile({ path, directory }))); throw error; }
    },
    async read(uid, entries) {
      return Promise.all(entries.map(async file => {
        if (!file.path.startsWith(`visit-photos/${uid}/`) || file.path.includes('..')) throw new Error('Caminho de foto inválido.');
        const { data } = await filesystem.readFile({ path: file.path, directory });
        const blob = typeof data === 'string' ? new Blob([Uint8Array.from(atob(data), c => c.charCodeAt(0))], { type: file.type }) : data;
        return { name: file.name, type: file.type, blob };
      }));
    },
    async remove(entries) { await Promise.allSettled(entries.map(file => filesystem.deleteFile({ path: file.path, directory }))); },
  };
}
